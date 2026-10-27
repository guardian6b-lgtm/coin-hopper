const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createGame}=require('./harness.cjs');
test('visual redesign preserves all six definitions, balance tables and authoritative simulation functions',()=>{
  const baseline=require('./fixtures/visual-baseline.json'),g=createGame(),hash=v=>crypto.createHash('sha256').update(v.replace(/\r\n/g,'\n')).digest('hex');
  assert.equal(hash(g.eval('JSON.stringify({LEVELS,ABILITIES,ENEMY_TYPES,ENEMY_COMBAT,ENEMY_DAMAGE})')),baseline.dataHash);
  for(const [name,expected]of Object.entries(baseline.functions))assert.equal(hash(g.eval(name+'.toString()')),expected,name);
});
test('approved reference is the exact original PNG, not a generated replacement',()=>{
  const bytes=fs.readFileSync(path.join(__dirname,'../docs/art/reference/coin_hopper_character_selection.png'));
  assert.equal(bytes.length,1954012);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'6d4e5d7ebbab523c159983df725c1c9efd4c67a7988a284ec358608bee3d9f4d');
});
for(const hero of ['hopper','minty','ember','nova','bolt'])test(`${hero}: all six art poses preserve complete simulation and collision state`,()=>{
  const g=createGame({saved:{coinhopper_character_v1:hero}});g.eval('newGame();startLevel(5)');g.step(2);
  const before=g.snapshot('({pl,grid,enemies,coins,shields,bossState,score,levelScore,lives,timer,ability,enemyCombat})');
  for(const pose of ['idle','run','jump','fall','hurt','victory'])g.eval(`drawCharacter(cx,'${hero}',200,300,30,32,1,'${pose}',2);draw()`);
  assert.deepEqual(g.snapshot('({pl,grid,enemies,coins,shields,bossState,score,levelScore,lives,timer,ability,enemyCombat})'),before);
});
test('visual pose selection follows motion, damage and victory without a new gameplay state',()=>{
  const g=createGame();g.eval('newGame();pl.inv=0;pl.ground=true;pl.vx=0');assert.equal(g.eval('characterPose(pl)'),'idle');
  for(const [change,pose] of [['pl.vx=100','run'],['pl.ground=false;pl.vy=-100','jump'],['pl.vy=100','fall'],['pl.inv=1','hurt'],["state='done'",'victory']]){g.eval(change);assert.equal(g.eval('characterPose(pl)'),pose);}
});
test('reduced-motion preference persists independently of character and volume settings',()=>{
  const g=createGame({saved:{coinhopper_character_v1:'bolt',coinhopper_settings:'{"music":0.4,"effects":0.7}'}});g.click('Settings');
  const input=g.element('motion-toggle');input.checked=true;g.domEvent('motion-toggle','change');assert.equal(g.eval('reducedMotion()'),true);
  const reload=createGame({saved:Object.fromEntries(g.storage)});assert.equal(reload.eval('reducedMotion()'),true);assert.equal(reload.eval('selectedCharacter'),'bolt');assert.deepEqual(reload.snapshot('settings'),{music:.4,effects:.7});
});
test('blocked storage does not prevent motion settings or native menus working',()=>{
  const g=createGame({storageBlocked:true});g.click('Settings');g.element('motion-toggle').checked=true;assert.doesNotThrow(()=>g.domEvent('motion-toggle','change'));assert.equal(g.eval('reducedMotion()'),true);g.click('Back');g.click('Play');g.click('Start game');assert.equal(g.eval('state'),'play');
});
