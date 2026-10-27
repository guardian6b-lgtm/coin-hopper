const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const seed = require('./enemy-fixture.cjs');
const heroes = ['hopper', 'minty', 'ember', 'nova', 'bolt'];
module.exports = async function verifyEnemies(browser, url, output) {
  const results=[],errors=[];
  const context=await browser.newContext({viewport:{width:960,height:540}});
  await context.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const step=n=>page.evaluate(n=>{for(let i=0;i<n;i++)update();draw();},n);
  const choose=async hero=>{
    await page.goto(url);await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.getByRole('button',{name:hero[0].toUpperCase()+hero.slice(1),exact:true}).click();
    await page.getByRole('button',{name:'Start game',exact:true}).click();
  };
  const cast=async()=>{await page.keyboard.down('KeyE');await step(1);await page.keyboard.up('KeyE');};
  const safeWait=async n=>{await page.evaluate('pl.x=144;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true');await step(n);};
  const stomp=async()=>{
    await page.evaluate('pl.x=enemies[0].x;pl.y=enemies[0].y-pl.h-2;pl.vx=0;pl.vy=200;pl.ground=false;pl.coyote=0;pl.buf=0');
    await page.keyboard.down('Space');await step(1);await page.keyboard.up('Space');
  };
  try {
    for(const type of ['shellback','sentinel'])for(const hero of heroes){
      await choose(hero);await page.evaluate(seed,{type,x:hero==='hopper'?199:280});
      if(['hopper','ember','bolt'].includes(hero)){
        for(let hit=1;hit<=2;hit++){
          if(hero==='hopper')await page.evaluate('pl.y=330;pl.ground=false;pl.vy=80');
          await cast();await step(25);
          assert.equal(await page.evaluate('enemies[0]?.health??0'),2-hit);
          assert.equal(await page.evaluate('score'),hit===1?0:50);
          if(hit===1)await safeWait(Math.ceil(await page.evaluate('ability.cooldown')*60));
        }
      }else{
        if(hero==='nova')await page.evaluate('pl.y=300;pl.ground=false;pl.vy=200');
        await cast();assert.equal(await page.evaluate('enemies[0].health'),2);
        if(hero==='minty'){
          assert.ok(await page.evaluate('enemies[0].root')>0);
          const pos=await page.evaluate('JSON.stringify({x:enemies[0].x,y:enemies[0].y,attackTimer:enemies[0].attackTimer})');
          await step(100);assert.equal(await page.evaluate('JSON.stringify({x:enemies[0].x,y:enemies[0].y,attackTimer:enemies[0].attackTimer})'),pos);
          await step(21);assert.equal(await page.evaluate('enemies[0].root'),0);
        }else assert.equal(await page.evaluate('pl.vy'),140);
        await stomp();assert.equal(await page.evaluate('enemies[0].health'),1);assert.equal(await page.evaluate('score'),0);
        assert.equal(await page.evaluate('pl.vy'),-560);await safeWait(19);await stomp();
      }
      assert.equal(await page.evaluate('score===50&&levelScore===50&&lives===3'),true);
      await step(30);assert.equal(await page.evaluate('enemies.length'),0);
      results.push(`PASS ${hero} / ${type}: actual E, intended HP/root/glide, safe defeat and +50 once`);
    }

    await choose('ember');await page.evaluate(seed,{type:'shellback'});
    await page.evaluate("enemies.push(createEnemy('sentinel',510,432));enemies[1].attackTimer=999;draw()");
    await page.screenshot({path:path.join(output,'enemy-intact.png')});
    await cast();await step(70);assert.equal(await page.evaluate('enemies[0].health'),1);
    assert.equal(await page.evaluate('enemies[0].hitFlash'),0);assert.equal(await page.evaluate('score'),0);
    await page.screenshot({path:path.join(output,'enemy-cracked.png')});
    results.push('PASS intact/cracked armor and two-HP presentation in real Canvas2D');

    await page.evaluate(seed,{type:'sentinel',activeAI:true});await step(92);
    assert.equal(await page.evaluate('enemies[0].attackPhase'),'charge');
    assert.equal(await page.evaluate('enemyCombat.projectiles.length'),0);
    await page.screenshot({path:path.join(output,'sentinel-windup.png')});
    await step(65);assert.equal(await page.evaluate('enemyCombat.projectiles.length'),1);
    await page.screenshot({path:path.join(output,'sentinel-projectile.png')});
    const frozen=await page.evaluate('JSON.stringify({enemyCombat,enemies,pl,parts,timer,score})');
    await page.keyboard.press('KeyP');await page.getByRole('button',{name:'Settings',exact:true}).click();await step(120);
    assert.equal(await page.evaluate('JSON.stringify({enemyCombat,enemies,pl,parts,timer,score})'),frozen);
    await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();
    await step(1);assert.notEqual(await page.evaluate('JSON.stringify(enemyCombat)'),JSON.stringify(JSON.parse(frozen).enemyCombat));
    results.push('PASS Sentinel wind-up, slow moving projectile and native pause/settings/resume freeze');

    await page.evaluate(seed,{type:'sentinel'});
    await page.evaluate("grid[12][6]='#';enemyCombat.projectiles=[{owner:enemies[0],x:300,y:452,vx:-12000,vy:0,radius:6,life:3}]");
    await step(1);assert.equal(await page.evaluate('enemyCombat.projectiles.length'),0);assert.equal(await page.evaluate('lives'),3);
    await page.screenshot({path:path.join(output,'sentinel-wall-impact.png')});
    await page.evaluate('enemyCombat.projectiles=[{owner:enemies[0],x:1100,y:200,vx:0,vy:0,radius:6,life:3}]');
    await step(1);assert.equal(await page.evaluate('enemyCombat.projectiles.length'),0);
    results.push('PASS real-browser continuous projectile collision stops before terrain/player and offscreen shots despawn');

    await page.evaluate(seed,{type:'sentinel'});await page.evaluate('pl.shield=true;enemyCombat.projectiles=[{owner:enemies[0],x:pl.x+13,y:pl.y+16,vx:0,vy:0,radius:6,life:3}]');
    await step(1);assert.equal(await page.evaluate('lives===3&&!pl.shield&&pl.inv===1&&enemyCombat.projectiles.length===0'),true);
    await page.evaluate("damageEnemy(enemies[0],'fireball');enemies[0].attackPhase='charge';enemies[0].attackTimer=.5;enemies[0].aim={x:-1,y:0};enemyCombat.projectiles.push({owner:enemies[0],x:500,y:200,vx:0,vy:0,radius:6,life:3});pl.y=ROWS*T+60");
    await step(1);assert.equal(await page.evaluate('lives===2&&enemyCombat.projectiles.length===0&&enemies[0].health===1&&enemies[0].attackPhase==="wait"'),true);
    await page.keyboard.press('KeyP');await page.getByRole('button',{name:'Restart level',exact:true}).click();await page.getByRole('button',{name:'Restart level',exact:true}).click();
    assert.equal(await page.evaluate('enemyCombat.projectiles.length===0&&enemies.every(e=>e.maxHealth===1)'),true);
    results.push('PASS browser shield hit, pit-death cleanup/preserved HP and native restart without new map placements');

    const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
    try {
      await mobile.addInitScript(()=>{window.requestAnimationFrame=()=>1;});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
      await mp.goto(url);await mp.getByRole('button',{name:'Play',exact:true}).tap();await mp.getByRole('button',{name:'Ember',exact:true}).tap();await mp.getByRole('button',{name:'Start game',exact:true}).tap();
      await mp.evaluate(seed,{type:'shellback',x:280});await mp.locator('#ability-button').tap();
      await mp.evaluate('for(let i=0;i<30;i++)update();draw()');
      assert.equal(await mp.evaluate('enemies[0].health===1&&score===0&&ability.cooldown>0'),true);
      await mp.screenshot({path:path.join(output,'enemy-mobile-touch.png')});
      results.push('PASS simulated mobile Ability tap damages armor once and displays cooldown without a kill award');
    } finally {await mobile.close();}
    const arena=await context.newPage();arena.on('pageerror',e=>errors.push(e.message));
    await arena.goto(new URL('enemy-arena.html',url).href);
    await arena.getByRole('button',{name:'Play',exact:true}).click();await arena.getByRole('button',{name:'Ember',exact:true}).click();await arena.getByRole('button',{name:'Start game',exact:true}).click();
    assert.equal(await arena.evaluate('LEVELS.length===4&&enemies[0].type==="shellback"&&enemies[0].health===2'),true);
    await arena.getByRole('button',{name:'Reset Sentinel',exact:true}).click();
    assert.equal(await arena.evaluate('enemies[0].type==="sentinel"&&score===0&&lives===3'),true);
    await arena.keyboard.press('KeyE');await arena.evaluate('for(let i=0;i<40;i++)update();draw()');
    assert.equal(await arena.evaluate('enemies[0].health===1&&score===0'),true);
    await arena.keyboard.press('KeyP');await arena.getByRole('button',{name:'Restart level',exact:true}).click();await arena.getByRole('button',{name:'Restart level',exact:true}).click();
    assert.equal(await arena.evaluate('enemies[0].type==="sentinel"&&enemies[0].health===2&&lives===3'),true);
    await arena.screenshot({path:path.join(output,'enemy-review-arena.png')});await arena.close();
    await context.setOffline(true);const offline=await context.newPage();offline.on('pageerror',e=>errors.push(e.message));
    await offline.setContent(fs.readFileSync(path.join(output,'enemy-arena.html'),'utf8'));
    await offline.getByRole('button',{name:'Play',exact:true}).click();await offline.getByRole('button',{name:'Ember',exact:true}).click();await offline.getByRole('button',{name:'Start game',exact:true}).click();
    assert.equal(await offline.evaluate('enemies[0].type==="shellback"&&LEVELS.length===4'),true);await offline.close();
    results.push('PASS generated artifact-only review arena, enemy reset, real E, native restart and offline HTML execution');
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'enemy-results.json'),JSON.stringify({results,errors},null,2));return results;
  } finally {await context.close();}
};
