const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createGame,onFlatGround}=require('./harness.cjs'),routes=require('./fixtures/campaign-routes.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),preview={coinhopper_stage_i_v1:'{"version":1,"art":true}'};
function boss(){const g=onFlatGround(createGame({saved:preview}));g.eval("bossState={required:true,defeated:false};enemies=[createEnemy('guardian',400,404)]");return g;}
function defeat(g){g.eval("enemies[0].health=1;enemies[0].attackPhase='recover';enemies[0].openingHit=false;damageEnemy(enemies[0],'stomp')");}

test('Stage I leaves six maps, enemy balance, encounter timing and powers byte-for-byte equivalent to verified base definitions',()=>{
 const g=createGame();for(const [key,expected]of Object.entries({LEVELS:'c8cdfbce8af4b2376bc3c99af11926b5719d4a333075f0d14afef5f8f52178e1',ENEMY_TYPES:'5bda99f9f85c1bf64c77a480e0526659f23ee757a59574bb2780c3e91709789d',GUARDIAN_ENCOUNTER:'6a29e4da8d67af4682c7029202f6d4c9c87728a5bd8cf61cdc65263bbf362772',ABILITIES:'055b168c545642459a9a239f12fc3ed970bcfff35a70b10458bae175a7b42496'}))assert.equal(hash(JSON.stringify(g.snapshot(key))),expected,key);
});
test('preview is opt-in and corrupt, oversized or blocked storage falls back without changing other preferences',()=>{
 for(const value of [undefined,'bad','{"version":2,"art":true}','x'.repeat(300),'null']){const g=createGame({saved:{coinhopper_stage_i_v1:value}});assert.equal(g.eval('stageIPrefs.art'),false);}
 const g=createGame({saved:preview,storageBlocked:true});assert.equal(g.eval('stageIPrefs.art'),false);assert.doesNotThrow(()=>g.eval('stageIPrefs.art=true;saveStageIPrefs()'));
 const restored=createGame({saved:{...preview,coinhopper_character_v1:'bolt'}});assert.equal(restored.eval('stageIPrefs.art&&selectedCharacter==="bolt"'),true);
});
test('only C3 Guardian is embedded: all rejected and pending Hopper/Walker proposals remain outside gameplay',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),manifest=require('../docs/art/stage-i/manifest.json');
 assert.deepEqual(Object.keys(manifest.atlases),['guardian']);assert.doesNotMatch(html,/id="stage-i-(hopper|walker)"|hopper-painted-refinement|Crownstride|Crownkeep|Crestspring/);
 const a=manifest.atlases.guardian;for(const [file,expected]of [[a.original,a.originalSHA256],[a.runtime,a.runtimeSHA256]])assert.equal(hash(fs.readFileSync(path.join(__dirname,'../docs/art/stage-i',file))),expected);
 assert.equal(hash(Buffer.from(html.match(/id="stage-i-guardian"[^>]+data-source="data:image\/webp;base64,([^"]+)/)[1],'base64')),a.runtimeSHA256);
 assert.ok(Buffer.byteLength(html)<8*1024*1024,'Canonical packaging buffer stays within its measured limit');
});
test('C3 lettering is never mirrored; render callbacks cannot alter health, hitboxes, score, geometry or opening duration',()=>{
 const g=boss();g.eval("stageIImages.guardian.complete=true;stageIImages.guardian.naturalWidth=1254;window.faces=[];stageIFrame=(ctx,id,frame,x,y,w,h,face=1)=>window.faces.push(face)");
 for(const [phase,health]of [['idle',5],['idle',1],['windup',3],['recover',5]])for(const side of [-1,1]){
  g.eval(`enemies[0].attackPhase='${phase}';enemies[0].health=${health};enemies[0].artVx=${side*48};pl.x=enemies[0].x+${side*200}`);
  const before=g.snapshot('({enemies,pl,bossState,grid,score,lives,ability})');g.eval('drawStageIGuardian(enemies[0])');assert.deepEqual(g.snapshot('({enemies,pl,bossState,grid,score,lives,ability})'),before);
 }
 assert.ok(g.snapshot('window.faces').every(x=>x===1));assert.equal(g.eval('enemies[0].w===68&&enemies[0].h===64&&GUARDIAN_ENCOUNTER.recovery===2.8'),true);
});
test('Guardian fracture settles in simulation time, freezes paused, persists after checkpoint death and never creates colliding actors',()=>{
 const g=boss(),grid=g.snapshot('grid');defeat(g);assert.equal(g.eval('score'),50);g.step(20);const age=g.eval('bossState.remains.age');g.click('pause-button');g.step(180);assert.equal(g.eval('bossState.remains.age'),age);g.click('Resume');g.step(120);
 assert.equal(g.eval('bossState.remains.settled&&bossState.remains.age===2.1&&enemies.length===0'),true);assert.deepEqual(g.snapshot('grid'),grid);
 const remains=g.snapshot('bossState.remains');g.eval('hurt(true)');assert.deepEqual(g.snapshot('bossState.remains'),remains);assert.equal(g.eval('bossState.defeated&&score===50'),true);assert.doesNotThrow(()=>g.eval('drawGuardianRemains()'));
 g.click('pause-button');g.click('Restart level');g.click('Restart level');assert.equal(g.eval('bossState.remains'),undefined);g.eval('startLevel(0)');assert.equal(g.eval('bossState.remains'),undefined);
});
test('reduced-motion corpse is immediately static C3 rubble, behind gameplay, without changing defeat/exit timing',()=>{
 const g=boss();defeat(g);g.eval("visualSettings.reduced=true;stageIImages.guardian.complete=true;stageIImages.guardian.naturalWidth=1254;window.rendered=[];stageIFrame=(ctx,id,frame)=>window.rendered.push(frame)");g.eval('drawGuardianRemains()');assert.deepEqual(g.snapshot('window.rendered'),[12]);assert.equal(g.eval('bossState.remains.age'),0);assert.equal(g.eval('bossState.defeated&&score===50'),true);
});
test('one-time defeat scoring and corpse initialization resist repeated damage and destruction callbacks',()=>{
 const g=boss();defeat(g);const remains=g.snapshot('bossState.remains');for(let n=0;n<8;n++)g.eval("damageEnemy(enemies[0],'lightning');beginGuardianDemise(enemies[0])");assert.equal(g.eval('score'),50);assert.deepEqual(g.snapshot('bossState.remains'),remains);
});
test('original stone Foley is deterministic, finite, bounded, click-ended and routed through the existing effects bus',()=>{
 const g=boss();for(const kind of ['step','open','fracture','rumble','impact']){
  const data=g.snapshot(`Array.from(composeGuardianSfx('${kind}').samples)`);assert.ok(data.length>4000);assert.equal(data[0],0);assert.equal(data.at(-1),0);assert.ok(data.every(x=>Number.isFinite(x)&&Math.abs(x)<1));assert.ok(data.some(x=>Math.abs(x)>.01));const checksum=hash(JSON.stringify(data));g.eval('guardianPCM.clear()');assert.equal(hash(JSON.stringify(g.snapshot(`Array.from(composeGuardianSfx('${kind}').samples)`))),checksum);
 }
 g.eval('audio()');assert.equal(g.eval("stageISound('fracture')"),true);assert.equal(g.audio.sources.at(-1).connections[0],g.eval('effectsGain'));g.eval('audioPrefs.muted=true');assert.equal(g.eval("stageISound('fracture')"),false);g.eval('audioPrefs.muted=false');g.click('pause-button');assert.equal(g.eval("stageISound('fracture')"),false);
});
for(const hero of ['hopper','minty','ember','nova','bolt'])test(`${hero}: C3 preview preserves all six recorded no-power routes, scoring, original physics and five separate boss openings`,()=>{
 const g=createGame({saved:{...preview,coinhopper_character_v1:hero}});g.eval('newGame()');let total=0;
 for(const [index,route]of routes.entries()){
  const next={jump:0,left:0,right:0};g.event('keydown',{code:'ArrowRight'});const hits=[];let hp=5;
  for(let frame=0;frame<route.maxFrames&&g.eval('state')==='play';frame++){
   for(const [field,code]of [['jump','Space'],['left','ArrowLeft'],['right','ArrowRight']])while(route[field]?.[next[field]]?.[0]===frame){g.event(route[field][next[field]][1]?'keydown':'keyup',{code});next[field]++;}
   g.step();assert.equal(g.eval('lives'),3);assert.equal(g.eval('ability.cooldown===0&&pl.w===26&&pl.h===32'),true);
   if(index===5){const health=g.eval('enemies.find(e=>e.type==="guardian")?.health??0');if(health<hp){hits.push([frame,health]);hp=health;}}
  }
  for(const code of ['ArrowRight','ArrowLeft','Space'])g.event('keyup',{code});total+=route.score;assert.equal(g.eval('state'),'done');assert.equal(g.eval('score'),total);assert.equal(g.eval('pl.character'),hero);if(index===5)assert.deepEqual(hits,route.bossHits);g.click(index===5?'Finish':'Next level');
 }assert.equal(g.eval('state'),'win');
});
