const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./harness.cjs');

const progress = game => game.snapshot('({lvl,lives,score,levelScore,timer,pl,coins,enemies})');

test('title presents native menu actions and controls return to the title', () => {
  const game = createGame();
  assert.equal(game.element('menu').hidden, false);
  assert.equal(game.document.activeElement, game.findButton('Play'));
  assert.ok(game.findButton('Settings'));
  game.click('Controls');
  assert.equal(game.eval('state'), 'controls');
  assert.match(game.element('menu-content').textContent, /Hold for a higher jump/);
  game.click('Back');
  assert.equal(game.eval('state'), 'title');
  game.click('Play');game.click('Start game');
  assert.deepEqual(game.snapshot('({state,lvl,lives,score})'), { state: 'play', lvl: 0, lives: 3, score: 0 });
  assert.equal(game.element('menu').hidden, true);
  assert.equal(game.element('pause-button').hidden, false);
  assert.equal(game.document.activeElement, game.element('c'));
});

test('Tab and Shift+Tab wrap through visible native menu controls', () => {
  const game = createGame();
  const play = game.findButton('Play'), settings = game.findButton('Settings');
  const back = game.event('keydown', { code: 'Tab', shiftKey: true, target: play });
  assert.equal(back.defaultPrevented, true);
  assert.equal(game.document.activeElement, settings);
  game.event('keydown', { code: 'Tab', target: settings });
  assert.equal(game.document.activeElement, play);
  game.event('keydown', { code: 'Tab', repeat: true, target: play });
  assert.equal(game.document.activeElement, game.findButton('Controls'), 'held Tab stays inside the menu');
  game.click('Settings');
  assert.equal(game.document.activeElement, game.element('effects-volume'));
  game.event('keydown', { code: 'Tab', target: game.element('effects-volume') });
  assert.equal(game.document.activeElement, game.element('music-volume'));
  game.event('keydown', { code: 'Tab', target: game.element('music-volume') });
  assert.equal(game.document.activeElement, game.findButton('Back'));
});

test('native Enter activation does not queue a second title-screen action', () => {
  const game = createGame();
  game.click('Controls');
  const back = game.findButton('Back');
  const key = game.event('keydown', { code: 'Enter', target: back });
  assert.equal(key.defaultPrevented, false);
  assert.equal(game.eval('anyEdge'), false);
  back.click(); // The browser dispatches this default click after Enter.
  game.step();
  assert.equal(game.eval('state'), 'title');
  const play = game.findButton('Play');
  game.event('keydown', { code: 'Space', target: play });
  play.click();
  assert.equal(game.eval('state'), 'characters');
  game.click('Start game');
  game.step();
  assert.equal(game.eval('state'), 'play');
  assert.equal(game.eval('jumpEdge'), false);
  assert.equal(game.eval('held("jump")'), false);
});

test('P and Escape work when the native pause controls own keyboard focus', () => {
  const game = createGame();
  game.click('Play');game.click('Start game');
  game.element('pause-button').focus();
  game.event('keydown', { code: 'KeyP', target: game.element('pause-button') });
  assert.equal(game.eval('state'), 'pause');
  const resume = game.findButton('Resume');
  assert.equal(game.document.activeElement, resume);
  game.event('keydown', { code: 'KeyP', target: resume });
  assert.equal(game.eval('state'), 'play');
  game.event('keydown', { code: 'Escape', target: game.element('pause-button') });
  assert.equal(game.eval('state'), 'pause');
  game.event('keydown', { code: 'Escape', target: game.findButton('Resume') });
  assert.equal(game.eval('state'), 'play');
});

test('held pause keys cannot toggle repeatedly after input is cleared', () => {
  const game = createGame();
  game.click('Play');game.click('Start game');
  game.event('keydown', { code: 'KeyP' });
  assert.equal(game.eval('state'), 'pause');
  game.event('keydown', { code: 'KeyP', repeat: true });
  game.event('keydown', { code: 'Escape', repeat: true });
  assert.equal(game.eval('state'), 'pause');
  game.click('Resume');
  game.event('keydown', { code: 'KeyP', repeat: true });
  assert.equal(game.eval('state'), 'play');
});

test('opening controls and settings from pause freezes the run and returns to pause', () => {
  const game = createGame();
  game.click('Play');game.click('Start game');
  game.step(20);
  game.click('pause-button');
  const paused = progress(game);
  game.click('Settings');
  game.step(120);
  assert.deepEqual(progress(game), paused);
  game.click('Back');
  assert.equal(game.eval('state'), 'pause');
  game.click('Controls');
  game.step(60);
  assert.deepEqual(progress(game), paused);
  game.event('keydown', { code: 'Escape', target: game.findButton('Back') });
  assert.equal(game.eval('state'), 'pause');
  game.click('Resume');
  assert.equal(game.eval('state'), 'play');
});

test('title settings and controls return with Escape without starting a run', () => {
  const game = createGame();
  for (const name of ['Settings', 'Controls']) {
    game.click(name);
    game.event('keydown', { code: 'Escape', target: game.document.activeElement });
    game.step();
    assert.equal(game.eval('state'), 'title');
  }
});

test('audio range changes update the live effects bus and survive reloading', () => {
  const game = createGame();
  game.click('Settings');
  assert.equal(game.element('effects-volume').value, '65');
  assert.equal(game.element('music-volume').value, '35');
  assert.match(game.element('menu-content').textContent, /Music is coming soon/);
  game.input('effects-volume', 0);
  game.input('music-volume', 80);
  assert.deepEqual(game.snapshot('settings'), { effects: 0, music: .8 });
  assert.equal(game.eval('effectsGain.gain.value'), 0);
  game.eval('SFX.coin()');
  game.flushTimeouts();
  assert.equal(game.eval('effectsGain.gain.value'), 0, 'delayed effects remain on the muted bus');
  game.input('effects-volume', 100);
  assert.equal(game.eval('effectsGain.gain.value'), 1);
  const reloaded = createGame({ saved: Object.fromEntries(game.storage) });
  assert.deepEqual(reloaded.snapshot('settings'), { effects: 1, music: .8 });
});

test('range keyboard events retain native behavior and do not trigger gameplay', () => {
  const game = createGame();
  game.click('Settings');
  const range = game.element('effects-volume');
  for (const code of ['ArrowLeft', 'ArrowRight', 'Space', 'Enter']) {
    const event = game.event('keydown', { code, target: range });
    assert.equal(event.defaultPrevented, false);
    assert.equal(game.eval('anyEdge'), false);
    assert.equal(game.eval('jumpEdge'), false);
    assert.equal(game.eval('state'), 'settings');
  }
});

test('settings clamp numeric saved values and reject malformed or wrong-type values', () => {
  const clamped = createGame({ saved: { coinhopper_settings: '{"music":2,"effects":-1}' } });
  assert.deepEqual(clamped.snapshot('settings'), { music: 1, effects: 0 });
  for (const value of ['{bad json', 'null', '[]', '{"music":"0.8","effects":null}', '{"music":1e999,"effects":{}}']) {
    const game = createGame({ saved: { coinhopper_settings: value } });
    assert.deepEqual(game.snapshot('settings'), { music: .35, effects: .65 });
  }
});

test('blocked browser storage does not prevent settings or gameplay', () => {
  const game = createGame({ storageBlocked: true });
  game.click('Settings');
  assert.doesNotThrow(() => game.input('effects-volume', 25));
  assert.equal(game.eval('settings.effects'), .25);
  game.click('Back');
  game.click('Play');game.click('Start game');
  assert.equal(game.eval('state'), 'play');
});

test('restart cancel and Escape leave all earned level progress intact', () => {
  const game = createGame();
  game.eval('newGame();score=270;levelScore=70;timer=12;lives=2;coins[0].got=1;enemies[0].dead=.4');
  game.click('pause-button');
  const before = progress(game);
  game.click('Restart level');
  assert.equal(game.eval('state'), 'restart');
  game.step(60);
  assert.deepEqual(progress(game), before);
  assert.match(game.element('menu-description').textContent, /remaining lives stay the same/);
  game.click('Cancel');
  assert.equal(game.eval('state'), 'pause');
  assert.deepEqual(progress(game), before);
  game.click('Restart level');
  game.event('keydown', { code: 'Escape', target: game.document.activeElement });
  assert.equal(game.eval('state'), 'pause');
  assert.deepEqual(progress(game), before);
});

test('confirmed restart resets only current-level points, coins, timer, and objects', () => {
  const game = createGame();
  game.eval('newGame();startLevel(1);score=290;levelScore=90;timer=18;lives=2;coins[0].got=1;enemies[0].dead=.4');
  game.click('pause-button');
  game.click('Restart level');
  game.click('Restart level');
  assert.deepEqual(game.snapshot('({state,lvl,lives,score,levelScore,timer,got:coins.filter(c=>c.got).length,coinCount:coins.length,enemyCount:enemies.length,atStart:pl.x===start.x&&pl.y===start.y})'), {
    state: 'play', lvl: 1, lives: 2, score: 200, levelScore: 0, timer: 0,
    got: 0, coinCount: 21, enemyCount: 5, atStart: true,
  });
  // Recollecting and restarting cannot add points to earlier levels.
  game.eval('coins[0].got=1;score+=10;levelScore+=10');
  game.click('pause-button');
  game.click('Restart level');
  game.click('Restart level');
  assert.equal(game.eval('score'), 200);
  assert.equal(game.eval('lives'), 2);
});

test('touch entry from the native title enables controls before the first canvas tap', () => {
  const game = createGame();
  game.domEvent('menu', 'pointerdown', { pointerType: 'touch' });
  game.click('Play');game.click('Start game');
  assert.equal(game.eval('touchMode'), true);
  assert.equal(game.element('pause-button').hidden, true);
  game.canvasEvent('touchstart', { touches: [{ clientX: 190, clientY: 470 }, { clientX: 875, clientY: 465 }] });
  assert.equal(game.eval('held("right")'), true);
  assert.equal(game.eval('held("jump")'), true);
  game.canvasEvent('touchcancel', { touches: [] });
  assert.equal(game.eval('held("right")'), false);
  assert.equal(game.eval('held("jump")'), false);
});

test('pause clears active keyboard and touch input and ignores canvas menu taps', () => {
  const game = createGame();
  game.click('Play');game.click('Start game');
  game.event('keydown', { code: 'KeyD' });
  game.canvasEvent('touchstart', { touches: [{ clientX: 875, clientY: 465 }] });
  game.canvasEvent('touchstart', { touches: [{ clientX: 920, clientY: 40 }] });
  assert.equal(game.eval('state'), 'pause');
  assert.deepEqual(game.snapshot('({right:held("right"),jump:held("jump"),jumpEdge,anyEdge})'),
    { right: false, jump: false, jumpEdge: false, anyEdge: false });
  game.canvasEvent('touchstart', { touches: [{ clientX: 875, clientY: 465 }] });
  game.step();
  assert.equal(game.eval('state'), 'pause');
  game.click('Resume');
  assert.equal(game.eval('held("right")'), false);
  assert.equal(game.eval('held("jump")'), false);
});

test('completion shows collected coins through deaths and advances using its native action', () => {
  const game = createGame();
  game.eval('newGame();coins[0].got=1;coins[1].got=1;score=20;levelScore=20;pl.inv=0;hurt();enemies=[];pl.x=flag.x;pl.vx=0');
  game.step();
  assert.equal(game.eval('state'), 'done');
  assert.match(game.element('menu-content').textContent, /Coins: 2 \/ 20/);
  game.click('Next level');
  assert.equal(game.eval('lvl'), 1);
  assert.equal(game.eval('state'), 'play');
  assert.equal(game.eval('lives'), 2);
});

test('returning to the title saves the best and Play starts a fresh run', () => {
  const game = createGame();
  game.eval('newGame();score=170;levelScore=70;lives=2');
  game.click('pause-button');
  game.click('Title screen');
  assert.equal(game.eval('state'), 'title');
  assert.equal(game.storage.get('coinhopper_best'), '170');
  game.click('Play');game.click('Start game');
  assert.deepEqual(game.snapshot('({lvl,score,lives,best})'), { lvl: 0, score: 0, lives: 3, best: 170 });
});

test('stale native Play and Next clicks cannot restart or skip a level', () => {
  const game = createGame();
  const play = game.findButton('Play');
  play.click();game.click('Start game');
  game.step(20);
  const playing = progress(game);
  play.click();
  assert.deepEqual(progress(game), playing);
  game.eval('enemies=[];pl.x=flag.x;pl.vx=0');
  game.step();
  assert.equal(game.eval('state'), 'done');
  const next = game.findButton('Next level');
  next.click();
  assert.equal(game.eval('lvl'), 1);
  const nextLevel = progress(game);
  next.click();
  assert.deepEqual(progress(game), nextLevel);
});
