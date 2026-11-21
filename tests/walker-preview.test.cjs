'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createGame, onFlatGround } = require('./harness.cjs');
const { composeEmberPage, composeDevelopmentPage } = require('../scripts/ember-preview.cjs');

const root = path.resolve(__dirname, '..', 'dev', 'walker-b1');
const meta = JSON.parse(fs.readFileSync(path.join(root, 'strips_meta.json')));
const stripName = clip => 'walker_' + clip + '_strip_1x.png';
const lookup = Object.fromEntries(Object.keys(meta).map(clip => {
  const png = fs.readFileSync(path.join(root, stripName(clip)));
  return ['data:image/png;base64,' + png.toString('base64'), [clip, png.readUInt32BE(16), png.readUInt32BE(20)]];
}));

async function gameWithWalker(failure = '') {
  const imageStub = 'const knownStrips=' + JSON.stringify(lookup) + ';const decodeFailure=' + JSON.stringify(failure) + ';' +
    'globalThis.Image=class {set src(uri){ const [clip,w,h]=knownStrips[uri];this.clip=clip;this.naturalWidth=w;this.naturalHeight=h;' +
    'if(clip==="walk"&&decodeFailure==="size")this.naturalWidth++;queueLoad(this);}' +
    'decode(){return this.clip==="walk"&&decodeFailure==="decode"?Promise.reject(Error("fixture")):Promise.resolve();}};' +
    'function queueLoad(image){Promise.resolve().then(()=>image.onload());}';
  const html = composeDevelopmentPage({ walker: true }).toString().replace('<script>', () => '<script>' + imageStub);
  const game = onFlatGround(createGame({ html, saved: { coinhopper_character_v1: 'minty' } }));
  await new Promise(resolve => setImmediate(resolve));
  game.eval('globalThis.actor=createEnemy("walker",300,13*T-28);actor.ground=true;enemies=[actor];');
  game.eval('globalThis.sample=null;let anchor,facing;cx.translate=(x,y)=>{anchor=[x,y]};cx.scale=(x,y)=>{facing=[x,y]};' +
    'cx.drawImage=(image,...args)=>{if(image.clip)sample={clip:image.clip,frame:args[0]/44,anchor,facing,args}};');
  return game;
}

function paint(game) {
  game.eval('sample=null;drawEnemy(actor)');
  return game.snapshot('sample');
}
function tick(game, n = 1) { game.step(n); return paint(game); }

test('Walker defaults OFF and composes independently with the verified Ember and roster page', () => {
  assert.deepEqual(composeDevelopmentPage(), composeEmberPage());
  const previous = composeEmberPage({ enabled: true });
  assert.deepEqual(composeDevelopmentPage({ enabled: true, walker: false }), previous);
  assert.ok(composeDevelopmentPage({ walker: true }).includes('installWalkerB1('));
  assert.ok(!composeDevelopmentPage({ walker: true }).includes('installEmberV31('));
  assert.ok(composeDevelopmentPage({ enabled: true, walker: true }).includes('installRosterPicker('));
  const failures = [];
  assert.deepEqual(composeDevelopmentPage({ enabled: true, walker: true, walkerAssetRoot: path.join(root, 'missing'),
    onWalkerFallback: e => failures.push(e) }), previous);
  assert.equal(failures.length, 1);
});

test('a changed strip fails the release hash before any Walker code is included', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'coinhopper-walker-b1-'));
  const files = ['strips_meta.json', ...Object.keys(meta).map(stripName)];
  t.after(() => {
    for (const file of files) fs.rmSync(path.join(temp, file), { force: true });
    fs.rmdirSync(temp);
  });
  for (const file of files) fs.copyFileSync(path.join(root, file), path.join(temp, file));
  const target = path.join(temp, stripName('walk'));
  const damaged = fs.readFileSync(target); damaged[damaged.length - 1] ^= 1; fs.writeFileSync(target, damaged);
  const errors = [];
  assert.deepEqual(composeDevelopmentPage({ walker: true, walkerAssetRoot: temp, onWalkerFallback: e => errors.push(e.message) }),
    composeDevelopmentPage());
  assert.match(errors[0], /checksum mismatch.*walker_walk_strip/);
});

test('browser decode or dimension failure retains the original live and defeated Walker path', async () => {
  for (const failure of ['size', 'decode']) {
    const game = await gameWithWalker(failure);
    assert.equal(game.eval('walkerB1.status'), 'failed');
    assert.equal(tick(game), null);
    assert.equal(game.eval('actor.vx'), -55);
    assert.equal(game.eval("damageEnemy(actor, 'fireball')"), true);
    assert.equal(paint(game), null);
  }
});

test('grounded travel starts two transition frames then an eight-frame walk at the approved pivot', async () => {
  const game = await gameWithWalker();
  assert.equal(game.eval('walkerB1.status'), 'ready');
  const samples = Array.from({ length: 29 }, () => tick(game));
  assert.deepEqual(samples.slice(0, 12).map(s => [s.clip, s.frame]), Array.from({ length: 12 }, (_, i) => ['idle_to_walk', Math.floor(i / 6)]));
  assert.deepEqual(samples.slice(12).map(s => [s.clip, s.frame]), Array.from({ length: 17 }, (_, i) => ['walk', Math.floor(i / 2) % 8]));
  const last = samples.at(-1);
  assert.deepEqual(last.anchor, game.snapshot('[actor.x+14-cam,actor.y+28]'));
  assert.deepEqual(last.facing, [-1,1]);
  assert.deepEqual(last.args, [0,0,44,41,-21.5,-38.5,44,41]);
  assert.equal(game.eval('actor.w===28 && actor.h===28 && Math.abs(actor.x-(300-29*55*DT))<1e-7'),true);
  const before = game.snapshot('actor'); paint(game); paint(game);
  assert.deepEqual(game.snapshot('actor'),before);
  assert.deepEqual(paint(game),last);
});

test('a slow patrol advances from actual distance and a root with nonzero velocity settles into idle', async () => {
  const game = await gameWithWalker();
  tick(game,13);
  game.eval('actor.vx=-27.5');
  assert.equal(tick(game,3).frame,0); assert.equal(tick(game).frame,1);
  game.eval('actor.root=1;globalThis.fixedX=actor.x;');
  const stopped = Array.from({length:36},()=>tick(game));
  assert.deepEqual(stopped.map(s=>[s.clip,s.frame]), Array.from({length:36},(_,i)=>i<12?['walk_to_idle',Math.floor(i/6)]:['idle',Math.floor((i-12)/6)%4]));
  assert.equal(game.eval('actor.x===fixedX && actor.vx===-27.5'),true);
  game.eval('actor.root=DT');
  assert.equal(tick(game).clip,'idle'); // Its timer expires on this stationary tick.
  assert.equal(tick(game).clip,'idle_to_walk');
});

for (const obstacle of ['wall', 'ledge']) {
  test('a '+obstacle+' mirrors the sprite on the reversal tick with no turnaround pause', async () => {
    const game = await gameWithWalker();
    game.eval('actor.vx=55;');
    tick(game,14);
    game.eval(obstacle==='wall'?'actor.x=10*T-actor.w;grid[12][10]="#"':'actor.x=10*T-actor.w-1;grid[13][10]=" "');
    const x = game.eval('actor.x');
    const reverse = tick(game);
    assert.equal(game.eval('actor.vx'),-55);
    assert.deepEqual(reverse.facing,[-1,1]);
    assert.equal(reverse.clip,'walk');
    const turnX = game.eval('actor.x');
    if(obstacle==='wall')assert.equal(turnX,x);
    else assert.ok(turnX>x);
    assert.equal(tick(game).clip,'walk');
    assert.ok(game.eval('actor.x')<turnX);
  });
}

test('an airborne Walker holds neutral through horizontal travel and starts locomotion on contact', async () => {
  const game = await gameWithWalker();
  game.eval('actor.ground=false;actor.y-=50;actor.vx=55');
  let airborne = 0;
  while (!game.eval('actor.ground') && airborne < 60) {
    const sample=tick(game);
    if (!game.eval('actor.ground')) {
      assert.deepEqual([sample.clip,sample.frame,sample.facing[0]],['idle',0,1]);airborne++;
    }
  }
  assert.ok(airborne>6);assert.equal(paint(game).clip,'idle_to_walk');
});

test('a real stomp draws an illustrated squash and retains the original score, bounce and removal',async()=>{
  const game=await gameWithWalker();
  game.eval('pl.x=actor.x;pl.y=actor.y-pl.h-2;pl.vx=0;pl.vy=200;pl.ground=false;pl.buf=0;pl.coyote=0;');
  const first = tick(game);
  assert.equal(first.clip, 'idle');
  assert.deepEqual(first.facing, [-1, 1]);
  assert.deepEqual(game.snapshot('[actor.dead,pl.vy,score,levelScore,lives]'),[.4,-380,50,50,3]);
  game.step(26);assert.equal(game.eval('enemies.includes(actor)'),false);
  assert.equal(game.eval('score'),50);
});

test('other enemies keep their own live and death renderers and reduced motion uses the neutral pose',async()=>{
  const game=await gameWithWalker();
  for(const id of ['hopper','sentinel','nightwing','shellback','guardian']){
    game.eval("actor=createEnemy('"+id+"',260,350);");
    assert.equal(paint(game),null,id);
    game.eval('actor.dead=.4');
    assert.equal(paint(game),null,id);
  }
  game.eval('actor=createEnemy("walker",300,13*T-28);actor.type="walker";actor.vx=55;actor.ground=true;enemies=[actor];visualSettings.reduced=true');
  const sample=tick(game,20);assert.deepEqual([sample.clip,sample.frame,sample.facing[0]],['idle',0,1]);
});

for (const face of [-1, 1]) {
  test('death holds the last painted walk cell around the original foot pivot, facing ' + face, async () => {
    const game = await gameWithWalker();
    game.eval('actor.vx=' + (face * 55));
    const live = tick(game, 22);
    assert.equal(live.clip, 'walk');
    assert.ok(live.frame > 0);
    game.step(3); // Updates can advance the gait between two visible frames.
    assert.equal(game.eval("damageEnemy(actor, 'lightning')"), true);
    const foot = game.snapshot('[actor.x + actor.w / 2, actor.y + actor.h]');
    let priorHeight = 1;
    for (let i = 0; game.eval('enemies.includes(actor)') && i < 30; i++) {
      game.eval('cam=17.5');
      const dead = paint(game);
      assert.equal(dead.clip, live.clip);
      assert.equal(dead.frame, live.frame);
      assert.deepEqual(dead.args, live.args);
      assert.deepEqual(dead.anchor, [foot[0] - 17.5, foot[1]]);
      assert.equal(Math.sign(dead.facing[0]), face);
      assert.ok(dead.facing[1] <= priorHeight && dead.facing[1] >= 0.56 - 1e-10);
      if (i >= 6) assert.ok(Math.abs(dead.facing[1] - 0.56) < 1e-10);
      priorHeight = dead.facing[1];
      assert.deepEqual(paint(game), dead, 'extra paints do not advance the pose or timer');
      game.step();
    }
    assert.ok(priorHeight < 0.57);
    assert.equal(game.eval('enemies.includes(actor)'), false);
    assert.equal(paint(game), null);
  });
}

test('an airborne hit holds the illustrated flight pose at the airborne foot position', async () => {
  const game = await gameWithWalker();
  game.eval('actor.vx=55;actor.ground=false;actor.y-=100');
  const live = tick(game, 3);
  assert.deepEqual([live.clip, live.frame, live.facing[0]], ['idle', 0, 1]);
  game.eval("damageEnemy(actor, 'fireball')");
  const held = tick(game, 12);
  assert.deepEqual(held.anchor, live.anchor);
  assert.deepEqual(held.args, live.args);
  assert.ok(held.facing[1] < 1);
});

test('reduced motion holds one static, foot-anchored squash through death', async () => {
  const game = await gameWithWalker();
  game.eval('visualSettings.reduced=true;actor.root=1');
  const live = tick(game, 9);
  game.eval("damageEnemy(actor, 'slam')");
  const held = paint(game);
  assert.deepEqual(held.args, live.args);
  assert.deepEqual(held.anchor, live.anchor);
  assert.deepEqual(held.facing, [-1.0875, 0.75]);
  assert.deepEqual(tick(game, 8), held);
  assert.deepEqual(tick(game, 13), held);
});

test('a stomp on the wall-reversal tick faces the resolved direction and preserves the visible cell', async () => {
  const game = await gameWithWalker();
  game.eval('actor.vx=55');
  const live = tick(game, 18);
  game.eval('grid[12][10]="#";actor.x=10*T-actor.w;pl.x=actor.x;pl.y=actor.y-pl.h-2;pl.vy=200;pl.ground=false;pl.inv=0');
  const dead = tick(game);
  assert.deepEqual(game.snapshot('[actor.vx,actor.dead,pl.vy,score]'),[-55,0.4,-380,50]);
  assert.deepEqual(dead.args, live.args);
  assert.deepEqual(dead.facing, [-1, 1]);
});
