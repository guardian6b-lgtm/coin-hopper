const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, onFlatGround } = require('./harness.cjs');

const characterKey = 'coinhopper_character_v1';

function observeHopper(game) {
  game.eval(`
    window.hopperDraws = [];
    const paintHopper = drawHopper;
    drawHopper = (ctx, x, y, height, face, pose, clock) => {
      window.hopperDraws.push({ x, y, height, face, pose, clock });
      return paintHopper(ctx, x, y, height, face, pose, clock);
    };
  `);
  return () => game.snapshot('window.hopperDraws.splice(0)');
}

test('the Hopper rig is dispatched for Hopper gameplay and picker portraits only', () => {
  const game = onFlatGround(createGame());
  const takeDraws = observeHopper(game);
  game.eval(`
    heroArt.complete = true;
    heroArt.naturalWidth = 1536;
    window.atlasDraws = 0;
    cx.drawImage = (image) => { if (image === heroArt) window.atlasDraws++; };
    drawPlayer();
  `);
  assert.equal(takeDraws().length, 1);
  assert.equal(game.eval('window.atlasDraws'), 0);

  for (const character of ['minty', 'ember', 'nova', 'bolt']) {
    game.eval(`
      pl.character = '${character}';
      window.atlasDraws = 0;
      drawPlayer();
      drawPortrait(document.createElement('canvas'), '${character}', true);
    `);
    assert.equal(takeDraws().length, 0, character);
    assert.equal(game.eval('window.atlasDraws'), 0, character);
  }

  game.eval("drawPortrait(document.createElement('canvas'), 'hopper', true)");
  assert.deepEqual(takeDraws().map(draw => draw.pose), ['victory']);
});

test('both Hopper feet stay planted through stance while the other foot lifts and recovers', () => {
  const game = createGame();
  for (const direction of [-1, 1]) {
    for (const offset of [0, 16]) {
      const start = 32 + offset;
      const initial = game.snapshot(`hopperFoot(${start}, ${offset})`);
      const plantedX = direction * (start + initial.x);
      for (const advance of [0, 1.5, 4, 8, 12, 15.9]) {
        const distance = start + advance;
        const foot = game.snapshot(`hopperFoot(${distance}, ${offset})`);
        assert.equal(foot.y, 0);
        assert.ok(Math.abs(direction * (distance + foot.x) - plantedX) < 1e-9);
      }
      const early = game.snapshot(`hopperFoot(${start + 20}, ${offset})`);
      const late = game.snapshot(`hopperFoot(${start + 28}, ${offset})`);
      assert.ok(early.y < 0 && late.y < 0, 'recovery foot clears the ground');
      assert.ok(late.x > early.x, 'the lifted foot returns forward');
      const next = game.snapshot(`hopperFoot(${start + 32}, ${offset})`);
      assert.deepEqual(next, initial, 'each foot repeats after one distance-based stride');
    }
  }
});

test('Hopper renders toward actual travel during reversal while input-facing and simulation remain authoritative', () => {
  for (const direction of [-1, 1]) {
    const game = onFlatGround(createGame());
    const takeDraws = observeHopper(game);
    game.eval(`
      pl.vx = ${direction * 180}; pl.face = ${direction}; pl.landTime = 0;
      window.horizontalScales = [];
      cx.scale = (x, y) => { if (y === 1) window.horizontalScales.push(x); };
      window.footDraws = [];
      const drawPart = drawHopperPart;
      drawHopperPart = (ctx, part, x, y, angle) => {
        if (part === getHopperParts().foot) window.footDraws.push({ x, y });
        return drawPart(ctx, part, x, y, angle);
      };
    `);
    const previous = game.snapshot('({ x: pl.x, distance: pl.animDistance })');
    game.event('keydown', { code: direction < 0 ? 'ArrowRight' : 'ArrowLeft' });
    game.step();
    const current = game.snapshot('pl');
    assert.equal(current.face, -direction);
    assert.equal(Math.sign(current.vx), direction);
    assert.ok(Math.abs(current.animDistance - previous.distance - Math.abs(current.x - previous.x)) < 1e-9);

    game.eval('drawPlayer()');
    const [draw] = takeDraws();
    assert.equal(draw.face, direction);
    assert.equal(draw.pose, 'run');
    assert.equal(draw.clock, current.animDistance);
    assert.ok(game.snapshot('window.horizontalScales').includes(direction));
    const sampledFeet = game.snapshot('[hopperFoot(pl.animDistance, 16), hopperFoot(pl.animDistance, 0)]');
    assert.deepEqual(game.snapshot('window.footDraws'), sampledFeet);
    assert.deepEqual(game.snapshot('pl'), current);
  }
});

test('Hopper renders all eight gameplay poses without changing game state', () => {
  const game = onFlatGround(createGame());
  const takeDraws = observeHopper(game);
  game.eval(`
    getHopperParts();
    window.poseTransforms = [];
    for (const method of ['translate', 'scale', 'rotate']) {
      cx[method] = (...args) => window.poseTransforms.push([method, ...args]);
    }
  `);
  const poses = [
    ['idle', ''],
    ['run', 'pl.vx = 120; pl.animDistance = 9;'],
    ['jump', 'pl.ground = false; pl.vy = -300;'],
    ['fall', 'pl.ground = false; pl.vy = 300;'],
    ['land', 'pl.landTime = 0.08;'],
    ['hurt', 'pl.inv = 0.25;'],
    ['slam', "pl.ground = false; pl.vy = 600; ability.active = 'slam';"],
    ['victory', "state = 'done';"],
  ];
  const simulation = '({ pl, state, grid, enemies, coins, shields, highJumps, bossState, score, lives, timer, ability, progress })';
  const compositionByPose = new Set();
  for (const [pose, changes] of poses) {
    game.eval(`
      state = 'play'; pl.ground = true; pl.vx = 0; pl.vy = 0;
      pl.landTime = 0; pl.inv = 0; ability.active = '';
      ${changes}
    `);
    const before = game.snapshot(simulation);
    game.eval('drawPlayer()');
    const draws = takeDraws();
    assert.equal(draws.length, 1, pose);
    assert.equal(draws[0].pose, pose);
    assert.equal(draws[0].y, before.pl.y + before.pl.h);
    if (pose === 'run') assert.equal(draws[0].clock, before.pl.animDistance);
    if (pose === 'land') assert.equal(draws[0].clock, before.pl.landTime);
    const commands = game.snapshot('window.poseTransforms.splice(0)');
    assert.ok(commands.length > 0, pose);
    const composition = JSON.stringify(commands);
    assert.equal(compositionByPose.has(composition), false, `${pose} uses a distinct composition`);
    compositionByPose.add(composition);
    assert.deepEqual(game.snapshot(simulation), before, pose);
  }
});

test('Hopper picker preview and cancel preserve saves; confirming uses the existing character preference', () => {
  const saved = {
    [characterKey]: 'minty',
    coinhopper_best: '120',
    coinhopper_settings: '{"music":0.3,"effects":0.5}',
  };
  const game = createGame({ saved });
  game.click('Play');
  game.click('character-hopper');
  assert.equal(game.element('character-hopper').getAttribute('aria-pressed'), 'true');
  assert.equal(game.eval('pendingCharacter'), 'hopper');
  game.click('Back');
  assert.deepEqual(Object.fromEntries(game.storage), saved);

  game.click('Play');
  game.click('character-hopper');
  game.click('Start game');
  assert.equal(game.storage.get(characterKey), 'hopper');
  assert.equal(game.storage.get('coinhopper_best'), saved.coinhopper_best);
  assert.equal(game.storage.get('coinhopper_settings'), saved.coinhopper_settings);
  const reloaded = createGame({ saved: Object.fromEntries(game.storage) });
  reloaded.click('Play');
  assert.equal(reloaded.element('character-hopper').getAttribute('aria-pressed'), 'true');
  reloaded.click('Start game');
  assert.deepEqual(reloaded.snapshot('({ id: pl.character, w: pl.w, h: pl.h })'), { id: 'hopper', w: 26, h: 32 });
});
