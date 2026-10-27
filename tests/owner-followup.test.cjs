const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,onFlatGround}=require('./harness.cjs');
test('Android landscape uses full844px scene width and compact native status, not the96px reserved strip',()=>{
 const g=createGame();g.eval('touchMode=true;innerWidth=844;innerHeight=390;fit();newGame();draw()');assert.equal(g.element('c').style.width,'844px');assert.equal(g.element('ability-hud').hidden,true);assert.equal(g.element('compact-hud').hidden,false);
 assert.match(g.element('compact-hud').textContent,/Sunny Meadow/);assert.equal(g.element('pause-button').hidden,false);
});
test('touch character instructions omit desktop Tab/E hints and midpoint copy acknowledges12levels',()=>{
 const g=createGame();g.eval('touchMode=true');g.click('Play');assert.doesNotMatch(g.element('menu-description').textContent,/Tab|Left \/ Right/);assert.match(g.element('menu-description').textContent,/Tap a hero/);assert.doesNotMatch(g.element('character-choice').textContent,/\(E\)/);
 g.eval("state='win';syncMenu()");assert.match(g.element('menu-title').textContent,/Chapter One/);assert.match(g.element('menu-description').textContent,/First 6 of 12/);assert.doesNotMatch(g.element('menu-description').textContent,/game complete|final boss/i);
});
const heroes=['hopper','minty','ember','nova','bolt'];
function ready(hero){const g=onFlatGround(createGame({saved:{coinhopper_character_v1:hero}}));g.eval("enemies=[createEnemy('shellback',pl.x+80,440),createEnemy('shellback',pl.x+150,440),createEnemy('walker',pl.x+210,440)];enemies.forEach(e=>e.vx=0)");return g;}
for(const hero of heroes)for(const [frames,tier]of [[0,0],[24,1],[48,2],[72,3]])test(`${hero}: tap/hold tier${tier} is deterministic and activates only on release`,()=>{
 const g=ready(hero);g.event('keydown',{code:'KeyE'});g.step(frames);assert.equal(g.eval('ability.cooldown'),0);assert.equal(g.eval('ability.projectiles.length'),0);assert.equal(g.eval('chargeTier(ability.charge)'),tier);
 if(hero==='hopper'||hero==='nova')g.eval('pl.y=300;pl.ground=false;pl.vy=10');g.event('keyup',{code:'KeyE'});g.step();assert.ok(g.eval('ability.cooldown')>0);assert.equal(g.eval('ability.power.tier'),tier);assert.equal(g.eval('ability.charging'),false);
});
for(const exit of ['pause','blur','death','restart','cancel'])test(`charging ${exit} cancels without surprise casts`,()=>{
 const g=ready('ember');g.domEvent('ability-button','pointerdown',{pointerId:5,button:0});g.step(35);
 if(exit==='pause')g.click('pause-button');if(exit==='blur')g.event('blur');if(exit==='death')g.eval('hurt(true)');if(exit==='restart')g.eval('startLevel(0)');if(exit==='cancel')g.domEvent('ability-button','pointercancel',{pointerId:5});
 g.domEvent('ability-button','pointerup',{pointerId:5});if(g.eval('state')==='pause')g.click('Resume');g.step();assert.equal(g.eval('ability.charging||ability.cooldown>0||ability.projectiles.length>0'),false);
});
test('charged damage never removes more than one Guardian HP per2.8s opening; scoring remains once',()=>{
 const g=ready('ember');g.eval("enemies=[createEnemy('guardian',300,404)];bossState.required=true;enemies[0].attackPhase='recover';enemies[0].openingHit=false;enemies[0].attackTimer=2.8");
 assert.equal(g.eval("damageEnemy(enemies[0],'fireball','#fff',3)"),true);assert.equal(g.eval('enemies[0].health'),4);assert.equal(g.eval("damageEnemy(enemies[0],'slam','#fff',3)"),false);assert.equal(g.eval('enemies[0].attackTimer'),2.8);assert.equal(g.eval('score'),0);
});
test('five Guardian HP reconcile into four pressure bands1/1/2/3/3 rocks with a full2.8s recovery',()=>{
 const g=ready('minty');const bands=[];for(const hp of [5,4,3,2,1]){g.eval(`enemies=[createEnemy('guardian',400,404)];enemies[0].health=${hp};enemies[0].cycle=1;enemies[0].attackTimer=DT;updateGuardian(enemies[0])`);bands.push(g.eval('GUARDIAN_ENCOUNTER.rocks[guardianBand(enemies[0])]'));g.eval('enemies[0].attackTimer=DT;updateGuardian(enemies[0])');assert.equal(g.eval('enemies[0].attackTimer'),2.8);assert.equal(g.eval('guardianOpen(enemies[0])'),true);}assert.deepEqual(bands,[1,1,2,3,3]);
});
test('Crown Slam splash uses nearest enemy bounds and cannot cross solid walls',()=>{
 const g=ready('hopper');g.eval("enemies=[createEnemy('guardian',pl.x+90,404)];enemies[0].attackPhase='recover';enemies[0].openingHit=false;enemies[0].attackTimer=99;ability.active='slam';ability.remaining=.5;ability.power={...ABILITIES.hopper,damage:1};pl.ground=true;updateAbilityWorld()");assert.equal(g.eval('enemies[0].health'),4);
 const w=ready('hopper');w.eval("enemies=[createEnemy('shellback',pl.x+65,440)];grid[12][5]='#';ability.active='slam';ability.remaining=.5;pl.ground=true;updateAbilityWorld()");assert.equal(w.eval('enemies[0].health'),2);
});
