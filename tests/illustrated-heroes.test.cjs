const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, onFlatGround } = require('./harness.cjs');

const heroes = ['minty', 'ember', 'nova', 'bolt'];
const characterKey = 'coinhopper_character_v1';
const simulation = `({
  pl, state, lvl, grid, cam, timer, score, levelScore, lives, progress,
  coins, shields, highJumps, enemies, enemyCombat, bossState, ability, coreItems, coreShots
})`;

function startHero(id) {
  const game = onFlatGround(createGame({ saved: { [characterKey]: id } }));
  game.eval('pl.inv = 0; pl.landTime = 0; coins = []; enemies = []; shields = []; highJumps = [];');
  return game;
}

function observeIllustrated(game) {
  game.eval(`
    window.illustratedDraws = [];
    const paintIllustrated = drawIllustratedHero;
    drawIllustratedHero = (...args) => {
      const [, id, x, y, height, face, pose, clock, power, travel] = args;
      window.illustratedDraws.push({ id, x, y, height, face, pose, clock, power, travel });
      return paintIllustrated(...args);
    };
  `);
  return () => game.snapshot('window.illustratedDraws.splice(0)');
}

function expectWorldPose(game, takeDraws, id, pose) {
  const before = game.snapshot(simulation);
  const saved = Object.fromEntries(game.storage);
  game.eval('drawPlayer()');
  const draws = takeDraws();
  assert.equal(draws.length, 1, `${id}: ${pose}`);
  const [draw] = draws;
  assert.equal(draw.id, id);
  assert.equal(draw.pose, pose, id);
  assert.equal(draw.y, before.pl.y + before.pl.h, `${id}: foot origin`);
  assert.deepEqual(game.snapshot(simulation), before, `${id}: ${pose} is render-only`);
  assert.deepEqual(Object.fromEntries(game.storage), saved);
  return draw;
}

test('each world and picker dispatches its own illustrated rig, reusing its part cache', () => {
  const game = startHero('minty');
  const takeDraws = observeIllustrated(game);
  game.eval(`
    window.legacyAtlasDraws = 0;
    if (typeof heroArt !== 'undefined') {
      heroArt.complete = true;
      heroArt.naturalWidth = 1536;
      cx.drawImage = (image) => { if (image === heroArt) window.legacyAtlasDraws++; };
    }
    const testedPartCaches = new Map();
  `);
  for (const id of heroes) {
    game.eval(`pl.character = '${id}'`);
    expectWorldPose(game, takeDraws, id, 'idle');
    game.eval(`
      testedPartCaches.set('${id}', getIllustratedParts('${id}'));
      drawPortrait(document.createElement('canvas'), '${id}', false);
      drawPortrait(document.createElement('canvas'), '${id}', true);
    `);
    assert.deepEqual(takeDraws().map(draw => [draw.id, draw.pose]), [[id, 'idle'], [id, 'victory']]);
    assert.equal(game.eval(`getIllustratedParts('${id}') === testedPartCaches.get('${id}')`), true);
  }
  assert.equal(game.eval('new Set(testedPartCaches.values()).size'), heroes.length);
  assert.equal(game.eval('window.legacyAtlasDraws'), 0);
  game.eval("pl.character = 'hopper'; drawPlayer(); drawPortrait(document.createElement('canvas'), 'hopper', true)");
  assert.deepEqual(takeDraws(), []);
});

const locomotionPoses = [
  ['idle', ''],
  ['run', 'pl.vx = 180; pl.animDistance = 9;'],
  ['jump', 'pl.ground = false; pl.vy = -300;'],
  ['fall', 'pl.ground = false; pl.vy = 300;'],
  ['land', 'pl.landTime = 0.08;'],
  ['hurt', 'pl.inv = 0.25;'],
  ['victory', "state = 'done';"],
];

for (const id of heroes) {
  test(`${id} draws locomotion, damage and victory poses without changing simulation`, () => {
    const game = startHero(id);
    const takeDraws = observeIllustrated(game);
    game.eval(`
      drawPlayer();
      window.rigCommands = [];
      for (const method of ['translate', 'scale', 'rotate']) {
        cx[method] = (...args) => window.rigCommands.push([method, ...args]);
      }
    `);
    takeDraws();
    const distinct = new Set();
    for (const [pose, changes] of locomotionPoses) {
      game.eval(`
        state = 'play'; pl.ground = true; pl.vx = 0; pl.vy = 0;
        pl.inv = 0; pl.landTime = 0;
        ${changes}
      `);
      expectWorldPose(game, takeDraws, id, pose);
      const commands = game.snapshot('window.rigCommands.splice(0)');
      assert.ok(commands.length > 0, pose);
      const composition = JSON.stringify(commands);
      assert.equal(distinct.has(composition), false, `${id}: ${pose} has its own composition`);
      distinct.add(composition);
    }
  });

  test(`${id} plants alternating feet in both directions and mirrors toward actual movement`, () => {
    const game = startHero(id);
    const takeDraws = observeIllustrated(game);
    game.eval(`
      const footSprite = getIllustratedParts('${id}').foot;
      window.gait = []; window.scales = []; window.paintedFeet = [];
      const sampleFoot = hopperFoot;
      hopperFoot = (distance, offset = 0) => {
        const foot = sampleFoot(distance, offset);
        window.gait.push({ distance, offset, ...foot });
        return foot;
      };
      const paintPart = drawHopperPart;
      drawHopperPart = (ctx, part, x, y, angle) => {
        if (part === footSprite) window.paintedFeet.push({ x, y });
        return paintPart(ctx, part, x, y, angle);
      };
      cx.scale = (x, y) => window.scales.push([x, y]);
    `);
    const takeGait = () => game.snapshot(`({
      samples: window.gait.splice(0).sort((a, b) => a.offset - b.offset),
      painted: window.paintedFeet.splice(0),
      rootScale: window.scales.splice(0)[0]
    })`);
    for (const direction of [-1, 1]) {
      const forward = direction < 0 ? 'ArrowLeft' : 'ArrowRight';
      const backward = direction < 0 ? 'ArrowRight' : 'ArrowLeft';
      for (const [distance, plantedOffset] of [[32, 0], [48, 16]]) {
        game.eval(`pl.x = 360; pl.vx = ${direction * 180}; pl.face = ${direction}; pl.animDistance = ${distance};`);
        game.event('keydown', { code: forward });
        let plantedX;
        for (let frame = 0; frame < 4; frame++) {
          if (frame > 0) game.step();
          const draw = expectWorldPose(game, takeDraws, id, 'run');
          const { samples: feet, painted, rootScale } = takeGait();
          assert.deepEqual(feet.map(foot => foot.offset), [0, 16]);
          assert.ok(feet.every(foot => foot.distance === draw.clock));
          const planted = feet.find(foot => foot.offset === plantedOffset);
          assert.equal(planted.y, 0);
          assert.equal(painted.length, 2);
          const paintedStance = painted.find(foot => foot.x === planted.x && foot.y === 0);
          assert.ok(paintedStance, `${id}: stance is painted at its calculated location`);
          if (frame > 0) assert.ok(feet.find(foot => foot.offset !== plantedOffset).y < 0);
          assert.deepEqual(rootScale, [direction, 1]);
          const worldX = game.eval('pl.x + pl.w / 2') + rootScale[0] * paintedStance.x;
          if (frame === 0) plantedX = worldX;
          assert.ok(Math.abs(worldX - plantedX) < 1e-9, `${id}: foot slides at frame ${frame}`);
        }
        game.event('keyup', { code: forward });
      }
      game.event('keydown', { code: backward });
      game.step();
      assert.equal(game.eval('pl.face'), -direction);
      assert.equal(game.eval('Math.sign(pl.vx)'), direction);
      assert.equal(expectWorldPose(game, takeDraws, id, 'run').face, direction);
      takeGait();

      game.event('keydown', { code: 'KeyE' });
      game.step();
      const charge = expectWorldPose(game, takeDraws, id, 'charge');
      assert.equal(charge.face, -direction, `${id}: charge remains aimed toward input`);
      assert.equal(charge.travel.direction, direction);
      assert.ok(charge.power > 0);
      const { samples, painted, rootScale } = takeGait();
      const stance = samples.find(foot => foot.y === 0);
      assert.deepEqual(rootScale, [-direction, 1]);
      assert.ok(painted.some(foot => foot.x === -stance.x && foot.y === 0), `${id}: feet follow travel while charging`);

      game.event('keyup', { code: 'KeyE' });
      game.event('keyup', { code: backward });
      game.eval('resetAbility()');
    }
  });

  test(`${id} draws charge, release and recovery from the real Ability input`, () => {
    const game = startHero(id);
    const takeDraws = observeIllustrated(game);
    if (id === 'minty' || id === 'bolt') {
      game.eval("enemies = [createEnemy('walker', pl.x + 90, 13*T - ENEMY_TYPES.walker.height)]; enemies[0].vx = 0;");
    }
    game.event('keydown', { code: 'KeyE' });
    game.step(30);
    assert.equal(game.eval('ability.charging'), true);
    assert.ok(game.eval('ability.charge') > 0);
    expectWorldPose(game, takeDraws, id, 'charge');

    if (id === 'nova') game.eval('pl.y = 180; pl.ground = false; pl.vy = 100;');
    game.event('keyup', { code: 'KeyE' });
    game.step();
    assert.equal(game.eval('ability.charging'), false);
    assert.ok(game.eval('ability.cooldown') > 0);
    const outcome = {
      minty: 'enemies.some(e => e.root > 0)',
      ember: "ability.projectiles.some(projectile => projectile.kind === 'fire')",
      nova: "ability.active === 'glide'",
      bolt: "ability.effects.some(effect => effect.kind === 'lightning')",
    }[id];
    assert.equal(game.eval(outcome), true);
    expectWorldPose(game, takeDraws, id, 'cast');
    game.step(7);
    expectWorldPose(game, takeDraws, id, 'recover');

    game.step(8);
    expectWorldPose(game, takeDraws, id, id === 'nova' ? 'glide' : 'idle');
    if (id === 'nova') {
      game.eval('pl.y = 13*T - pl.h;');
      game.step();
      assert.equal(game.eval('ability.active'), '');
      expectWorldPose(game, takeDraws, id, 'land');
    }
  });
}

test('Minty draws the existing missed vine without gaining a cooldown or reward', () => {
  const game = startHero('minty');
  const takeDraws = observeIllustrated(game);
  game.event('keydown', { code: 'KeyE' });
  game.step(3);
  game.event('keyup', { code: 'KeyE' });
  game.step();
  assert.equal(game.eval('ability.cast'), 0);
  assert.equal(game.eval('ability.cooldown'), 0);
  assert.equal(game.eval('score'), 0);
  expectWorldPose(game, takeDraws, 'minty', 'cast');
  game.eval("abilityEffect('pickup', { x: pl.x, y: pl.y, color: '#fff' }, 0.6)");
  game.step(7);
  expectWorldPose(game, takeDraws, 'minty', 'recover');
  game.step(8);
  expectWorldPose(game, takeDraws, 'minty', 'idle');
});

test('illustrated picker previews cancel cleanly; confirmed hero IDs persist and reload', () => {
  for (const id of heroes) {
    const saved = {
      [characterKey]: 'hopper',
      coinhopper_best: '120',
      coinhopper_settings: '{"music":0.3,"effects":0.5}',
    };
    const game = createGame({ saved });
    const takeDraws = observeIllustrated(game);
    game.click('Play');
    takeDraws();
    game.click(`character-${id}`);
    assert.equal(game.element(`character-${id}`).getAttribute('aria-pressed'), 'true');
    assert.ok(takeDraws().some(draw => draw.id === id && draw.pose === 'victory'));
    game.click('Back');
    assert.deepEqual(Object.fromEntries(game.storage), saved);

    game.click('Play');
    game.click(`character-${id}`);
    game.click('Start game');
    assert.equal(game.storage.get(characterKey), id);
    assert.equal(game.storage.get('coinhopper_best'), saved.coinhopper_best);
    assert.equal(game.storage.get('coinhopper_settings'), saved.coinhopper_settings);
    const reloaded = createGame({ saved: Object.fromEntries(game.storage) });
    reloaded.click('Play');
    assert.equal(reloaded.element(`character-${id}`).getAttribute('aria-pressed'), 'true');
    reloaded.click('Start game');
    assert.deepEqual(reloaded.snapshot('({ id: pl.character, w: pl.w, h: pl.h })'), { id, w: 26, h: 32 });
  }
});
