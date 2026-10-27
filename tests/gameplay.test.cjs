const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createGame, onFlatGround } = require('./harness.cjs');

const originalLevels = [
  ['Sunny Meadow', 'f67ca0f2c947debe4b79c485bbcd41bd888baf27ec588f6b9fb65222ee1485b6', 20, 3],
  ['Brick Hills', '6924250be597204c96cfcbd070a8494e9051806e5b0850db5e39c585bafbbcc1', 21, 5],
  ['Starry Night', '2a6c12f1759e0d4a008239125ec83fc29e6f8813d18359aa6b515e14359640a4', 22, 7],
];

test('all three archived foundation maps, names, and order stay unchanged', () => {
  const levels = createGame().snapshot('FOUNDATION_LEVELS');
  assert.ok(levels.length >= 4);
  for (let i = 0; i < originalLevels.length; i++) {
    assert.equal(levels[i].name, originalLevels[i][0]);
    assert.equal(crypto.createHash('sha256').update(levels[i].map.join('\n')).digest('hex'), originalLevels[i][1]);
  }
});

test('each original level loads its coins, enemies, spawn, and supported flag', () => {
  const game = createGame();
  originalLevels.forEach(([, , coinCount, enemyCount], i) => {
    game.eval(`startLevel(${i})`);
    const actual = game.snapshot(`({
      state,lvl,coinCount:coins.length,enemyCount:enemies.length,
      rows:grid.length,width:LW,rectangular:grid.every(row=>row.length===LW),
      spawnMatches:pl.x===start.x&&pl.y===start.y,
      flagSupported:isSolid(flag.x/T,flag.y/T+1),
      removedMarkers:!grid.flat().some(tile=>'oeFP'.includes(tile))
    })`);
    assert.deepEqual(actual, {
      state: 'play', lvl: i, coinCount:coinCount+17, enemyCount:enemyCount+3, rows: 15,
      width: [174, 180, 182][i], rectangular: true, spawnMatches: true,
      flagSupported: true, removedMarkers: true,
    });
  });
});

test('keyboard movement accelerates to the existing speed cap and stops on release', () => {
  const game = onFlatGround(createGame());
  game.event('keydown', { code: 'KeyD' });
  game.step(20);
  assert.equal(game.eval('pl.vx'), 260);
  assert.ok(game.eval('pl.x') > 144);
  game.event('keyup', { code: 'KeyD' });
  game.step(10);
  assert.equal(game.eval('pl.vx'), 0);
  game.event('keydown', { code: 'ArrowLeft' });
  game.step(20);
  assert.equal(game.eval('pl.vx'), -260);
  assert.equal(game.eval('pl.face'), -1);
});

test('tile collisions stop horizontal movement and prevent falling through the floor', () => {
  const game = onFlatGround(createGame());
  game.eval("grid[12][5]='#';pl.x=5*T-pl.w-1;pl.vx=260;keys.ArrowRight=true");
  game.step();
  assert.equal(game.eval('pl.x+pl.w'), 5 * 36);
  assert.equal(game.eval('pl.vx'), 0);
  game.eval('keys.ArrowRight=false');
  game.step(60);
  assert.equal(game.eval('pl.y+pl.h'), 13 * 36);
  assert.equal(game.eval('pl.ground'), true);
});

test('holding jump preserves a higher jump than releasing it early', () => {
  function jumpPeak(release) {
    const game = onFlatGround(createGame());
    game.event('keydown', { code: 'Space' });
    game.step();
    assert.equal(game.eval('pl.vy'), -610);
    if (release) game.event('keyup', { code: 'Space' });
    let peak = game.eval('pl.y');
    for (let i = 0; i < 60; i++) {
      game.step();
      peak = Math.min(peak, game.eval('pl.y'));
    }
    assert.equal(game.eval('pl.ground'), true);
    return 436 - peak;
  }
  const high = jumpPeak(false), low = jumpPeak(true);
  assert.ok(high > 100 && high < 120, `held jump height: ${high}`);
  assert.ok(high - low > 40, `held ${high}, released ${low}`);
});

test('coyote time allows a recent ledge departure but expires', () => {
  const game = onFlatGround(createGame());
  game.eval('pl.y=350;pl.ground=false;pl.coyote=.08');
  game.event('keydown', { code: 'Space' });
  game.step();
  assert.equal(game.eval('pl.vy'), -610);
  const expired = onFlatGround(createGame());
  expired.eval('pl.y=350;pl.ground=false;pl.coyote=0');
  expired.event('keydown', { code: 'Space' });
  expired.step();
  assert.equal(expired.eval('pl.vy'), 30);
});

test('a jump pressed just before landing is buffered and fires on landing', () => {
  const game = onFlatGround(createGame());
  game.eval('pl.y=13*T-pl.h-1;pl.vy=120;pl.ground=false;pl.coyote=-1');
  game.event('keydown', { code: 'KeyW' });
  game.step();
  assert.equal(game.eval('pl.ground'), true);
  assert.ok(game.eval('pl.buf') > 0);
  game.step();
  assert.equal(game.eval('pl.vy'), -610);
  assert.equal(game.eval('pl.ground'), false);
});

test('damage consumes one life, respawns with grace, and preserves level progress', () => {
  const game = createGame();
  game.eval('newGame();pl.inv=0;score=70;levelScore=70;timer=12;coins[0].got=1;enemies[0].dead=.4');
  game.eval('hurt()');
  assert.deepEqual(game.snapshot('({lives,score,levelScore,timer,inv:pl.inv,atStart:pl.x===start.x&&pl.y===start.y,coinKept:!!coins[0].got,dead:enemies[0].dead})'), {
    lives: 2, score: 70, levelScore: 70, timer: 12, inv: 1,
    atStart: true, coinKept: true, dead: .4,
  });
  game.eval('hurt()');
  assert.equal(game.eval('lives'), 2);
  game.step(61);
  game.eval('hurt()');
  assert.equal(game.eval('lives'), 1);
});

test('falling costs a life even during spawn grace', () => {
  const game = onFlatGround(createGame());
  game.eval('pl.inv=1;pl.y=ROWS*T+60');
  game.step();
  assert.equal(game.eval('lives'), 2);
  assert.equal(game.eval('pl.x===start.x&&pl.y===start.y'), true);
});

test('coins score once and remain collected after damage', () => {
  const game = onFlatGround(createGame());
  game.eval('coins=[{x:pl.x+13,y:pl.y+16,t:0}]');
  game.step(2);
  assert.deepEqual(game.snapshot('({score,levelScore,got:coins[0].got})'), { score: 10, levelScore: 10, got: 1 });
  game.eval('pl.inv=0;hurt()');
  assert.equal(game.eval('score'), 10);
  assert.equal(game.eval('coins[0].got'), 1);
});

test('stomping awards 50 once and holding jump increases the bounce', () => {
  function stomp(held) {
    const game = onFlatGround(createGame());
    game.eval(`pl.y=390;pl.vy=200;pl.ground=false;keys.Space=${held};
      enemies=[{x:pl.x,y:420,w:28,h:28,vx:0,vy:0,dead:0,ground:false}]`);
    game.step();
    assert.deepEqual(game.snapshot('({score,levelScore,dead:enemies[0].dead})'), { score: 50, levelScore: 50, dead: .4 });
    const bounce = game.eval('pl.vy');
    game.step(10);
    assert.equal(game.eval('score'), 50);
    return bounce;
  }
  assert.equal(stomp(false), -380);
  assert.equal(stomp(true), -560);
});

test('stomped enemies disappear when their countdown expires', () => {
  const game = onFlatGround(createGame());
  game.eval('enemies=[{x:500,y:440,w:28,h:28,vx:0,vy:0,dead:.4,ground:true}]');
  game.step(10);
  assert.equal(game.eval('enemies.length'), 1);
  game.step(15);
  assert.equal(game.eval('enemies.length'), 0);
});

test('an enemy countdown exactly one step long cannot revive the enemy', () => {
  const game = onFlatGround(createGame());
  game.eval('enemies=[{x:pl.x,y:pl.y,w:28,h:28,vx:0,vy:0,dead:DT,ground:true}]');
  game.step(2);
  assert.equal(game.eval('enemies.length'), 0);
  assert.equal(game.eval('lives'), 3);
  assert.equal(game.eval('score'), 0);
});

test('enemies that fall out of the level are removed without awarding points', () => {
  const game = onFlatGround(createGame());
  game.eval('enemies=[{x:500,y:ROWS*T+60,w:28,h:28,vx:0,vy:0,dead:0,ground:false}]');
  game.step();
  assert.equal(game.eval('enemies.length'), 0);
  assert.equal(game.eval('score'), 0);
});

test('spike damage ends the tick before death-position coin collection', () => {
  const game = onFlatGround(createGame());
  game.eval("grid[12][4]='^';coins=[{x:pl.x+13,y:pl.y+16,t:0}]");
  game.step();
  assert.deepEqual(game.snapshot('({lives,score,state,coinGot:!!coins[0].got,atStart:pl.x===start.x})'), {
    lives: 2, score: 0, state: 'play', coinGot: false, atStart: true,
  });
});

test('enemy damage cannot complete a level from the old player position', () => {
  const game = onFlatGround(createGame());
  game.eval('flag.x=pl.x;enemies=[{x:pl.x,y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true}]');
  game.step();
  assert.deepEqual(game.snapshot('({lives,score,state,atStart:pl.x===start.x})'), {
    lives: 2, score: 0, state: 'play', atStart: true,
  });
});

test('last-life spike damage stays game over with zero lives and no completion bonus', () => {
  const game = onFlatGround(createGame());
  game.eval("lives=1;pl.x=4*T+24;grid[12][4]='^';grid[12][5]='^';flag.x=pl.x");
  game.step();
  assert.deepEqual(game.snapshot('({state,lives,score})'), { state: 'over', lives: 0, score: 0 });
});

test('last-life enemy damage stays game over even when the flag is crossed', () => {
  const game = onFlatGround(createGame());
  game.eval('lives=1;flag.x=pl.x;enemies=[{x:pl.x,y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true}]');
  game.step();
  assert.deepEqual(game.snapshot('({state,lives,score})'), { state: 'over', lives: 0, score: 0 });
});

test('damage does not run again after the final life has been lost', () => {
  const game = onFlatGround(createGame());
  game.eval('lives=1;hurt();hurt()');
  assert.equal(game.eval('lives'), 0);
  assert.equal(game.eval('state'), 'over');
});

test('pause and blur freeze player, enemies, level timer, and score', () => {
  const game = createGame();
  game.eval('newGame()');
  game.event('keydown', { code: 'KeyP' });
  assert.equal(game.eval('state'), 'pause');
  const before = game.snapshot('({pl,enemies,timer,score})');
  game.step(30);
  assert.deepEqual(game.snapshot('({pl,enemies,timer,score})'), before);
  game.event('keyup', { code: 'KeyP' });
  game.event('keydown', { code: 'KeyP' });
  assert.equal(game.eval('state'), 'play');
  game.event('keydown', { code: 'KeyD' });
  game.event('blur');
  assert.equal(game.eval('state'), 'pause');
  assert.equal(game.eval('held("right")'), false);
});

test('completion scores once, advances all four levels, and saves the best score', () => {
  const game = createGame();
  game.event('keydown', { code: 'Enter' });
  game.step();
  game.event('keyup', { code: 'Enter' });
  assert.equal(game.eval('state'), 'characters');
  game.click('Start game');
  for (let i = 0; i < 4; i++) {
    assert.equal(game.eval('lvl'), i);
    game.eval('enemies=[];pl.x=flag.x;pl.vx=0;timer=10');
    game.step();
    assert.equal(game.eval('state'), 'done');
    assert.equal(game.eval('levelScore'), 350);
    assert.equal(game.eval('score'), (i + 1) * 350);
    game.step(2);
    assert.equal(game.eval('score'), (i + 1) * 350);
    game.event('keydown', { code: 'Enter' });
    game.step();
    game.event('keyup', { code: 'Enter' });
  }
  assert.equal(game.eval('state'), game.eval('LEVELS.length')>4?'play':'win');
  assert.equal(game.storage.get('coinhopper_best'), '1400');
  const reloaded = createGame({ saved: Object.fromEntries(game.storage) });
  assert.equal(reloaded.eval('best'), 1400);
  if(game.eval('state')==='play'){game.click('pause-button');game.click('Title screen');}
  else{game.event('keydown', { code: 'Enter' });game.step();game.event('keyup', { code: 'Enter' });}
  assert.equal(game.eval('state'), 'title');
  game.event('keydown', { code: 'Enter' });
  game.step();
  game.click('Start game');
  assert.deepEqual(game.snapshot('({lvl,lives,score,best})'), { lvl: 0, lives: 3, score: 0, best: 1400 });
});

test('the actual animation loop draws title and gameplay without throwing', () => {
  const game = createGame();
  assert.doesNotThrow(() => game.frame(17));
  game.event('keydown', { code: 'Enter' });
  assert.doesNotThrow(() => game.frame(34));
  assert.equal(game.eval('state'), 'characters');
  game.click('Start game');
  assert.doesNotThrow(() => game.frame(51));
  assert.equal(game.eval('state'), 'play');
});
