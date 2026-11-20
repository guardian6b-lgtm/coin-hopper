'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { composeEmberPage } = require('../scripts/ember-preview.cjs');
const manifest = require('../dev/ember-v31/manifest.json');
const { createGame, onFlatGround } = require('./harness.cjs');

function fixture({ character = 'ember', valid = true } = {}) {
  const sizes = Object.values(manifest.clips).map(clip => [clip.width * clip.count, clip.height]);
  const loader = `
    const testStripSizes = ${JSON.stringify(sizes)};
    globalThis.Image = class {
      set src(value) {
        [this.naturalWidth, this.naturalHeight] = testStripSizes.shift();
        if (${!valid}) this.naturalHeight = 0;
        this.onload();
      }
    };`;
  const html = composeEmberPage({ enabled: true }).toString().replace('<script>', '<script>' + loader);
  const game = createGame({ html, saved: { coinhopper_character_v1: character } });
  onFlatGround(game);
  game.eval(`
    let ellipses = [], bounds = null;
    cx.rect = (...args) => { bounds = args; };
    cx.ellipse = (x,y,rx,ry) => {
      if (cx.fillStyle === '#283655') ellipses.push({x,y,rx,ry,alpha:cx.globalAlpha,bounds});
    };
    // Isolate the shadow stage of the actual drawPlayer entry point.
    drawCharacter = () => {};
    function captureShadows() {
      ellipses = []; bounds = null;
      drawPlayer();
      return ellipses;
    }`);
  return game;
}

const capture = game => game.snapshot('captureShadows()');

test('jump shadow stays on the floor, fades and shrinks continuously, then returns to contact', () => {
  const game = fixture();
  const contact = capture(game)[0];
  assert.equal(contact.y - contact.ry, 468);
  game.event('keydown', { code: 'Space' });
  let previous = contact, smallest = contact, landed = false;
  for (let tick = 0; tick < 90; tick++) {
    game.step();
    const [shadow] = capture(game);
    assert.equal(shadow.y - shadow.ry, 468);
    assert.equal(shadow.x, game.eval('pl.x + pl.w / 2 - cam'));
    assert.ok(Math.abs(shadow.alpha - previous.alpha) < 0.03);
    if (game.eval('pl.vy < 0')) {
      assert.ok(shadow.rx <= previous.rx && shadow.alpha <= previous.alpha);
    } else {
      assert.ok(shadow.rx >= previous.rx && shadow.alpha >= previous.alpha);
    }
    if (shadow.rx < smallest.rx) smallest = shadow;
    if (game.eval('pl.ground')) {
      assert.deepEqual(shadow, contact);
      landed = true;
      break;
    }
    previous = shadow;
  }
  assert.ok(landed && smallest.rx < contact.rx * 0.8 && smallest.alpha < contact.alpha / 2);
});

test('a shadow crossing two different heights paints clipped pieces on their exposed surfaces', () => {
  const game = fixture();
  game.eval("grid[9][4] = '='; pl.x = 5*T - pl.w/2; pl.y = 8*T - pl.h; cam = 75;");
  const pieces = capture(game);
  assert.equal(pieces.length, 2);
  const [upper, lower] = pieces;
  assert.equal(upper.y - upper.ry, 324);
  assert.equal(lower.y - lower.ry, 468);
  assert.equal(upper.x, 105);
  assert.equal(upper.bounds[0] + upper.bounds[2], 105);
  assert.equal(lower.bounds[0], 105);
  assert.ok(upper.alpha > lower.alpha && upper.rx > lower.rx);
  // Moving under a suspended platform must not project onto its top.
  game.eval('pl.y = 10*T - pl.h;');
  assert.deepEqual(capture(game).map(piece => piece.y - piece.ry), [468]);
});

test('terrain clips a partial footprint at a pit lip and draws nothing over a full gap', () => {
  const game = fixture();
  game.eval("grid[13][5] = ' '; pl.x = 5*T - pl.w/2; pl.y -= T;");
  const [lip] = capture(game);
  assert.equal(lip.bounds[0] + lip.bounds[2], 180);
  game.eval('pl.x += T/2;');
  assert.deepEqual(capture(game), []);
  game.eval("grid[14][5] = '#';");
  assert.equal(capture(game)[0].bounds[1], 504);
  game.eval('pl.y = 15*T;');
  assert.deepEqual(capture(game), []);
});

test('world boundary collision walls cannot become unsupported shadow surfaces', () => {
  const game = fixture();
  game.eval('pl.x = 0; cam = 0;');
  assert.equal(capture(game)[0].bounds[0], 0);
  game.eval("grid[13][0] = ' '; grid[13][1] = ' ';");
  assert.deepEqual(capture(game), []);
  game.eval('pl.x = LW*T - pl.w;');
  const [edge] = capture(game);
  assert.equal(edge.bounds[0] + edge.bounds[2], game.eval('LW*T'));
  game.eval("grid[13][LW-1] = ' ';");
  assert.deepEqual(capture(game), []);
});

test('other heroes and invalid Ember images keep the original R6-C shadow', () => {
  for (const options of [{ character: 'nova' }, { valid: false }]) {
    const game = fixture(options);
    game.eval('pl.y -= T;');
    const [shadow] = capture(game);
    assert.equal(shadow.y, 434);
    assert.equal(shadow.ry, 3);
    assert.equal(shadow.alpha, 0.16);
    assert.equal(shadow.bounds, null);
  }
});
