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
for(const hero of heroes)test(`${hero}: optional Core adds finite ranged fire without replacing charged special`,()=>{
 const g=ready(hero);g.eval('pl.core={ammo:6,cooldown:0}');g.event('keydown',{code:'KeyF'});g.step();g.event('keyup',{code:'KeyF'});assert.equal(g.eval('pl.core.ammo'),5);assert.equal(g.eval('pl.character'),hero);assert.equal(g.eval('ability.cooldown'),0);g.step(20);assert.equal(g.eval('enemies[0].health'),1);
 g.event('keydown',{code:'KeyE'});g.step(25);if(['hopper','nova'].includes(hero))g.eval('pl.y=300;pl.ground=false;pl.vy=100');g.event('keyup',{code:'KeyE'});g.step();assert.equal(g.eval('ability.power.tier'),1);assert.equal(g.eval('pl.core.ammo'),5);
});
test('Core stacking: shield first, then Core absorbs one enemy/spike hit; pits bypass both',()=>{
 const g=ready('minty');g.eval('pl.core={ammo:6,cooldown:0};pl.shield=true');g.eval('hurt()');assert.equal(g.eval('!pl.shield&&pl.core.ammo===6&&lives===3'),true);g.eval('pl.inv=0;hurt()');assert.equal(g.eval('pl.core===null&&lives===3&&pl.inv===1'),true);g.eval('pl.core={ammo:6,cooldown:0};pl.shield=true;hurt(true)');assert.equal(g.eval('pl.core===null&&!pl.shield&&lives===2&&coreShots.length===0'),true);
});
test('Core cannot recharge itself, tunnel through walls, damage closed boss armor or double-score',()=>{
 const g=ready('nova');g.eval("pl.core={ammo:6,cooldown:0};grid[12][5]='#'");g.event('keydown',{code:'KeyF'});g.step(40);g.event('keyup',{code:'KeyF'});assert.equal(g.eval('score'),0);assert.equal(g.eval('coreShots.length'),0);assert.equal(g.eval('pl.core.ammo'),5);
 g.eval("grid[12][5]=' ';enemies=[createEnemy('guardian',pl.x+70,404)];enemies[0].attackTimer=99;pl.core.cooldown=0;fireCore()");g.step(20);assert.equal(g.eval('enemies[0].health'),5);assert.equal(g.eval('score'),0);
});
test('prototype defaults off; opt-in pickup audit adds strategic items without changing maps, coins or save keys',()=>{
 const g=createGame();assert.equal(g.eval('playtestPrefs.core'),false);g.click('Settings');g.element('core-trial').checked=true;g.domEvent('core-trial','change');g.click('Back');g.click('Play');g.click('Start game');assert.equal(g.eval('shields.filter(s=>s.trial).length'),1);
 for(const i of [2,4,5]){g.eval(`startLevel(${i})`);assert.equal(g.eval('coreItems.length'),1);assert.equal(g.eval('coreItems[0].got'),false);}
 const reload=createGame({saved:Object.fromEntries(g.storage)});assert.equal(reload.eval('playtestPrefs.core'),true);const blocked=createGame({storageBlocked:true});assert.equal(blocked.eval('playtestPrefs.core'),false);
});
test('last-life pit collision has priority over Core rewards and clears shots',()=>{
 const g=ready('ember');g.eval('pl.core={ammo:6,cooldown:0};pl.y=600;lives=1;coreShots=[{x:enemies[0].x,y:enemies[0].y,vx:0,radius:5,life:1}];enemies[0].health=1');g.step();assert.equal(g.eval('state'),'over');assert.equal(g.eval('score'),0);assert.equal(g.eval('coreShots.length'),0);
});
test('Skyline composition rises at33/66% without backtrack resets; only engaged boss overrides it',()=>{
 const g=createGame();g.click('Play');g.click('Start game');g.eval('startLevel(5);ac.currentTime=3;pl.x=start.x+(LEVELS[5].arenaStart*T-start.x)*.34;syncMusic()');assert.equal(g.eval('musicState.theme'),'summitRise');assert.equal(g.eval('musicState.offset'),3);
 g.eval('pl.x=start.x;syncMusic()');assert.equal(g.eval('musicState.theme'),'summitRise');g.eval('ac.currentTime=5;pl.x=start.x+(LEVELS[5].arenaStart*T-start.x)*.67;syncMusic()');assert.equal(g.eval('musicState.theme'),'summitPeak');assert.equal(g.eval('musicState.offset'),5);
 g.eval('ac.currentTime=6;pl.x=LEVELS[5].arenaStart*T;pl.y=436;pl.ground=true;pl.vx=0;cam=pl.x-W/3;syncMusic()');assert.equal(g.eval('musicState.theme'),'summitPeak','position alone is not the encounter event');g.step();g.eval('syncMusic()');assert.equal(g.eval('musicState.theme'),'boss');assert.equal(g.eval('bossState.engaged'),true);
 g.eval('ac.currentTime=7;hurt(true);syncMusic()');assert.equal(g.eval('musicState.theme'),'summitPeak');assert.equal(g.eval('musicState.offset'),6,'checkpoint return resumes traversal composition phase');assert.ok(g.eval('musicRetired.size')<=4);
});
test('Core cooldown/ammo freeze on pause, and death/restart/transition clear carried state without farming',()=>{
 const g=ready('nova');g.eval('playtestPrefs.core=true;startLevel(4);coreItems[0].got=true;pl.core={ammo:4,cooldown:.4}');g.click('pause-button');g.step(180);assert.equal(g.eval('pl.core.cooldown'),.4);g.click('Resume');g.eval('hurt(true)');assert.equal(g.eval('pl.core'),null);assert.equal(g.eval('coreItems[0].got'),true);g.click('pause-button');g.click('Restart level');g.click('Restart level');assert.equal(g.eval('coreItems[0].got'),false);assert.equal(g.eval('pl.core'),null);
});

test('trial Core placements sit outside solid terrain and are collectible from their actual supporting surface',()=>{
 for(const lvl of [2,4,5]){const g=ready('minty');g.eval(`playtestPrefs.core=true;startLevel(${lvl});enemies=[];const item=coreItems[0];if(isSolid(Math.floor(item.x/T),Math.floor(item.y/T)))throw Error('Core inside solid');pl.x=item.x-13;pl.y=(${lvl===5?13:11})*T-pl.h;pl.ground=true;pl.vy=0;pl.vx=0`);if(lvl===5){g.event('keydown',{code:'Space'});g.step(7);}else g.step();assert.equal(g.eval('coreItems[0].got&&pl.core.ammo===6'),true);}
});
test('keyboard Core activation restores canvas focus so ordinary movement remains available',()=>{
 const g=ready('nova');g.eval('pl.core={ammo:6,cooldown:0}');g.element('core-button').focus();g.domEvent('core-button','click',{detail:0});assert.equal(g.document.activeElement,g.element('c'));g.step();assert.equal(g.eval('pl.core.ammo'),5);
});

test('landscape framing follows high routes without changing simulation coordinates or low-ground control clearance',()=>{
 const g=ready('hopper');g.eval('touchMode=true;innerWidth=844;innerHeight=390;fit();pl.y=50;pl.vy=0');const before=g.snapshot('({pl,cam,enemies,score,timer})');g.eval('draw()');assert.deepEqual(g.snapshot('({pl,cam,enemies,score,timer})'),before);const high=g.eval('parseFloat(cv.style.top)-H*sceneScale/2');assert.ok(high>-30);assert.ok(g.eval('72*sceneScale')+high>0);g.eval('pl.y=436;draw()');const low=g.eval('parseFloat(cv.style.top)-H*sceneScale/2');assert.ok(low+468*g.eval('sceneScale')<=328);
});
