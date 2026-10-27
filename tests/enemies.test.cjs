const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, onFlatGround } = require('./harness.cjs');
const types = ['shellback', 'sentinel'];
const heroes = ['hopper', 'minty', 'ember', 'nova', 'bolt'];
function setup(type = 'shellback', hero = 'hopper') {
  const game = onFlatGround(createGame({ saved: { coinhopper_character_v1: hero } }));
  game.eval(`shields=[];enemies=[createEnemy('${type}',300,0)];enemies[0].y=13*T-enemies[0].h;enemies[0].vx=0;enemies[0].ground=true;enemies[0].attackTimer=999`);
  return game;
}
function stomp(game) {
  game.eval('pl.x=enemies[0].x;pl.y=enemies[0].y-pl.h-2;pl.vx=0;pl.vy=200;pl.ground=false;pl.coyote=0;pl.buf=0;jumpEdge=false');game.step();
}
function safeWait(game, ticks) {
  game.eval('pl.x=144;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true');game.step(ticks);
}
function cast(game) {game.event('keydown', { code: 'KeyE' });game.event('keyup', { code: 'KeyE' });game.step();}
function shot(game, code = '') {
  game.eval(`enemyCombat.projectiles.push({owner:enemies[0],x:pl.x+13,y:pl.y+16,vx:0,vy:0,radius:6,life:3${code}})`);
}

test('the factory gives every enemy explicit health and preserves legacy marker conventions', () => {
  const game = setup();
  for (const [type, health] of [['walker', 1], ['hopper', 1], ['shellback', 2], ['sentinel', 2]]) {
    assert.deepEqual(game.snapshot(`(()=>{const e=createEnemy('${type}',100,200);return [e.health,e.maxHealth,e.dead]})()`), [health, health, 0]);
  }
  assert.equal(game.eval("createEnemy('walker',0,0).type"), undefined);
  assert.equal(game.eval("createEnemy('hopper',0,0).hop"), .7);
  assert.throws(() => game.eval("createEnemy('boss',0,0)"), /Unknown enemy/);
});

test('all four maps load only the same one-hit walkers and hoppers', () => {
  const game = createGame();
  for (let i = 0; i < 4; i++) {
    game.eval(`startLevel(${i})`);
    assert.equal(game.eval('enemies.every(e=>e.health===1&&e.maxHealth===1&&(!e.type||e.type==="hopper"))'), true);
  }
});

for (const type of types) {
  test(`${type}: first hit damages armor with no score, later defeat awards +50 only once`, () => {
    const game = setup(type);
    assert.equal(game.eval("damageEnemy(enemies[0],'fireball')"), true);
    assert.equal(game.eval('enemies[0].health===1&&enemies[0].dead===0&&score===0&&levelScore===0'), true);
    assert.equal(game.eval('enemies[0].hitTime'), .3);assert.equal(game.eval('enemies[0].hitFlash'), .18);
    for (const source of ['stomp', 'slam', 'fireball', 'lightning']) assert.equal(game.eval(`damageEnemy(enemies[0],'${source}')`), false);
    game.step(17);assert.equal(game.eval("damageEnemy(enemies[0],'stomp')"), false);
    game.step();assert.equal(game.eval("damageEnemy(enemies[0],'lightning')"), true);
    assert.equal(game.eval('enemies[0].health===0&&enemies[0].dead===.4&&score===50&&levelScore===50'), true);
    game.step(5);assert.equal(game.eval("damageEnemy(enemies[0],'fireball')"), false);
    game.step(21);assert.equal(game.eval('enemies.length'), 0);assert.equal(game.eval('score'), 50);
  });

  for (const hero of heroes) {
    test(`${hero} defeats the active ${type} from the floor using only legal movement/jump inputs`, () => {
      const game = onFlatGround(createGame({ saved: { coinhopper_character_v1: hero } }));
      game.eval(`shields=[];enemies=[createEnemy('${type}',350,0)];enemies[0].y=13*T-enemies[0].h`);
      game.event('keydown', { code: 'ArrowRight' });
      let approach=0;
      while (game.eval('pl.x<enemies[0].x-45') && approach++<100) game.step();
      assert.ok(approach<100);game.event('keyup', { code: 'ArrowRight' });game.event('keydown', { code: 'Space' });
      let airborne=0;
      while (game.eval('enemies[0]?.health===2&&lives===3') && airborne++<100) game.step();
      assert.ok(airborne<100);assert.equal(game.eval('enemies[0].health'),1);assert.equal(game.eval('score'),0);
      if(type==='shellback'){game.event('keydown',{code:'ArrowLeft'});game.step(7);game.event('keyup',{code:'ArrowLeft'});}
      game.step(90);
      assert.equal(game.eval('score===50&&levelScore===50&&lives===3&&enemies.length===0&&ability.cooldown===0&&!pl.shield'),true);
    });

    test(`${hero} can defeat ${type} with two ordinary stomps and original bounce/scoring`, () => {
      const game = setup(type, hero);stomp(game);
      assert.equal(game.eval('enemies[0].health'), 1);assert.equal(game.eval('score'), 0);
      assert.equal(game.eval('pl.vy'), -380);assert.equal(game.eval('lives'), 3);
      safeWait(game, 19);game.event('keydown', { code: 'Space' });stomp(game);
      assert.equal(game.eval('enemies[0].health'), 0);assert.equal(game.eval('score'), 50);
      assert.equal(game.eval('pl.vy'), -560);assert.equal(game.eval('pl.character'), hero);
    });
  }

  for (const hero of ['hopper', 'ember', 'bolt']) {
    test(`${hero}'s attack deals one HP per cast to ${type}, never points per hit`, () => {
      const game = setup(type, hero);
      game.eval('enemies[0].x=pl.x+55');
      for (let hit = 1; hit <= 2; hit++) {
        if (hero === 'hopper') game.eval('pl.y=330;pl.ground=false;pl.vy=80');
        cast(game);game.step(25);
        assert.equal(game.eval('enemies[0]?.health ?? 0'), 2 - hit);
        assert.equal(game.eval('score'), hit === 1 ? 0 : 50);
        if (hit === 1) safeWait(game, Math.ceil(game.eval('ability.cooldown') * 60));
      }
      game.step(30);assert.equal(game.eval('score'), 50);
    });
  }

  test(`Minty roots ${type} without damage, then it resumes and remains stompable`, () => {
    const game = setup(type, 'minty');game.eval('enemies[0].vx=-40');cast(game);
    assert.equal(game.eval('enemies[0].health'), 2);assert.equal(game.eval('score'), 0);
    const frozen = game.snapshot('({x:enemies[0].x,y:enemies[0].y,attackTimer:enemies[0].attackTimer})');
    game.step(100);assert.deepEqual(game.snapshot('({x:enemies[0].x,y:enemies[0].y,attackTimer:enemies[0].attackTimer})'), frozen);
    game.step(20);assert.ok(game.eval('enemies[0].x') < frozen.x);
    stomp(game);assert.equal(game.eval('enemies[0].health'), 1);
  });

  test(`Nova's active glide still permits a safe one-HP stomp on ${type}`, () => {
    const game = setup(type, 'nova');game.eval('pl.y=300;pl.ground=false;pl.vy=200');cast(game);
    game.eval('pl.x=enemies[0].x;pl.y=enemies[0].y-pl.h-2;pl.vy=200');game.step();
    assert.equal(game.eval('enemies[0].health'), 1);assert.equal(game.eval('score'), 0);
    assert.equal(game.eval('pl.vy'), -380);assert.equal(game.eval('lives'), 3);
  });
}

test('protected armor still bounces a stomp without losing extra HP or granting player invulnerability', () => {
  const game = setup();stomp(game);stomp(game);
  assert.equal(game.eval('enemies[0].health'), 1);assert.equal(game.eval('pl.vy'), -380);
  game.eval('pl.x=enemies[0].x;pl.y=enemies[0].y;pl.vy=0;pl.inv=0');game.step();
  assert.equal(game.eval('lives'), 2);
});

test('a fireball followed by a same-frame stomp cannot defeat fresh armor', () => {
  const game = setup('shellback', 'ember');
  game.eval('pl.x=enemies[0].x;pl.y=enemies[0].y-pl.h+10;pl.vy=200;pl.ground=false');cast(game);
  assert.equal(game.eval('enemies[0].health'), 1);assert.equal(game.eval('score'), 0);
  assert.equal(game.eval('ability.projectiles.length'), 0);
});

test('lightning hits two distinct armored targets once each and never loops back to its first survivor', () => {
  const game = setup('shellback', 'bolt');
  game.eval("enemies.push(createEnemy('sentinel',365,432),createEnemy('shellback',400,440));enemies.forEach(e=>{e.vx=0;e.attackTimer=999})");cast(game);
  assert.deepEqual(game.snapshot('enemies.map(e=>e.health)'), [1, 1, 2]);assert.equal(game.eval('score'), 0);
  safeWait(game, 361);cast(game);
  assert.equal(game.eval('score'), 100);assert.equal(game.eval('enemies[2].health'), 2);
});

test('lightning and fireball still stop at terrain before armored enemies', () => {
  for (const hero of ['ember', 'bolt']) {
    const game = setup('shellback', hero);game.eval("grid[12][6]='#'");cast(game);game.step(40);
    assert.equal(game.eval('enemies[0].health'), 2);assert.equal(game.eval('score'), 0);
  }
});

test('the shared damage API ignores unsupported sources, fallen/dead actors and menus', () => {
  const game = setup();
  for (const source of ['snare', 'glide', 'unknown']) assert.equal(game.eval(`damageEnemy(enemies[0],'${source}')`), false);
  game.click('pause-button');assert.equal(game.eval("damageEnemy(enemies[0],'stomp')"), false);game.click('Resume');
  game.eval('enemies[0].y=ROWS*T+60');assert.equal(game.eval("damageEnemy(enemies[0],'fireball')"), false);
  assert.equal(game.eval('score'), 0);
});

test('Shellback uses its configured slower patrol and reverses at walls and ledges', () => {
  for (const obstacle of ["grid[12][13]='#'", "grid[13][13]=' '"]) {
    const game = setup();game.eval(`enemies[0].x=14*T;enemies[0].vx=-ENEMY_TYPES.shellback.speed;${obstacle}`);game.step();
    assert.equal(game.eval('enemies[0].vx'), 40);assert.equal(game.eval('enemies[0].health'), 2);
  }
});

test('Sentinel waits, visibly charges for 0.8s, then fires a slow locked-aim projectile', () => {
  const game = setup('sentinel');game.eval('resetSentinel(enemies[0])');
  game.step(71);assert.equal(game.eval('enemies[0].attackPhase'), 'wait');
  game.step();assert.equal(game.eval('enemies[0].attackPhase'), 'charge');assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
  const aim = game.snapshot('enemies[0].aim');game.eval('pl.x=200');game.step(47);
  assert.deepEqual(game.snapshot('enemies[0].aim'), aim);assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
  game.step();assert.equal(game.eval('enemyCombat.projectiles.length'), 1);
  assert.ok(Math.abs(game.eval('Math.hypot(enemyCombat.projectiles[0].vx,enemyCombat.projectiles[0].vy)') - 130) < 1e-8);
  assert.ok(Math.abs(game.eval('enemyCombat.projectiles[0].vx') - aim.x * 130) < 1e-8);
  assert.equal(game.eval('enemies[0].attackTimer'), 2.4);
});

test('Sentinel does not acquire through terrain, outside range, or while offscreen', () => {
  for (const condition of ["grid[12][6]='#'", 'enemies[0].x=800', 'enemies[0].x=1300']) {
    const game = setup('sentinel');game.eval(`resetSentinel(enemies[0]);${condition}`);game.step(200);
    assert.equal(game.eval('enemies[0].attackPhase'), 'wait');assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
  }
});

test('an offscreen charging Sentinel cancels its attack rather than firing an unseen shot', () => {
  const game = setup('sentinel');game.eval("enemies[0].x=1300;enemies[0].attackPhase='charge';enemies[0].attackTimer=DT;enemies[0].aim={x:-1,y:0}");game.step();
  assert.equal(game.eval('enemies[0].attackPhase'), 'wait');assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
});

test('Vine Snare pauses a charged Sentinel attack and its timing resumes after release', () => {
  const game = setup('sentinel', 'minty');game.eval('resetSentinel(enemies[0])');game.step(85);cast(game);
  const timer = game.eval('enemies[0].attackTimer');game.step(100);
  assert.equal(game.eval('enemies[0].attackTimer'), timer);assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
  game.step(20);assert.ok(game.eval('enemies[0].attackTimer') < timer);
  game.step(50);assert.equal(game.eval('enemyCombat.projectiles.length'), 1);
});

test('enemy projectiles have continuous wall collision even at high speed and cannot hit through walls', () => {
  for (const speed of [-130, -12000]) {
    const game = setup('sentinel');game.eval("grid[12][6]='#'");shot(game, `,x:300,vx:${speed}`);game.step(50);
    assert.equal(game.eval('enemyCombat.projectiles.length'), 0);assert.equal(game.eval('lives'), 3);
  }
});

test('a wall wins an exact projectile/player collision tie', () => {
  const game = setup('sentinel');game.eval("grid[12][6]='#';pl.x=216;pl.y=436");shot(game, ',x:180,vx:12000');game.step();
  assert.equal(game.eval('lives'), 3);assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
});

test('a swept projectile hit loses one life and clears every shot safely before respawn', () => {
  const game = setup('sentinel');shot(game, ',x:80,vx:12000');shot(game, ',x:500,vx:-130');game.step();
  assert.equal(game.eval('lives'), 2);assert.equal(game.eval('pl.x===start.x&&pl.y===start.y'), true);
  assert.equal(game.eval('enemyCombat.projectiles.length'), 0);assert.equal(game.eval('enemies[0].attackTimer'), 1.2);
});

test('a shield absorbs one shot; another shot during recovery is consumed without another life loss', () => {
  const game = setup('sentinel');game.eval('pl.shield=true');shot(game);shot(game);game.step();
  assert.equal(game.eval('lives===3&&!pl.shield&&pl.inv===1'), true);assert.equal(game.eval('enemyCombat.projectiles.length'), 1);
  game.step();assert.equal(game.eval('lives'), 3);assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
  game.eval('pl.inv=0');shot(game);game.step();assert.equal(game.eval('lives'), 2);
});

test('multiple consumed invulnerability shots do not duplicate surviving projectiles', () => {
  const game = setup('sentinel');game.eval('pl.inv=1');shot(game, ',x:400');shot(game);shot(game);shot(game, ',x:500');game.step();
  assert.deepEqual(game.snapshot('enemyCombat.projectiles.map(p=>p.x)'), [400, 500]);assert.equal(game.eval('lives'), 3);
});

test('shots expire and leaving world bounds removes them without damage or scoring', () => {
  const game = setup('sentinel');shot(game, ',x:500,life:DT');shot(game, ',x:500,y:-35,vy:-130');game.step();
  assert.equal(game.eval('enemyCombat.projectiles.length'), 0);assert.equal(game.eval('lives'), 3);assert.equal(game.eval('score'), 0);
});

test('offscreen hostile shots despawn with a one-tile margin, including after camera movement', () => {
  const game=setup('sentinel');shot(game,',x:1100,y:200');shot(game,',x:500,y:200');game.step();
  assert.deepEqual(game.snapshot('enemyCombat.projectiles.map(p=>p.x)'),[500]);
  game.eval('cam=1500;updateEnemyProjectiles()');
  assert.equal(game.eval('enemyCombat.projectiles.length'),0);assert.equal(game.eval('lives'),3);assert.equal(game.eval('score'),0);
});

test('defeating a Sentinel removes only its owned shots, without farming or friendly-fire points', () => {
  const game = setup('sentinel');shot(game, ',x:500');
  game.eval("enemies.push(createEnemy('sentinel',600,432));enemyCombat.projectiles.push({...enemyCombat.projectiles[0],owner:enemies[1]});damageEnemy(enemies[0],'fireball');enemies[0].hitTime=0;damageEnemy(enemies[0],'stomp')");
  assert.equal(game.eval('score'), 50);assert.equal(game.eval('enemyCombat.projectiles.length'), 1);
  assert.equal(game.eval('enemyCombat.projectiles[0].owner===enemies[1]'), true);
});

test('pause, settings, controls, restart cancel and blur freeze all enemy combat state', () => {
  const game = setup('sentinel');game.eval("damageEnemy(enemies[0],'fireball');enemies[0].attackPhase='charge';enemies[0].attackTimer=.5;enemies[0].aim={x:-1,y:0}");shot(game, ',x:500,vx:-130');
  game.click('pause-button');const before = game.snapshot('({enemyCombat,enemies,pl,score,timer,parts})');
  for (const screen of ['Settings', 'Controls']) {
    game.click(screen);game.step(120);assert.deepEqual(game.snapshot('({enemyCombat,enemies,pl,score,timer,parts})'), before);game.click('Back');
  }
  game.click('Restart level');game.step(120);game.click('Cancel');assert.deepEqual(game.snapshot('({enemyCombat,enemies,pl,score,timer,parts})'), before);
  game.click('Resume');game.event('blur');game.step(120);assert.deepEqual(game.snapshot('({enemyCombat,enemies,pl,score,timer,parts})'), before);
  game.click('Resume');game.step();assert.ok(game.eval('enemies[0].hitTime') < before.enemies[0].hitTime);
});

for (const ending of ['death', 'gameover', 'restart', 'complete', 'title', 'newrun']) {
  test(`${ending} clears hostile projectiles, charges, hit FX and roots with an explicit health policy`, () => {
    const game = setup('sentinel');game.eval("damageEnemy(enemies[0],'fireball');enemies[0].root=1;enemies[0].attackPhase='charge';enemies[0].attackTimer=.5;enemies[0].aim={x:-1,y:0}");shot(game, ',x:500');
    if (ending === 'death' || ending === 'gameover') game.eval(`${ending === 'gameover' ? 'lives=1;' : ''}hurt(true)`);
    else if (ending === 'restart') {game.click('pause-button');game.click('Restart level');game.click('Restart level');}
    else if (ending === 'complete') {game.eval('pl.x=flag.x;pl.vx=0');game.step();}
    else if (ending === 'title') {game.click('pause-button');game.click('Title screen');}
    else game.eval('newGame()');
    assert.equal(game.eval('enemyCombat.projectiles.length'), 0);
    assert.equal(game.eval('enemies.every(e=>!e.root&&!e.hitTime&&!e.hitFlash&&e.attackPhase!=="charge")'), true);
    assert.equal(game.eval('parts.some(p=>p.enemy)'), false);
    if (['death', 'gameover', 'complete'].includes(ending)) assert.equal(game.eval('enemies[0].health'), 1, 'damage persists, avoiding a silent armor heal');
    else assert.equal(game.eval('enemies.every(e=>e.health===e.maxHealth)'), true);
    assert.equal(game.eval('score'), ending === 'complete' ? 400 : 0);
  });
}

test('hostile projectile count is bounded, and new enemy sounds use effects volume and stop on pause', () => {
  const game = setup('sentinel');game.eval('audio();settings.effects=0;applySettings();resetSentinel(enemies[0])');
  game.step(119);assert.equal(game.eval('enemySounds.size'), 0);game.step();assert.equal(game.eval('enemySounds.size'), 1);
  assert.equal(game.eval('effectsGain.gain.value'), 0);
  const note = game.audio.oscillators.at(-1);assert.equal(note.connections[0].connections[0], game.audio.gains[0]);
  game.click('pause-button');assert.equal(game.eval('enemySounds.size'), 0);assert.equal(note.stops.length, 2);
  game.click('Resume');game.eval("enemyCombat.projectiles=Array.from({length:ENEMY_COMBAT.shotLimit},()=>({owner:enemies[0],x:600,y:200,vx:0,vy:0,radius:6,life:3}));enemies[0].attackPhase='charge';enemies[0].attackTimer=DT;enemies[0].aim={x:-1,y:0}");game.step();
  assert.equal(game.eval('enemyCombat.projectiles.length'), 32);
});

test('intact, damaged, rooted, charging, projectile and defeated art render without errors', () => {
  const game = setup('shellback');assert.doesNotThrow(() => game.eval('draw()'));
  game.eval("damageEnemy(enemies[0],'stomp');enemies[0].root=2;enemies.push(createEnemy('sentinel',500,432));enemies[1].attackPhase='charge';enemies[1].aim={x:-1,y:0};enemies[1].attackTimer=.4");shot(game, ',x:400');
  assert.doesNotThrow(() => game.eval('draw()'));
  game.eval("enemies[0].hitTime=0;damageEnemy(enemies[0],'fireball')");assert.doesNotThrow(() => game.eval('draw()'));
});
