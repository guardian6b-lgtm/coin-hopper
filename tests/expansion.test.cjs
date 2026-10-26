const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, onFlatGround } = require('./harness.cjs');

const hopper = "{x:500,y:440,w:28,h:28,vx:-55,vy:0,dead:0,ground:true,type:'hopper',hop:.7}";
const progress = game => game.snapshot('({pl,enemies,shields,coins,timer,score,levelScore,lives})');

// Collision fixtures isolate each interaction; recorded input routes separately
// prove reachability using the unmodified maps and real input handlers.
test('Moonlit Gardens is exactly the fourth level with a supported start and finish', () => {
  const game = createGame();
  game.eval('newGame();startLevel(3)');
  assert.deepEqual(game.snapshot(`({count:LEVELS.length,name:LEVELS[lvl].name,
    shieldCount:shields.length,hoppers:enemies.filter(e=>e.type==='hopper').length,
    walkers:enemies.filter(e=>!e.type).length,coins:coins.length,
    width:LW,rows:grid.length,safeStart:isSolid(Math.floor(start.x/T),13),
    safeFinish:isSolid(flag.x/T,flag.y/T+1),
    markersRemoved:!grid.flat().some(c=>'hSoeFP'.includes(c)),
    initialShield:pl.shield})`), {
    count: 4, name: 'Moonlit Gardens', shieldCount: 2, hoppers: 4,
    walkers: 2, coins: 24, width: 109, rows: 15,
    safeStart: true, safeFinish: true, markersRemoved: true, initialShield: false,
  });
});

test('the original levels have no new enemies or shield pickups', () => {
  const game = createGame();
  for (let i = 0; i < 3; i++) {
    game.eval(`startLevel(${i})`);
    assert.equal(game.eval("shields.length===0 && enemies.every(e=>!e.type) && !pl.shield"), true);
  }
});

test('hoppers launch and land on a deterministic rhythm while walkers keep walking', () => {
  const game = onFlatGround(createGame());
  game.eval(`enemies=[${hopper},{x:600,y:440,w:28,h:28,vx:-55,vy:0,dead:0,ground:true}]`);
  const launches = [];
  let wasRising = false;
  for (let tick = 0; tick < 160; tick++) {
    game.step();
    const rising = game.eval('enemies[0].vy<0');
    if (rising && !wasRising) launches.push(tick);
    wasRising = rising;
    assert.equal(game.eval('enemies[1].ground && enemies[1].vy===0'), true);
  }
  assert.equal(launches.length, 3);
  assert.ok(launches[0] >= 40 && launches[0] <= 43);
  assert.ok(launches.slice(1).every((tick, i) => tick - launches[i] === 57));
  assert.ok(game.eval('enemies[0].x<500 && enemies[1].x<600'));
});

test('hoppers turn at walls and ledges instead of walking off their platform', () => {
  for (const obstacle of ["grid[12][13]='#'", "grid[13][13]=' '"]) {
    const game = onFlatGround(createGame());
    game.eval(`enemies=[${hopper}];enemies[0].x=14*T;${obstacle}`);
    game.step();
    assert.equal(game.eval('enemies[0].vx'), 55);
  }
});

test('hoppers use the existing stomp points, bounce and defeat cleanup', () => {
  for (const held of [false, true]) {
    const game = onFlatGround(createGame());
    game.eval(`pl.y=390;pl.vy=200;pl.ground=false;keys.Space=${held};pl.shield=true;
      enemies=[${hopper}];Object.assign(enemies[0],{x:pl.x,y:420,vx:0,ground:false})`);
    game.step();
    assert.deepEqual(game.snapshot('({score,levelScore,lives,shield:pl.shield,dead:enemies[0].dead,bounce:pl.vy})'), {
      score: 50, levelScore: 50, lives: 3, shield: true, dead: .4, bounce: held ? -560 : -380,
    });
    game.step(25);
    assert.equal(game.eval('enemies.length'), 0);
    assert.equal(game.eval('score'), 50);
  }
});

test('a shieldless hopper side hit consumes exactly one life', () => {
  const game = onFlatGround(createGame());
  game.eval(`enemies=[${hopper}];enemies[0].x=pl.x;enemies[0].vx=0`);
  game.step();
  assert.deepEqual(game.snapshot('({lives,state,score,shield:pl.shield,atStart:pl.x===start.x})'), {
    lives: 2, state: 'play', score: 0, shield: false, atStart: true,
  });
});

test('shield collection gives protection without changing any score or lives', () => {
  const game = onFlatGround(createGame());
  game.eval('shields=[{x:pl.x+13,y:pl.y+16,got:false}]');
  game.step(2);
  assert.deepEqual(game.snapshot('({shield:pl.shield,got:shields[0].got,score,levelScore,lives})'), {
    shield: true, got: true, score: 0, levelScore: 0, lives: 3,
  });
});

test('shields do not stack or consume a second pickup while already protected', () => {
  const game = onFlatGround(createGame());
  game.eval('pl.shield=true;shields=[{x:pl.x+13,y:pl.y+16,got:false}]');
  game.step();
  assert.equal(game.eval('shields[0].got'), false);
  game.eval('hurt()');
  assert.equal(game.eval('pl.shield'), false);
  game.step();
  assert.equal(game.eval('pl.shield && shields[0].got'), true);
});

test('both walkers and hoppers consume one shield without consuming a life or respawning', () => {
  for (const type of ['', "type:'hopper',hop:.7,"]) {
    const game = onFlatGround(createGame());
    game.eval(`pl.shield=true;score=70;levelScore=70;
      enemies=[{${type}x:pl.x,y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true}]`);
    const x = game.eval('pl.x');
    game.step();
    assert.deepEqual(game.snapshot('({shield:pl.shield,lives,score,levelScore,x:pl.x,inv:pl.inv})'), {
      shield: false, lives: 3, score: 70, levelScore: 70, x, inv: 1,
    });
    game.step(20);
    assert.equal(game.eval('lives'), 3, 'recovery protects against repeated overlap');
    game.step(42);
    assert.equal(game.eval('lives'), 2, 'the next unprotected hit consumes a life');
  }
});

test('a shield absorbs spike contact once, including adjacent spikes in one tick', () => {
  const game = onFlatGround(createGame());
  game.eval("pl.shield=true;pl.x=4*T+24;grid[12][4]='^';grid[12][5]='^'");
  game.step();
  assert.deepEqual(game.snapshot('({shield:pl.shield,lives,score,state,inv:pl.inv})'), {
    shield: false, lives: 3, score: 0, state: 'play', inv: 1,
  });
  game.step(20);
  assert.equal(game.eval('lives'), 3);
  game.step(42);
  assert.equal(game.eval('lives'), 2);
});

test('shield hits preserve the final life; the next unprotected hit reaches Game Over', () => {
  const game = onFlatGround(createGame());
  game.eval('lives=1;pl.shield=true;hurt()');
  assert.equal(game.eval("state==='play' && lives===1 && !pl.shield"), true);
  game.eval('pl.inv=0;hurt()');
  assert.equal(game.eval("state==='over' && lives===0 && !pl.shield"), true);
});

test('recovery invulnerability does not spend a shield on an otherwise harmless hit', () => {
  const game = onFlatGround(createGame());
  game.eval('pl.shield=true;pl.inv=.5;hurt()');
  assert.equal(game.eval('pl.shield && lives===3'), true);
});

test('pits bypass shield and recovery immunity and clear protection on death/game over', () => {
  for (const lives of [3, 1]) {
    const game = onFlatGround(createGame());
    game.eval(`pl.shield=true;pl.inv=1;pl.y=ROWS*T+60;lives=${lives}`);
    game.step();
    assert.equal(game.eval('lives'), lives - 1);
    assert.equal(game.eval('pl.shield'), false);
    assert.equal(game.eval('state'), lives === 1 ? 'over' : 'play');
  }
});

test('a shield hit ends the tick before death-position coins or a finish award', () => {
  const game = onFlatGround(createGame());
  game.eval("pl.shield=true;grid[12][4]='^';coins=[{x:pl.x+13,y:pl.y+16,t:0}];flag.x=pl.x");
  game.step();
  assert.deepEqual(game.snapshot('({score,got:!!coins[0].got,state,lives})'), {
    score: 0, got: false, state: 'play', lives: 3,
  });
});

test('pause/settings/controls freeze shield state and the hopper hop timer', () => {
  const game = createGame();
  game.eval('newGame();startLevel(3);pl.shield=true');
  game.click('pause-button');
  const before = progress(game);
  for (const menu of ['Settings', 'Controls']) {
    game.click(menu);game.step(120);
    assert.deepEqual(progress(game), before);
    game.click('Back');
  }
  game.click('Resume');game.step(2);
  assert.notDeepEqual(progress(game), before);
  assert.equal(game.eval('pl.shield'), true);
});

test('restart cancellation keeps protection; confirmation resets pickups/hoppers and current points', () => {
  const game = createGame();
  game.eval('newGame();startLevel(3);pl.shield=true;shields[0].got=true;enemies[0].hop=.1;score=470;levelScore=70;lives=2');
  game.click('pause-button');const before = progress(game);
  game.click('Restart level');game.click('Cancel');
  assert.deepEqual(progress(game), before);
  game.click('Restart level');game.click('Restart level');
  assert.deepEqual(game.snapshot('({shield:pl.shield,pickupsReady:shields.every(s=>!s.got),hop:enemies[0].hop,score,levelScore,lives,lvl,timer})'), {
    shield: false, pickupsReady: true, hop: .7, score: 400, levelScore: 0, lives: 2, lvl: 3, timer: 0,
  });
});

test('death clears protection but keeps consumed pickups and earned progress until restart', () => {
  const game = createGame();
  game.eval('newGame();startLevel(3);shields[0].got=true;pl.shield=true;score=30;levelScore=30;hurt(true)');
  assert.deepEqual(game.snapshot('({shield:pl.shield,got:shields[0].got,score,levelScore,lives})'), {
    shield: false, got: true, score: 30, levelScore: 30, lives: 2,
  });
});

test('level transitions and a new run reset protection and show four-level completion', () => {
  const game = createGame();
  game.eval('newGame();startLevel(2);pl.shield=true;enemies=[];pl.x=flag.x;pl.vx=0');game.step();
  game.click('Next level');
  assert.equal(game.eval('lvl===3 && !pl.shield && shields.length===2'), true);
  game.eval('pl.shield=true;enemies=[];pl.x=flag.x;pl.vx=0');game.step();
  assert.equal(game.eval('pl.shield'), false, 'completion clears protection before the win screen');
  assert.ok(game.findButton('Finish'));
  game.click('Finish');
  assert.equal(game.eval('state'), 'win');
  assert.match(game.element('menu-description').textContent, /All 4 levels complete/);
  game.click('Title screen');game.click('Play');game.click('Start game');
  assert.equal(game.eval('lvl===0 && !pl.shield && shields.length===0 && lives===3 && score===0'), true);
});

test('Moonlit Gardens renders with shield, hopping enemies and touch controls', () => {
  const game = createGame();
  game.eval('newGame();startLevel(3);pl.shield=true;touchMode=true');
  assert.doesNotThrow(() => game.frame(17));
  game.canvasEvent('touchstart', { touches: [{ clientX: 190, clientY: 470 }, { clientX: 875, clientY: 465 }] });
  assert.equal(game.eval('held("right") && held("jump")'), true);
  game.canvasEvent('touchcancel', { touches: [] });
  assert.equal(game.eval('held("right") || held("jump")'), false);
});
