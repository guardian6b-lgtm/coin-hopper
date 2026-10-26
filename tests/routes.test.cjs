const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./harness.cjs');

// Recorded key transitions at 60 Hz, found against the shipped maps and replayed
// through the shipped input handlers and update(). No world/player edits, enemy
// removal, invulnerability changes, or collision shortcuts occur during replay.
const routes = require('./fixtures/routes.cjs');

for (const [index, route] of routes.entries()) {
  test(`level remains completable without damage or shields: ${route.name}`, () => {
    const game = createGame();
    game.eval(`newGame(); startLevel(${index});`);
    game.event('keydown', { code: 'ArrowRight' });
    let nextJump = 0;
    for (let frame = 0; frame < 1100; frame++) {
      if (route.jump[nextJump]?.[0] === frame) {
        game.event(route.jump[nextJump][1] ? 'keydown' : 'keyup', { code: 'Space' });
        nextJump++;
      }
      game.step();
      const current = game.snapshot('({ state, lives, score, lvl })');
      assert.equal(current.lives, 3, `damage on frame ${frame}`);
      assert.equal(current.lvl, index);
      assert.equal(game.eval('shields.some(s=>s.got)'), false, 'no shield pickup or protection needed');
      if (current.state === 'done') {
        assert.ok(current.score >= 100, 'completion awards points');
        return;
      }
      assert.equal(current.state, 'play', `unexpected state on frame ${frame}`);
    }
    assert.fail('The recorded input route did not reach the flag in 1100 frames');
  });
}

test('a continuous run completes all four levels in order using native menu actions', () => {
  const game = createGame();
  game.click('Play');game.click('Start game');
  for (const [index, route] of routes.entries()) {
    game.event('keydown', { code: 'ArrowRight' });
    let nextJump = 0;
    for (let frame = 0; frame < 1100 && game.eval('state') === 'play'; frame++) {
      if (route.jump[nextJump]?.[0] === frame) {
        game.event(route.jump[nextJump][1] ? 'keydown' : 'keyup', { code: 'Space' });
        nextJump++;
      }
      game.step();
      assert.equal(game.eval('lives'), 3, `${route.name} frame ${frame}`);
    }
    assert.equal(game.eval('state'), 'done', route.name);
    assert.equal(game.eval('lvl'), index);
    assert.equal(game.eval('shields.some(s=>s.got)'), false);
    game.click(index === routes.length - 1 ? 'Finish' : 'Next level');
  }
  assert.equal(game.eval('state'), 'win');
  assert.ok(game.eval('score') > 400);
  assert.equal(Number(game.storage.get('coinhopper_best')), game.eval('score'));
});
