const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,onFlatGround}=require('./harness.cjs');
const heroes=['hopper','minty','ember','nova','bolt'];
for(const hero of heroes)test(`${hero}: High Jump grants two equal grounded launches, never a double jump`,()=>{
  const g=onFlatGround(createGame({saved:{coinhopper_character_v1:hero}}));
  g.eval('highJumps=[{x:pl.x+13,y:pl.y+16,got:false}]');g.step();
  assert.equal(g.eval('pl.highJump'),2);const launches=[];
  for(let n=0;n<2;n++){
    g.event('keydown',{code:'Space'});g.step();launches.push(g.eval('pl.vy'));
    assert.equal(g.eval('pl.highJump'),1-n);
    g.event('keyup',{code:'Space'});g.event('keydown',{code:'Space'});g.step();assert.equal(g.eval('pl.highJump'),1-n,'airborne presses cannot consume charge');
    g.step(70);g.event('keyup',{code:'Space'});assert.equal(g.eval('pl.ground'),true);
  }
  assert.deepEqual(launches,[-820,-820]);g.event('keydown',{code:'Space'});g.step();assert.equal(g.eval('pl.vy'),-610);assert.equal(g.eval('score'),0);
});
test('High Jump is independent of shield/power, freezes on pause and safely replenishes after death/restart',()=>{
  const g=onFlatGround(createGame());g.eval('highJumps=[{x:pl.x+13,y:pl.y+16,got:false}];pl.shield=true;ability.cooldown=2');g.step();
  assert.equal(g.eval('pl.highJump===2&&pl.shield&&ability.cooldown>0'),true);
  g.click('pause-button');g.step(120);assert.equal(g.eval('pl.highJump'),2);g.click('Resume');
  g.eval('hurt(true)');assert.equal(g.eval('pl.highJump'),0);assert.equal(g.eval('highJumps[0].got'),false);
  g.eval('pl.highJump=2');g.click('pause-button');g.click('Restart level');g.click('Restart level');assert.equal(g.eval('pl.highJump'),0);
});
test('boss HUD hides attack commands, state, phase and countdown in ordinary builds',()=>{
  const g=onFlatGround(createGame());g.eval("bossState.required=true;enemies=[createEnemy('guardian',400,404)]");
  for(const phase of ['idle','windup','recover']){g.eval(`enemies[0].attackPhase='${phase}';draw()`);assert.equal(g.element('boss-status').textContent,'');assert.equal(g.element('boss-status').hidden,true);assert.doesNotMatch(g.element('boss-name').textContent,/Phase|Recovery|Warning|Guarding/);assert.doesNotMatch(g.element('boss-health').getAttribute('aria-valuetext'),/recover|stomp|windup|s|Phase/);}
});
test('native touch supports simultaneous movement, jump, ability and cancellation without stuck keys',()=>{
  const g=onFlatGround(createGame({saved:{coinhopper_character_v1:'ember'}}));
  g.domEvent('touch-right','pointerdown',{pointerId:1,button:0});g.domEvent('touch-jump','pointerdown',{pointerId:2,button:0});g.domEvent('ability-button','pointerdown',{pointerId:3,button:0,pointerType:'touch'});g.step();
  assert.equal(g.eval('tb.right&&tb.jump&&pl.vx>0&&pl.vy<0&&ability.cooldown>0'),true);assert.equal(g.eval('ability.projectiles.length'),1);
  g.domEvent('touch-jump','pointercancel',{pointerId:2});assert.equal(g.eval('tb.right&&!tb.jump'),true);g.event('blur');assert.equal(g.eval('tb.right||tb.jump'),false);
});

for(const hero of heroes)test(`${hero}: Level 3 lower approach has broad boosted touch timing rather than a frame-perfect gate`,()=>{
  for(const x of [24,24.5,25])for(const hold of [18,24,30,36,42,48]){
    const g=createGame({saved:{coinhopper_character_v1:hero}});
    // Isolated crossing envelope; complete normal-spawn routes are tested separately.
    g.eval(`newGame();startLevel(2);enemies=[];pl.x=${x}*T;pl.y=436;pl.vx=260;pl.ground=true;pl.inv=0;pl.highJump=2`);
    g.domEvent('touch-right','pointerdown',{pointerId:1,button:0});g.domEvent('touch-jump','pointerdown',{pointerId:2,button:0});
    g.step(hold);g.domEvent('touch-jump','pointerup',{pointerId:2});g.step(95-hold);
    assert.equal(g.eval('lives'),3,`${x} tiles, ${hold} frames`);assert.ok(g.eval('pl.x')>31*36);assert.equal(g.eval('pl.highJump'),1);
  }
});
test('ordinary jump arc stays exactly 108.5px; both held boosted jumps rise 193.6667px',()=>{
  const heights=[];for(const charges of [0,2,1]){
    const g=onFlatGround(createGame());g.eval(`pl.highJump=${charges};highJumps=[]`);g.event('keydown',{code:'Space'});let y=436;
    do{g.step();y=Math.min(y,g.eval('pl.y'));}while(!g.eval('pl.ground'));heights.push(436-y);
  }
  assert.ok(Math.abs(heights[0]-108.5)<1e-6);assert.ok(Math.abs(heights[1]-193.6666667)<1e-6);assert.equal(heights[1],heights[2]);
});
test('six expansions invert to their original maps except the explicit Starry Night boots/spike correction',()=>{
  const g=createGame();
  for(let i=0;i<6;i++){
    const {current,original,at}=g.snapshot(`({current:LEVELS[${i}].map,original:FOUNDATION_LEVELS[${i}].map,at:LEVELS[${i}].expansionStart})`);
    const padded=Array(15-original.length).fill('').concat(original);
    for(let row=0;row<15;row++){
      let expected=padded[row];if(i===2&&row===10)expected=expected.replace('^^^','^^ ');
      if(i===2&&row===12)expected=expected.slice(0,23)+'J'+expected.slice(24);
      assert.equal((current[row].slice(0,at)+current[row].slice(at+96)).trimEnd(),expected.trimEnd(),`level${i+1} row${row}`);
    }
  }
});
test('retry terraces preserve coins/armor/score, restore only zero-point boots and never bank rewards',()=>{
  const g=createGame();g.eval("newGame();startLevel(4);const c=LEVELS[4].checkpoints[0];pl.x=c.x;pl.y=c.y;pl.ground=true;pl.vy=0;enemies[0].health=1;coins[0].got=1;highJumps[0].got=true;score=170;levelScore=70");g.step();
  assert.equal(g.eval('checkpoint.x'),g.eval('LEVELS[4].checkpoints[0].x'));g.eval('hurt(true)');
  assert.equal(g.eval('pl.x===checkpoint.x&&pl.highJump===0&&!highJumps[0].got&&coins[0].got===1&&enemies[0].health===1&&score===170&&levelScore===70'),true);
  g.click('pause-button');g.click('Restart level');g.click('Restart level');assert.equal(g.eval('checkpoint===null&&pl.x===start.x&&score===100&&levelScore===0&&!coins[0].got&&enemies[0].health===2'),true);
});
for(const hp of [5,3,1])for(const cycle of [0,1,2])test(`Guardian HP${hp} cycle${cycle}: fixed material attack, locked tells, safe cleanup and shield interaction`,()=>{
  const g=onFlatGround(createGame());g.eval(`bossState.required=true;enemies=[createEnemy('guardian',400,404)];enemies[0].health=${hp};enemies[0].cycle=${cycle};enemies[0].attackTimer=DT;pl.x=190`);g.step();
  const pattern=g.eval('enemies[0].pattern'),aim=g.snapshot('enemies[0].aim');g.eval('pl.x=100');g.step(100);
  assert.deepEqual(g.snapshot('enemies[0].aim'),aim);const shots=g.snapshot('enemyCombat.projectiles');
  assert.ok(shots.every(s=>['wave','boulder','debris'].includes(s.kind)),pattern);
  if(pattern==='debris')assert.ok(shots.every(s=>s.gravity>0&&s.vx===0));
  g.eval('pl.shield=true;pl.inv=0;enemyCombat.projectiles=[{owner:enemies[0],kind:"boulder",x:pl.x+13,y:pl.y+16,vx:0,vy:0,radius:10,life:1,gravity:650}]');g.step();
  assert.equal(g.eval('lives===3&&!pl.shield'),true);g.eval('hurt(true)');assert.equal(g.eval('enemyCombat.projectiles.length'),0);
});
test('run cycle is eight articulated alternating contacts and render state freezes throughout pause',()=>{
  const g=onFlatGround(createGame());assert.equal(g.eval('RUN_CYCLE.length'),8);assert.equal(g.eval('new Set(RUN_CYCLE.map(f=>JSON.stringify(f))).size'),8);
  g.event('keydown',{code:'ArrowRight'});g.step(10);g.click('pause-button');const frozen=g.snapshot('({time,d:pl.animDistance,enemy:enemyCombat.clock,ability:ability.clock})');g.step(120);assert.deepEqual(g.snapshot('({time,d:pl.animDistance,enemy:enemyCombat.clock,ability:ability.clock})'),frozen);
});
test('touch mode retains an explicit visible native Pause button alongside the action controls',()=>{
  const g=createGame();g.eval('touchMode=true;newGame();draw()');assert.equal(g.element('pause-button').hidden,false);assert.equal(g.element('touch-controls').hidden,false);g.click('pause-button');assert.equal(g.eval('state'),'pause');g.click('Resume');assert.equal(g.element('pause-button').hidden,false);
});
