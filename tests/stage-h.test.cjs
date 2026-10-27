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
