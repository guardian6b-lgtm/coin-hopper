const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const verify=require('./progression-page-checks.cjs');
module.exports=async function verifyProgression(browser,url,output){
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),contexts=[],errors=[],results=[];
  const open=async options=>{const context=await browser.newContext(options);contexts.push(context);await context.route(url,route=>route.fulfill({status:200,contentType:'text/html',body:html}));await context.setOffline(true);return context;};
  try{
    const desktop=await open({viewport:{width:960,height:540}}),page=await desktop.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);results.push(...await verify(page,output));
    const mobile=await open({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await mobile.addInitScript(()=>{localStorage.setItem('coinhopper_progress_v1',JSON.stringify({version:1,completed:[true,true,true,true,true,false],lastLevel:5,started:true}));localStorage.setItem('coinhopper_audio_v1','muted');});
    const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));await mp.goto(url);await mp.getByRole('button',{name:'Level Select',exact:true}).tap();await mp.locator('#level-choice-5').tap();await mp.getByRole('button',{name:'Minty',exact:true}).tap();await mp.getByRole('button',{name:'Start game',exact:true}).tap();assert.equal(await mp.evaluate('lvl===5&&pl.character==="minty"&&score===0&&lives===3&&touchMode'),true);
    await mp.screenshot({path:path.join(output,'progress-mobile-start.png')});results.push('PASS simulated portrait touch Level Select → Minty → fresh Skyline Summit');
    const blocked=await open({viewport:{width:960,height:540}});await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}}));
    const bp=await blocked.newPage();bp.on('pageerror',e=>errors.push(e.message));await bp.goto(url);await bp.getByRole('button',{name:'Play',exact:true}).click();await bp.getByRole('button',{name:'Start game',exact:true}).click();await bp.keyboard.press('Escape');await bp.getByRole('button',{name:'Title screen',exact:true}).click();await bp.getByRole('button',{name:'Continue',exact:true}).click();await bp.getByRole('button',{name:'Start game',exact:true}).click();assert.equal(await bp.evaluate('lvl===0&&score===0&&lives===3'),true);await bp.reload();assert.equal(await bp.evaluate('unlockedCount()===1&&!progress.started'),true);results.push('PASS blocked browser storage supports in-session Continue and safe fresh progress on reload');
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'progress-browser-results.json'),JSON.stringify({results,errors},null,2));return results;
  }finally{for(const context of contexts)await context.close();}
};
