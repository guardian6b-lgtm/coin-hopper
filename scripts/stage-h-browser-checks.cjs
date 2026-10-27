// Stage H additions to the retained browser suite. Fixtures are explicitly named;
// native-input footage and full legal routes are separate evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const heroes=['hopper','minty','ember','nova','bolt'];
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
module.exports=async function stageHBrowser(browser,url,output,{engine='chromium'}={}){
 const results=[],errors=[],captures=[];fs.mkdirSync(output,{recursive:true});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 await context.addInitScript(()=>{requestAnimationFrame=()=>0;localStorage.setItem('coinhopper_progress_v1',JSON.stringify({version:1,completed:Array(6).fill(true),lastLevel:2,started:true}));});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const choose=async(hero,level=2)=>{await page.goto(url);await page.getByRole('button',{name:'Level Select',exact:true}).tap();await page.locator('#level-choice-'+level).tap();await page.getByRole('button',{name:hero[0].toUpperCase()+hero.slice(1),exact:true}).tap();await page.getByRole('button',{name:'Start game',exact:true}).tap();await page.waitForFunction('heroArt.complete&&heroArt.naturalWidth');await page.evaluate('for(let i=0;i<5;i++)update();draw()');};
 const snap=async name=>{const file=`stage-h-${engine}-${name}.png`;await page.screenshot({path:path.join(output,file)});captures.push(file);};
 try{
  for(const hero of heroes){
   await choose(hero);await page.evaluate('pl.x=23*T;pl.y=436;pl.vx=0;pl.vy=0;pl.ground=true;pl.inv=0;enemies=[];update();draw()');
   assert.equal(await page.evaluate('pl.highJump'),2);await snap('boots-'+hero);
   // A lower-approach fixture uses native touch buttons; all five full Level3
   // routes in the main suite begin at ordinary spawn and need no boost at all.
   await page.locator('#touch-right').dispatchEvent('pointerdown',{pointerId:101,button:0,pointerType:'touch'});
   await page.evaluate('for(let i=0;i<8;i++)update();draw()');
   await page.locator('#touch-jump').dispatchEvent('pointerdown',{pointerId:102,button:0,pointerType:'touch'});
   await page.evaluate('for(let i=0;i<36;i++)update();draw()');
   await page.locator('#touch-jump').dispatchEvent('pointerup',{pointerId:102,pointerType:'touch'});
   await page.evaluate('for(let i=0;i<65;i++)update();draw()');
   await page.locator('#touch-right').dispatchEvent('pointerup',{pointerId:101,pointerType:'touch'});
   assert.equal(await page.evaluate('lives===3&&pl.x>31*T&&pl.highJump===1&&ability.cooldown===0'),true);await snap('level3-crossed-'+hero);
   results.push(`PASS ${engine} ${hero}: actual boots pickup → native touch-button boosted lower crossing, one charge, no hero power/shield`);
  }
  for(const size of [{width:390,height:844},{width:844,height:390},{width:320,height:568},{width:568,height:320},{width:320,height:240}]){
   await page.setViewportSize(size);await page.evaluate('fit();draw()');
   assert.equal(await page.locator('#pause-button').isVisible(),true);
   const boxes=[];for(const id of ['touch-left','touch-right','touch-jump','ability-button']){const b=await page.locator('#'+id).boundingBox();assert.ok(b&&b.width>=44&&b.height>=44&&b.x>=0&&b.y>=0&&b.x+b.width<=size.width+1&&b.y+b.height<=size.height+1,JSON.stringify({id,b,size}));boxes.push(b);}
   const canvas=await page.locator('#c').boundingBox();assert.ok(canvas.y+468*canvas.height/540<=Math.min(...boxes.map(b=>b.y))+1,JSON.stringify({canvas,boxes,size}));if(size.width>=480&&size.width>size.height)assert.ok(canvas.width>=size.width-1);
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.equal(overlap(boxes[i],boxes[j]),false);
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await snap(`touch-${size.width}x${size.height}`);
  }
  results.push(`PASS ${engine}: four separate 44px+ native action/move targets, no overlap at five portrait/landscape/low-height sizes`);
  await page.setViewportSize({width:844,height:390});
  for(const hero of heroes){
   await choose(hero,0);await page.evaluate("pl.x=4*T;pl.y=436;pl.ground=true;pl.inv=0;enemies=[createEnemy('walker',pl.x+100,440)];enemies[0].vx=0;draw()");
   if(engine==='chromium'){
    const cdp=await context.newCDPSession(page);const points=[];await page.evaluate(()=>{window.inputTrace=[];for(const n of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(n,e=>inputTrace.push([n,e.target.id,e.pointerId,e.button]));});
    for(const [i,id]of ['touch-right','touch-jump','ability-button'].entries()){const b=await page.locator('#'+id).boundingBox();points.push({id:i+1,x:b.x+b.width/2,y:b.y+b.height/2,radiusX:3,radiusY:3});}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await page.evaluate('for(let n=0;n<25;n++)update();draw()');assert.equal(await page.evaluate('ability.charging&&ability.cooldown===0&&tb.right&&tb.jump'),true);const area=await page.locator('#c').boundingBox(),fourth={id:99,x:area.x+area.width*.5,y:Math.max(90,area.y+area.height*.4),radiusX:3,radiusY:3};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points,fourth]});assert.equal(await page.evaluate('tb.right&&tb.jump&&ability.charging'),true,'fourth simultaneous contact must preserve held charge/movement');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[fourth]});if(hero==='minty')await page.evaluate('enemies[0].x=pl.x+80;enemies[0].y=pl.y+4');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[points[2]]});await page.evaluate('update();draw()');
    assert.equal(await page.evaluate('tb.right&&tb.jump&&pl.vx>0&&ability.cooldown>0'),true,JSON.stringify(await page.evaluate('({tb,x:pl.x,y:pl.y,vx:pl.vx,vy:pl.vy,cooldown:ability.cooldown,trace:window.inputTrace})')));const cast=await page.evaluate('ability.cooldown');
    const canvas=await page.locator('#c').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.slice(0,2),{id:99,x:canvas.x+canvas.width*.5,y:canvas.y+canvas.height*.4,radiusX:3,radiusY:3}]});
    await page.evaluate('update();draw()');assert.equal(await page.evaluate('tb.right&&tb.jump'),true,'fourth canvas contact must not release native button owners');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.evaluate('update();draw()');assert.equal(await page.evaluate('tb.right||tb.jump'),false);
    assert.ok(await page.evaluate('ability.cooldown')<cast);await cdp.detach();
   }else{
    // WebKit mobile emulation supports native single taps; simultaneous contact
    // delivery here is pointer-event injection, explicitly not physical iOS.
    for(const [i,id]of ['touch-right','touch-jump','ability-button'].entries())await page.locator('#'+id).dispatchEvent('pointerdown',{pointerId:i+1,button:0,pointerType:'touch'});
    await page.evaluate('for(let n=0;n<25;n++)update();draw()');assert.equal(await page.evaluate('ability.charging&&ability.cooldown===0'),true);if(hero==='minty')await page.evaluate('enemies[0].x=pl.x+80;enemies[0].y=pl.y+4');await page.locator('#ability-button').dispatchEvent('pointerup',{pointerId:3,pointerType:'touch'});await page.evaluate('update();draw()');assert.equal(await page.evaluate('tb.right&&tb.jump&&ability.cooldown>0'),true);
    for(const [i,id]of ['touch-right','touch-jump'].entries())await page.locator('#'+id).dispatchEvent('pointercancel',{pointerId:i+1,pointerType:'touch'});
   }
   await snap('ability-'+hero);results.push(`PASS ${engine} ${hero}: overlapping move+jump+Ability, native cast/cooldown and cancellation (fixture enemy)`);
  }
  await choose('nova',5);
  const text=await page.evaluate(()=>{
   pl.x=enemies.find(e=>e.type==='guardian').x-100;pl.y=436;cam=pl.x-W/3;
   const drawn=[],original=cx.fillText.bind(cx);cx.fillText=(s,...args)=>{drawn.push(String(s));return original(s,...args);};
   for(const hp of [5,3,1])for(const phase of ['idle','windup','recover']){const b=enemies.find(e=>e.type==='guardian');b.health=hp;b.attackPhase=phase;b.attackTimer=.5;draw();drawn.push(bossName.textContent,bossStatus.textContent,bossHealth.getAttribute('aria-valuetext'));}
   cx.fillText=original;return drawn;
  });assert.doesNotMatch(text.join('|'),/Recovery|stomp now|ground slam soon|Guarding|Phase [123]|windup|recover|\bP[123]\b/);await snap('guardian-no-debug');
  results.push(`PASS ${engine}: normal boss DOM, accessibility text and canvas contain no state/command/countdown across all three phases`);
  const hashes=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=70;const ctx=canvas.getContext('2d');
   return CHARACTERS.map(hero=>{const pixels=[];for(let n=0;n<8;n++){ctx.clearRect(0,0,64,70);drawCharacter(ctx,hero.id,32,60,30,32,1,'run',n/8);pixels.push(canvas.toDataURL());}return pixels;});
  });for(const row of hashes)assert.equal(new Set(row).size,8);
  fs.writeFileSync(path.join(output,`stage-h-${engine}-run-strips.html`),`<!doctype html><meta charset="utf-8"><title>Stage H native-size locomotion</title><style>body{background:#dae7ea;font:16px sans-serif}img{width:64px;height:70px;border:1px solid #789}figure{margin:12px}small{display:block}</style><h1>Eight articulated run frames</h1><p>64×70 diagnostic windows; hero drawn at gameplay 30×32 body scale. Essential limb motion; not a normal-input recording.</p>`+hashes.map((row,i)=>`<figure><figcaption>${heroes[i]}</figcaption>${row.map(src=>`<img src="${src}">`).join('')}</figure>`).join(''));
  results.push(`PASS ${engine}: all five heroes have eight distinct native gameplay-scale articulated frames`);
  await page.evaluate("showMenu('pause')");const frozen=await page.evaluate('JSON.stringify({pl,time,ability,enemyCombat,enemies})');await page.evaluate('for(let i=0;i<120;i++)update();draw()');assert.equal(await page.evaluate('JSON.stringify({pl,time,ability,enemyCombat,enemies})'),frozen);
  await page.getByRole('button',{name:'Resume',exact:true}).tap();await page.setViewportSize({width:390,height:844});await page.evaluate('draw()');assert.equal(await page.evaluate('tb.right||tb.jump||tb.left'),false);
  await context.setOffline(true);await page.evaluate('update();draw()');results.push(`PASS ${engine}: pause freezes animation/combat, rotation clears held inputs, active game continues with network offline`);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,`stage-h-${engine}-results.json`),JSON.stringify({engine,results,captures,errors,physicalDevices:'NOT TESTED'},null,2));return results;
 }finally{await context.close();}
};
