const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
module.exports=async function verifySkyline(browser,url,output){
  const results=[],errors=[];
  const context=await browser.newContext({viewport:{width:960,height:540}});
  await context.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const step=n=>page.evaluate(n=>{for(let i=0;i<n;i++)update();draw();},n);
  const choose=async hero=>{
    await page.goto(url);await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:hero[0].toUpperCase()+hero.slice(1),exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
  };
  const bossFixture=()=>page.evaluate(()=>{
    startLevel(5);enemies=enemies.filter(e=>e.type==='guardian');const boss=enemies[0];
    pl.x=boss.x-80;pl.y=436;pl.vx=0;pl.vy=0;pl.ground=true;pl.inv=0;cam=pl.x-W/3;coins=[];shields=[];
    boss.attackPhase='recover';boss.openingHit=false;boss.attackTimer=20;draw();
  });
  try{
    await choose('hopper');await page.evaluate('startLevel(5)');await step(7);
    await page.screenshot({path:path.join(output,'skyline-summit-intro.png')});
    await page.evaluate(()=>{const flyer=enemies.filter(e=>e.type==='nightwing').sort((a,b)=>a.x-b.x)[0];pl.x=flyer.x-100;pl.y=436;pl.vx=0;pl.vy=0;pl.ground=true;pl.inv=0;cam=pl.x-W/3;});
    for(let i=0;i<180&&await page.evaluate('!enemies.some(e=>e.type==="nightwing"&&e.attackPhase==="charge")');i++)await step(1);
    assert.equal(await page.evaluate('enemies.some(e=>e.type==="nightwing"&&e.attackPhase==="charge")'),true);
    await page.screenshot({path:path.join(output,'nightwing-windup.png')});await step(47);
    assert.equal(await page.evaluate('enemies.some(e=>e.type==="nightwing"&&e.attackPhase==="dive")'),true);
    await page.screenshot({path:path.join(output,'nightwing-dive.png')});
    await page.keyboard.press('KeyP');const frozen=await page.evaluate('JSON.stringify({enemies,enemyCombat,pl,timer,score,bossState})');await step(120);
    assert.equal(await page.evaluate('JSON.stringify({enemies,enemyCombat,pl,timer,score,bossState})'),frozen);await page.getByRole('button',{name:'Resume',exact:true}).click();
    results.push('PASS actual Nightwing patrol/wind-up/dive rendering and native pause freeze');

    for(const hero of ['hopper','minty','ember','nova','bolt']){
      await choose(hero);await bossFixture();
      if(hero==='hopper')await page.evaluate('pl.x=enemies[0].x-55;pl.y=330;pl.ground=false;pl.vy=80');
      if(hero==='nova')await page.evaluate('pl.y=300;pl.ground=false;pl.vy=200');
      await page.keyboard.press('KeyE');await step(1);
      assert.ok(await page.evaluate('ability.cooldown')>0);
      await page.screenshot({path:path.join(output,`guardian-power-${hero}.png`)});
      if(hero==='minty'){
        const phase=await page.evaluate('enemies[0].attackTimer');await step(100);assert.equal(await page.evaluate('enemies[0].attackTimer'),phase);assert.equal(await page.evaluate('enemies[0].health'),5);
        await step(22);assert.equal(await page.evaluate('enemies[0].root'),0);assert.ok(await page.evaluate('enemies[0].attackTimer')<phase);
      }else if(hero==='nova'){
        await step(3);assert.equal(await page.evaluate('pl.vy'),140);assert.equal(await page.evaluate('enemies[0].health'),5);
      }else{
        await step(35);assert.equal(await page.evaluate('enemies[0].health'),4);assert.equal(await page.evaluate('score'),0);assert.equal(await page.evaluate('bossState.defeated'),false);
      }
      results.push(`PASS ${hero}: native E boss interaction, no skipped fight, cooldown and correct HP/score`);
    }

    await bossFixture();await page.evaluate('pl.x=flag.x;pl.y=436;pl.vx=0');await step(1);
    assert.equal(await page.evaluate('state'), 'play');assert.equal(await page.evaluate('score'),0);
    await page.screenshot({path:path.join(output,'guardian-locked-exit.png')});
    await bossFixture();await page.evaluate("enemies[0].attackPhase='windup';enemies[0].attackTimer=.5");
    await page.keyboard.press('KeyP');const phaseFreeze=await page.evaluate('JSON.stringify({enemies,enemyCombat,pl,bossState,timer,score})');
    await page.getByRole('button',{name:'Settings',exact:true}).click();await step(60);assert.equal(await page.evaluate('JSON.stringify({enemies,enemyCombat,pl,bossState,timer,score})'),phaseFreeze);
    await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();
    results.push('PASS final exit remains locked while boss lives, and settings freeze boss phase/health');

    await bossFixture();await page.evaluate('pl.shield=true;enemyCombat.projectiles=[{kind:"wave",owner:enemies[0],x:pl.x+13,y:459,vx:0,vy:0,radius:7,life:2.4}]');await step(1);
    assert.equal(await page.evaluate('lives===3&&!pl.shield&&enemyCombat.projectiles.length===0'),true);
    await page.evaluate("enemies[0].health=3;enemies[0].root=1;pl.y=ROWS*T+60");await step(1);
    assert.equal(await page.evaluate('lives===2&&enemies[0].health===3&&!enemies[0].root&&enemyCombat.projectiles.length===0&&!bossState.defeated'),true);
    await page.keyboard.press('KeyP');await page.getByRole('button',{name:'Restart level',exact:true}).click();await page.getByRole('button',{name:'Restart level',exact:true}).click();
    assert.equal(await page.evaluate('enemies.find(e=>e.type==="guardian").health===5&&bossState.required&&!bossState.defeated'),true);
    results.push('PASS boss shockwave shield, pit death cleanup/preserved HP and native full fight restart');

    await bossFixture();await page.emulateMedia({reducedMotion:'reduce'});
    const still=await page.evaluate('(()=>{drawSummitBG();const a=cv.toDataURL();enemyCombat.clock+=10;drawSummitBG();return a===cv.toDataURL()})()');assert.equal(still,true);await page.evaluate('draw()');
    results.push('PASS reduced-motion Summit background removes decorative wind streaks');
    for(const size of [{width:960,height:540},{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:320,height:240}]){
      await page.setViewportSize(size);await page.waitForFunction('Math.abs(parseFloat(cv.style.width)-(touchMode&&innerWidth>innerHeight&&innerWidth>=480?innerWidth/960:Math.min(innerWidth/960,innerHeight/540))*960)<.1',null,{polling:50});await page.evaluate('draw()');
      const box=await page.locator('#boss-hud').boundingBox(),button=await page.locator('#ability-button').boundingBox(),power=await page.locator('#ability-hud').boundingBox();
      assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width&&box.y+box.height<=size.height,JSON.stringify({box,size}));
      const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
      assert.equal(overlaps(box,button)||(power&&overlaps(box,power))||false,false,JSON.stringify({box,button,power}));
      assert.equal(await page.locator('#boss-health').getAttribute('aria-valuenow'),'5');
      await page.screenshot({path:path.join(output,`guardian-hud-${size.width}x${size.height}.png`)});
    }
    results.push('PASS native boss HP/phase HUD stays visible without ability-control overlap in all five viewports');
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'skyline-results.json'),JSON.stringify({results,errors},null,2));return results;
  }finally{await context.close();}
};
