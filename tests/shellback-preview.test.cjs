
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createGame, onFlatGround } = require('./harness.cjs');
const { composeDevelopmentPage } = require('../scripts/ember-preview.cjs');
const directory = path.resolve(__dirname, '../dev/shellback-s1');
const files = ['shellback_v1.0_metadata.json', 'shellback_v1.0_intact_1x.png', 'shellback_v1.0_cracked_1x.png'];
const known = Object.fromEntries(['intact', 'cracked'].map(state => [
  'data:image/png;base64,' + fs.readFileSync(path.join(directory, 'shellback_v1.0_' + state + '_1x.png')).toString('base64'), state
]));
async function setup({ enabled = true, failure = '' } = {}) {
  const stub = 'const known=' + JSON.stringify(known) + ',failure=' + JSON.stringify(failure) + ';' +
    'globalThis.Image=class {set src(uri){this.state=known[uri];this.naturalWidth=this.state==="cracked"&&failure==="size"?43:44;this.naturalHeight=40;' +
    'Promise.resolve().then(()=>this.state==="cracked"&&failure==="load"?this.onerror():this.onload());}' +
    'decode(){return this.state==="cracked"&&failure==="decode"?Promise.reject(Error("test decode")):Promise.resolve();}};';
  const page = composeDevelopmentPage({ shellback: enabled }).toString().replace('<script>', () => '<script>' + stub);
  const game = onFlatGround(createGame({ html: page }));
  await new Promise(resolve => setImmediate(resolve));
  game.eval('shields=[];highJumps=[];coreItems=[];globalThis.actor=createEnemy("shellback",300,13*T-28);actor.ground=true;enemies=[actor];');
  game.eval('globalThis.sample=null;let anchor,scale;cx.translate=(x,y)=>{anchor=[x,y]};cx.scale=(x,y)=>{scale=[x,y]};' +
    'cx.drawImage=(image,...args)=>{if(image.state)sample={state:image.state,anchor,scale,args}};');
  return game;
}
function paint(game) { game.eval('sample=null;drawEnemy(actor)'); return game.snapshot('sample'); }
function stomp(game) {
  game.eval('pl.x=actor.x;pl.y=actor.y-pl.h-2;pl.vx=0;pl.vy=200;pl.ground=false;pl.coyote=0;pl.buf=0;jumpEdge=false');
  game.step();
}
test('Shellback defaults OFF with byte-identical ordinary and existing opt-in pages', () => {
  const raw = fs.readFileSync(path.resolve(__dirname, '../index.html'));
  assert.deepEqual(composeDevelopmentPage(), raw);
  assert.deepEqual(composeDevelopmentPage({ shellback: 'true' }), raw);
  for (const enabled of [false, true]) for (const walker of [false, true]) {
    assert.deepEqual(composeDevelopmentPage({ enabled, walker, shellback: false }), composeDevelopmentPage({ enabled, walker }));
  }
  const html = composeDevelopmentPage({ shellback: true }).toString();
  assert(html.includes('installShellbackS1('));
  assert(!html.includes('installEmberV31(') && !html.includes('installWalkerB1('));
  assert(composeDevelopmentPage({ shellback: true, enabled: true, walker: true }).includes('installRosterPicker('));
  assert.equal(createHash('sha256').update(raw).digest('hex'), 'f05b50ab148a7ec4bfa879689640ba36ddf1a1c3935e631a003ba1e529310cdc');
});
test('missing or tampered master data leaves the requested page and other feature flags intact', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'coinhopper-shellback-s1-'));
  t.after(() => { for (const name of files) fs.rmSync(path.join(temp, name), { force: true }); fs.rmdirSync(temp); });
  const before = composeDevelopmentPage({ enabled: true, walker: true });
  const compose = () => {
    const errors = [];
    assert.deepEqual(composeDevelopmentPage({ enabled: true, walker: true, shellback: true, shellbackAssetRoot: temp,
      onShellbackFallback: e => errors.push(e.message) }), before);
    assert.equal(errors.length, 1);
  };
  compose();
  for (const name of files) fs.copyFileSync(path.join(directory, name), path.join(temp, name));
  for (const name of files) {
    const original = fs.readFileSync(path.join(temp, name));
    const changed = Buffer.from(original); changed[changed.length - 1] ^= 1;
    fs.writeFileSync(path.join(temp, name), changed); compose(); fs.writeFileSync(path.join(temp, name), original);
  }
});
for (const failure of ['load', 'size', 'decode']) {
  test(failure + ' failure preserves procedural intact, cracked and defeated rendering', async () => {
    const game = await setup({ failure });
    assert.equal(game.eval('shellbackS1.status'), 'failed');
    assert.equal(paint(game), null);
    game.eval("damageEnemy(actor,'fireball')"); assert.equal(paint(game), null);
    game.step(19); game.eval("damageEnemy(actor,'fireball')"); assert.equal(paint(game), null);
    assert.equal(game.eval('score'), 50);
  });
}
test('factory and resolved patrol preserve 2 HP, 34×28 and 40 px/s', async () => {
  const game = await setup();
  assert.equal(game.eval('shellbackS1.status'), 'ready');
  assert.deepEqual(game.snapshot('[actor.health,actor.maxHealth,actor.w,actor.h,actor.vx]'), [2,2,34,28,-40]);
  game.step(12);
  assert(Math.abs(game.eval('actor.x') - 292) < 1e-7);
  assert.deepEqual(paint(game), { state: 'intact', anchor: game.snapshot('[actor.x+17-cam,actor.y+28]'), scale: [-1,1], args: [-22.023,-37.727,44,40] });
});
for (const face of [-1, 1]) {
  test('first hit selects cracked art at the same foot pivot facing ' + face, async () => {
    const game = await setup(); game.eval('actor.vx=' + face * 40);
    const intact = paint(game);
    assert.equal(game.eval("damageEnemy(actor,'fireball')"), true);
    const cracked = paint(game);
    assert.equal(intact.state, 'intact'); assert.equal(cracked.state, 'cracked');
    assert.deepEqual(cracked.anchor, intact.anchor); assert.deepEqual(cracked.scale, [face,1]); assert.deepEqual(cracked.args, intact.args);
    assert.deepEqual(game.snapshot('[actor.health,actor.dead,actor.hitTime,score,levelScore]'), [1,0,.3,0,0]);
    const before = game.snapshot('actor');
    for (let i = 0; i < 10; i++) paint(game);
    assert.deepEqual(game.snapshot('actor'), before);
  });
}
for (const source of ['stomp','slam','fireball','lightning']) {
  test(source + ' respects the hit guard, grants points only on defeat and removes the illustrated corpse on schedule', async () => {
    const game = await setup();
    assert.equal(game.eval("damageEnemy(actor,'" + source + "')"), true);
    assert.equal(game.eval("damageEnemy(actor,'" + source + "')"), false);
    game.step(19);
    assert.equal(game.eval("damageEnemy(actor,'" + source + "')"), true);
    assert.deepEqual(game.snapshot('[actor.health,actor.dead,score,levelScore]'), [0,.4,50,50]);
    assert.equal(game.eval("damageEnemy(actor,'stomp')"), false);
    const death = paint(game);
    assert.equal(death.state, 'cracked'); assert.deepEqual(death.scale, [-1.3,.3]);
    assert.deepEqual(death.anchor, game.snapshot('[actor.x+17-cam,actor.y+28]'));
    game.step(23); assert(game.eval('enemies.includes(actor)')); assert.equal(paint(game).state, 'cracked');
    game.step(2); assert.equal(game.eval('enemies.includes(actor)'), false); assert.equal(paint(game), null);
    assert.equal(game.eval('score'), 50);
  });
}
test('two real stomps retain the original ordinary and held-jump bounces', async () => {
  const game = await setup();stomp(game);
  assert.deepEqual(game.snapshot('[actor.health,pl.vy,score]'), [1,-380,0]);
  game.eval('pl.x=144;pl.y=13*T-pl.h;pl.vy=0;pl.ground=true');game.step(19);
  game.event('keydown', { code: 'Space' });stomp(game);
  assert.deepEqual(game.snapshot('[actor.health,pl.vy,score,lives]'), [0,-560,50,3]);
});
test('charged damage retains stronger existing tiers and awards 50 once', async () => {
  const game = await setup(); assert.equal(game.eval("damageEnemy(actor,'fireball','#fff',3)"), true);
  assert.deepEqual(game.snapshot('[actor.health,actor.dead,score]'), [0,.4,50]);
  assert.equal(paint(game).state, 'cracked'); assert.equal(game.eval("damageEnemy(actor,'lightning')"), false);
});
test('walls and ledges reverse immediately and rooting preserves velocity without movement', async () => {
  for (const obstacle of ["grid[12][13]='#'", "grid[13][13]=' '"]) {
    const game = await setup();game.eval('actor.x=14*T;actor.vx=-40;' + obstacle);game.step();
    assert.equal(game.eval('actor.vx'),40);assert.deepEqual(paint(game).scale,[1,1]);
    const x=game.eval('actor.x');game.step();assert(game.eval('actor.x')>x);
  }
  const game = await setup();game.eval('actor.root=.2');const x=game.eval('actor.x');
  game.step(10);assert.equal(game.eval('actor.x'),x);assert.equal(game.eval('actor.vx'),-40);
  game.step(5);assert(game.eval('actor.x')<x);
});
test('other enemy renderers and all original level spawn lists remain intact', async () => {
  const on=await setup(),off=await setup({enabled:false});
  for(const type of ['walker','hopper','sentinel','nightwing','guardian']){
    on.eval('actor=createEnemy("'+type+'",300,300)');
    assert.equal(paint(on),null);
  }
  for(let level=0;level<6;level++){
    on.eval('startLevel('+level+')');off.eval('startLevel('+level+')');
    assert.deepEqual(on.snapshot('({grid,enemies,flag,start})'),off.snapshot('({grid,enemies,flag,start})'));
  }
});
test('feature ON/OFF has identical simulation and stored state through hits, root, defeat and menu return', async () => {
  const on=await setup(),off=await setup({enabled:false});
  for(let tick=0;tick<100;tick++){
    for(const g of [on,off]){
      if(tick===10)g.eval('actor.root=.2');
      if(tick===30||tick===60)g.eval("damageEnemy(actor,'fireball')");
      g.step();paint(g);
    }
    assert.deepEqual(on.snapshot('({pl,enemies,enemyCombat,score,levelScore,lives,progress,ability,timer})'),
      off.snapshot('({pl,enemies,enemyCombat,score,levelScore,lives,progress,ability,timer})'));
    assert.deepEqual([...on.storage],[...off.storage]);
  }
  on.eval("activateMenuAction('title')");off.eval("activateMenuAction('title')");
  assert.deepEqual([...on.storage],[...off.storage]);assert.equal(on.eval('score'),50);
});
