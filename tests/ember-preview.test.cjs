'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createGame, onFlatGround } = require('./harness.cjs');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const characterKey = 'coinhopper_character_v1';
const simulation = `({
  pl, state, lvl, cam, timer, time, score, levelScore, lives, best, progress,
  grid, flag, checkpoint, coins, shields, highJumps, coreItems, coreShots,
  keys, jumpEdge, abilityEdge, enemies, enemyCombat, bossState, ability
})`;

function controls(game, ...actions) {
  for (const [type, code] of actions) game.event(type, { code });
}

const down = code => ['keydown', code];
const up = code => ['keyup', code];

function prepare(game) {
  onFlatGround(game);
  game.eval(`
    grid[12][9] = '#';
    shields = []; highJumps = []; coreItems = [];
    // Seed presentation particles identically in both VM contexts.
    let testSeed = 2166136261;
    Math.random = () => {
      testSeed = (Math.imul(testSeed, 1664525) + 1013904223) >>> 0;
      return testSeed / 4294967296;
    };
  `);
}

function frameSnapshot(game) {
  return {
    simulation: game.snapshot(simulation),
    saves: [...game.storage.entries()]
  };
}

function moveReplay() {
  return [
    [1, 'idle'],
    [6, 'acceleration', down('ArrowRight')],
    [46, 'run right and contact wall'],
    [5, 'wall still held'],
    [6, 'accelerate left', up('ArrowRight'), down('ArrowLeft')],
    [13, 'full-speed left'],
    [6, 'reverse at speed', up('ArrowLeft'), down('ArrowRight')],
    [10, 'right after reversal'],
    [12, 'deceleration and idle', up('ArrowRight')],
    [1, 'takeoff', down('Space')],
    [25, 'rise, apex and fall'],
    [30, 'landing and recovery', up('Space')],
    [18, 'idle after landing'],
  ];
}

function replay(games, sequence, observe = () => {}) {
  let tick = 0;
  for (const [count, label, ...actions] of sequence) {
    for (const game of games) controls(game, ...actions);
    for (let step = 0; step < count; step++) {
      tick++;
      for (const game of games) {
        game.step();
        game.eval('draw()');
      }
      if (games.length === 2) assert.deepEqual(
        frameSnapshot(games[1]), frameSnapshot(games[0]), `${label}, tick ${tick}`
      );
      observe(games.at(-1), label, step, tick);
    }
  }
}

function placeTarget(game) {
  game.eval(`
    pl.x = 145;
    pl.face = 1;
    enemies = [createEnemy('walker', pl.x + 100, 440)];
    enemies[0].vx = 0; enemies[0].root = 99;
  `);
}

function castReplay() {
  return [
    [1, 'tap release', down('KeyE'), up('KeyE')],
    [24, 'tap projectile impact'],
    [180, 'cooldown and idle'],
    [73, 'charge hold', down('KeyE')],
    [1, 'charged release', up('KeyE')],
    [25, 'charged projectile impact'],
    [30, 'cast recovery'],
  ];
}

// The harness executes the single inline script in a browser-shaped VM. Stub
// only image decoding and read dimensions from the actual supplied PNG bytes.
// The composed game, tick observer, asset selection and paint path are intact.
function imagePrelude(failure) {
  return `
    globalThis.previewImageLoads = [];
    globalThis.previewImageCallbacks = [];
    globalThis.previewDecodeCallbacks = [];
    const previewDecodeOutcome = ${JSON.stringify(failure)};
    globalThis.Image = class PreviewImage {
      constructor() {
        if (previewDecodeOutcome === 'deferred-decode') {
          this.decode = () => new Promise((resolve, reject) => previewDecodeCallbacks.push({ resolve, reject }));
        }
      }
      set src(uri) {
        const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const encoded = uri.slice('data:image/png;base64,'.length);
        const bytes = [];
        for(let i = 0; i < 32; i += 4) {
          const word = (base64.indexOf(encoded[i]) << 18) |
            (base64.indexOf(encoded[i + 1]) << 12) |
            (base64.indexOf(encoded[i + 2]) << 6) | base64.indexOf(encoded[i + 3]);
          bytes.push((word >>> 16) & 255, (word >>> 8) & 255, word & 255);
        }
        const read32 = i => bytes[i] * 16777216 + bytes[i + 1] * 65536 + bytes[i + 2] * 256 + bytes[i + 3];
        this.naturalWidth = read32(16);
        this.naturalHeight = read32(20);
        const first = globalThis.previewImageLoads.length === 0;
        globalThis.previewImageLoads.push([this.naturalWidth, this.naturalHeight]);
        if (first && previewDecodeOutcome === 'size') this.naturalWidth++;
        const complete = () => {
          this.complete = true;
          if (first && (previewDecodeOutcome === 'decode' || previewDecodeOutcome === 'delayed-error')) this.onerror?.();
          else this.onload?.();
        };
        if (previewDecodeOutcome === 'delayed' || previewDecodeOutcome === 'delayed-error') {
          globalThis.previewImageCallbacks.push(complete);
        }
        else Promise.resolve().then(complete);
      }
    };
  `;
}

function originalPage() {
  return fs.readFileSync(indexPath);
}

function previewFixture({ enabled = false, failure = null, id = 'ember', assetRoot } = {}) {
  const { composeEmberPage } = require('../scripts/ember-preview.cjs');
  const page = composeEmberPage({ enabled, assetRoot }).toString('utf8');
  const html = page.replace('<script>', '<script>' + imagePrelude(failure));
  return createGame({ html, saved: { [characterKey]: id } });
}

async function createPreviewGame(options) {
  const game = previewFixture(options);
  // Let image event promises and consequent aggregate load promises settle.
  await new Promise(resolve => setImmediate(resolve));
  prepare(game);
  game.step();
  game.eval('draw()');
  return game;
}

function visual(game) {
  return game.snapshot('globalThis.emberV31.snapshot()');
}

function enterRun(game, character = 'ember') {
  game.click('Play');
  game.click('character-' + character);
  game.click('Start game');
  assert.equal(game.eval('state'), 'play');
  assert.equal(game.eval('pl.character'), character);
}

function startControl(game) {
  return game.element('menu-actions').firstElementChild;
}

test('the opt-in sprite fits at the left world edge and returns smoothly to its foot anchor', async () => {
  const game = await createPreviewGame({ enabled: true });
  controls(game, down('ArrowLeft'));
  game.step(60);
  assert.equal(game.eval('pl.x'), 0);
  game.eval(`
    globalThis.edgeAnchor = [];
    cx.translate = (x, y) => { edgeAnchor = [x, y]; };
  `);
  function measure(x, camera) {
    game.eval(`pl.x = ${x}; cam = ${camera}; drawPlayer()`);
    const [anchorX, anchorY] = game.snapshot('edgeAnchor');
    assert.equal(anchorY, game.eval('pl.y + pl.h'));
    assert.equal(visual(game).source, 'sprite');
    assert.equal(game.eval('pl.x'), x);
    assert.equal(game.eval('cam'), camera);
    return anchorX + camera;
  }
  const wall = measure(0, 0);
  assert.ok(wall >= 48 - 12.94, 'full mirrored run cell clears x=0, even at its widest');
  let prior = wall;
  for (let x = 1; x <= 50; x++) {
    const next = measure(x, 0);
    assert.ok(next > prior && next - prior <= 1.000001, 'drawing moves monotonically as the collider leaves the wall');
    prior = next;
  }
  assert.equal(prior, 63);
  assert.equal(measure(400, 395), 413, 'a viewport edge in mid-level does not activate wall clearance');
  assert.deepEqual(game.snapshot('[pl.w,pl.h]'), [26, 32]);
});

function watchAtlasDraws(game) {
  game.eval(`
    globalThis.firstDrawCalls = [];
    const paintImage = cx.drawImage;
    cx.drawImage = (image, ...args) => {
      if (image instanceof Image) globalThis.firstDrawCalls.push(args);
      return paintImage.call(cx, image, ...args);
    };
  `);
}

function assertEmberSpawnDraw(game, reason) {
  const before = frameSnapshot(game);
  assert.equal(before.simulation.pl.inv, 1, reason);
  game.eval('firstDrawCalls.length = 0; draw()');
  const sample = visual(game);
  assert.equal(sample.ready, true, reason);
  assert.equal(sample.source, 'sprite', reason);
  assert.equal(sample.clip, 'idle', reason);
  assert.equal(sample.index, 0, reason);
  assert.equal(game.eval('firstDrawCalls.length'), 1, reason);
  assert.deepEqual(frameSnapshot(game), before, 'painting a fresh spawn cannot advance physics or saves');
}

test('default and explicit OFF serve the original bytes, and missing opted-in assets fall back', () => {
  const { composeEmberPage } = require('../scripts/ember-preview.cjs');
  const warnings = [];
  const unusedRoot = path.join(root, 'no-ember-assets-in-this-test');
  assert.deepEqual(composeEmberPage(), originalPage());
  assert.deepEqual(composeEmberPage({ enabled: false, assetRoot: unusedRoot,
    onFallback: detail => warnings.push(detail) }), originalPage());
  assert.deepEqual(warnings, [], 'OFF must not attempt to load the archive assets');
  assert.deepEqual(composeEmberPage({ enabled: true, assetRoot: unusedRoot,
    onFallback: detail => warnings.push(detail) }), originalPage());
  assert.equal(warnings.length, 1);
});

test('an altered strip cannot bypass checksum validation', t => {
  const { composeEmberPage } = require('../scripts/ember-preview.cjs');
  const assetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coin-hopper-ember-test-'));
  const manifestPath = path.join(assetRoot, 'manifest.json');
  const idlePath = path.join(assetRoot, 'ember_idle_strip_1x.png');
  t.after(() => {
    for (const file of [manifestPath, idlePath]) fs.rmSync(file, { force: true });
    fs.rmdirSync(assetRoot);
  });
  const suppliedAssets = path.join(root, 'dev', 'ember-v31');
  fs.copyFileSync(path.join(suppliedAssets, 'manifest.json'), manifestPath);
  const changed = fs.readFileSync(path.join(suppliedAssets, 'ember_idle_strip_1x.png'));
  changed[changed.length - 1] ^= 1;
  fs.writeFileSync(idlePath, changed);
  const warnings = [];
  assert.deepEqual(composeEmberPage({ enabled: true, assetRoot, onFallback: error => warnings.push(error) }), originalPage());
  assert.equal(warnings.length, 1);
  assert.match(warnings[0].message, /strip failed validation/);
});

test('the actual ON page loads exactly the four native locomotion strips; OFF loads none', async () => {
  const off = await createPreviewGame();
  assert.deepEqual(off.snapshot('globalThis.previewImageLoads'), []);
  assert.equal(off.eval('typeof globalThis.emberV31'), 'undefined');
  const on = await createPreviewGame({ enabled: true });
  assert.deepEqual(on.snapshot('globalThis.previewImageLoads').sort(),
    [[172, 61], [192, 61], [364, 66], [768, 67]].sort());
  assert.deepEqual(
    (({ ready, failed, source, clip }) => ({ ready, failed, source, clip }))(visual(on)),
    { ready: true, failed: false, source: 'sprite', clip: 'idle' }
  );
  const other = await createPreviewGame({ enabled: true, id: 'nova' });
  assert.equal(visual(other).source, 'procedural');
});

test('an image error or wrong decoded dimensions restores the procedural renderer', async () => {
  for (const failure of ['decode', 'size']) {
    const game = await createPreviewGame({ enabled: true, failure });
    const { ready, failed, source } = visual(game);
    assert.deepEqual({ ready, failed, source }, { ready: false, failed: true, source: 'procedural' }, failure);
    assert.equal(game.eval('pl.character'), 'ember');
  }
});

test('the first Ember gameplay paint uses the atlas before the first simulation update', async () => {
  const game = previewFixture({ enabled: true, id: 'hopper' });
  await new Promise(resolve => setImmediate(resolve));
  watchAtlasDraws(game);
  enterRun(game);
  assert.equal(game.eval('time'), 0);
  assert.equal(game.eval('pl.ground'), false, 'the original spawn still needs its first ground update');
  assertEmberSpawnDraw(game, 'initial start');
  replay([game], [[4, 'initial four-pixel floor settle']], game => {
    assert.equal(visual(game).source, 'sprite');
    assert.equal(visual(game).clip, 'idle', 'settling onto the spawn floor is not a player landing');
  });
  assert.equal(game.eval('pl.ground && pl.landTime > 0 && pl.inv > 0'), true);
  replay([game], [[1, 'first move under spawn immunity', down('ArrowRight')]]);
  assert.equal(game.eval('pl.inv > 0'), true);
  assert.equal(visual(game).clip, 'runstart');
});

test('while decoding, only Ember waits in the chooser and all four strips unlock its first sprite paint', () => {
  const game = previewFixture({ enabled: true, failure: 'delayed' });
  watchAtlasDraws(game);
  game.click('Play');
  const before = [...game.storage.entries()];
  assert.equal(visual(game).ready, false);
  assert.equal(startControl(game).disabled, true);
  assert.match(startControl(game).textContent, /Loading Ember artwork/);
  startControl(game).click();
  game.eval("activateMenuAction('start-character')");
  assert.equal(game.eval('state'), 'characters');
  assert.equal(game.eval('typeof pl'), 'undefined');
  assert.deepEqual([...game.storage.entries()], before);

  game.click('character-nova');
  assert.equal(startControl(game).disabled, false, 'other heroes can still start');
  game.click('character-ember');
  assert.equal(startControl(game).disabled, true);

  game.eval('previewImageCallbacks.splice(0, 3).forEach(complete => complete())');
  assert.equal(visual(game).ready, false);
  assert.equal(startControl(game).disabled, true, 'partial readiness cannot expose a mixed renderer');
  game.eval('previewImageCallbacks.shift()()');
  assert.equal(visual(game).ready, true);
  assert.equal(startControl(game).disabled, false);
  game.click('Start game');
  assert.equal(game.eval('state'), 'play');
  assertEmberSpawnDraw(game, 'first start after delayed decoding');
});

test('a late decode error releases the cold chooser gate without starting or changing a saved game', () => {
  const game = previewFixture({ enabled: true, failure: 'delayed-error' });
  watchAtlasDraws(game);
  game.click('Play');
  const before = [...game.storage.entries()];
  assert.equal(startControl(game).disabled, true);
  game.eval('previewImageCallbacks.shift()()');
  assert.equal(visual(game).failed, true);
  assert.equal(startControl(game).disabled, false);
  assert.equal(game.eval('state'), 'characters', 'fallback still needs the original start action');
  assert.deepEqual([...game.storage.entries()], before);
  game.click('Start game');
  assert.equal(game.eval('state'), 'play');
  assert.equal(game.eval('pl.character'), 'ember');
  game.eval('draw()');
  assert.equal(visual(game).source, 'procedural');
  assert.equal(game.eval('firstDrawCalls.length'), 0);
});

test('browser decode promises settle before Ember is startable and a rejected decode allows fallback', async () => {
  for (const rejects of [false, true]) {
    const game = previewFixture({ enabled: true, failure: 'deferred-decode' });
    await new Promise(resolve => setImmediate(resolve));
    game.click('Play');
    assert.equal(game.eval('previewDecodeCallbacks.length'), 4);
    assert.equal(visual(game).ready, false);
    assert.equal(startControl(game).disabled, true);
    if (rejects) {
      game.eval("previewDecodeCallbacks.shift().reject(new Error('fixture decode rejected'))");
    }
    game.eval('previewDecodeCallbacks.splice(0).forEach(({ resolve }) => resolve())');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(visual(game).ready, !rejects);
    assert.equal(visual(game).failed, rejects);
    assert.equal(startControl(game).disabled, false);
    watchAtlasDraws(game);
    game.click('Start game');
    game.eval('draw()');
    assert.equal(visual(game).source, rejects ? 'procedural' : 'sprite');
    assert.equal(game.eval('firstDrawCalls.length'), rejects ? 0 : 1);
  }
});

test('restart and a pit death each paint the new Ember on their first gameplay frame', async () => {
  const game = previewFixture({ enabled: true });
  await new Promise(resolve => setImmediate(resolve));
  watchAtlasDraws(game);
  enterRun(game);
  replay([game], [[12, 'travel away from spawn', down('ArrowRight')]]);
  assert.ok(visual(game).distance > 0);
  game.eval('globalThis.previousPlayer = pl');
  game.click('pause-button');
  game.click('Restart level');
  game.click('Restart level');
  assert.equal(game.eval('pl !== previousPlayer'), true);
  assert.equal(game.eval('timer'), 0, 'draw precondition is the restart before updates resume');
  assertEmberSpawnDraw(game, 'restart');
  assert.equal(visual(game).distance, 0);

  replay([game], [[12, 'travel from restart', down('ArrowRight')]]);
  assert.ok(visual(game).distance > 0);
  game.eval('globalThis.previousPlayer = pl; pl.y = ROWS * T + 60');
  const livesBefore = game.eval('lives');
  game.step();
  assert.equal(game.eval('lives'), livesBefore - 1);
  assert.equal(game.eval('pl !== previousPlayer'), true);
  assertEmberSpawnDraw(game, 'pit respawn');
  assert.equal(visual(game).distance, 0);
});

test('shield impact paints the approved squash, keeps protection, and recovers to idle', async () => {
  const game = await createPreviewGame({ enabled: true });
  watchAtlasDraws(game);
  const livesBefore = game.eval('lives');
  game.eval(`
    globalThis.previousPlayer = pl;
    pl.shield = true;
    enemies = [createEnemy('walker', pl.x, pl.y + 4)];
    enemies[0].vx = 0;
    enemies[0].root = 99;
  `);
  game.step();
  assert.equal(game.eval('lives'), livesBefore);
  assert.equal(game.eval('pl === previousPlayer'), true);
  assert.equal(game.eval('pl.shield'), false, 'the actual contact consumed the shield');
  assert.equal(game.eval('pl.inv'), 1, 'the original hurt invulnerability is active');
  game.eval('firstDrawCalls.length = 0; draw()');
  assert.equal(visual(game).source, 'sprite');
  assert.equal(visual(game).clip, 'jump');
  assert.equal(visual(game).index, 5);
  assert.equal(game.eval('firstDrawCalls.length'), 1);
  game.eval('enemies = []');
  replay([game], [[61, 'recover from the actual hit']]);
  assert.equal(visual(game).source, 'sprite');
  assert.equal(visual(game).clip, 'idle');
});

test('missing server assets and failed browser decoding both allow Ember to start procedurally', async () => {
  for (const options of [
    { assetRoot: path.join(root, 'no-ember-assets-in-this-test') },
    { failure: 'decode' }
  ]) {
    const game = previewFixture({ enabled: true, ...options });
    await new Promise(resolve => setImmediate(resolve));
    watchAtlasDraws(game);
    enterRun(game);
    game.eval('draw()');
    assert.equal(game.eval('firstDrawCalls.length'), 0);
    if (options.failure) {
      assert.equal(visual(game).failed, true);
      assert.equal(visual(game).source, 'procedural');
    } else {
      assert.equal(game.eval('typeof globalThis.emberV31'), 'undefined');
      assert.deepEqual(game.snapshot('globalThis.previewImageLoads'), []);
    }
    controls(game, down('KeyE'));
    game.eval('drawPlayer()');
    controls(game, up('KeyE'));
    game.step();
    game.eval('drawPlayer()');
    assert.equal(game.eval('ability.projectiles.length'), 1);
    assert.equal(game.eval('firstDrawCalls.length'), 0, 'failed artwork stays procedural during Fireball');
  }
});

test('recorded Ember inputs keep simulation, saves, and real Fireball outcomes identical OFF and ON', async () => {
  const off = await createPreviewGame();
  const on = await createPreviewGame({ enabled: true });
  const games = [off, on];
  const usedClips = new Set();
  let tick = 0;
  replay(games, moveReplay(), (game, label, step) => {
    const sample = visual(game);
    if (sample.source === 'sprite') usedClips.add(sample.clip);
    if (label === 'takeoff') {
      assert.equal(game.eval('pl.ground'), false);
      assert.equal(game.eval('pl.vy'), -610);
    }
    if (label === 'wall still held') assert.equal(game.eval('pl.x'), 298);
    if (label === 'full-speed left') {
      assert.equal(game.eval('pl.vx'), -260);
      assert.equal(sample.face, -1);
    }
    if (label === 'right after reversal' && step === 9) assert.equal(game.eval('pl.vx'), 260);
    tick++;
  });
  assert.deepEqual([...usedClips].sort(), ['idle', 'jump', 'run', 'runstart']);
  assert.equal(visual(on).clip, 'idle');
  for (const game of games) placeTarget(game);
  const projectileFrames = [];
  replay(games, castReplay(), (game, label, step) => {
    if (label === 'tap release' || label === 'charged release') {
      const shots = game.snapshot('ability.projectiles');
      assert.equal(shots.length, 1);
      assert.equal(shots[0].vx, 420);
      assert.equal(shots[0].damage, label === 'tap release' ? 1 : 3);
      assert.equal(visual(game).source, 'sprite');
      projectileFrames.push(shots[0]);
    }
    if (label === 'charge hold') {
      if (step === 0) for (const item of games) placeTarget(item);
      assert.equal(visual(game).source, 'sprite');
    }
    if (label === 'cast recovery' && step === 29) assert.equal(visual(game).clip, 'idle');
    tick++;
  });
  assert.equal(projectileFrames.length, 2);
  assert.equal(on.eval('score'), 100, 'both live projectile hit rewards are exercised');
  assert.equal(on.storage.get(characterKey), 'ember');
  assert.equal(tick, 513, 'the full deterministic input trace was compared');
});

test('Fireball paints grounded charge, queued release and recovery holds on the original input ticks', async () => {
  const game = await createPreviewGame({ enabled: true });
  watchAtlasDraws(game);
  function assertHold(index) {
    const before = frameSnapshot(game);
    game.eval('firstDrawCalls.length = 0; drawPlayer()');
    assert.equal(visual(game).source, 'sprite');
    assert.equal(visual(game).clip, 'runstart');
    assert.equal(visual(game).index, index);
    assert.deepEqual(game.snapshot('firstDrawCalls'), [
      [index * 48, 0, 48, 61, -13.94, -57.84, 48, 61]
    ]);
    assert.deepEqual(frameSnapshot(game), before);
  }

  controls(game, down('KeyE'));
  assertHold(0);
  game.step(95);
  assert.equal(game.eval('ability.charge'), 1.2);
  assertHold(0);
  controls(game, up('KeyE'));
  assertHold(2);
  assert.equal(game.eval('ability.projectiles.length'), 0);
  game.step();
  assertHold(2);
  assert.deepEqual(game.snapshot('ability.projectiles.map(p => [p.vx, p.damage])'), [[420, 3]]);
  game.step(8);
  assertHold(1);
  game.step(6);
  game.eval('drawPlayer()');
  assert.equal(visual(game).clip, 'idle');
});

test('Fireball keeps approved airborne travel through a grounded charge, takeoff, release and landing', async () => {
  const off = await createPreviewGame();
  const on = await createPreviewGame({ enabled: true });
  const flightFrames = new Set();
  replay([off, on], [
    [4, 'grounded charge', down('KeyE')],
    [8, 'jump during charge', down('Space')],
    [1, 'airborne release', up('KeyE')],
    [8, 'airborne recovery'],
    [59, 'land and settle', up('Space')]
  ], (game, label, step) => {
    const painted = visual(game);
    assert.equal(painted.source, 'sprite');
    if (!game.eval('pl.ground')) {
      assert.equal(painted.clip, 'jump');
      assert.ok(painted.index >= 1 && painted.index <= 4);
      flightFrames.add(painted.index);
    }
    if (label === 'jump during charge' && step === 0) assert.equal(game.eval('pl.vy'), -610);
    if (label === 'airborne release') assert.equal(game.eval('ability.projectiles.length'), 1);
  });
  assert.deepEqual([...flightFrames].sort(), [1, 2, 3, 4]);
  assert.equal(visual(on).clip, 'idle');
});

test('a reversing cast faces the projectile and left-wall casting preserves native cell clearance', async () => {
  const game = await createPreviewGame({ enabled: true });
  replay([game], [
    [10, 'run right', down('ArrowRight')],
    [1, 'reverse and charge', up('ArrowRight'), down('ArrowLeft'), down('KeyE')]
  ]);
  assert.ok(game.eval('pl.vx > 0'));
  assert.equal(visual(game).clip, 'run');
  assert.equal(visual(game).face, -1);
  replay([game], [[1, 'release while braking', up('KeyE')]]);
  assert.equal(game.eval('ability.projectiles[0].vx'), -420);
  assert.equal(visual(game).face, -1);

  replay([game], [[200, 'continue to boundary and recharge'], [1, 'charge at wall', down('KeyE')]]);
  assert.equal(game.eval('pl.x'), 0);
  assert.equal(visual(game).index, 0);
  controls(game, up('KeyE'));
  game.eval('globalThis.wallAnchor = null; cx.translate = (x, y) => { wallAnchor = x; }; drawPlayer()');
  assert.equal(visual(game).clip, 'runstart');
  assert.equal(visual(game).index, 2);
  assert.equal(visual(game).face, -1);
  assert.ok(game.eval('wallAnchor') >= 48 - 13.94);
});

test('real airborne Core damage preserves the sprite, immunity, reduced motion and the OFF simulation', async () => {
  const off = await createPreviewGame();
  const on = await createPreviewGame({ enabled: true });
  const games = [off, on];
  replay(games, [[8, 'rise', down('Space')]]);
  for (const game of games) {
    game.eval(`
      visualSettings.reduced = true;
      pl.core = { ammo: 6, cooldown: 0 };
      enemies = [createEnemy('walker', pl.x, pl.y + 4)];
      enemies[0].vx = 0;
      enemies[0].root = 99;
    `);
  }
  replay(games, [[1, 'Core contact']], game => {
    assert.equal(game.eval('pl.core'), null);
    assert.equal(game.eval('pl.inv'), 1);
    assert.equal(game.eval('lives'), 3);
    assert.equal(game.eval('pl.ground'), false);
    assert.equal(visual(game).clip, 'jump');
    assert.equal(visual(game).index, 2);
  });
  replay(games, [[10, 'contact during immunity', up('Space')]]);
  assert.equal(on.eval('lives'), 3);
  for (const game of games) game.eval('enemies = []');
  replay(games, [[65, 'protected flight, landing and recovery']], game => {
    assert.equal(visual(game).source, 'sprite');
  });
  assert.ok(on.eval('pl.inv <= 0 && pl.ground'));
  assert.equal(visual(on).clip, 'idle');
});

test('idle loops, four authored run-start ticks join run_11, and wall contact stops phase travel', async () => {
  const game = await createPreviewGame({ enabled: true });
  const idleFrames = [];
  replay([game], [[32, 'idle']], game => {
    const pose = visual(game);
    assert.equal(pose.clip, 'idle');
    idleFrames.push(pose.index);
  });
  assert.deepEqual([...new Set(idleFrames)], [0, 1, 2, 3]);
  assert.equal(idleFrames.at(-1), 0, 'four frames at 8fps wrap after a nominal half second');

  const fromRest = [];
  replay([game], [[5, 'four run-start frames and entry', down('ArrowRight')]], game => {
    const { clip, index } = visual(game);
    fromRest.push([clip, index]);
  });
  assert.deepEqual(fromRest, [
    ['runstart', 0], ['runstart', 1], ['runstart', 2], ['runstart', 3], ['run', 11]
  ]);

  replay([game], [[1, 'reach cap']]);
  assert.equal(game.eval('pl.vx'), 260);
  const indices = [visual(game).index];
  replay([game], [[16, 'one full-speed gait cycle']], game => {
    assert.equal(visual(game).clip, 'run');
    indices.push(visual(game).index);
  });
  assert.equal(new Set(indices.slice(0, 16)).size, 16);
  assert.equal(indices[0], indices.at(-1), 'one atlas loop matches sixteen full-speed physics ticks');

  replay([game], [[42, 'run into a wall']]);
  const wall = visual(game);
  assert.equal(game.eval('pl.x'), 298);
  assert.equal(game.eval('pl.vx'), 0);
  replay([game], [[12, 'continue holding the wall direction']], game => {
    const sample = visual(game);
    assert.equal(sample.distance, wall.distance);
    assert.notEqual(sample.clip, 'runstart');
    if (sample.clip === 'run') assert.equal(sample.index, wall.index);
  });
});

test('jump starts on the input tick and the authored landing hold releases into idle or new movement', async () => {
  const game = await createPreviewGame({ enabled: true });
  function jumpToImpact() {
    const frames = [];
    replay([game], [[1, 'takeoff', down('Space')], [19, 'held rise'], [1, 'release', up('Space')]], game => {
      const pose = visual(game);
      assert.equal(pose.clip, 'jump');
      frames.push(pose.index);
    });
    assert.ok([1, 2].includes(frames[0]), 'the anticipation cel does not block takeoff');
    assert.equal(game.eval('pl.ground'), false);
    for (let i = 0; i < 60 && !game.eval('pl.ground'); i++) {
      replay([game], [[1, 'flight until contact']], game => frames.push(visual(game).index));
    }
    assert.ok(frames.includes(4), 'fall cel was shown');
    assert.equal(game.eval('pl.ground'), true);
    assert.equal(visual(game).index, 5, 'landing cel starts on resolved ground contact');
  }
  jumpToImpact();
  const landed = [visual(game).index];
  replay([game], [[24, 'landing hold and settle']], game => landed.push(visual(game).index));
  assert.deepEqual(landed.slice(0, 12), Array(12).fill(5), 'the 200ms hold uses twelve fixed steps');
  assert.deepEqual(landed.slice(12, 18), Array(6).fill(6), 'the 100ms settle cel uses six fixed steps');
  assert.equal(visual(game).clip, 'idle');
  jumpToImpact();
  const startX = game.eval('pl.x');
  replay([game], [[1, 'move during landing hold', down('ArrowRight')]]);
  assert.ok(game.eval('pl.x') > startX && game.eval('pl.vx') > 0);
  assert.notEqual(visual(game).clip, 'jump');
});

test('decelerating gait advances by resolved world distance and settles into idle', async () => {
  const game = await createPreviewGame({ enabled: true });
  replay([game], [[5, 'initial run start', down('ArrowRight')]]);
  const entryX = game.eval('pl.x');
  assert.equal(visual(game).index, 11);
  replay([game], [[17, 'run before releasing movement']]);
  let lastX = game.eval('pl.x');
  let lastIndex = visual(game).index;
  let workedAtSubCap = false;
  let repeatedFrames = 0;
  replay([game], [[9, 'decelerate', up('ArrowRight')]], game => {
    const { clip, index } = visual(game);
    const { x, vx } = game.snapshot('pl');
    if (x > lastX) {
      assert.ok(vx > 0 && vx < 260);
      const traveledFrames = Math.floor((x - entryX) / (260 / 60) + 1e-7);
      assert.equal(clip, 'run');
      assert.equal(index, (11 + traveledFrames) % 16);
      if (index === lastIndex) repeatedFrames++;
      workedAtSubCap = true;
    } else {
      assert.equal(vx, 0);
      assert.equal(clip, 'runstart', 'the game is stationary while the sprite settles');
    }
    lastX = x;
    lastIndex = index;
  });
  assert.equal(workedAtSubCap, true);
  assert.ok(repeatedFrames > 0, 'slow steps do not unconditionally advance the atlas by one frame');
  replay([game], [[8, 'finish cosmetic stop']]);
  assert.equal(visual(game).clip, 'idle');
});

test('stationary Ember retraces existing approach poses, with immediate interruption by movement or takeoff', async () => {
  const game = await createPreviewGame({ enabled: true });
  function sprintThenStop(direction) {
    const key = direction === 1 ? 'ArrowRight' : 'ArrowLeft';
    replay([game], [[15, 'build speed', down(key)]]);
    controls(game, up(key));
    for (let i = 0; i < 10 && game.eval('pl.vx') !== 0; i++) replay([game], [[1, 'brake']]);
    assert.equal(game.eval('pl.vx'), 0);
    const start = visual(game);
    assert.equal(start.clip, 'runstart');
    assert.equal(start.face, direction);
    return start.index;
  }
  for (const direction of [1, -1]) {
    const index = sprintThenStop(direction);
    const stopX = game.eval('pl.x');
    for (let tick = 1; tick <= 2 * (index + 1); tick++) {
      replay([game], [[1, 'stationary recover']]);
      const sample = visual(game);
      assert.equal(game.eval('pl.x'), stopX);
      const expected = index - Math.floor(tick / 2);
      assert.equal(sample.clip, expected < 0 ? 'idle' : 'runstart');
      if (expected >= 0) assert.equal(sample.index, expected);
    }
  }
  sprintThenStop(1);
  replay([game], [[1, 'new movement immediately interrupts stop', down('ArrowLeft')]]);
  assert.ok(game.eval('pl.vx') < 0);
  assert.equal(visual(game).face, -1);
  assert.equal(visual(game).index, 0);
  replay([game], [[2, 'short tap stopping', up('ArrowLeft')]]);
  assert.equal(game.eval('pl.vx'), 0);
  assert.equal(visual(game).clip, 'runstart');
  replay([game], [[1, 'jump immediately interrupts stop', down('Space')]]);
  assert.ok(game.eval('pl.vy') < 0);
  assert.equal(visual(game).clip, 'jump');
});

test('run-start keeps the native contact within a pixel into run frame 11 in both directions', async () => {
  // Centroids of the lowest occupied row (alpha > 128) in each native cell.
  const contactX = [29, 28, 25.5, 22.5, 18.5];
  for (const direction of [1, -1]) {
    const game = await createPreviewGame({ enabled: true });
    game.eval(`
      globalThis.testSpriteOffset = null;
      cx.drawImage = (image, ...args) => { if (image instanceof Image) testSpriteOffset = args[4]; };
    `);
    const positions = [];
    replay([game], [[5, 'start through first run cel', down(direction === 1 ? 'ArrowRight' : 'ArrowLeft')]], (g, label, tick) => {
      const { clip, index, face } = visual(g);
      assert.equal(clip, tick === 4 ? 'run' : 'runstart');
      assert.equal(index, tick === 4 ? 11 : tick);
      assert.equal(face, direction);
      const anchor = g.eval('pl.x + pl.w / 2');
      positions.push(anchor + face * (g.eval('testSpriteOffset') + contactX[tick]));
    });
    assert.ok(Math.max(...positions) - Math.min(...positions) < 0.62,
      'the authored native contact spans about 0.61 px before rasterization');
  }
});

test('sprite paint uses the authored 1x cell and pivot and reflects about the existing foot anchor', async () => {
  const game = await createPreviewGame({ enabled: true });
  game.eval(`
    globalThis.previewBlits = [];
    globalThis.previewTransforms = [];
    cx.drawImage = (image, ...args) => {
      if (image instanceof Image) globalThis.previewBlits.push(args);
    };
    cx.translate = (...args) => globalThis.previewTransforms.push(['translate', ...args]);
    cx.scale = (...args) => globalThis.previewTransforms.push(['scale', ...args]);
  `);
  function paint(expectedClip, expectedFace, width, height, pivot) {
    game.eval('previewBlits.length = 0; previewTransforms.length = 0; drawPlayer()');
    const anchor = game.snapshot('[pl.x + pl.w / 2 - cam, pl.y + pl.h]');
    const { clip, index, face, source } = visual(game);
    assert.equal(source, 'sprite');
    assert.equal(clip, expectedClip);
    assert.equal(face, expectedFace);
    assert.deepEqual(game.snapshot('previewTransforms'), [
      ['translate', ...anchor],
      ['scale', expectedFace, 1]
    ]);
    assert.deepEqual(game.snapshot('previewBlits'), [
      [index * width, 0, width, height, -pivot[0], -pivot[1], width, height]
    ]);
  }
  paint('idle', 1, 43, 61, [14.94, 58.84]);
  controls(game, down('ArrowLeft'));
  game.step(3);
  paint('runstart', -1, 48, 61, [13.94, 57.84]);
});
