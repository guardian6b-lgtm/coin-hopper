// Named rendering fixtures. No production test hooks, altered maps or physical-device claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function stageIPage(page,output,label='chromium',resize=size=>page.setViewportSize(size)){
 fs.mkdirSync(output,{recursive:true});const results=[];
 await page.evaluate('window.__stageIRAF=requestAnimationFrame;requestAnimationFrame=()=>0');await page.waitForTimeout(50);
 const initial=await page.evaluate('({prefs:{...stageIPrefs},hero:selectedCharacter,mode:meadowSettings.mode,reduced:visualSettings.reduced})');
 try{
  await page.evaluate("stageIPrefs.art=true;prepareStageIArt();newGame();startLevel(5)");await page.waitForFunction('stageIReady("guardian")&&heroArt.complete');
  const contract=await page.evaluate('({hp:ENEMY_TYPES.guardian.health,w:ENEMY_TYPES.guardian.width,h:ENEMY_TYPES.guardian.height,recovery:GUARDIAN_ENCOUNTER.recovery})');assert.deepEqual(contract,{hp:5,w:68,h:64,recovery:2.8});
  const pixels=[];
  for(const size of [{width:844,height:390},{width:390,height:844},{width:960,height:540}]){
   await resize(size);await page.evaluate(()=>{touchMode=true;fit();newGame();startLevel(5);const e=enemies.find(e=>e.type==='guardian');pl.x=e.x-145;pl.y=436;pl.vx=pl.vy=0;pl.inv=0;cam=e.x-500;enemies=[e];bossState.engaged=true;});
   for(const pose of ['idle','windup','throw','recover','damaged','walk','death','rubble']){
    await page.evaluate(pose=>{score=levelScore=0;const e=enemies[0];if(e){e.hitFlash=0;e.health=5;e.attackPhase='idle';e.pattern='slam';e.attackTimer=1;e.artVx=0;e.animDistance=18;delete bossState.remains;bossState.defeated=false;e.dead=0;}
     if(pose==='windup')e.attackPhase='windup';if(pose==='throw'){e.attackPhase='windup';e.pattern='boulder';}
     if(pose==='recover')e.attackPhase='recover';if(pose==='damaged'){e.health=2;e.hitFlash=.2;}
     if(pose==='walk'){e.health=1;e.artVx=48;}
     if(pose==='death'||pose==='rubble'){e.health=1;e.attackPhase='recover';e.openingHit=false;e.hitTime=0;damageEnemy(e,'stomp');bossState.remains.age=pose==='death'?.8:2.1;bossState.remains.settled=pose==='rubble';}
     draw();},pose);
    await page.screenshot({path:path.join(output,`${label}-guardian-${pose}-${size.width}x${size.height}.png`)});if(size.width===960)pixels.push(await page.locator('#c').evaluate(c=>c.toDataURL()));
   }
  }
  assert.ok(new Set(pixels).size>=7);results.push('PASS actual-engine C3 idle/windup/throw/open/damage/walk/death/rubble renders at three native viewport sizes (named fixtures, not owner art acceptance)');
  const profile=await page.evaluate(()=>{newGame();startLevel(5);const e=enemies.find(e=>e.type==='guardian');enemies=[e];pl.x=e.x-180;pl.y=436;cam=e.x-500;const times=[];for(let n=0;n<240;n++){e.animDistance=n*.8;e.artVx=48;e.health=1;const t=performance.now();draw();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {frames:240,p95Ms:times[Math.floor(times.length*.95)],meanMs:times.reduce((a,b)=>a+b)/times.length,decodedGuardianRGBABytes:1254*1254*4,heapBytes:performance.memory?.usedJSHeapSize??null};});
  assert.ok(Number.isFinite(profile.p95Ms));fs.writeFileSync(path.join(output,`${label}-stage-i-profile.json`),JSON.stringify({...profile,scope:'Headless runner render cost; not device FPS, temperature, battery or touch latency.'},null,2));
  const sound=await page.evaluate(async()=>{const context=new OfflineAudioContext(1,22050,22050),data=composeGuardianSfx('fracture'),buffer=context.createBuffer(1,data.samples.length,22050);buffer.getChannelData(0).set(data.samples);const a=context.createBufferSource(),gain=context.createGain();a.buffer=buffer;gain.gain.value=.25;a.connect(gain);gain.connect(context.destination);a.start();const rendered=(await context.startRendering()).getChannelData(0);let error=0;for(let i=0;i<data.samples.length;i++)error=Math.max(error,Math.abs(rendered[i]-data.samples[i]*.25));return {maximumQuarterVolumeError:error,first:rendered[0],last:rendered.at(-1)};});assert.ok(sound.maximumQuarterVolumeError<1e-6);assert.equal(sound.first,0);assert.equal(sound.last,0);results.push('PASS real OfflineAudioContext renders original stone Foley through a 25% effects gain; audible quality NOT TESTED');
  await resize({width:844,height:390});await page.evaluate("showMenu('title','title')");await page.screenshot({path:path.join(output,`${label}-stage-i-title-844x390.png`)});
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Stage I C3 Guardian and title preview',{exact:true}).uncheck();assert.equal(await page.evaluate('stageIPrefs.art'),false);assert.equal(JSON.parse(await page.evaluate("localStorage.getItem('coinhopper_stage_i_v1')")).art,false);await page.getByLabel('Stage I C3 Guardian and title preview',{exact:true}).check();results.push('PASS native preview checkbox and safe versioned persistence');
  return results;
 }finally{
  await page.evaluate(initial=>{Object.assign(stageIPrefs,initial.prefs);selectedCharacter=initial.hero;meadowSettings.mode=initial.mode;visualSettings.reduced=initial.reduced;prepareStageIArt();saveStageIPrefs();newGame();showMenu('title','title');requestAnimationFrame=window.__stageIRAF;delete window.__stageIRAF;last=performance.now();accum=0;requestAnimationFrame(frame);},initial);
 }
};
