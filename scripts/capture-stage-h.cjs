// Exact Stage G vs current captures, plus actual wall-clock input footage. No
// simulation speed-up or player/world edits occur during the native-input clips.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),cp=require('node:child_process');
const {chromium}=require('playwright');
const out=process.env.COIN_HOPPER_TEST_OUTPUT||path.join(os.tmpdir(),'coin-hopper-stage-h-captures');fs.mkdirSync(out,{recursive:true});
const before=cp.execFileSync('git',['show','3469a3d78d429faf6385cb85bdecfcc459d1a2b8:index.html'],{cwd:path.join(__dirname,'..'),maxBuffer:8*1024*1024}),after=fs.readFileSync(path.join(__dirname,'../index.html'));
const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(q.url==='/before'?before:after);});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});const errors=[];
 try{
  // Controlled comparisons are labeled fixtures. Stage G is exact verified source.
  for(const label of ['before','after']){
   const context=await browser.newContext({viewport:{width:960,height:540}});await context.addInitScript(()=>requestAnimationFrame=()=>0);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/'+label);await page.waitForFunction('heroArt.complete&&heroArt.naturalWidth');
   for(let i=0;i<6;i++){
    await page.evaluate(i=>{newGame();startLevel(i);selectedCharacter='hopper';pl.character='hopper';pl.inv=0;draw();},i);await page.screenshot({path:path.join(out,`${label}-level-${i+1}-spawn-fixture.png`)});
   }
   for(const [w,h]of [[960,540],[1440,810],[390,844],[844,390],[960,360]]){
    await page.setViewportSize({width:w,height:h});await page.evaluate('startLevel(2);pl.x=23*T;pl.y=436;pl.inv=0;cam=pl.x-W/3;draw()');await page.screenshot({path:path.join(out,`${label}-level3-crossing-fixture-${w}x${h}.png`)});
    await page.evaluate("startLevel(5);pl.x=enemies.find(e=>e.type==='guardian').x-100;pl.y=436;pl.inv=0;cam=pl.x-W/3;draw()");await page.screenshot({path:path.join(out,`${label}-guardian-fixture-${w}x${h}.png`)});
   }
   await context.close();
  }
  // Normal menus with a disclosed fully unlocked save, then actual timed input.
  // Every level begins at ordinary spawn; no direct startLevel/actor setup.
  const context=await browser.newContext({viewport:{width:960,height:540},recordVideo:{dir:path.join(out,'clips'),size:{width:960,height:540}}});
  await context.addInitScript(()=>localStorage.setItem('coinhopper_progress_v1',JSON.stringify({version:1,completed:Array(6).fill(true),lastLevel:0,started:true})));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const shots=[];
  for(const [hero,level]of [...['Hopper','Minty','Ember','Nova','Bolt'].map(h=>[h,0]),...[1,2,3,4,5].map(l=>['Hopper',l])]){
   await page.goto(base+'/after');await page.getByRole('button',{name:'Level Select',exact:true}).click();await page.locator('#level-choice-'+level).click();await page.getByRole('button',{name:hero,exact:true}).click();await page.screenshot({path:path.join(out,`native-picker-${hero.toLowerCase()}.png`)});await page.getByRole('button',{name:'Start game',exact:true}).click();await page.waitForFunction('pl.inv<=0');
   await page.screenshot({path:path.join(out,`native-idle-${hero.toLowerCase()}-level-${level+1}.png`)});
   await page.keyboard.down('ArrowRight');await page.waitForTimeout(160);
   for(let n=0;n<8;n++){const name=`native-run-${hero.toLowerCase()}-level-${level+1}-${n}.png`;await page.screenshot({path:path.join(out,name)});shots.push(name);await page.waitForTimeout(17);}
   await page.keyboard.up('ArrowRight');await page.keyboard.down('Space');await page.waitForTimeout(120);await page.screenshot({path:path.join(out,`native-jump-${hero.toLowerCase()}-level-${level+1}.png`)});await page.keyboard.up('Space');
   await page.waitForTimeout(160);await page.screenshot({path:path.join(out,`native-fall-${hero.toLowerCase()}-level-${level+1}.png`)});
  }
  const video=page.video();await context.close();await video.saveAs(path.join(out,'stage-h-normal-input.webm'));
  if(errors.length)throw new Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'stage-h-capture-notes.json'),JSON.stringify({baseline:'3469a3d78d429faf6385cb85bdecfcc459d1a2b8',fixtureComparisons:'Identical initial scene positions at native browser sizes; names explicitly say fixture.',normalInput:'Fully unlocked save enables native Level Select; ordinary spawn, menu clicks, real wall-clock keyboard movement/jump; RAF and simulation unmodified. Clips are short motion/readability samples, not full human or campaign completion.',runFrames:shots,errors},null,2));
  const rows=['<h1>Stage H native browser comparisons</h1><p>Images are native 960×540 captures; use browser at100% zoom. Before/after spawn scenes are explicitly controlled fixtures. The video uses ordinary spawn and real timed input.</p>'];
  for(let i=1;i<=6;i++)rows.push(`<h2>Level ${i}</h2><p>Stage G before (fixture)</p><img src="before-level-${i}-spawn-fixture.png"><p>Stage H after (fixture)</p><img src="after-level-${i}-spawn-fixture.png">`);
  rows.push('<h2>Normal input footage</h2><video controls src="stage-h-normal-input.webm" width="960"></video>');
  fs.writeFileSync(path.join(out,'stage-h-comparison.html'),'<!doctype html><meta charset="utf-8"><title>Coin Hopper Stage H evidence</title><style>body{font:16px sans-serif;background:#e5eff3;color:#24374d}img{display:block;width:960px;height:540px;max-width:none}video{display:block}</style>'+rows.join(''));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
