const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {createGame}=require('./harness.cjs');
const routes=require('./fixtures/campaign-routes.cjs');
const cavern={bonus:require('./fixtures/stage-h-cavern-bonus.json')};
const heroes=['hopper','minty','ember','nova','bolt'];
function select(game,id){game.click('Play');game.click('character-'+id);game.click('Start game');}
function replay(game,route,noShield=true){
  game.event('keydown',{code:'ArrowRight'});let frames=0;
  const next={jump:0,left:0,right:0};
  for(;frames<route.maxFrames&&game.eval('state')==='play';frames++){
    for(const [field,code]of [['jump','Space'],['left','ArrowLeft'],['right','ArrowRight']]){
      while(route[field]?.[next[field]]?.[0]===frames){game.event(route[field][next[field]][1]?'keydown':'keyup',{code});next[field]++;}
    }
    const protectedBefore=game.eval('pl.shield');game.step();
    assert.equal(game.eval('lives'),3,`${route.name}, frame ${frames}`);
    assert.equal(game.eval('ability.cooldown===0&&!ability.active&&ability.projectiles.length===0'),true);
    if(noShield)assert.equal(game.eval('shields.some(s=>s.got)'),false);
    else if(protectedBefore&&game.eval('state')==='play')assert.equal(game.eval('pl.shield'),true,'optional shield must not mask route damage');
  }
  game.event('keyup',{code:'ArrowRight'});game.event('keyup',{code:'ArrowLeft'});game.event('keyup',{code:'Space'});
  assert.equal(game.eval('state'),'done',route.name);
  assert.equal(game.eval('levelScore'),route.score);
  return frames;
}

test('archived foundation definitions retain the four verified pre-expansion hashes',()=>{
  const hashes=['2a98625b6ff56cbb64596eb57f15be3419c2c7de0e2a92182cee30e541bc3dcf','2088933dba2eaf2392f8287391c824919877a1d0a35a5d23ce9f5649c55654a3','2dee0b8187afb49bb9c8078fc3e9dd23501ce1698c840aa206174aa5f73c3307','3b022ef3ad520b80a6fa3c51af9f11f1a0a01ad45e26e066568b1e7df347ccfe'];
  const game=createGame();
  for(let i=0;i<4;i++)assert.equal(crypto.createHash('sha256').update(JSON.stringify(game.snapshot(`FOUNDATION_LEVELS[${i}]`))).digest('hex'),hashes[i]);
});

test('Crystal Caverns loads its own cave geometry, two-HP types, optional shield and safe flag',()=>{
  const game=createGame();game.eval('newGame();startLevel(4)');
  assert.equal(game.eval('LEVELS[4].name'),'Crystal Caverns');assert.equal(game.eval('LEVELS[4].theme'),'cavern');
  assert.equal(game.eval('LW'),245);assert.equal(game.eval('coins.length'),54);assert.equal(game.eval('shields.length'),1);
  assert.equal(game.eval('enemies.filter(e=>e.type==="shellback").length'),6);assert.equal(game.eval('enemies.filter(e=>e.type==="sentinel").length'),4);
  assert.equal(game.eval('enemies.every(e=>e.health===2&&e.maxHealth===2&&e.y+e.h===13*T)'),true);
  assert.equal(game.eval('grid.flat().some(c=>"bsPFSoeh".includes(c))'),false);
  assert.equal(game.eval('isSolid(Math.floor(start.x/T),13)&&isSolid(flag.x/T,flag.y/T+1)'),true);
  assert.equal(game.eval('pl.w===26&&pl.h===32&&ability.cooldown===0&&!pl.shield'),true);
});

for(const hero of heroes){
  test(`${hero} completes the entire ${routes.length}-level campaign without damage, powers or shields`,()=>{
    const game=createGame();select(game,hero);let total=0;
    for(const [index,route]of routes.entries()){
      assert.equal(game.eval('lvl'),index);replay(game,route);total+=route.score;
      assert.equal(game.eval('score'),total);assert.equal(game.eval('pl.character'),hero);
      assert.equal(game.eval('unlockedCount()'),Math.min(routes.length,index+2));
      game.click(index===routes.length-1?'Finish':'Next level');
    }
    assert.equal(game.eval('state'),'win');assert.equal(game.eval('score'),total);
    assert.deepEqual(game.snapshot('progress.completed'),Array(routes.length).fill(true));
    assert.match(game.element('menu-description').textContent,new RegExp(`All ${routes.length} levels complete`));
  });

  test(`${hero} reaches every Crystal Caverns raised coin group on the optional legal route`,()=>{
    const game=createGame();select(game,hero);game.eval('startLevel(4)');replay(game,cavern.bonus,false);
    const raised=game.snapshot('coins.filter(c=>c.y<400&&c.got).map(c=>Math.floor(c.x/T))');
    for(const x of [9,10,11,40,42,136,137,138,139])assert.ok(raised.includes(x),`raised coin ${x}`);
    assert.equal(game.eval('shields[0].got'),true);assert.equal(game.eval('pl.character'),hero);
  });
}

test('Crystal Caverns death preserves damaged armor and restart restores fresh HP/pickups without farming',()=>{
  const game=createGame();game.eval("newGame();startLevel(4);damageEnemy(enemies[0],'fireball');shields[0].got=true;score=300;levelScore=100;lives=2;hurt(true)");
  assert.equal(game.eval('enemies[0].health===1&&shields[0].got&&score===300&&lives===1&&enemyCombat.projectiles.length===0'),true);
  game.click('pause-button');game.click('Restart level');game.click('Restart level');
  assert.equal(game.eval('enemies.every(e=>e.health===2)&&!shields[0].got&&score===200&&levelScore===0&&lives===1'),true);
});

test('Crystal Caverns completion clears powers and protection, and uses the actual campaign end',()=>{
  const game=createGame();game.eval('newGame();startLevel(4);enemies=[];pl.x=flag.x;pl.vx=0;pl.shield=true;ability.cooldown=2');game.step();
  assert.equal(game.eval('state==="done"&&!pl.shield&&ability.cooldown===0&&enemyCombat.projectiles.length===0'),true);
  if(game.eval('LEVELS.length')===5){game.click('Finish');assert.equal(game.eval('state'),'win');}
  else{game.click('Next level');assert.equal(game.eval('lvl===5&&state==="play"'),true);}
});

test('cave rendering supports the system reduced-motion preference and preserves geometry',()=>{
  const game=createGame();game.eval('newGame();startLevel(4);window.matchMedia=()=>({matches:true})');
  const before=game.snapshot('grid');assert.equal(game.eval('reducedMotion()'),true);assert.doesNotThrow(()=>game.eval('draw()'));
  assert.deepEqual(game.snapshot('grid'),before);game.eval('window.matchMedia=()=>({matches:false})');assert.doesNotThrow(()=>game.eval('draw()'));
});
