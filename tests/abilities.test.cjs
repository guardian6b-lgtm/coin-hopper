const test = require('node:test');
const assert = require('node:assert/strict');
const { createGame, onFlatGround } = require('./harness.cjs');
const roster = ['hopper', 'minty', 'ember', 'nova', 'bolt'];
function gameFor(id) { return onFlatGround(createGame({ saved: { coinhopper_character_v1: id } })); }
function cast(game) { game.event('keydown', { code: 'KeyE' });game.step();game.event('keyup', { code: 'KeyE' }); }
function enemy(x = 'pl.x+90', extras = '') { return `{x:${x},y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true${extras}}`; }
function prepare(game, id) {
  if (id === 'hopper' || id === 'nova') game.eval('pl.y=330;pl.ground=false;pl.vy=80');
  if (id === 'minty') game.eval(`enemies=[${enemy()}]`);
}

// The foundation's 89 regressions and 20 no-ability character/level replays stay
// separate. These fixtures isolate active power behavior in the shipped script.
test('the approved character dispatch and provisional cooldown table are complete', () => {
  const game = gameFor('hopper');
  assert.deepEqual(game.snapshot('Object.fromEntries(Object.entries(ABILITIES).map(([id,a])=>[id,[a.name,a.cooldown]]))'), {
    hopper: ['Crown Slam', 4], minty: ['Vine Snare', 4], ember: ['Fireball', 3], nova: ['Star Glide', 5], bolt: ['Chain Lightning', 6],
  });
});

for (const id of roster) {
  test(`${id}: E dispatches only its own power, enforces cooldown and ignores held repeats`, () => {
    const game = gameFor(id);prepare(game, id);cast(game);
    assert.equal(game.eval('ability.cooldown'), { hopper: 4, minty: 4, ember: 3, nova: 5, bolt: 6 }[id]);
    const effects = game.snapshot('({active:ability.active,shots:ability.projectiles.length,roots:enemies.filter(e=>e.root>0).length})');
    assert.equal(effects.active, id === 'hopper' ? 'slam' : id === 'nova' ? 'glide' : '');
    assert.equal(effects.shots, id === 'ember' ? 1 : 0);
    assert.equal(effects.roots, id === 'minty' ? 1 : 0);
    assert.equal(game.eval('useAbility()'), false);
    game.event('keydown', { code: 'KeyE', repeat: true });
    assert.equal(game.eval('abilityEdge'), false);
  });

  test(`${id}: pause/settings/controls freeze cooldown, active effects and roots exactly`, () => {
    const game = gameFor(id);prepare(game, id);cast(game);game.click('pause-button');
    const before = game.snapshot('({ability,enemies,pl,score,timer})');
    for (const screen of ['Settings', 'Controls']) {
      game.click(screen);game.event('keydown', { code: 'KeyE', target: game.document.activeElement });game.step(180);
      assert.deepEqual(game.snapshot('({ability,enemies,pl,score,timer})'), before);
      game.click('Back');
    }
    game.click('Resume');game.step();
    assert.ok(game.eval('ability.cooldown') < before.ability.cooldown);
  });

  test(`${id}: death, restart, transitions and title clear owned power state and roots`, () => {
    const game = gameFor(id);prepare(game, id);cast(game);
    game.eval(`enemies.push(${enemy('800', ',root:2')});hurt(true)`);
    assert.equal(game.eval('ability.cooldown===0 && !ability.active && !ability.effects.length && !ability.projectiles.length && enemies.every(e=>!e.root)'), true);
    game.eval('ability.cooldown=2;ability.effects.push({kind:"impact",life:.2});ability.projectiles.push({kind:"fire",life:.5})');
    game.click('pause-button');game.click('Restart level');game.click('Restart level');
    assert.equal(game.eval('ability.cooldown===0 && !ability.projectiles.length && !ability.effects.length'), true);
    game.eval('ability.cooldown=2;enemies=[];pl.x=flag.x;pl.vx=0');game.step();
    assert.equal(game.eval('state'), 'done');assert.equal(game.eval('ability.cooldown'), 0);
    game.click('Next level');assert.equal(game.eval('ability.cooldown'), 0);
    game.click('pause-button');game.click('Title screen');assert.equal(game.eval('ability.effects.length'), 0);
  });
}

test('menus, hidden buttons and held E across pause never queue a surprise cast', () => {
  const game = createGame();
  game.event('keydown', { code: 'KeyE' });game.step();
  game.domEvent('ability-button', 'click', { detail: 0 });
  assert.equal(game.eval('abilityEdge'), false);
  game.click('Play');game.click('character-ember');game.click('Start game');
  game.event('keydown', { code: 'KeyP' });game.event('keydown', { code: 'KeyE' });
  game.click('Resume');game.event('keydown', { code: 'KeyE', repeat: true });game.step();
  assert.equal(game.eval('ability.projectiles.length'), 0);
  game.event('keyup', { code: 'KeyE' });cast(game);assert.equal(game.eval('ability.projectiles.length'), 1);
});

test('E works on in-game native controls, while the dedicated button does not queue jump', () => {
  const game = gameFor('ember');game.element('pause-button').focus();
  game.event('keydown', { code: 'KeyE', target: game.element('pause-button') });game.step();
  assert.equal(game.eval('ability.projectiles.length'), 1);
  game.eval('resetAbility()');game.domEvent('ability-button', 'click', { detail: 0 });game.step();
  assert.equal(game.eval('ability.projectiles.length'), 1);
  assert.equal(game.eval('jumpEdge || held("jump")'), false);
  assert.equal(game.document.activeElement, game.element('c'));
});

test('a touch on the DOM Ability button is excluded from canvas movement/jump touches', () => {
  const game = gameFor('ember');
  game.canvasEvent('touchstart', { touches: [{ clientX: 190, clientY: 470 }, { clientX: 875, clientY: 465 }], targetTouches: [{ clientX: 190, clientY: 470 }] });
  assert.equal(game.eval('held("right")'), true);assert.equal(game.eval('held("jump")'), false);
  game.domEvent('ability-button', 'pointerdown', { pointerType: 'touch', button: 0 });game.step();
  assert.equal(game.eval('ability.projectiles.length'), 1);
  assert.equal(game.eval('held("right") && !held("jump")'), true);
});

test('grounded Crown Slam and Star Glide do not activate or consume a cooldown', () => {
  for (const id of ['hopper', 'nova']) {
    const game = gameFor(id);cast(game);
    assert.equal(game.eval('ability.cooldown'), 0);assert.equal(game.eval('ability.active'), '');
  }
});

test('Crown Slam lands on solid tiles safely, defeats local enemies once, and never changes terrain', () => {
  const game = gameFor('hopper');game.eval(`pl.y=330;pl.ground=false;enemies=[${enemy('pl.x+55')}]`);
  const grid = game.snapshot('grid');cast(game);
  assert.ok(game.eval('pl.vy') >= 720);
  for (let i = 0; i < 30 && !game.eval('pl.ground'); i++) game.step();
  assert.equal(game.eval('pl.y+pl.h'), 13 * 36);
  assert.equal(game.eval('ability.active'), '');
  assert.equal(game.eval('score'), 50);assert.equal(game.eval('levelScore'), 50);
  game.step(30);assert.equal(game.eval('score'), 50);assert.equal(game.eval('enemies.length'), 0);
  assert.deepEqual(game.snapshot('grid'), grid);
});

test('Crown Slam shockwave respects walls and its localized range', () => {
  const game = gameFor('hopper');game.eval(`pl.y=330;pl.ground=false;grid[12][5]='#';enemies=[${enemy('205')},${enemy('450')}]`);
  cast(game);game.step(25);
  assert.equal(game.eval('score'), 0);assert.equal(game.eval('enemies.every(e=>!e.dead)'), true);
});

test('Crown Slam times out in empty air and does not suppress pit death or final-life Game Over', () => {
  const game = gameFor('hopper');game.eval('grid=grid.map(row=>row.map(()=>" "));pl.y=20;pl.ground=false;pl.shield=true;lives=1');
  cast(game);game.step(60);
  assert.equal(game.eval('state'), 'over');assert.equal(game.eval('lives'), 0);
  assert.equal(game.eval('ability.active'), '');assert.equal(game.eval('pl.shield'), false);
});

test('a standard enemy stomp cancels the slam and retains its existing +50/bounce', () => {
  const game = gameFor('hopper');game.eval(`pl.y=390;pl.ground=false;pl.vy=200;enemies=[${enemy('pl.x')}];enemies[0].y=430;enemies[0].ground=false`);
  cast(game);
  assert.equal(game.eval('score'), 50);assert.equal(game.eval('pl.vy'), -380);
  assert.equal(game.eval('ability.active'), '');
});

test('Vine Snare roots exactly one nearest facing enemy and resumes its saved velocity/hop timer', () => {
  const game = gameFor('minty');game.eval(`enemies=[${enemy('pl.x+75',",vx:55,type:'hopper',hop:.3")},${enemy('pl.x+135')}]`);
  cast(game);
  assert.ok(game.eval('enemies[0].root') > 1.9);assert.equal(game.eval('enemies[1].root'), undefined);
  const before = game.snapshot('({x:enemies[0].x,y:enemies[0].y,vy:enemies[0].vy,hop:enemies[0].hop})');
  game.step(100);assert.deepEqual(game.snapshot('({x:enemies[0].x,y:enemies[0].y,vy:enemies[0].vy,hop:enemies[0].hop})'), before);
  game.step(20);assert.equal(game.eval('enemies[0].root'), 0);
  assert.ok(game.eval('enemies[0].x') > before.x);assert.equal(game.eval('score'), 0);
});

test('Vine Snare cannot target behind the player, beyond range, or through terrain; misses keep readiness', () => {
  for (const setup of ["pl.face=-1", "enemies[0].x=pl.x+240", "grid[12][5]='#'"]) {
    const game = gameFor('minty');game.eval(`enemies=[${enemy()}];${setup}`);cast(game);
    assert.equal(game.eval('enemies[0].root'), undefined);assert.equal(game.eval('ability.cooldown'), 0);
  }
});

test('rooted enemies remain dangerous, can be stomped, and never grant points just for rooting', () => {
  const game = gameFor('minty');game.eval(`enemies=[${enemy()}]`);cast(game);
  assert.equal(game.eval('score'), 0);
  game.eval('pl.x=enemies[0].x;pl.inv=0');game.step();
  assert.equal(game.eval('lives'), 2);assert.equal(game.eval('enemies[0].root'), undefined, 'death clears the root');
  game.eval('pl.y=390;pl.x=enemies[0].x;pl.ground=false;pl.vy=200;enemies[0].y=420;enemies[0].root=1');game.step();
  assert.equal(game.eval('score'), 50);assert.equal(game.eval('enemies[0].root'), undefined);
});

test('Fireball travels in either facing direction and stops after one enemy with +50 once', () => {
  for (const face of [-1, 1]) {
    const game = gameFor('ember');game.eval(`pl.x=350;pl.face=${face};enemies=[${enemy('pl.x+pl.face*100')},${enemy('pl.x+pl.face*160')}]`);cast(game);
    assert.equal(Math.sign(game.eval('ability.projectiles[0].vx')), face);
    game.step(25);assert.equal(game.eval('score'), 50);assert.equal(game.eval('ability.projectiles.length'), 0);
    assert.equal(game.eval('enemies.filter(e=>!e.dead).length'), 1);
    game.step(60);assert.equal(game.eval('score'), 50);
  }
});

test('Fireball has continuous wall collision even at high speed and cannot spawn beyond an adjacent wall', () => {
  for (const velocity of [420, 6000]) {
    const game = gameFor('ember');game.eval(`grid[12][5]='#';enemies=[${enemy('250')}]`);
    game.eval('useAbility()');game.eval(`ability.projectiles[0].vx=${velocity}`);game.step(20);
    assert.equal(game.eval('score'), 0);assert.equal(game.eval('ability.projectiles.length'), 0);
    assert.equal(game.eval('enemies[0].dead'), 0);
  }
});

test('Fireball expires at its finite range and never double-scores an already stomped target', () => {
  const game = gameFor('ember');game.eval(`enemies=[${enemy('200',',dead:.4')},${enemy('750')}]`);cast(game);game.step(61);
  assert.equal(game.eval('ability.projectiles.length'), 0);assert.equal(game.eval('score'), 0);
});

test('Star Glide limits descent for 1.5 seconds without adding upward velocity or changing steering', () => {
  const game = gameFor('nova');game.eval('pl.y=100;pl.ground=false;pl.vy=300');cast(game);
  assert.equal(game.eval('pl.vy'), 140);assert.equal(game.eval('ability.remaining'), 1.5);
  game.event('keydown', { code: 'ArrowRight' });game.step(20);
  assert.ok(game.eval('pl.x') > 144);assert.equal(game.eval('pl.vy'), 140);
  game.step(70);assert.equal(game.eval('ability.active'), '');assert.ok(game.eval('pl.vy') > 140);
  const rising = gameFor('nova');rising.eval('pl.y=300;pl.ground=false;pl.vy=-300');cast(rising);
  assert.equal(rising.eval('pl.vy'), -300 + 3800 / 60, 'ordinary released-jump gravity still applies during ascent');
});

test('Star Glide respects floor/wall collision, cancels on landing and never saves a pit fall', () => {
  const game = gameFor('nova');game.eval("pl.y=400;pl.ground=false;pl.vy=300;pl.x=5*T-pl.w-1;keys.ArrowRight=true;grid[12][5]='#'");cast(game);game.step(25);
  assert.equal(game.eval('pl.y+pl.h'), 13 * 36);assert.equal(game.eval('ability.active'), '');
  assert.ok(game.eval('pl.x+pl.w') <= 5 * 36);
  const pit = gameFor('nova');pit.eval('grid=grid.map(row=>row.map(()=>" "));pl.y=530;pl.ground=false;pl.vy=300;pl.shield=true;pl.inv=1;lives=1');cast(pit);pit.step(60);
  assert.equal(pit.eval('state'), 'over');assert.equal(pit.eval('lives'), 0);assert.equal(pit.eval('pl.shield'), false);
});

test('Chain Lightning is an instant facing bolt, with at most one deterministic nearby chain', () => {
  const game = gameFor('bolt');game.eval(`enemies=[${enemy('230')},${enemy('300')},${enemy('330')}]`);cast(game);
  assert.equal(game.eval('score'), 100);assert.equal(game.eval('levelScore'), 100);
  assert.equal(game.eval('enemies[0].dead>0 && enemies[1].dead>0 && enemies[2].dead===0'), true);
  assert.equal(game.eval('ability.effects.filter(f=>f.kind==="lightning").length'), 2);
  game.step(60);assert.equal(game.eval('score'), 100);
});

test('lightning faces left too, and chain selection cannot cross a wall or exceed range', () => {
  const left = gameFor('bolt');left.eval(`pl.x=400;pl.face=-1;enemies=[${enemy('300')},${enemy('230')}]`);cast(left);
  assert.equal(left.eval('score'), 100);
  const blocked = gameFor('bolt');blocked.eval(`enemies=[${enemy('180')},${enemy('260')}];grid[12][6]='#'`);cast(blocked);
  assert.equal(blocked.eval('score'), 50);assert.equal(blocked.eval('enemies[1].dead'), 0);
  const far = gameFor('bolt');far.eval(`enemies=[${enemy('210')},${enemy('400')}]`);cast(far);assert.equal(far.eval('score'), 50);
  const wall = gameFor('bolt');wall.eval(`enemies=[${enemy('260')}];grid[12][5]='#'`);cast(wall);assert.equal(wall.eval('score'), 0);
});

test('all power cooldowns and visual effects expire by simulation ticks and render without errors', () => {
  for (const id of roster) {
    const game = gameFor(id);prepare(game, id);cast(game);assert.doesNotThrow(() => game.eval('draw()'));
    game.eval('enemies=[];pl.x=start.x;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true');game.step(361);
    assert.equal(game.eval('ability.cooldown'), 0);assert.equal(game.eval('ability.active'), '');
    assert.equal(game.eval('ability.effects.length'), 0);assert.equal(game.eval('ability.projectiles.length'), 0);
  }
});

test('each power uses the effects-volume bus and has a distinct launch sound', () => {
  const frequencies = [];
  for (const id of roster) {
    const game = gameFor(id);prepare(game, id);game.eval('settings.effects=0;audio();applySettings()');cast(game);
    assert.equal(game.eval('effectsGain.gain.value'), 0);
    assert.ok(game.audio.oscillators.length > 0);
    const bus=game.audio.gains[0];
    for(const oscillator of game.audio.oscillators){
      const note=oscillator.connections[0];
      assert.equal(note.connections[0],bus,'every ability tone routes through the effects bus');
    }
    frequencies.push(game.audio.oscillators[0].frequency.values[0]);
  }
  assert.equal(new Set(frequencies).size, 5);
});


test('Game Over clears all owned power state and retry starts ready without reviving defeated enemies', () => {
  const game = gameFor('ember');cast(game);game.eval('lives=1;pl.y=ROWS*T+60');game.step();
  assert.equal(game.eval('state'), 'over');assert.equal(game.eval('ability.cooldown'), 0);
  assert.equal(game.eval('ability.projectiles.length'), 0);assert.equal(game.eval('ability.effects.length'), 0);
  game.click('Try again');assert.equal(game.eval('ability.cooldown'), 0);
});

test('a shield still absorbs an ordinary active-power hit and a later hit consumes a life', () => {
  const game = gameFor('nova');prepare(game, 'nova');cast(game);
  game.eval('pl.shield=true;pl.inv=0;hurt()');
  assert.equal(game.eval('lives===3&&!pl.shield&&pl.inv===1'), true);
  game.eval('pl.inv=0;hurt()');assert.equal(game.eval('lives'), 2);
  assert.equal(game.eval('ability.active'), '');assert.equal(game.eval('ability.cooldown'), 0);
});

test('lightning cannot chain diagonally through solid terrain', () => {
  const game = gameFor('bolt');
  game.eval(`enemies=[${enemy('230')},${enemy('300')}];enemies[1].y=370;grid[11][7]='#'`);cast(game);
  assert.equal(game.eval('score'), 50);assert.equal(game.eval('enemies[1].dead'), 0);
});

test('the cooldown HUD shows the owner/power and pauses at an unchanged readiness value', () => {
  const game = gameFor('ember');cast(game);game.eval('draw()');
  assert.match(game.element('ability-name').textContent, /Ember.*Fireball/);
  assert.equal(game.element('ability-button').disabled, true);
  const before=game.element('ability-meter').getAttribute('aria-valuenow');
  game.click('pause-button');assert.equal(game.element('ability-hud').hidden, true);
  game.step(60);game.click('Resume');game.eval('draw()');
  assert.equal(game.element('ability-meter').getAttribute('aria-valuenow'), before);
  game.eval('enemies=[]');game.step(181);game.eval('draw()');
  assert.equal(game.element('ability-meter').getAttribute('aria-valuenow'), '100');
  assert.equal(game.element('ability-button').disabled, false);
});


test('power-owned particles clear on death while ordinary damage particles remain', () => {
  const game=gameFor('bolt');game.eval(`enemies=[${enemy()}]`);cast(game);
  assert.equal(game.eval('parts.some(p=>p.power)'), true);
  game.eval('hurt(true)');
  assert.equal(game.eval('parts.some(p=>p.power)'), false);
  assert.ok(game.eval('parts.length')>0, 'the original hurt burst is preserved');
});

test('pause and lifecycle cleanup stop ability audio nodes without touching the normal effects bus', () => {
  const game=gameFor('ember');cast(game);
  assert.equal(game.eval('abilitySounds.size'), 1);
  const note=game.audio.oscillators[0];assert.equal(note.stops.length,1);
  game.click('pause-button');assert.equal(game.eval('abilitySounds.size'),0);
  assert.equal(note.stops.length,2);
  game.click('Resume');game.eval('resetAbility()');cast(game);
  assert.equal(game.eval('abilitySounds.size'),1);game.eval('hurt(true)');
  assert.equal(game.eval('abilitySounds.size'),0);
});

test('holding E through cooldown never auto-fires; releasing and pressing again does', () => {
  const game=gameFor('ember');game.event('keydown',{code:'KeyE'});game.step();game.step(181);
  assert.equal(game.eval('ability.cooldown'),0);assert.equal(game.eval('ability.projectiles.length'),0);
  game.event('keydown',{code:'KeyE',repeat:true});game.step();assert.equal(game.eval('ability.projectiles.length'),0);
  game.event('keyup',{code:'KeyE'});game.event('keydown',{code:'KeyE'});game.step();
  assert.equal(game.eval('ability.projectiles.length'),1);
});

test('last-life spike damage during a slam takes priority over shockwave rewards', () => {
  const game=gameFor('hopper');game.eval(`pl.y=330;pl.ground=false;lives=1;grid[12][4]='^';enemies=[${enemy('pl.x+55')}]`);
  cast(game);for(let i=0;i<30&&game.eval('state')==='play';i++)game.step();
  assert.equal(game.eval('state'),'over');assert.equal(game.eval('lives'),0);assert.equal(game.eval('score'),0);
  assert.equal(game.eval('ability.effects.length'),0);assert.equal(game.eval('enemies[0].dead'),0);
});

test('a projectile resolving before a potential stomp awards the same enemy only once', () => {
  const game=gameFor('ember');game.eval(`pl.y=400;pl.vy=200;pl.ground=false;enemies=[${enemy('pl.x')}];enemies[0].y=420;enemies[0].ground=false`);
  cast(game);game.step(30);assert.equal(game.eval('score'),50);assert.equal(game.eval('levelScore'),50);
});

test('equal-distance lightning chains deterministically choose the first clear candidate', () => {
  const game=gameFor('bolt');game.eval(`pl.y=396;pl.ground=false;enemies=[${enemy('260')},${enemy('320')},${enemy('320')}];enemies[0].y=400;enemies[1].y=360;enemies[2].y=440`);
  cast(game);assert.equal(game.eval('score'),100);
  assert.equal(game.eval('enemies[1].dead>0&&enemies[2].dead===0'),true);
});
