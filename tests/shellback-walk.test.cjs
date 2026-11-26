
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup, paint } = require('./shellback-harness.cjs');
const walk = require('../dev/shellback-s1/walk-metadata.json');
const frame = sample => sample.args.length === 8 ? sample.args[0] / 56 : null;
function step(game,n=1) { game.step(n); return paint(game); }

for (const face of [-1,1]) {
  test('native 20 fps walk repeats after 30 simulation ticks, facing ' + face, async () => {
    const game = await setup(); game.eval('actor.vx=' + face*40);
    const x = game.eval('actor.x'), samples=[];
    for(let i=1;i<=61;i++) {
      const sample=step(game); samples.push(frame(sample));
      assert.equal(frame(sample),Math.floor(i/3)%10);
      assert.equal(sample.scale[0],face);
      assert.deepEqual(sample.args.slice(4),[-walk.pivot[0],-walk.pivot[1],56,40]);
      assert.deepEqual(sample.anchor,game.snapshot('[actor.x+17-cam,actor.y+28]'));
    }
    assert.deepEqual(samples.slice(0,30),samples.slice(30,60));
    assert(Math.abs(game.eval('actor.x')-(x+face*40*61/60))<1e-7);
    assert.deepEqual(game.snapshot('[actor.w,actor.h,actor.health]'),[34,28,2]);
  });
}
test('every gait phase survives an intact-to-cracked swap without changing frame or pivot',async()=>{
  for(let index=0;index<10;index++){
    const game=await setup();step(game,index*3+1);
    const before=paint(game);
    assert.equal(frame(before),index);
    assert.equal(game.eval("damageEnemy(actor,'fireball')"),true);
    const after=paint(game);
    assert.equal(after.state,'cracked');
    assert.deepEqual(after.args,before.args);assert.deepEqual(after.anchor,before.anchor);assert.deepEqual(after.scale,before.scale);
    assert.equal(frame(step(game)),index);
  }
});
test('rooting with nonzero velocity freezes the walk cell and resumes its exact phase',async()=>{
  const game=await setup();step(game,11);
  game.eval('actor.root=.5');const held=paint(game),position=game.eval('actor.x');
  for(let i=0;i<25;i++){assert.deepEqual(step(game),held);assert.equal(game.eval('actor.x'),position);}
  assert.equal(game.eval('actor.vx'),-40);
  game.eval('actor.root=0');assert.equal(frame(step(game)),4);
});
test('pause, repeated paints and a damage repaint do not consume animation phase',async()=>{
  const game=await setup();step(game,8);const held=paint(game),before=game.snapshot('actor');
  for(let i=0;i<12;i++)assert.deepEqual(paint(game),held);
  assert.deepEqual(game.snapshot('actor'),before);
  game.click('pause-button');game.step(90);assert.deepEqual(paint(game),held);
  game.click('Resume');assert.equal(frame(step(game)),3);
});
test('new actors and level restarts begin with independent phase zero',async()=>{
  const game=await setup();step(game,23);assert.equal(frame(paint(game)),7);
  game.eval('actor=createEnemy("shellback",300,13*T-28);actor.ground=true;enemies=[actor]');
  assert.equal(frame(step(game)),0);
  game.eval('newGame();actor=createEnemy("shellback",300,13*T-28);actor.ground=true;enemies=[actor]');
  assert.equal(frame(step(game)),0);
});
test('airborne travel holds the current pose and resumes on terrain contact',async()=>{
  const game=await setup();step(game,14);
  game.eval('actor.y-=80;actor.vy=-120;actor.ground=false');const held=frame(paint(game));
  for(let i=0;i<8;i++)assert.equal(frame(step(game)),held);
  assert.equal(game.eval('actor.ground'),false);
  let ticks=0;while(!game.eval('actor.ground')&&ticks++<90)step(game);
  assert(ticks<90);assert.equal(game.eval('actor.y+actor.h'),468);
});
test('death holds the current cracked gait cell until original removal',async()=>{
  const game=await setup();step(game,19);game.eval("damageEnemy(actor,'fireball')");step(game,19);
  const live=paint(game);game.eval("damageEnemy(actor,'fireball')");
  for(let i=0;i<24;i++){
    const corpse=paint(game);assert.equal(corpse.state,'cracked');assert.deepEqual(corpse.args,live.args);assert.deepEqual(corpse.scale,[-1.3,.3]);
    game.step();
  }
  game.step(2);assert.equal(game.eval('enemies.includes(actor)'),false);assert.equal(paint(game),null);assert.equal(game.eval('score'),50);
});
test('wall and ledge turns mirror on the resolved collision tick without resetting stride',async()=>{
  for(const obstacle of ['wall','ledge']){
    const game=await setup();step(game,10);const before=frame(paint(game));
    game.eval('actor.x=14*T;' + (obstacle==='wall'?"grid[12][13]='#'":"grid[13][13]=' '"));
    const turn=step(game);assert.equal(turn.scale[0],1);assert.equal(frame(turn),before);
    const x=game.eval('actor.x');step(game);assert(game.eval('actor.x')>x);
  }
});
test('reduced motion holds a stationary approved pose without changing patrol',async()=>{
  const game=await setup();game.eval('visualSettings.reduced=true');const x=game.eval('actor.x');
  for(let i=0;i<30;i++)assert.equal(frame(step(game)),0);
  assert(Math.abs(game.eval('actor.x')-(x-20))<1e-7);
});
