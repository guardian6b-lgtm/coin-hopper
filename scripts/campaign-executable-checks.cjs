// All six legal keyboard routes inside the actual offline packaged renderer.
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
    for(const hero of ['hopper','minty','ember','nova','bolt']){
      await choose(hero);let total=0;
      for(const [index,route]of routes.entries()){
        assert.equal(await page.evaluate('lvl'),index);let captured=false;
        await replay(page,route,async tick=>{if(hero==='nova'&&tick>=400&&!captured){await page.screenshot({path:path.join(output,`${label}-level-${index+1}.png`)});captured=true;}});
        total+=route.score;
        assert.equal(await page.evaluate('state'),'done');assert.equal(await page.evaluate('lives'),3);
        assert.equal(await page.evaluate('score'),total);assert.equal(await page.evaluate('levelScore'),route.score);assert.equal(await page.evaluate('shields.some(s=>s.got)'),false);
        assert.equal(await page.evaluate('ability.cooldown===0&&pl.character'),hero);
        assert.ok(await page.evaluate('unlockedCount()')>=Math.min(routes.length,index+2));
        await page.getByRole('button',{name:index===routes.length-1?'Finish':'Next level',exact:true}).click();
        results.push({character:hero,level:route.name,status:'PASS',score:route.score,total,checks:['actual offline renderer','normal New Game/Next flow without direct level setup','legal no-power/no-shield route','baseline movement','three lives','earned progression','native mandatory boss/victory flow']});
      }
      assert.equal(total,routes.reduce((n,r)=>n+r.score,0));assert.equal(await page.evaluate('state'),'win');assert.equal(await page.evaluate('score'),total);
      assert.equal(await page.evaluate('progress.completed.every(Boolean)'),true);
    }
    await choose('nova');
    return results;
  }finally{
    await page.evaluate('requestAnimationFrame=window.__verificationRAF;delete window.__verificationRAF;last=performance.now();accum=0;requestAnimationFrame(frame)');
  }
};
