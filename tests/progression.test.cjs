const test=require('node:test'),assert=require('node:assert/strict');
const {createGame}=require('./harness.cjs'),routes=require('./fixtures/campaign-routes.cjs');
const key='coinhopper_progress_v1';
function savedRun(count,lastLevel=Math.min(count,5)){return JSON.stringify({version:1,completed:Array.from({length:6},(_,i)=>i<count),lastLevel,started:true});}
function playRoute(g,route){
  g.event('keydown',{code:'ArrowRight'});const next={jump:0,left:0,right:0};
  for(let frame=0;frame<route.maxFrames&&g.eval('state')==='play';frame++){
    for(const [field,code]of [['jump','Space'],['left','ArrowLeft'],['right','ArrowRight']])while(route[field]?.[next[field]]?.[0]===frame){g.event(route[field][next[field]][1]?'keydown':'keyup',{code});next[field]++;}g.step();
  }
  for(const code of ['ArrowRight','ArrowLeft','Space'])g.event('keyup',{code});
}
test('fresh progress exposes only Level 1 and disabled Continue; level selection cannot start locked levels',()=>{
  const g=createGame();assert.equal(g.findButton('Continue').disabled,true);assert.equal(g.eval('unlockedCount()'),1);
  assert.match(g.element(g.findButton('Continue').getAttribute('aria-describedby')).textContent,/Continue unlocks/);g.click('Level Select');
  assert.equal(g.document.activeElement,g.element('level-choice-0'));
  for(let i=0;i<6;i++)assert.equal(g.element('level-choice-'+i).disabled,i>0);
  g.click('level-choice-5');g.eval('selectLevel(5)');assert.equal(g.eval('state'),'levels');
  for(const value of [-1,6,NaN,'1',null])g.eval(`selectLevel(${JSON.stringify(value)})`);assert.equal(g.eval('state'),'levels');
  g.event('keydown',{code:'Escape'});assert.equal(g.eval('state'),'title');g.eval("activateMenuAction('continue')");assert.equal(g.eval('state'),'title');
});
test('versioned saves reject corrupt/wrong-shaped data and derive unlocks from contiguous completion',()=>{
  const bad=['{bad','null','[]','0','"bad"','x'.repeat(4097),JSON.stringify({version:2,completed:Array(6).fill(true),lastLevel:5,started:true}),JSON.stringify({version:1,completed:Array(6).fill('yes'),lastLevel:5,started:true}),JSON.stringify({version:1,completed:[true],lastLevel:0,started:true})];
  for(const value of bad){const g=createGame({saved:{[key]:value}});assert.equal(g.eval('unlockedCount()'),1);assert.equal(g.eval('progress.started'),false);assert.equal(g.storage.get(key),value,'viewing corrupt saves must not overwrite storage');}
  const g=createGame({saved:{[key]:JSON.stringify({version:1,completed:[true,false,true,true,true,true],lastLevel:5,started:true,unlocked:6})}});
  assert.equal(g.eval('unlockedCount()'),2);assert.deepEqual(g.snapshot('progress.completed'),[true,false,false,false,false,false]);assert.equal(g.eval('progress.lastLevel'),1);
});
test('invalid cursors recover to the first incomplete unlocked level without deleting earned completions',()=>{
  for(const lastLevel of [-1,6,1.5,'4',null]){
    const value=JSON.parse(savedRun(4));value.lastLevel=lastLevel;const g=createGame({saved:{[key]:JSON.stringify(value)}});
    assert.equal(g.eval('unlockedCount()'),5);assert.equal(g.eval('progress.lastLevel'),4);
  }
});
test('an interrupted first-level attempt enables Continue at its beginning with a fresh score/lives',()=>{
  const g=createGame();g.click('Play');g.click('Start game');g.eval('score=120;levelScore=120;lives=1;pl.shield=true');g.click('pause-button');g.click('Title screen');
  assert.equal(g.findButton('Continue').disabled,false);g.click('Continue');g.click('Start game');assert.deepEqual(g.snapshot('({lvl,score,lives})'),{lvl:0,score:0,lives:3});assert.equal(g.eval('pl.shield'),false);
});
test('a legal no-power first-level route unlocks Level 2 and saves Continue before Next is clicked',()=>{
  const g=createGame();g.click('Play');g.click('Start game');playRoute(g,routes[0]);assert.equal(g.eval('state'),'done');assert.equal(g.eval('score'),routes[0].score);assert.equal(g.eval('lives'),3);
  assert.equal(g.eval('unlockedCount()'),2);assert.equal(JSON.parse(g.storage.get(key)).lastLevel,1);
  g.click('Title screen');g.click('Continue');assert.match(g.element('menu-description').textContent,/Brick Hills/);g.click('Start game');assert.deepEqual(g.snapshot('({lvl,score,lives})'),{lvl:1,score:0,lives:3});
});
test('picker cancel returns to its caller and writes neither progress nor character preference',()=>{
  const saved={[key]:savedRun(3,2),coinhopper_character_v1:'minty'},g=createGame({saved});
  g.click('Continue');g.click('character-bolt');g.click('Back');assert.equal(g.eval('state'),'title');assert.deepEqual(Object.fromEntries(g.storage),saved);
  g.click('Level Select');g.click('level-choice-2');g.click('character-ember');g.event('keydown',{code:'Escape'});assert.equal(g.eval('state'),'levels');assert.deepEqual(Object.fromEntries(g.storage),saved);
});
for(const hero of ['hopper','minty','ember','nova','bolt'])for(let level=0;level<6;level++)test(`${hero}: selected unlocked Level ${level+1} starts fresh with its original hitbox and reset mechanics`,()=>{
  const g=createGame({saved:{[key]:savedRun(6,5)}});g.click('Level Select');g.click('level-choice-'+level);g.click('character-'+hero);g.click('Start game');
  assert.equal(g.eval('lvl'),level);assert.equal(g.eval('pl.character'),hero);assert.equal(g.eval('score===0&&lives===3&&timer===0&&pl.w===26&&pl.h===32&&!pl.shield&&ability.cooldown===0'),true);
  if(level===5)assert.equal(g.eval('bossState.required&&!bossState.defeated&&enemies.find(e=>e.type==="guardian").health===5'),true);
});
test('Play/New Game resets run state and cursor, keeps earned unlocks and isolates all existing saves',()=>{
  const saved={[key]:savedRun(5,4),coinhopper_character_v1:'minty',coinhopper_settings:'{"music":0.8,"effects":0.4}',coinhopper_best:'1000',coinhopper_motion_v1:'reduce',coinhopper_audio_v1:'muted'};
  const g=createGame({saved});g.click('Play');g.click('Start game');assert.deepEqual(g.snapshot('({lvl,score,lives})'),{lvl:0,score:0,lives:3});assert.equal(g.eval('unlockedCount()'),6);assert.equal(g.eval('progress.lastLevel'),0);
  for(const [name,value]of Object.entries(saved))if(name!==key)assert.equal(g.storage.get(name),value,name);
});
test('death and restart retain earned progress while existing HP/pickup/score reset rules remain intact',()=>{
  const g=createGame({saved:{[key]:savedRun(4,4)}});g.click('Continue');g.click('Start game');
  const before=g.storage.get(key);g.eval('score=300;levelScore=100;pl.shield=true;ability.cooldown=2;shields[0].got=true;damageEnemy(enemies[0],"fireball");hurt(true)');
  assert.equal(g.storage.get(key),before);assert.equal(g.eval('lives===2&&!pl.shield&&ability.cooldown===0&&shields[0].got&&enemies[0].health===1'),true);
  g.click('pause-button');g.click('Restart level');g.click('Restart level');assert.equal(g.eval('score===200&&levelScore===0&&lives===2&&!shields[0].got&&enemies[0].health===2'),true);assert.equal(g.storage.get(key),before);
});
test('saved completed Level 6 never bypasses its fresh boss, and repeated selection never banks old score',()=>{
  const g=createGame({saved:{[key]:savedRun(6,5)}});g.click('Continue');g.click('Start game');
  g.eval('pl.x=flag.x;pl.vx=0;pl.y=436');g.step();assert.equal(g.eval('state'),'play');assert.equal(g.eval('score'),0);
  g.eval("const boss=enemies.find(e=>e.type==='guardian');for(let i=0;i<5;i++){boss.attackPhase='recover';boss.openingHit=false;boss.hitTime=0;damageEnemy(boss,'stomp')}");g.step();assert.equal(g.eval('state'),'done');const score=g.eval('score');
  g.eval('syncMenu();syncMenu()');g.step(60);assert.equal(g.eval('score'),score);g.click('Finish');g.click('Title screen');g.click('Continue');g.click('Start game');
  assert.equal(g.eval('score===0&&lives===3&&bossState.required&&!bossState.defeated'),true);
});
test('blocked storage retains in-session unlocks and safely falls back on reload',()=>{
  const g=createGame({storageBlocked:true});g.click('Play');g.click('Start game');playRoute(g,routes[0]);assert.equal(g.eval('unlockedCount()'),2);assert.equal(g.storage.size,0);
  g.click('Title screen');g.click('Continue');g.click('Start game');assert.equal(g.eval('lvl'),1);
  const reload=createGame({storageBlocked:true});assert.equal(reload.eval('unlockedCount()'),1);assert.equal(reload.eval('progress.started'),false);
});
