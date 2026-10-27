// Real menu flows and a legal earned route. Seeded late-game saves are fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const replay=require('./replay-browser-route.cjs'),firstRoute=require('../tests/fixtures/campaign-routes.cjs')[0];
const sizes=[{width:960,height:540},{width:1440,height:810},{width:390,height:844},{width:844,height:390},{width:320,height:240}];
module.exports=async function verifyProgressionPage(page,output,label='browser',resize=size=>page.setViewportSize(size)){
  const results=[],initial=await page.evaluate('({size:{width:innerWidth,height:innerHeight},character:localStorage.getItem("coinhopper_character_v1"),progress:localStorage.getItem(PROGRESS_KEY),settings:localStorage.getItem("coinhopper_settings"),audio:localStorage.getItem("coinhopper_audio_v1"),motion:localStorage.getItem("coinhopper_motion_v1"),best:best})');
  let earned=initial.progress;
  try{
    await page.evaluate('localStorage.removeItem(PROGRESS_KEY)');await page.reload();
    assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled(),true);
    await page.keyboard.press('Tab');assert.equal(await page.getByRole('button',{name:'Level Select',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');assert.equal(await page.evaluate('state'),'levels');
    for(let i=0;i<6;i++)assert.equal(await page.locator('#level-choice-'+i).isDisabled(),i>0);
    await page.evaluate('selectLevel(5)');assert.equal(await page.evaluate('state'),'levels');await page.keyboard.press('Escape');
    await page.evaluate('window.__progressRAF=requestAnimationFrame;requestAnimationFrame=()=>0');await page.waitForTimeout(40);
    try{
      await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Hopper',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
      await replay(page,firstRoute);assert.equal(await page.evaluate('state'), 'done');assert.equal(await page.evaluate('score===500&&lives===3&&unlockedCount()===2&&progress.lastLevel===1'),true);
      await page.screenshot({path:path.join(output,`${label}-progress-earned-route.png`)});
    }finally{await page.evaluate('requestAnimationFrame=window.__progressRAF;delete window.__progressRAF;last=performance.now();accum=0;requestAnimationFrame(frame)');}
    results.push('PASS fresh locks/disabled Continue, keyboard Level Select, guarded locked entry and legal no-power route earns Level 2');
    await page.getByRole('button',{name:'Title screen',exact:true}).click();await page.reload();
    await page.getByRole('button',{name:'Continue',exact:true}).click();assert.match(await page.locator('#menu-description').innerText(),/Brick Hills/);
    await page.getByRole('button',{name:'Minty',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
    assert.equal(await page.evaluate('lvl===1&&score===0&&lives===3&&!pl.shield&&ability.cooldown===0&&pl.character==="minty"'),true);
    await page.screenshot({path:path.join(output,`${label}-progress-continue.png`)});
    await page.keyboard.press('Escape');await page.getByRole('button',{name:'Title screen',exact:true}).click();
    earned=await page.evaluate('localStorage.getItem(PROGRESS_KEY)');
    const actual=await page.evaluate('({settings:localStorage.getItem("coinhopper_settings"),audio:localStorage.getItem("coinhopper_audio_v1"),motion:localStorage.getItem("coinhopper_motion_v1"),best})');
    for(const name of ['settings','audio','motion'])assert.equal(actual[name],initial[name],name);assert.ok(actual.best>=initial.best);
    results.push('PASS earned progress survives reload; Continue starts level beginning with fresh score/lives and preserves existing settings/best');

    await page.evaluate(()=>{localStorage.setItem(PROGRESS_KEY,JSON.stringify({version:1,completed:[true,true,true,true,true,false],lastLevel:5,started:true}));});await page.reload();
    for(const size of sizes){
      await resize(size);await page.waitForFunction(size=>innerWidth===size.width&&innerHeight===size.height,size);
      await page.getByRole('button',{name:'Level Select',exact:true}).click();
      for(let i=0;i<6;i++){
        const button=page.locator('#level-choice-'+i);assert.equal(await button.isDisabled(),false);await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();
        assert.ok(b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=size.width+1&&b.y+b.height<=size.height+1&&b.width>=44&&b.height>=44,JSON.stringify({size,b,i}));
      }
      await page.locator('#level-choice-0').scrollIntoViewIfNeeded();
      if(size.width>=960&&size.height>=540){await page.locator('.menu-panel').evaluate(el=>el.scrollTop=0);const back=await page.getByRole('button',{name:'Back',exact:true}).boundingBox();assert.ok(back&&back.y>=0&&back.y+back.height<=size.height,JSON.stringify({size,back}));}
      await page.screenshot({path:path.join(output,`${label}-progress-levels-${size.width}x${size.height}.png`)});
      await page.getByRole('button',{name:'Back',exact:true}).click();
    }
    await resize(sizes[0]);
    for(const hero of ['Hopper','Minty','Ember','Nova','Bolt']){
      await page.getByRole('button',{name:'Level Select',exact:true}).click();await page.locator('#level-choice-5').click();
      await page.getByRole('button',{name:hero,exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
      assert.equal(await page.evaluate('lvl===5&&score===0&&lives===3&&!pl.shield&&ability.cooldown===0&&bossState.required&&!bossState.defeated&&enemies.find(e=>e.type==="guardian").health===5'),true);
      assert.equal(await page.evaluate('pl.character'),hero.toLowerCase());
      // Controlled exit fixture; the separate canonical campaign routes remain legal inputs.
      await page.evaluate('pl.x=flag.x;pl.y=436;pl.vx=0;update()');assert.equal(await page.evaluate('state'), 'play');assert.equal(await page.evaluate('score'),0);
      await page.keyboard.press('Escape');await page.getByRole('button',{name:'Title screen',exact:true}).click();
    }
    results.push('PASS five responsive Level Select sizes and all five selected heroes start a fresh mandatory boss; saved completion cannot bypass the exit');
    const before=await page.evaluate('localStorage.getItem(PROGRESS_KEY)');
    await page.getByRole('button',{name:'Level Select',exact:true}).click();await page.locator('#level-choice-4').click();await page.getByRole('button',{name:'Hopper',exact:true}).click();await page.keyboard.press('Escape');
    assert.equal(await page.evaluate('state'),'levels');assert.equal(await page.evaluate('localStorage.getItem(PROGRESS_KEY)'),before);
    results.push('PASS character-picker cancel returns to Level Select without overwriting the saved attempt');
    fs.writeFileSync(path.join(output,`${label}-progress-results.json`),JSON.stringify({results,earnedProgress:JSON.parse(earned),fixtures:'Late-game availability and locked-exit position are controlled fixtures; first-level earned route is legal input only.',humanHardware:'NOT TESTED'},null,2));return results;
  }finally{
    await resize(initial.size);
    await page.evaluate(data=>{if(data.earned===null)localStorage.removeItem(PROGRESS_KEY);else localStorage.setItem(PROGRESS_KEY,data.earned);if(data.character===null)localStorage.removeItem('coinhopper_character_v1');else localStorage.setItem('coinhopper_character_v1',data.character);},{earned,character:initial.character});
    await page.reload();
  }
};
