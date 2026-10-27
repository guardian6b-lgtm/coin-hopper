// Functional tier outcomes through actual E release and shared collision/damage.
const test=require('node:test'),assert=require('node:assert/strict'),{createGame,onFlatGround}=require('./harness.cjs');
function ready(hero){const g=onFlatGround(createGame({saved:{coinhopper_character_v1:hero}}));g.eval('enemies=[];coins=[];pl.inv=0');return g;}
function charge(g,frames,air=false){g.event('keydown',{code:'KeyE'});g.step(frames);if(air)g.eval('pl.y=430;pl.ground=false;pl.vy=80');g.event('keyup',{code:'KeyE'});g.step();}
test('full Crown Slam reaches and defeats armored targets outside tap radius; no repeat reward',()=>{
 for(const frames of [0,72]){const g=ready('hopper');g.eval("enemies=[createEnemy('shellback',pl.x+112,13*T-ENEMY_TYPES.shellback.height)];enemies[0].root=99");charge(g,frames,true);assert.equal(g.eval('score'),frames?50:0);assert.equal(g.eval('enemies[0].health'),frames?0:2);g.step(30);assert.equal(g.eval('score'),frames?50:0);}
});
test('full Vine Snare roots three eligible nearby actors, tap roots one, neither fabricates damage',()=>{
 for(const frames of [0,72]){const g=ready('minty');g.eval("enemies=[80,110,140].map(dx=>createEnemy('walker',pl.x+dx,440));enemies.forEach(e=>{e.vx=0;e.attackTimer=99;})");charge(g,frames);assert.equal(g.eval('enemies.filter(e=>e.root>0).length'),frames?3:1);assert.equal(g.eval('enemies.every(e=>e.health===1)&&score===0'),true);g.step(frames?200:125);assert.equal(g.eval('enemies.some(e=>e.root>0)'),false);}
});
test('charged Fireball defeats twoHP armor and an eligible nearby splash actor; tap only chips armor',()=>{
 for(const frames of [0,72]){const g=ready('ember');g.eval("enemies=[createEnemy('shellback',pl.x+100,440),createEnemy('walker',pl.x+86,400)];enemies.forEach(e=>{e.vx=0;e.root=99;})");charge(g,frames);g.step(20);assert.equal(g.eval('score'),frames?100:0);assert.equal(g.eval('enemies[0]?.health??0'),frames?0:1);assert.equal(g.eval('enemies[1]?.health??0'),frames?0:1);g.step(30);assert.equal(g.eval('score'),frames?100:0);}
});
test('full Chain Lightning resolves four unique eligible defeats; tap retains two targets',()=>{
 for(const frames of [0,72]){const g=ready('bolt');g.eval("enemies=[80,130,180,230].map(dx=>createEnemy('walker',pl.x+dx,440));enemies.forEach(e=>{e.vx=0;e.root=99;})");charge(g,frames);assert.equal(g.eval('score'),frames?200:100);g.step(30);assert.equal(g.eval('score'),frames?200:100);}
});
test('full Star Glide extends duration but keeps original falling cap and ends on landing or pit death',()=>{
 const g=ready('nova');g.event('keydown',{code:'KeyE'});g.step(72);g.eval('pl.y=80;pl.ground=false;pl.vy=200');g.event('keyup',{code:'KeyE'});g.step();assert.equal(g.eval('ability.remaining'),4.5);g.step(15);assert.equal(g.eval('pl.vy'),140);g.eval('pl.y=436;pl.ground=true');g.step();assert.equal(g.eval('ability.active'),'');g.eval('pl.core={ammo:6,cooldown:0};pl.shield=true;pl.y=600');g.step();assert.equal(g.eval('lives'),2);assert.equal(g.eval('pl.core===null&&!pl.shield&&ability.remaining===0'),true);
});
