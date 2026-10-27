// Native gameplay renderer sequences. These are deliberately controlled art/
// mechanics fixtures, separate from the ordinary-spawn input video and routes.
const path=require('node:path'),fs=require('node:fs');
module.exports=async function sequences(browser,url,out){
 const context=await browser.newContext({viewport:{width:960,height:540}});await context.addInitScript(()=>requestAnimationFrame=()=>0);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const files=[];
 const snap=async name=>{const file='sequence-'+name+'.png';await page.screenshot({path:path.join(out,file)});files.push(file);};
 const step=n=>page.evaluate(n=>{for(let i=0;i<n&&state==='play';i++)update();draw();},n);
 const flat=async hero=>{await page.evaluate(hero=>{selectedCharacter=hero;newGame();grid=Array.from({length:ROWS},(_,y)=>Array(LW).fill(y===13?'#':' '));enemies=[];coins=[];shields=[];highJumps=[];pl.x=4*T;pl.y=436;pl.ground=true;pl.inv=0;pl.vx=0;pl.vy=0;cam=0;draw();},hero);};
 try{
  await page.goto(url);await page.waitForFunction('heroArt.complete&&heroArt.naturalWidth');
  for(const hero of ['hopper','minty','ember','nova','bolt']){
   await flat(hero);
   await page.evaluate(()=>{enemies=[createEnemy('shellback',pl.x+(pl.character==='hopper'?70:100),440)];enemies[0].vx=0;if(pl.character==='bolt'){enemies.push(createEnemy('shellback',pl.x+170,440));enemies[1].vx=0;}if(['hopper','nova'].includes(pl.character)){pl.ground=false;pl.y=330;pl.vy=80;}});
   await page.keyboard.press('KeyE');await step(1);
   for(let frame=0;frame<6;frame++){await snap(`${hero}-power-${frame}-fixture`);await step(3);}
   await flat(hero);await page.evaluate('pl.inv=.4;draw()');await snap(`${hero}-hurt-fixture`);
   await page.evaluate("state='done';draw()");await snap(`${hero}-victory-fixture`);
  }
  for(const item of ['shield','boots']){
   await flat('hopper');await page.evaluate(item=>{const pickup={x:pl.x+42,y:pl.y+16,got:false};if(item==='shield')shields=[pickup];else highJumps=[pickup];draw();},item);
   await snap(`${item}-before-fixture`);await page.keyboard.down('ArrowRight');
   for(let n=0;n<5;n++){await step(4);await snap(`${item}-pickup-${n}-fixture`);}await page.keyboard.up('ArrowRight');
  }
  for(const type of ['walker','hopper','shellback','sentinel','nightwing']){
   await flat('minty');await page.evaluate(type=>{const spec=ENEMY_TYPES[type];enemies=[createEnemy(type,400,13*T-spec.height-(type==='nightwing'?75:0))];if(type==='sentinel'){enemies[0].attackTimer=DT;pl.x=210;}draw();},type);
   for(let n=0;n<5;n++){await snap(`${type}-motion-${n}-fixture`);await step(type==='sentinel'?14:type==='hopper'?12:5);}
   await page.evaluate(()=>{const e=enemies[0];e.hitTime=0;damageEnemy(e,'stomp');draw();});await snap(`${type}-reaction-fixture`);await step(20);await page.evaluate("enemies[0].hitTime=0;damageEnemy(enemies[0],'stomp');draw()");for(let n=0;n<5;n++){await snap(`${type}-defeat-${n}-fixture`);await step(6);}
  }
  for(const [pattern,cycle]of [['slam',0],['boulder',1],['debris',2]]){
   await page.evaluate(cycle=>{startLevel(5);enemies=enemies.filter(e=>e.type==='guardian');const e=enemies[0];e.health=1;e.cycle=cycle;pl.x=e.x-150;pl.y=436;pl.ground=true;pl.inv=0;cam=pl.x-W/3;e.attackTimer=DT;update();draw();},cycle);
   for(let n=0;n<3;n++){await snap(`guardian-${pattern}-windup-${n}-fixture`);await step(12);}
   for(let n=0;n<5;n++){await step(6);await snap(`guardian-${pattern}-impact-${n}-fixture`);}
  }
  await page.evaluate("const boss=enemies.find(e=>e.type==='guardian');boss.attackPhase='recover';boss.hitTime=0;damageEnemy(boss,'stomp');draw()");for(let n=0;n<5;n++){await snap(`guardian-defeat-${n}-fixture`);await step(6);}
  if(errors.length)throw new Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,'stage-h-animation-sequences.json'),JSON.stringify({source:'Actual960x540gameplay canvas+HUD. Named isolated fixtures; not a human playthrough or physical-device capture.',files,errors},null,2));
  const groups=Object.groupBy(files,f=>f.replace(/-\d+-fixture\.png$/,'-frames'));
  fs.writeFileSync(path.join(out,'stage-h-animation-sequences.html'),'<!doctype html><meta charset="utf-8"><title>Stage H native animation sequences</title><style>body{font:16px sans-serif;background:#e3edf1;color:#20394d}section{display:flex;gap:8px;overflow-x:auto}img{width:960px;height:540px;max-width:none}</style><h1>Native gameplay animation sequences</h1><p>Controlled fixtures in the actual game renderer at960×540. Scroll each row; no enlargement. Distinct from ordinary-input footage.</p>'+Object.entries(groups).map(([name,row])=>`<h2>${name}</h2><section>${row.map(file=>`<figure><img src="${file}"><figcaption>${file}</figcaption></figure>`).join('')}</section>`).join(''));
 }finally{await context.close();}
};
