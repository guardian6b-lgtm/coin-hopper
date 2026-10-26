const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./harness.cjs');

// Recorded key transitions at 60 Hz, found against the original maps and replayed
// through the shipped input handlers and update(). No world/player edits, enemy
// removal, invulnerability changes, or collision shortcuts occur during replay.
const routes = [
  {
    name: 'Sunny Meadow',
    jump: [[7,true],[14,false],[39,true],[67,false],[106,true],[127,false],
      [138,true],[163,false],[168,true],[203,false],[211,true],[219,false],
      [237,true],[247,false],[277,true],[315,false],[342,true],[373,false],
      [375,true],[414,false],[419,true],[454,false],[479,true],[512,false],
      [530,true],[547,false],[569,true],[595,false]],
  },
  {
    name: 'Brick Hills',
    jump: [[18,true],[42,false],[61,true],[75,false],[144,true],[156,false],
      [182,true],[208,false],[228,true],[266,false],[313,true],[336,false],
      [351,true],[386,false],[388,true],[411,false],[438,true],[451,false],
      [476,true],[507,false],[524,true],[548,false],[574,true],[598,false],
      [623,true],[660,false],[679,true]],
  },
  {
    name: 'Starry Night',
    jump: [[16,true],[36,false],[97,true],[107,false],[153,true],[157,false],
      [187,true],[197,false],[211,true],[221,false],[277,true],[310,false],
      [334,true],[338,false],[369,true],[409,false],[414,true],[437,false],
      [441,true],[461,false],[482,true],[505,false],[537,true],[577,false],
      [617,true],[657,false],[673,true],[677,false]],
  },
];

for (const [index, route] of routes.entries()) {
  test(`original level remains completable without damage: ${route.name}`, () => {
    const game = createGame();
    game.eval(`newGame(); startLevel(${index});`);
    game.event('keydown', { code: 'ArrowRight' });
    let nextJump = 0;
    for (let frame = 0; frame < 900; frame++) {
      if (route.jump[nextJump]?.[0] === frame) {
        game.event(route.jump[nextJump][1] ? 'keydown' : 'keyup', { code: 'Space' });
        nextJump++;
      }
      game.step();
      const current = game.snapshot('({ state, lives, score, lvl })');
      assert.equal(current.lives, 3, `damage on frame ${frame}`);
      assert.equal(current.lvl, index);
      if (current.state === 'done') {
        assert.ok(current.score >= 100, 'completion awards points');
        return;
      }
      assert.equal(current.state, 'play', `unexpected state on frame ${frame}`);
    }
    assert.fail('The recorded input route did not reach the flag in 900 frames');
  });
}
