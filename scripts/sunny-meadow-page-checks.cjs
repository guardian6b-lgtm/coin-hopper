// Named render/quality fixtures. CPU/frame metrics are runner measurements, not
// physical-phone fps, input-to-photon, battery, thermal or owner art acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function meadowPage(page,output,label='browser'){
 const initial=await page.evaluate(() => ({hero:selectedCharacter,mode:meadowSettings.mode,reduced:visualSettings.reduced,stored:localStorage.getItem('coinhopper_meadow_art_v1')})),results=[];await page.evaluate('window.__meadowRAF=requestAnimationFrame;requestAnimationFrame=()=>0');await page.waitForTimeout(50);
 try{
  await page.evaluate("newGame();meadowSettings.mode='illustrated';prepareMeadowArt()");await page.waitForFunction('meadowPlate.complete&&meadowPlate.naturalWidth===1536&&heroArt.complete&&heroArt.naturalWidth===1535');
  // Warm first-use Canvas raster caches before exact mode-to-mode pixels.
  for(let level=1;level<6;level++){
   const same=await page.evaluate(level=>{startLevel(level);cam=400;meadowSettings.mode='standard';draw();cx.getImageData(0,0,W,H);draw();const a=cx.getImageData(0,0,W,H).data;meadowSettings.mode='illustrated';draw();const b=cx.getImageData(0,0,W,H).data;return a.every((v,i)=>v===b[i]);},level);assert.equal(same,true,'No art rollout into Level'+(level+1));
  }results.push('PASS Levels2–6 remain pixel-identical with illustrated mode selected');
  const menus=await page.evaluate(()=>{showMenu('title','title');meadowSettings.mode='standard';draw();draw();const a=cv.toDataURL();meadowSettings.mode='illustrated';draw();return a===cv.toDataURL()});assert.equal(menus,true);results.push('PASS title backdrop stays pixel-identical after returning from gameplay');
  const metrics=[];
  for(const mode of ['standard','illustrated','lite']){
   await page.evaluate(mode=>{newGame();meadowSettings.mode=mode;for(let i=0;i<30;i++){update();draw();}},mode);
   const row=await page.evaluate(async mode=>{
    const cpu=[],interval=[],schedule=window.__meadowRAF;let previous;
    for(let n=0;n<180;n++)await new Promise(resolve=>schedule(now=>{if(previous!==undefined)interval.push(now-previous);previous=now;const start=performance.now();update();draw();cpu.push(performance.now()-start);resolve();}));
    const stats=a=>{a.sort((a,b)=>a-b);return {mean:a.reduce((a,b)=>a+b,0)/a.length,p95:a[Math.floor(a.length*.95)],max:a.at(-1)};};return {mode,frames:cpu.length,cpuMs:stats(cpu),frameIntervalMs:stats(interval),heapBytes:performance.memory?.usedJSHeapSize??null};
   },mode);metrics.push(row);assert.ok(Number.isFinite(row.cpuMs.p95));
  }
  const input=[];
  for(let n=0;n<5;n++){
   await page.evaluate(()=>{newGame();meadowSettings.mode='illustrated';window.__keyAt=null;window.addEventListener('keydown',e=>{if(e.code==='ArrowRight')window.__keyAt=performance.now();},{once:true});window.__inputProbe=new Promise(resolve=>{const poll=()=>window.__meadowRAF(()=>{update();draw();if(window.__keyAt!==null&&pl.vx>0)resolve(performance.now()-window.__keyAt);else poll();});poll();});});
   await page.keyboard.down('ArrowRight');input.push(await page.evaluate('window.__inputProbe'));await page.keyboard.up('ArrowRight');
  }
  const still=await page.evaluate(()=>{visualSettings.reduced=true;newGame();meadowSettings.mode='illustrated';cam=0;drawBG();const a=cv.toDataURL();cam=600;time+=2;drawBG();visualSettings.reduced=false;return a===cv.toDataURL();});assert.equal(still,true);results.push('PASS reduced-motion freezes decorative parallax; cached rich/Lite renderer has real frame and event-to-simulation profiles');
  for(const size of [{width:844,height:390},{width:960,height:540}]){
   await page.setViewportSize(size);await page.evaluate(size=>{touchMode=size.width===844;fit();newGame();for(let n=0;n<65;n++)update();cam=0;},size);
   const pixels=[];for(const mode of ['standard','illustrated','lite']){await page.evaluate(mode=>{meadowSettings.mode=mode;draw();},mode);pixels.push(await page.locator('#c').evaluate(c=>c.toDataURL()));await page.screenshot({path:path.join(output,`${label}-meadow-${mode}-${size.width}x${size.height}.png`)});}assert.equal(new Set(pixels).size,3);
  }
  results.push('PASS native844×390 and960×540 Standard/Illustrated/Lite captures; three distinct live renders');
  await page.evaluate("showMenu('settings','title')");await page.getByLabel('Sunny Meadow art quality',{exact:true}).selectOption('lite');assert.equal(await page.evaluate('meadowSettings.mode'),'lite');assert.equal(await page.evaluate("localStorage.getItem('coinhopper_meadow_art_v1')"),'lite');
  await page.evaluate("meadowAssetFailed=true;newGame();draw()");assert.equal(await page.evaluate('meadowPrototypeActive()'),false);results.push('PASS native quality select/persistence and automatic missing-art Standard fallback');
  const report={results,metrics,inputEventToSimulationMs:input,inputLimit:'Native key event→next scheduled simulation/draw on this runner, not input-to-photon',physicalPhones:'NOT TESTED',audibleArtAcceptance:'NOT TESTED',decodedPlateRGBABytes:1536*1024*4,sourceHTMLBytes:fs.statSync(path.join(__dirname,'../index.html')).size};fs.writeFileSync(path.join(output,`${label}-meadow-profile.json`),JSON.stringify(report,null,2));return results;
 }finally{await page.evaluate(initial=>{meadowSettings.mode=initial.mode;visualSettings.reduced=initial.reduced;if(initial.stored===null)localStorage.removeItem('coinhopper_meadow_art_v1');else localStorage.setItem('coinhopper_meadow_art_v1',initial.stored);meadowAssetFailed=false;selectedCharacter=initial.hero;newGame();},initial);await page.evaluate('requestAnimationFrame=window.__meadowRAF;delete window.__meadowRAF;last=performance.now();accum=0;requestAnimationFrame(frame)');}
};
