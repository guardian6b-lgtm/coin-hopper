const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, onFlatGround } = require('./harness.cjs');
const routes = require('./fixtures/routes.cjs');
const roster = ['hopper', 'minty', 'ember', 'nova', 'bolt'];
const preference = 'coinhopper_character_v1';
const select = (game, id) => { game.click('Play');game.click('character-' + id);game.click('Start game'); };

test('Play opens five named, described, drawable cosmetic choices without starting a run', () => {
  const game = createGame();game.click('Play');
  assert.equal(game.eval('state'), 'characters');
  assert.equal(game.element('menu-title').textContent, 'Choose Your Hopper');
  assert.deepEqual(game.snapshot('CHARACTERS.map(c=>c.name)'), ['Hopper', 'Minty', 'Ember', 'Nova', 'Bolt']);
  for (const id of roster) {
    const card = game.element('character-' + id);
    assert.ok(card.textContent.length > 30);
    assert.ok(card.querySelector('canvas'));
    assert.equal(card.getAttribute('aria-pressed'), String(id === 'hopper'));
  }
  assert.equal(game.document.activeElement, game.element('character-hopper'));
  assert.equal(game.eval('pl'), undefined);
  assert.equal(game.eval('score'), 0);
});

test('previewing and canceling preserve the prior choice, score and settings storage', () => {
  const saved = { [preference]: 'nova', coinhopper_best: '220', coinhopper_settings: '{"effects":0.25,"music":0.8}' };
  const game = createGame({ saved });game.click('Play');game.click('character-ember');
  assert.equal(game.eval('pendingCharacter'), 'ember');
  assert.equal(game.eval('selectedCharacter'), 'nova');
  assert.equal(game.element('character-ember').getAttribute('aria-pressed'), 'true');
  assert.equal(game.element('character-nova').getAttribute('aria-pressed'), 'false');
  game.click('Back');
  assert.equal(game.eval('state'), 'title');
  assert.equal(game.document.activeElement, game.findButton('Play'));
  assert.deepEqual(Object.fromEntries(game.storage), saved);
  game.click('Play');
  assert.equal(game.eval('pendingCharacter'), 'nova');
  assert.equal(game.document.activeElement, game.element('character-nova'));
  game.click('character-bolt');game.event('keydown', { code: 'Escape', target: game.document.activeElement });
  assert.equal(game.eval('state'), 'title');
  assert.equal(game.eval('selectedCharacter'), 'nova');
});

test('Start confirms and persists selection, focuses the game and clears held input', () => {
  const game = createGame();select(game, 'ember');
  assert.equal(game.eval('selectedCharacter'), 'ember');
  assert.equal(game.eval('pl.character'), 'ember');
  assert.equal(game.eval('state'), 'play');
  assert.equal(game.storage.get(preference), 'ember');
  assert.equal(game.document.activeElement, game.element('c'));
  assert.equal(game.eval('jumpEdge || anyEdge || held("jump") || held("right")'), false);
  assert.deepEqual(game.snapshot('({score,lives,lvl,w:pl.w,h:pl.h})'), { score: 0, lives: 3, lvl: 0, w: 26, h: 32 });
});

test('Left/Right wrap, Home/End choose, and Tab/Shift+Tab remain inside the picker', () => {
  const game = createGame();game.click('Play');
  const key = code => game.event('keydown', { code, target: game.document.activeElement });
  assert.equal(key('ArrowLeft').defaultPrevented, true);
  assert.equal(game.eval('pendingCharacter'), 'bolt');
  assert.equal(game.document.activeElement, game.element('character-bolt'));
  key('ArrowRight');assert.equal(game.eval('pendingCharacter'), 'hopper');
  key('End');assert.equal(game.eval('pendingCharacter'), 'bolt');
  key('Home');assert.equal(game.eval('pendingCharacter'), 'hopper');
  game.event('keydown', { code: 'Tab', shiftKey: true, target: game.document.activeElement });
  assert.equal(game.document.activeElement, game.findButton('Back'));
  key('Tab');assert.equal(game.document.activeElement, game.element('character-hopper'));
  for (let i = 0; i < 5; i++) key('Tab');
  assert.equal(game.document.activeElement, game.findButton('Start game'));
  assert.equal(game.eval('anyEdge || jumpEdge'), false);
});

test('native Enter/Space select cards without starting and confirm without a queued jump', () => {
  const game = createGame();game.click('Play');
  for (const code of ['Enter', 'Space']) {
    const card = game.element('character-minty');
    const event = game.event('keydown', { code, target: card });
    assert.equal(event.defaultPrevented, false);
    card.click();game.step();
    assert.equal(game.eval('state'), 'characters');
    assert.equal(game.eval('pendingCharacter'), 'minty');
    assert.equal(game.eval('anyEdge || jumpEdge'), false);
  }
  const start = game.findButton('Start game');
  game.event('keydown', { code: 'Space', target: start });start.click();game.step();
  assert.equal(game.eval('state'), 'play');
  assert.equal(game.eval('pl.character'), 'minty');
  assert.equal(game.eval('held("jump") || jumpEdge'), false);
  const before = game.snapshot('({score,lives,lvl,timer,pl})');start.click();
  assert.deepEqual(game.snapshot('({score,lives,lvl,timer,pl})'), before, 'stale Start cannot reset a run');
});

test('title keyboard shortcut enters selection instead of bypassing confirmation', () => {
  const game = createGame();game.event('keydown', { code: 'Enter' });game.step(2);
  assert.equal(game.eval('state'), 'characters');
  assert.equal(game.eval('pl'), undefined);
});

test('each saved character restores after reload and unrelated storage survives', () => {
  for (const id of roster) {
    const game = createGame({ saved: { coinhopper_best: '120', coinhopper_settings: '{"effects":0.4,"music":0.7}' } });
    select(game, id);
    const reloaded = createGame({ saved: Object.fromEntries(game.storage) });
    reloaded.click('Play');
    assert.equal(reloaded.eval('pendingCharacter'), id);
    assert.equal(reloaded.element('character-' + id).getAttribute('aria-pressed'), 'true');
    reloaded.click('Start game');
    assert.equal(reloaded.eval('pl.character'), id);
    assert.equal(reloaded.eval('best'), 120);
    assert.deepEqual(reloaded.snapshot('settings'), { effects: .4, music: .7 });
  }
});

test('missing, malformed and unknown preferences safely fall back to Hopper', () => {
  for (const invalid of ['', 'Nova', 'speedy', 'null', '{"id":"nova"}', '["nova"]', '__proto__']) {
    const game = createGame({ saved: { [preference]: invalid } });
    game.click('Play');assert.equal(game.eval('pendingCharacter'), 'hopper');
    game.click('Start game');assert.equal(game.eval('pl.character'), 'hopper');
  }
  assert.equal(createGame().eval('selectedCharacter'), 'hopper');
});

test('blocked storage still permits selection, play and retry; a fresh session defaults safely', () => {
  const game = createGame({ storageBlocked: true });
  assert.doesNotThrow(() => select(game, 'bolt'));
  assert.equal(game.eval('pl.character'), 'bolt');
  game.eval('lives=1;pl.inv=0;hurt()');game.click('Try again');
  assert.equal(game.eval('pl.character'), 'bolt');
  assert.equal(createGame({ storageBlocked: true }).eval('selectedCharacter'), 'hopper');
});

test('all five characters have identical physical trajectories and body dimensions', () => {
  function trajectory(id) {
    const game = onFlatGround(createGame({ saved: { [preference]: id } }));
    const trace = [];
    game.event('keydown', { code: 'ArrowRight' });
    for (let tick = 0; tick < 100; tick++) {
      if (tick === 12) game.event('keydown', { code: 'Space' });
      if (tick === 28) game.event('keyup', { code: 'Space' });
      if (tick === 55) { game.event('keyup', { code: 'ArrowRight' });game.event('keydown', { code: 'KeyA' }); }
      game.step();
      trace.push(game.snapshot('({x:pl.x,y:pl.y,w:pl.w,h:pl.h,vx:pl.vx,vy:pl.vy,ground:pl.ground,coyote:pl.coyote,buf:pl.buf,score,lives})'));
    }
    return trace;
  }
  const baseline = trajectory('hopper');
  for (const id of roster.slice(1)) assert.deepEqual(trajectory(id), baseline, id);
});

for (const id of roster) {
  test(`${id} keeps its appearance through pause, damage, restart, transitions and Game Over`, () => {
    const game = createGame();select(game, id);
    game.click('pause-button');game.click('Settings');game.click('Back');game.click('Controls');game.click('Back');game.click('Resume');
    assert.equal(game.eval('pl.character'), id);
    game.eval('pl.inv=0;hurt()');assert.equal(game.eval('pl.character'), id);
    game.click('pause-button');game.click('Restart level');game.click('Restart level');
    assert.equal(game.eval('pl.character'), id);
    for (let level = 0; level < 4; level++) {
      assert.equal(game.eval('lvl'), level);
      game.eval('enemies=[];pl.x=flag.x;pl.vx=0');game.step();
      assert.equal(game.eval('pl.character'), id);
      game.click(game.eval('lvl+1===LEVELS.length') ? 'Finish' : 'Next level');
      assert.equal(game.eval('pl.character'), id);
    }
    if(game.eval('state')==='play')game.click('pause-button');
    game.click('Title screen');game.click('Play');game.click('Start game');
    game.eval('lives=1;pl.inv=0;hurt()');assert.equal(game.eval('state'), 'over');
    assert.equal(game.eval('pl.character'), id);game.click('Try again');
    assert.equal(game.eval('pl.character'), id);
    assert.doesNotThrow(() => game.frame(17));
  });

  test(`${id} shares coin/stomp scoring, shield absorption, spike and pit damage`, () => {
    const game = onFlatGround(createGame({ saved: { [preference]: id } }));
    game.eval('coins=[{x:pl.x+13,y:pl.y+16,t:0}];shields=[{x:pl.x+13,y:pl.y+16,got:false}]');game.step(2);
    assert.equal(game.eval('score===10 && levelScore===10 && pl.shield && lives===3'), true);
    game.eval('pl.y=390;pl.vy=200;pl.ground=false;enemies=[{x:pl.x,y:420,w:28,h:28,vx:0,vy:0,dead:0,ground:false}]');game.step();
    assert.equal(game.eval('score===60 && levelScore===60 && pl.shield && pl.vy===-380'), true);
    game.eval('hurt()');assert.equal(game.eval('!pl.shield && lives===3'), true);
    game.eval("enemies=[];pl.x=4*T;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.inv=0;grid[12][4]='^'");game.step();
    assert.equal(game.eval('lives'), 2);assert.equal(game.eval('pl.character'), id);
    game.eval('pl.shield=true;pl.inv=1;pl.y=ROWS*T+60');game.step();
    assert.equal(game.eval('lives===1 && !pl.shield && score===60'), true);
    assert.equal(game.eval('pl.character'), id);
  });

  test(`${id} completes all four unmodified routes with unchanged results and no protection`, () => {
    const game = createGame();select(game, id);
    const outcomes = [];
    for (const [index, route] of routes.entries()) {
      game.event('keydown', { code: 'ArrowRight' });let next = 0;
      for (let frame = 0; frame < 1100 && game.eval('state') === 'play'; frame++) {
        if (route.jump[next]?.[0] === frame) { game.event(route.jump[next][1] ? 'keydown' : 'keyup', { code: 'Space' });next++; }
        game.step();
      }
      assert.equal(game.eval('state'), 'done');assert.equal(game.eval('lives'), 3);
      assert.equal(game.eval('shields.some(s=>s.got)'), false);
      assert.equal(game.eval('pl.character'), id);
      outcomes.push(game.snapshot('({score,levelScore,lives})'));
      game.click(game.eval('lvl+1===LEVELS.length') ? 'Finish' : 'Next level');
    }
    assert.equal(game.eval('state'), game.eval('LEVELS.length')>4?'play':'win');
    // Outcomes recorded from verified base f2c8751. All variants use the same
    // movement/collision and award rules; fixtures are
    // replayed end-to-end, not implemented with character-specific shortcuts.
    assert.deepEqual(outcomes, [
      { score: 500, levelScore: 500, lives: 3 },
      { score: 1045, levelScore: 545, lives: 3 },
      { score: 1590, levelScore: 545, lives: 3 },
      { score: 2190, levelScore: 600, lives: 3 },
    ]);
  });
}
