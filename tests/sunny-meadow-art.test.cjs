const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createGame}=require('./harness.cjs');
test('Sunny Meadow art defaults Standard and safely rejects invalid/blocked preferences',()=>{
 for(const options of [{},{saved:{coinhopper_meadow_art_v1:'invalid'}},{storageBlocked:true}]){const g=createGame(options);assert.equal(g.eval('meadowSettings.mode'),'standard');g.eval('newGame();draw()');assert.equal(g.eval('meadowPrototypeActive()'),false);}
});
test('quality selection persists separately and is reachable after Core without changing saved progression',()=>{
 const g=createGame({saved:{coinhopper_character_v1:'nova',coinhopper_settings:'{"music":0.4,"effects":0.7}'}});g.click('Settings');g.element('meadow-quality').value='lite';g.domEvent('meadow-quality','change');assert.equal(g.eval('meadowSettings.mode'),'lite');const r=createGame({saved:Object.fromEntries(g.storage)});assert.equal(r.eval('meadowSettings.mode'),'lite');assert.equal(r.eval('selectedCharacter'),'nova');assert.deepEqual(r.snapshot('settings'),{music:.4,effects:.7});
});
for(const hero of ['hopper','minty','ember','nova','bolt'])test(`${hero}: all quality modes and six scenes preserve full simulation state`,()=>{
 const g=createGame({saved:{coinhopper_character_v1:hero}});g.eval('newGame();meadowPlate.complete=true;meadowPlate.naturalWidth=1536');
 for(let lvl=0;lvl<6;lvl++){g.eval(`startLevel(${lvl})`);g.step(2);const before=g.snapshot('({pl,grid,enemies,coins,shields,highJumps,coreItems,coreShots,bossState,score,levelScore,lives,timer,ability,enemyCombat})');for(const mode of ['standard','illustrated','lite'])g.eval(`meadowSettings.mode='${mode}';draw()`);assert.deepEqual(g.snapshot('({pl,grid,enemies,coins,shields,highJumps,coreItems,coreShots,bossState,score,levelScore,lives,timer,ability,enemyCombat})'),before);}
});
test('missing or failed optional plate falls back, and tile caches stay bounded',()=>{
 const g=createGame();g.eval("newGame();meadowSettings.mode='illustrated';meadowPlate.complete=false;draw()");assert.equal(g.eval('meadowPrototypeActive()'),false);g.eval('meadowPlate.complete=true;meadowPlate.naturalWidth=1536');for(const mode of ['illustrated','lite'])g.eval(`meadowSettings.mode='${mode}';draw()`);assert.equal(g.eval('meadowTileCache.size'),4);g.domEvent('meadow-plate','error');assert.equal(g.eval('meadowPrototypeActive()'),false);assert.doesNotThrow(()=>g.eval('draw()'));
});
test('new prototype plate preserves original generated PNG bytes and embedded copy matches manifest',()=>{
 const root=path.join(__dirname,'..'),manifest=require('../docs/art/prototypes/sunny-meadow-provenance.json');const raw=fs.readFileSync(path.join(root,'docs/art/prototypes',manifest.file));assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(raw.readUInt32BE(16),1536);assert.equal(raw.readUInt32BE(20),1024);assert.equal(raw.length,manifest.bytes);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),manifest.sha256);const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const encoded=html.match(/id="meadow-plate"[^>]*data-source="data:image\/png;base64,([^"]+)"/)[1];assert.deepEqual(Buffer.from(encoded,'base64'),raw);
});
