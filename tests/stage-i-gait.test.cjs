const test=require('node:test'),assert=require('node:assert/strict'),{createGame,onFlatGround}=require('./harness.cjs');
for(const hero of ['hopper','minty','ember','nova','bolt'])for(const direction of [-1,1])test(`${hero} ${direction}: planted foot counter-travels the body; lifted foot recovers forward`,()=>{
 const g=onFlatGround(createGame({saved:{coinhopper_character_v1:hero}}));g.eval('enemies=[];coins=[];highJumps=[];pl.inv=0');const stance=[];for(const distance of [0,2,4,6,8,10,12,14])stance.push(direction*g.eval(`gaitSample(${distance}/WALK_STRIDE).left`)+direction*distance);assert.ok(stance.every(x=>Math.abs(x-direction*8)<1e-9));
 const phases=g.snapshot('Array.from({length:8},(_,i)=>gaitSample(i/8))');assert.ok(phases.slice(0,4).every(f=>f.plantL&&f.liftL===0));assert.ok(phases[5].left<phases[6].left&&phases[6].left<phases[7].left&&phases[6].liftL<0);
 g.event('keydown',{code:direction<0?'ArrowLeft':'ArrowRight'});g.step(8);const p=g.snapshot('pl');assert.equal(Math.sign(p.vx),direction);assert.ok(p.animDistance>0);assert.equal(g.eval('pl.w===26&&pl.h===32'),true);
 g.click('pause-button');const d=g.eval('pl.animDistance');g.step(90);assert.equal(g.eval('pl.animDistance'),d);g.click('Resume');g.step();assert.ok(g.eval('pl.animDistance')>d);
});
test('inertial direction reversal renders toward actual travel without changing ability-facing or hitbox',()=>{
 const g=onFlatGround(createGame());g.eval('enemies=[];pl.vx=260;pl.face=1;pl.animDistance=16;window.facings=[];drawCharacter=(ctx,id,x,y,w,h,face)=>window.facings.push(face)');g.event('keydown',{code:'ArrowLeft'});g.step();const before=g.snapshot('({pl,score,lives})');g.eval('drawPlayer()');assert.deepEqual(g.snapshot('({pl,score,lives})'),before);assert.equal(g.eval('pl.face'),-1);assert.equal(g.eval('window.facings[0]'),1);
});
test('ground enemy gait clock advances by real distance and freezes under snare/pause',()=>{
 const g=onFlatGround(createGame());g.eval("enemies=[createEnemy('walker',400,440),createEnemy('shellback',500,432)];enemies.forEach(e=>e.vx=60)");g.step(10);assert.deepEqual(g.snapshot('enemies.map(e=>Math.round(e.animDistance))'),[10,10]);g.eval('enemies.forEach(e=>e.root=1)');g.step(20);assert.deepEqual(g.snapshot('enemies.map(e=>Math.round(e.animDistance))'),[10,10]);
});
