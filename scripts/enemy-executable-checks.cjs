// Actual offline packaged app, real-time RAF/input, controlled actor fixtures.
const assert=require('node:assert/strict');
const path=require('node:path');
const seed=require('./enemy-fixture.cjs');
module.exports=async function verifyExecutableEnemies(app,output,label){
  const page=app.page,results=[];
  const choose=async hero=>{
    if(await page.evaluate('state')==='play')await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Title screen',exact:true}).click();
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.getByRole('button',{name:hero[0].toUpperCase()+hero.slice(1),exact:true}).click();
    await page.getByRole('button',{name:'Start game',exact:true}).click();
  };
  const safe=()=>page.evaluate('pl.x=144;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true');
  const stomp=async()=>{
    await page.evaluate('pl.x=enemies[0].x;pl.y=enemies[0].y-pl.h-2;pl.vx=0;pl.vy=200;pl.ground=false;pl.coyote=0;pl.buf=0');
    await page.keyboard.press('Space');
  };
  for(const type of ['shellback','sentinel'])for(const hero of ['hopper','minty','ember','nova','bolt']){
    await choose(hero);await page.evaluate(seed,{type,x:hero==='hopper'?199:280});
    if(hero==='hopper'||hero==='nova')await page.evaluate('pl.y=330;pl.ground=false;pl.vy=200');
    await page.keyboard.press('KeyE');await page.waitForFunction('ability.cooldown>0');
    if(['hopper','ember','bolt'].includes(hero))await page.waitForFunction('enemies[0].health===1');
    else{
      assert.equal(await page.evaluate('enemies[0].health'),2);
      if(hero==='minty'){
        const frozen=await page.evaluate('JSON.stringify({x:enemies[0].x,y:enemies[0].y,attackTimer:enemies[0].attackTimer})');
        await page.waitForTimeout(150);assert.equal(await page.evaluate('JSON.stringify({x:enemies[0].x,y:enemies[0].y,attackTimer:enemies[0].attackTimer})'),frozen);
      }else assert.ok(await page.evaluate('ability.active==="glide"&&pl.vy<=140'));
      await stomp();await page.waitForFunction('enemies[0].health===1');
    }
    await safe();assert.equal(await page.evaluate('score'),0);
    await page.waitForFunction('enemies[0].hitTime===0');
    if(hero==='ember')await page.screenshot({path:path.join(output,`${label}-${type}-cracked.png`)});
    await stomp();await page.waitForFunction('score===50');assert.equal(await page.evaluate('lives'),3);
    results.push({character:hero,enemy:type,status:'PASS',checks:['native E','intended power interaction','two-hit defeat','no score on armor hit','one +50 award']});
  }

  await choose('nova');await page.evaluate(seed,{type:'sentinel',activeAI:true});
  await page.waitForFunction('enemies[0].attackPhase==="charge"');
  await page.screenshot({path:path.join(output,`${label}-sentinel-windup.png`)});
  await page.keyboard.press('KeyP');
  const frozen=await page.evaluate('JSON.stringify({enemyCombat,enemies,pl,timer,score,parts})');
  await page.waitForTimeout(150);assert.equal(await page.evaluate('JSON.stringify({enemyCombat,enemies,pl,timer,score,parts})'),frozen);
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await page.waitForFunction('enemyCombat.projectiles.length>0');
  await page.screenshot({path:path.join(output,`${label}-sentinel-shot.png`)});
  await page.evaluate('pl.shield=true');await page.waitForFunction('!pl.shield');assert.equal(await page.evaluate('lives'),3);
  await page.evaluate("damageEnemy(enemies[0],'fireball');enemies[0].attackPhase='charge';enemies[0].aim={x:-1,y:0};enemyCombat.projectiles.push({owner:enemies[0],x:500,y:200,vx:0,vy:0,radius:6,life:3});pl.y=ROWS*T+60");
  await page.waitForFunction('lives===2');assert.equal(await page.evaluate('enemyCombat.projectiles.length===0&&enemies[0].health===1&&enemies[0].attackPhase==="wait"'),true);

  await page.evaluate(seed,{type:'sentinel'});
  await page.evaluate("grid[12][6]='#';enemyCombat.projectiles=[{owner:enemies[0],x:300,y:452,vx:-12000,vy:0,radius:6,life:3}]");
  await page.waitForFunction('enemyCombat.projectiles.length===0');assert.equal(await page.evaluate('lives'),3);
  await page.keyboard.press('KeyP');await page.getByRole('button',{name:'Restart level',exact:true}).click();await page.getByRole('button',{name:'Restart level',exact:true}).click();
  assert.equal(await page.evaluate('enemyCombat.projectiles.length===0&&enemies.every(e=>e.health===1&&e.maxHealth===1)'),true);
  results.push({enemy:'sentinel',status:'PASS',checks:['windup','slow projectile','pause freeze','shield','pit-death cleanup/preserved HP','terrain collision','restart']});
  // Existing saved-character/lifecycle checks expect Nova, which stays selected.
  return results;
};
