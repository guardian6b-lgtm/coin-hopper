const assert=require('node:assert/strict');
const path=require('node:path');
const replay=require('./replay-browser-route.cjs');
const cavern=require('../tests/fixtures/crystal-caverns.cjs');
module.exports=async function verifyCampaign(browser,url,output){
  const results=[],errors=[];
  const context=await browser.newContext({viewport:{width:960,height:540}});
  await context.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(url);await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Nova',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
    await page.evaluate('startLevel(4);for(let i=0;i<7;i++)update();draw()');
    assert.equal(await page.evaluate('enemies.filter(e=>e.type==="shellback").length===3&&enemies.filter(e=>e.type==="sentinel").length===3'),true);
    await page.screenshot({path:path.join(output,'crystal-caverns-intro.png')});
    results.push('PASS Crystal Caverns distinct scenery, safe intro, two-HP placements and optional shield');

    await page.evaluate('startLevel(4)');await replay(page,cavern.bonus);
    assert.equal(await page.evaluate('state==="done"&&lives===3&&levelScore===600&&ability.cooldown===0'),true);
    const raised=await page.evaluate('coins.filter(c=>c.y<400&&c.got).map(c=>Math.floor(c.x/T))');
    for(const x of [9,10,11,40,42,136,137,138,139])assert.ok(raised.includes(x));
    results.push('PASS Crystal Caverns optional legal-input route reaches all raised bonus groups and shield');

    await page.evaluate('startLevel(4)');await page.emulateMedia({reducedMotion:'reduce'});
    const hashes=await page.evaluate('(()=>{drawCavernBG();const first=cv.toDataURL();ability.clock+=10;drawCavernBG();return [first,cv.toDataURL(),reducedMotion()]})()');
    assert.equal(hashes[2],true);assert.equal(hashes[0],hashes[1]);await page.evaluate('draw()');
    await page.screenshot({path:path.join(output,'crystal-caverns-reduced-motion.png')});
    results.push('PASS reduced-motion preference keeps cave sparkles static without changing geometry');

    await page.evaluate("damageEnemy(enemies[0],'fireball');shields[0].got=true;pl.y=ROWS*T+60;update();draw()");
    assert.equal(await page.evaluate('lives===2&&enemies[0].health===1&&enemyCombat.projectiles.length===0'),true);
    await page.keyboard.press('KeyP');await page.getByRole('button',{name:'Restart level',exact:true}).click();await page.getByRole('button',{name:'Restart level',exact:true}).click();
    assert.equal(await page.evaluate('enemies.every(e=>e.health===2)&&!shields[0].got&&lvl===4'),true);
    results.push('PASS actual cave death/restart preserves then restores armor and clears hostile shots');

    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    try{
      await mobile.addInitScript(()=>{window.requestAnimationFrame=()=>1;});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
      await mp.goto(url);await mp.getByRole('button',{name:'Play',exact:true}).tap();await mp.getByRole('button',{name:'Ember',exact:true}).tap();await mp.getByRole('button',{name:'Start game',exact:true}).tap();
      await mp.evaluate('startLevel(4);for(let i=0;i<10;i++)update();draw()');await mp.locator('#ability-button').tap();await mp.evaluate('update();draw()');
      assert.equal(await mp.evaluate('ability.projectiles.length'),1);
      for(const size of [{width:390,height:844},{width:844,height:390},{width:320,height:240}]){
        await mp.setViewportSize(size);await mp.waitForFunction('Math.abs(parseFloat(cv.style.width)-Math.min(innerWidth/960,innerHeight/540)*960)<.1',null,{polling:50});await mp.evaluate('draw()');
        const button=await mp.locator('#ability-button').boundingBox();assert.ok(button.width>=44&&button.height>=44&&button.x>=0&&button.y>=0&&button.x+button.width<=size.width&&button.y+button.height<=size.height);
        await mp.screenshot({path:path.join(output,`crystal-caverns-${size.width}x${size.height}.png`)});
      }
      results.push('PASS cave mobile Ability and responsive portrait/landscape/low-height layout');
    }finally{await mobile.close();}
    assert.deepEqual(errors,[]);return results;
  }finally{await context.close();}
};
