const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,onFlatGround}=require('./harness.cjs');
const route=require('./fixtures/campaign-routes.cjs')[5];
function fixture(type='guardian',hero='hopper'){
  const g=onFlatGround(createGame({saved:{coinhopper_character_v1:hero}}));
  g.eval(`enemies=[createEnemy('${type}',400,${type==='guardian'?404:372})];shields=[];bossState={required:${type==='guardian'},defeated:false};pl.inv=0`);return g;
}
function cast(g){g.event('keydown',{code:'KeyE'});g.step();g.event('keyup',{code:'KeyE'});}
function wave(g,more=''){g.eval(`enemyCombat.projectiles.push({kind:'wave',owner:enemies[0],x:pl.x+13,y:pl.y+23,vx:0,vy:0,radius:7,life:2.4${more}})`);}

test('Skyline Summit has safe elevated islands, four flyers, a five-HP boss and a required exit gate',()=>{
  const g=createGame();g.eval('newGame();startLevel(5)');
  assert.equal(g.eval('LEVELS.length'),6);assert.equal(g.eval('LEVELS[5].name'),'Skyline Summit');
  assert.equal(g.eval('enemies.filter(e=>e.type==="nightwing").length'),4);
  assert.equal(g.eval('enemies.filter(e=>e.type==="guardian").length'),1);
  assert.equal(g.eval('enemies.find(e=>e.type==="guardian").health'),5);
  assert.equal(g.eval('bossState.required&&!bossState.defeated&&isSolid(Math.floor(start.x/T),13)&&isSolid(flag.x/T,13)'),true);
  assert.equal(g.eval('grid.flat().some(c=>"nGbsPFSoeh".includes(c))'),false);
  assert.equal(g.eval('LEVELS[5].arenaStart===216'),true);
});

for(const hero of ['hopper','minty','ember','nova','bolt']){
  test(`${hero}: recorded no-power Summit/boss route removes five HP in distinct openings and unlocks once`,()=>{
    const g=createGame({saved:{coinhopper_character_v1:hero}});g.eval('newGame();startLevel(5)');g.event('keydown',{code:'ArrowRight'});
    const next={jump:0,right:0,left:0},hits=[];let hp=5;
    for(let frame=0;frame<route.maxFrames&&g.eval('state')==='play';frame++){
      for(const [field,code]of [['jump','Space'],['right','ArrowRight'],['left','ArrowLeft']])while(route[field][next[field]]?.[0]===frame){g.event(route[field][next[field]][1]?'keydown':'keyup',{code});next[field]++;}
      g.step();const health=g.eval('enemies.find(e=>e.type==="guardian")?.health??0');if(health<hp){hits.push([frame,health]);hp=health;}
      assert.equal(g.eval('lives'),3);assert.equal(g.eval('shields.some(s=>s.got)'),false);assert.equal(g.eval('ability.cooldown'),0);
    }
    assert.deepEqual(hits,route.bossHits);assert.equal(g.eval('state'), 'done');assert.equal(g.eval('bossState.defeated'),true);assert.equal(g.eval('score'),route.score);
    g.click('Finish');assert.equal(g.eval('state'),'win');assert.match(g.element('menu-description').textContent,/All 6 levels complete/);
  });
}

test('the final flag gives no completion or flag bonus until the Guardian is defeated',()=>{
  const g=createGame();g.eval('newGame();startLevel(5);enemies=enemies.filter(e=>e.type==="guardian");coins=[];pl.x=flag.x;pl.y=436;pl.vx=0');g.step();
  assert.equal(g.eval('state'),'play');assert.equal(g.eval('score'),0);
  for(let i=0;i<5;i++)g.eval("enemies[0].attackPhase='recover';enemies[0].hitTime=0;damageEnemy(enemies[0],'stomp')");
  assert.equal(g.eval('bossState.defeated&&score===50'),true);g.step();assert.equal(g.eval('state'),'done');assert.equal(g.eval('score'),450);
  g.step(100);assert.equal(g.eval('score'),450);
});

test('Guardian armor rejects hits, recovery accepts one HP, and closes without partial-hit score',()=>{
  const g=fixture();
  for(const source of ['stomp','slam','fireball','lightning'])assert.equal(g.eval(`damageEnemy(enemies[0],'${source}')`),false);
  g.eval("enemies[0].attackPhase='recover'");assert.equal(g.eval("damageEnemy(enemies[0],'fireball')"),true);
  assert.equal(g.eval('enemies[0].health===4&&score===0&&enemies[0].attackPhase==="idle"'),true);
  g.eval('enemies[0].hitTime=0');assert.equal(g.eval("damageEnemy(enemies[0],'stomp')"),false,'one hit per visible opening');
});

test('Guardian three-phase wind-up, material attacks and recovery use fixed simulation time',()=>{
  for(const health of [5,3,1]){
    const g=fixture();g.eval(`enemies[0].health=${health};enemies[0].attackTimer=DT`);g.step();
    assert.equal(g.eval('enemies[0].attackPhase'),'windup');const windup=health===5?1.15:health===3?1:.9;
    assert.equal(g.eval('enemies[0].attackTimer'),windup);g.step(Math.round(windup*60));
    assert.equal(g.eval('enemies[0].attackPhase'),'recover');assert.equal(g.eval('enemyCombat.projectiles.length'),2);
    assert.equal(g.eval('enemyCombat.projectiles.every(p=>p.kind==="wave"&&Math.abs(p.vx)===150)'),true);
  }
});

for(const hero of ['hopper','ember','bolt']){
  test(`${hero}'s damaging power removes one boss HP during recovery and cannot skip the encounter`,()=>{
    const g=fixture('guardian',hero);g.eval(`enemies[0].attackPhase='recover';enemies[0].attackTimer=20;enemies[0].x=${hero==='hopper'?199:260}`);
    if(hero==='hopper')g.eval('pl.y=330;pl.ground=false;pl.vy=100');cast(g);g.step(30);
    assert.equal(g.eval('enemies[0].health'),4);assert.equal(g.eval('score'),0);assert.equal(g.eval('bossState.defeated'),false);
  });
}

test('Minty roots the boss for two seconds, freezes its phase and releases before cooldown is ready',()=>{
  const g=fixture('guardian','minty');g.eval("enemies[0].x=280;enemies[0].attackPhase='windup';enemies[0].attackTimer=.8");cast(g);
  const timer=g.eval('enemies[0].attackTimer');g.step(100);assert.equal(g.eval('enemies[0].attackTimer'),timer);
  assert.equal(g.eval('enemies[0].health'),5);g.step(20);assert.equal(g.eval('enemies[0].root'),0);assert.ok(g.eval('ability.cooldown')>1.9);
  g.step(2);assert.ok(g.eval('enemies[0].attackTimer')<timer);
});

test('Nova can glide through a legal jump over a shockwave without flight, damage or boss damage',()=>{
  const g=fixture('guardian','nova');g.eval('enemies[0].attackTimer=999');wave(g,',x:pl.x-50,vx:150');
  g.event('keydown',{code:'Space'});g.event('keydown',{code:'KeyE'});g.step();g.event('keyup',{code:'KeyE'});g.step(50);
  assert.equal(g.eval('lives'),3);assert.equal(g.eval('enemies[0].health'),5);assert.equal(g.eval('score'),0);
  assert.ok(g.eval('pl.vy')>=-640);assert.ok(g.eval('pl.y')>200);
});

test('Guardian shockwaves are shielded, terrain blocked, finite and never pass through solids',()=>{
  const g=fixture();g.eval('pl.shield=true;enemies[0].attackTimer=999');wave(g);g.step();
  assert.equal(g.eval('lives===3&&!pl.shield&&pl.inv===1'),true);
  g.eval("grid[12][7]='#';enemyCombat.projectiles=[]");wave(g,',x:350,y:459,vx:-12000');g.step();
  assert.equal(g.eval('enemyCombat.projectiles.length'),0);assert.equal(g.eval('lives'),3);
  wave(g,',x:600,y:200,life:DT');g.step();assert.equal(g.eval('enemyCombat.projectiles.length'),0);
});

test('boss death clears owned waves, awards once and keeps the exit unlocked after corpse cleanup or player death',()=>{
  const g=fixture();g.eval("enemies[0].health=1;enemies[0].attackPhase='recover'");wave(g,',x:600,y:200');
  g.eval("damageEnemy(enemies[0],'lightning')");assert.equal(g.eval('score===50&&bossState.defeated&&enemyCombat.projectiles.length===0'),true);
  g.eval('hurt(true)');assert.equal(g.eval('bossState.defeated'),true);g.step(30);assert.equal(g.eval('enemies.length'),0);assert.equal(g.eval('score'),50);
});

test('boss player-death keeps damage but clears phase/root/waves; restart restores a fresh required fight and rolls score back',()=>{
  const g=createGame();g.eval("newGame();startLevel(5);const boss=enemies.find(e=>e.type==='guardian');boss.health=3;boss.root=2;boss.attackPhase='windup';score=300;levelScore=100;enemyCombat.projectiles.push({owner:boss,x:500,y:200,vx:0,vy:0,radius:7,life:2});hurt(true)");
  assert.equal(g.eval('enemies.find(e=>e.type==="guardian").health'),3);assert.equal(g.eval('enemyCombat.projectiles.length'),0);
  assert.equal(g.eval('enemies.find(e=>e.type==="guardian").root'),undefined);
  g.click('pause-button');g.click('Restart level');g.click('Restart level');
  assert.equal(g.eval('enemies.find(e=>e.type==="guardian").health'),5);assert.equal(g.eval('bossState.required&&!bossState.defeated&&score===200'),true);
});

test('pause/settings/restart cancel freeze boss health/phase/waves and native HUD state exactly',()=>{
  const g=fixture();g.eval("enemies[0].attackPhase='windup';enemies[0].attackTimer=.5");wave(g,',x:600,y:200');g.eval('draw()');
  g.click('pause-button');const frozen=g.snapshot('({bossState,enemyCombat,enemies,pl,score,timer})');
  g.click('Settings');g.step(100);g.click('Back');g.click('Restart level');g.step(100);g.click('Cancel');
  assert.deepEqual(g.snapshot('({bossState,enemyCombat,enemies,pl,score,timer})'),frozen);g.click('Resume');g.step();assert.notDeepEqual(g.snapshot('enemyCombat'),frozen.enemyCombat);
});

test('boss HUD exposes HP and defeat without narrating internal states or commands',()=>{
  const g=fixture();g.eval('draw()');assert.equal(g.element('boss-health').getAttribute('aria-valuenow'),'5');assert.equal(g.element('boss-status').textContent,'');
  g.eval("enemies[0].health=2;enemies[0].attackPhase='recover';draw()");assert.doesNotMatch(g.element('boss-name').textContent,/Phase|stomp|recover/i);assert.equal(g.element('boss-status').hidden,true);
  g.eval('bossState.defeated=true;draw()');assert.equal(g.element('boss-health').getAttribute('aria-valuenow'),'0');assert.match(g.element('boss-status').textContent,/exit open/);
  g.eval('bossState.defeated=false;enemies[0].maxHealth=7;draw()');assert.equal(g.element('boss-health').getAttribute('aria-valuemax'),'7');assert.match(g.element('boss-name').textContent,/2 \/ 7/);
});

test('Nightwing patrol, charge and dive are deterministic, telegraphed and use a locked aim',()=>{
  const g=fixture('nightwing');g.eval('pl.x=320');
  for(let i=0;i<150&&g.eval('enemies[0].attackPhase')!=='charge';i++)g.step();
  assert.equal(g.eval('enemies[0].attackPhase'),'charge');assert.equal(g.eval('enemies[0].attackTimer'),.65);
  const aim=g.snapshot('enemies[0].aim');g.eval('pl.x=144');g.step(38);assert.equal(g.eval('enemies[0].attackPhase'),'charge');g.step();
  assert.equal(g.eval('enemies[0].attackPhase'),'dive');assert.deepEqual(g.snapshot('enemies[0].aim'),aim);
  const before=g.snapshot('({x:enemies[0].x,y:enemies[0].y})');g.step();assert.ok(Math.hypot(g.eval('enemies[0].x')-before.x,g.eval('enemies[0].y')-before.y)<=190/60+.001);
});

test('Nightwing flight uses collision-safe movement, including a blocked patrol or high requested velocity',()=>{
  const g=fixture('nightwing');g.eval("enemies[0].x=270;enemies[0].y=300;enemies[0].homeX=270;enemies[0].homeY=300;for(let y=0;y<13;y++)grid[y][9]='#'");
  for(let i=0;i<20;i++)g.eval('moveFlyer(enemies[0],12000,0)');assert.ok(g.eval('enemies[0].x+enemies[0].w')<=9*36);
  g.step(200);assert.ok(g.eval('enemies[0].x+enemies[0].w')<=9*36);assert.equal(g.eval('enemies[0].health'),1);
});

for(const hero of ['hopper','minty','ember','nova','bolt']){
  test(`${hero} can stomp a snared or ordinary Nightwing for the unchanged one-hit +50`,()=>{
    const g=fixture('nightwing',hero);g.eval('enemies[0].root=1;pl.x=enemies[0].x;pl.y=enemies[0].y-pl.h-2;pl.vy=200;pl.ground=false');g.step();
    assert.equal(g.eval('score'),50);assert.equal(g.eval('enemies[0].health'),0);assert.equal(g.eval('pl.vy'),-380);g.step(30);assert.equal(g.eval('enemies.length'),0);
  });
}

for(const hero of ['hopper','ember','bolt']){
  test(`${hero}'s attack defeats a visible Nightwing once while terrain still blocks targeting`,()=>{
    const g=fixture('nightwing',hero);g.eval('enemies[0].x=pl.x+55;enemies[0].y=440;enemies[0].homeX=enemies[0].x;enemies[0].homeY=440;enemies[0].root=2');
    if(hero==='hopper')g.eval('pl.y=330;pl.ground=false');cast(g);g.step(40);
    assert.equal(g.eval('score'),50);assert.equal(g.eval('enemies.length'),0);
    const blocked=fixture('nightwing',hero);blocked.eval("enemies[0].x=216;enemies[0].y=440;enemies[0].root=2;grid[12][5]='#'");
    if(hero==='hopper')blocked.eval('pl.y=330;pl.ground=false');cast(blocked);blocked.step(40);
    assert.equal(blocked.eval('enemies[0].health'),1);assert.equal(blocked.eval('score'),0);
  });
}

test('Minty releases a flying Nightwing without teleporting or permanently freezing its patrol',()=>{
  const g=fixture('nightwing','minty');g.eval('enemies[0].x=280;enemies[0].y=430;enemies[0].homeX=280;enemies[0].homeY=430');cast(g);
  const before=g.snapshot('({x:enemies[0].x,y:enemies[0].y,flyTime:enemies[0].flyTime})');g.step(100);assert.deepEqual(g.snapshot('({x:enemies[0].x,y:enemies[0].y,flyTime:enemies[0].flyTime})'),before);
  g.step(22);assert.notEqual(g.eval('enemies[0].x'),before.x);assert.equal(g.eval('enemies[0].root'),0);assert.equal(g.eval('enemies[0].health'),1);
});
