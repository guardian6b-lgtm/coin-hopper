// New-level legal keyboard routes inside the actual offline packaged renderer.
// RAF is suspended only for deterministic replay, then restored; product code is untouched.
const assert=require('node:assert/strict');
const path=require('node:path');
const routes=require('../tests/fixtures/campaign-routes.cjs');
const replay=require('./replay-browser-route.cjs');
module.exports=async function verifyExecutableCampaign(app,output,label){
  const page=app.page,results=[];
  await page.evaluate('window.__verificationRAF=requestAnimationFrame;requestAnimationFrame=()=>0');
  await page.waitForTimeout(100);
  const choose=async hero=>{
    if(await page.evaluate('state')==='play')await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Title screen',exact:true}).click();await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.getByRole('button',{name:hero[0].toUpperCase()+hero.slice(1),exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
  };
  try{
    for(const hero of ['hopper','minty','ember','nova','bolt'])for(const [offset,route]of routes.slice(4).entries()){
      await choose(hero);await page.evaluate(index=>startLevel(index),offset+4);
      let captured=false;
      await replay(page,route,async tick=>{if(hero==='nova'&&tick>=400&&!captured){await page.screenshot({path:path.join(output,`${label}-level-${offset+5}.png`)});captured=true;}});
      assert.equal(await page.evaluate('state'),'done');assert.equal(await page.evaluate('lives'),3);
      assert.equal(await page.evaluate('levelScore'),route.score);assert.equal(await page.evaluate('shields.some(s=>s.got)'),false);
      assert.equal(await page.evaluate('ability.cooldown===0&&pl.character'),hero);
      const final=await page.evaluate('lvl+1===LEVELS.length');
      await page.getByRole('button',{name:final?'Finish':'Next level',exact:true}).click();
      if(final)assert.equal(await page.evaluate('state'),'win');
      results.push({character:hero,level:route.name,status:'PASS',checks:['actual offline renderer','legal no-power/no-shield route','baseline movement','three lives','expected score','native completion flow']});
    }
    await choose('nova');
    return results;
  }finally{
    await page.evaluate('requestAnimationFrame=window.__verificationRAF;delete window.__verificationRAF;last=performance.now();accum=0;requestAnimationFrame(frame)');
  }
};
