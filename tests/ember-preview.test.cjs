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
    globalThis.Image = class PreviewImage {
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
        if (first && ${JSON.stringify(failure)} === 'size') this.naturalWidth++;
        this.complete = true;
        Promise.resolve().then(() => {
          if (first && ${JSON.stringify(failure)} === 'decode') this.onerror?.();
          else this.onload?.();
        });
      }
    };
  `;
}

function originalPage() {
  return fs.readFileSync(indexPath);
}

async function createPreviewGame({ enabled = false, failure = null, id = 'ember' } = {}) {
  const { composeEmberPage } = require('../scripts/ember-preview.cjs');
  const page = composeEmberPage({ enabled }).toString('utf8');
  const html = page.replace('<script>', '<script>' + imagePrelude(failure));
  const game = createGame({ html, saved: { [characterKey]: id } });
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
      assert.equal(visual(game).source, 'procedural');
      projectileFrames.push(shots[0]);
    }
    if (label === 'charge hold') {
      if (step === 0) for (const item of games) placeTarget(item);
      assert.equal(visual(game).source, 'procedural');
    }
    if (label === 'cast recovery' && step === 29) assert.equal(visual(game).clip, 'idle');
    tick++;
  });
  assert.equal(projectileFrames.length, 2);
  assert.equal(on.eval('score'), 100, 'both live projectile hit rewards are exercised');
  assert.equal(on.storage.get(characterKey), 'ember');
  assert.equal(tick, 513, 'the full deterministic input trace was compared');
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
      assert.equal(clip, 'idle');
    }
    lastX = x;
    lastIndex = index;
  });
  assert.equal(workedAtSubCap, true);
  assert.ok(repeatedFrames > 0, 'slow steps do not unconditionally advance the atlas by one frame');
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
