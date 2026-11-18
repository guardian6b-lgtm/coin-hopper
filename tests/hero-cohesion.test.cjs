const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, onFlatGround } = require('./harness.cjs');

const heroes = ['hopper', 'minty', 'ember', 'nova', 'bolt'];
const commonPoses = ['idle', 'run', 'jump', 'fall', 'land', 'hurt', 'victory', 'charge'];
const simulation = `({
  pl, state, lvl, grid, cam, timer, time, score, levelScore, lives, progress,
  coins, shields, highJumps, enemies, enemyCombat, bossState, ability, coreItems, coreShots, parts
})`;

function startHero(id) {
  const game = onFlatGround(createGame({ saved: { coinhopper_character_v1: id } }));
  game.eval('pl.x = 420; cam = 180; pl.inv = 0; pl.landTime = 0; coins = []; enemies = []; shields = []; highJumps = [];');
  return game;
}

function pose(game, ...args) {
  return game.snapshot(`heroRigPose(...${JSON.stringify(args)})`);
}

function assertPoint(point, message) {
  assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), message);
}

function matchesPoint(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < 1e-7;
}

function project(root, face, point) {
  return { x: root.x + face * point.x, y: root.y + point.y };
}

test('all five hero rigs keep distinct poses with finite limbs and readable joint positions', () => {
  const game = startHero('hopper');
  for (const id of heroes) {
    const poses = [...commonPoses, ...(id === 'hopper' ? ['slam'] : ['cast', 'recover'])];
    if (id === 'nova') poses.push('glide');
    const silhouettes = new Set();
    for (const name of poses) {
      const clock = name === 'run' ? 7 : name === 'land' ? 0.08 : 0.41;
      const rig = pose(game, id, name, clock, 0.6);
      const label = `${id}: ${name}`;
      assertPoint(rig.body, label);
      assertPoint(rig.chest, label);
      assert.ok(rig.body.scaleX > 0 && rig.body.scaleY > 0 && Number.isFinite(rig.body.angle), label);
      for (const points of [rig.feet, rig.hips, rig.arms]) assert.equal(points.length, 2, label);
      for (const point of [...rig.feet, ...rig.hips]) assertPoint(point, label);
      for (const { hand, shoulder } of rig.arms) {
        assertPoint(hand, label);
        assertPoint(shoulder, label);
        assert.ok(!matchesPoint(hand, shoulder), label);
      }
      const silhouette = JSON.stringify([rig.body, rig.feet, rig.arms]);
      assert.equal(silhouettes.has(silhouette), false, label);
      silhouettes.add(silhouette);
    }
  }
});

test('world hand, chest and ground anchors agree with each hero rig in both directions', () => {
  for (const id of heroes) {
    const game = startHero(id);
    game.event('keydown', { code: 'KeyE' });
    game.step(39);
    assert.equal(game.eval('ability.charging'), true);
    const saved = Object.fromEntries(game.storage);
    const root = game.snapshot('({ x: pl.x + pl.w / 2, y: pl.y + pl.h })');
    const worldPose = id === 'hopper' ? 'hopperWorldPose' : 'illustratedHeroWorldPose';
    const faces = [];
    for (const face of [-1, 1]) {
      game.eval(`pl.face = ${face}`);
      const before = game.snapshot(simulation);
      const visual = game.snapshot(`${worldPose}(pl)`);
      assert.equal(visual.pose, 'charge', id);
      const rig = pose(game, id, visual.pose, visual.clock, visual.power, visual.travel, visual.face, visual.motion);
      const anchors = game.snapshot('heroVisualAnchors(pl)');
      assert.equal(anchors.face, face, id);
      assert.equal(anchors.pose, 'charge', id);
      assert.ok(matchesPoint(anchors.foot, root), id);
      assert.ok(matchesPoint(anchors.chest, project(root, face, rig.chest)), id);
      assert.ok(rig.arms.some(({ hand }) => matchesPoint(anchors.hand, project(root, face, hand))), id);
      game.eval('drawWorld()');
      assert.deepEqual(game.snapshot(simulation), before, id);
      assert.deepEqual(Object.fromEntries(game.storage), saved, id);
      faces.push(anchors);
    }
    const [left, right] = faces;
    for (const anchor of ['hand', 'chest']) {
      assert.ok(matchesPoint(left[anchor], { x: 2 * root.x - right[anchor].x, y: right[anchor].y }), `${id}: ${anchor}`);
    }
  }
});

test('each grounded gait retains contact through stride wraps, even while aiming behind travel', () => {
  const game = startHero('hopper');
  for (const id of heroes) {
    for (const direction of [-1, 1]) {
      for (const name of ['run', 'charge']) {
        const face = name === 'run' ? direction : -direction;
        const at = distance => pose(game, id, name, name === 'run' ? distance : 0.4, 0.6, { distance, direction }, face);
        for (const phase of [0, 16]) {
          let previous;
          for (const distance of [phase + 0.5, phase + 5, phase + 11, phase + 15.5]) {
            const { feet } = at(distance);
            const planted = feet.filter(foot => Math.abs(foot.y) < 1e-7);
            assert.equal(planted.length, 1, `${id}: ${name}`);
            assert.ok(feet.some(foot => foot.y < 0), `${id}: swing foot clears ground`);
            const worldX = direction * distance + face * planted[0].x;
            if (previous !== undefined) assert.ok(Math.abs(worldX - previous) < 1e-7, `${id}: stance slides`);
            previous = worldX;
          }
        }
        for (const boundary of [4, 8, 12, 16, 20, 24, 28, 32]) {
          const before = at(boundary - 0.001);
          const after = at(boundary + 0.001);
          assert.ok(Math.hypot(before.body.x - after.body.x, before.body.y - after.body.y) < 0.02, `${id}: body jumps at ${boundary}`);
          for (let foot = 0; foot < before.feet.length; foot++) {
            const a = before.feet[foot], b = after.feet[foot];
            assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 0.02, `${id}: foot jumps at ${boundary}`);
          }
        }
      }
    }
  }
});

test('reduced motion stabilizes idle art while preserving charge gestures and planted gait', () => {
  const game = startHero('hopper');
  for (const id of heroes) {
    const before = game.snapshot(simulation);
    game.eval('visualSettings.reduced = false; window.matchMedia = () => ({ matches: false });');
    assert.notDeepEqual(pose(game, id, 'idle', 0.29), pose(game, id, 'idle', 0.72), id);
    game.eval('window.matchMedia = () => ({ matches: true });');
    const idle = pose(game, id, 'idle', 0.29);
    assert.deepEqual(pose(game, id, 'idle', 0.72), idle, id);
    const charging = pose(game, id, 'charge', 0.72, 0.8);
    assert.notDeepEqual(charging.arms, idle.arms, id);
    const running = pose(game, id, 'run', 8, 0, { distance: 8, direction: 1 });
    assert.ok(running.feet.some(foot => Math.abs(foot.y) < 1e-7), id);
    assert.ok(running.feet.some(foot => foot.y < 0), id);
    assert.deepEqual(game.snapshot(simulation), before);
  }
});

function activatePower(game) {
  game.event('keydown', { code: 'KeyE' });
  game.step(24);
  if (game.eval("pl.character === 'nova' || pl.character === 'hopper'")) {
    game.eval('pl.ground = false; pl.y = 250; pl.vy = 120;');
  }
  game.event('keyup', { code: 'KeyE' });
  game.step();
}

test('Vine Snare and Chain Lightning render from the palm without changing recorded targets', () => {
  for (const [id, kind] of [['minty', 'vine'], ['bolt', 'lightning']]) {
    for (const face of [-1, 1]) {
      const game = startHero(id);
      game.eval(`
        pl.face = ${face};
        enemies = [90, 155].map(dx => createEnemy('walker', pl.x + ${face} * dx, 13*T - ENEMY_TYPES.walker.height));
        enemies.forEach(enemy => { enemy.vx = 0; });
      `);
      activatePower(game);
      game.step(5);
      const before = game.snapshot(simulation);
      const effect = `ability.effects.find(effect => effect.kind === '${kind}')`;
      const ray = game.snapshot(effect);
      const anchors = game.snapshot('heroVisualAnchors(pl)');
      const root = game.snapshot(`abilityRayRoot(${effect}, heroVisualAnchors(pl))`);
      assert.ok(matchesPoint(root, anchors.hand), `${id}: the first ray starts at its palm`);

      game.eval(`
        window.rayStarts = []; window.rayEdges = [];
        cx.moveTo = (x, y) => window.rayStarts.push({ x, y });
        cx.lineTo = (x, y) => window.rayEdges.push({ x, y });
        drawAbilityEffects(heroVisualAnchors(pl));
      `);
      const camera = game.eval('cam');
      const starts = game.snapshot('window.rayStarts');
      const edges = game.snapshot('window.rayEdges');
      assert.ok(starts.some(point => matchesPoint(point, { x: root.x - camera, y: root.y })), id);
      assert.ok(edges.some(point => matchesPoint(point, { x: ray.tx - camera, y: ray.ty })), id);
      if (id === 'bolt') {
        const chain = game.snapshot("ability.effects.find(effect => effect.kind === 'lightning' && effect.total === 0.24)");
        assert.ok(starts.some(point => matchesPoint(point, { x: chain.x - camera, y: chain.y })), 'the next link still begins at the enemy');
      }
      assert.deepEqual(game.snapshot(simulation), before);

      game.eval('pl.face *= -1');
      const turned = game.snapshot(`abilityRayRoot(${effect}, heroVisualAnchors(pl))`);
      assert.ok(face * (turned.x - ray.x) >= 0, `${id}: a turn never redirects an existing ray`);
      game.eval('pl.x += 60');
      assert.deepEqual(game.snapshot(`abilityRayRoot(${effect}, heroVisualAnchors(pl))`), { x: ray.x, y: ray.y });
    }
  }
});

test('Crown Slam streaks and Star Glide wings stay attached to the rendered body', () => {
  for (const [id, active] of [['hopper', 'slam'], ['nova', 'glide']]) {
    const game = startHero(id);
    activatePower(game);
    assert.equal(game.eval('ability.active'), active);
    const before = game.snapshot(simulation);
    const anchors = game.snapshot('heroVisualAnchors(pl)');
    const pan = game.eval('cam');
    game.eval(`
      window.effectPaths = [];
      cx.${id === 'nova' ? 'moveTo' : 'quadraticCurveTo'} = (...args) => window.effectPaths.push(args.slice(-2));
      drawHeroAbilityBehind(heroVisualAnchors(pl));
    `);
    const contact = game.snapshot('window.effectPaths');
    const origin = id === 'nova' ? anchors.chest : anchors.foot;
    const width = id === 'nova' ? 5 : 8;
    const offset = id === 'nova' ? 4 : 0.5;
    for (const side of [-1, 1]) {
      const expected = { x: origin.x + side * width - pan, y: origin.y + offset };
      assert.ok(contact.some(([x, y]) => matchesPoint({ x, y }, expected)), `${id}: ${side}`);
    }
    assert.deepEqual(game.snapshot(simulation), before);
  }
});

test('Ember’s fireball core stays centered on the simulated projectile within its radius', () => {
  const game = startHero('ember');
  activatePower(game);
  assert.equal(game.eval('ability.projectiles.length'), 1);
  const before = game.snapshot(simulation);
  const [shot] = before.ability.projectiles;
  game.eval(`
    window.fireArcs = [];
    cx.arc = (x, y, radius) => window.fireArcs.push({ x, y, radius });
    drawAbilityEffects(heroVisualAnchors(pl));
  `);
  const center = { x: shot.x - before.cam, y: shot.y };
  assert.ok(game.snapshot('window.fireArcs').some(arc => matchesPoint(arc, center) && arc.radius > 0 && arc.radius <= shot.radius));
  assert.deepEqual(game.snapshot(simulation), before);
});
