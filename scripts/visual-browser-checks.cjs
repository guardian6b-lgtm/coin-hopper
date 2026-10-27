const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const capture=require('./visual-captures.cjs');
module.exports=async function verifyVisual(browser,url,output){
  const results=[],errors=[],baseline='6381c6f81a169bfbc702591fc2ead0ef81eca765';
  const before=execFileSync('git',['show',baseline+':index.html'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
  fs.writeFileSync(path.join(output,'before-stage-d.html'),before);
  const contexts=[];
  try{
    for(const label of ['before','after']){
      const context=await browser.newContext({viewport:{width:960,height:540}});contexts.push(context);
      await context.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
      if(label==='before')await context.route('**/before.html',route=>route.fulfill({status:200,contentType:'text/html',body:before}));
      const page=await context.newPage();page.on('pageerror',e=>errors.push(label+': '+e.message));
      await page.goto(label==='before'?url+'before.html':url);await context.setOffline(true);
      const captures=await capture(page,output,label);assert.equal(captures.length,28);
      results.push(`PASS ${label}: real offline browser captures, native menu reachability in five sizes, six scenes and seven menu fixtures`);
      if(label==='after'){
        await page.waitForFunction('heroArt.complete&&heroArt.naturalWidth===1535');
        const pixels=await page.evaluate(()=>{
          const canvas=document.createElement('canvas');canvas.width=120;canvas.height=120;const ctx=canvas.getContext('2d'),hashes=[];
          for(const hero of CHARACTERS){for(const pose of ['idle','run','jump','fall','hurt','victory']){ctx.clearRect(0,0,120,120);drawCharacter(ctx,hero.id,60,102,60,64,1,pose,1);hashes.push(canvas.toDataURL());}}
          return hashes;
        });assert.equal(new Set(pixels).size,30);results.push('PASS all 30 hero/pose portraits produce distinct real pixels');
        await page.evaluate("showMenu('settings','title')");await page.getByRole('checkbox',{name:'Reduce decorative motion',exact:true}).check();
        assert.equal(await page.evaluate('reducedMotion()'),true);
        await context.setOffline(false);await page.reload();await context.setOffline(true);assert.equal(await page.evaluate('reducedMotion()'),true);
        await page.evaluate('newGame();startLevel(5);pl.inv=1;draw()');
        // A render onto the same surface can blend alpha; clear it before the pixel comparison.
        const still=await page.evaluate('(()=>{cx.clearRect(0,0,W,H);drawPlayer();const a=cv.toDataURL();time+=.3;cx.clearRect(0,0,W,H);drawPlayer();return a===cv.toDataURL()})()');assert.equal(still,true);
        results.push('PASS native reduced-motion checkbox persists across reload and disables player flashing/bobbing');
        await context.setOffline(false);await page.goto(url);
        const timing=await page.evaluate(()=>{
          newGame();const frames=[];for(let i=0;i<6;i++){startLevel(i);for(let f=0;f<60;f++){const start=performance.now();draw();frames.push(performance.now()-start);}}
          frames.sort((a,b)=>a-b);return {frames:frames.length,meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:frames[Math.floor(frames.length*.95)],maxMs:frames.at(-1),renderer:navigator.userAgent};
        });assert.ok(timing.p95Ms<33.34,JSON.stringify(timing));fs.writeFileSync(path.join(output,'render-performance.json'),JSON.stringify(timing,null,2));results.push('PASS measured six-scene rendering p95 below 33.34ms on this automated runner');
      }
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'visual-results.json'),JSON.stringify({baseline,results,errors},null,2));return results;
  }finally{for(const context of contexts)await context.close();}
};
