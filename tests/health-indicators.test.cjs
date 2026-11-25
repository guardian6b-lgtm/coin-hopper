
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createGame, onFlatGround } = require('./harness.cjs');
const { composeDevelopmentPage } = require('../scripts/ember-preview.cjs');

async function gameWithArt() {
  const stub = 'globalThis.Image=class{set src(value){this.naturalWidth=44;this.naturalHeight=40;Promise.resolve().then(()=>this.onload());}decode(){return Promise.resolve();}};';
  const html = composeDevelopmentPage({ shellback: true }).toString().replace('<script>', () => '<script>' + stub);
  const game = onFlatGround(createGame({ html }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(game.eval('shellbackS1.status'), 'ready');
  return game;
}
function observeDots(game) {
  game.eval('globalThis.healthMarks=[];cx.arc=(x,y,r)=>{if(r===3.4&&y===-actor.h-12)healthMarks.push([x,y,r]);};');
}
for (const type of ['walker','hopper','shellback','sentinel','nightwing','guardian']) {
  test(type + ' draws no floating health dots at 1, 2, 3 or 7 HP, including damaged and defeated states', () => {
    const game = onFlatGround(createGame());
    observeDots(game);
    for (const maximum of [1,2,3,7]) {
      game.eval('globalThis.actor=createEnemy("' + type + '",300,300);actor.maxHealth=' + maximum);
      for (let hp = maximum; hp >= 0; hp--) {
        game.eval('actor.health=' + hp + ';actor.dead=' + (hp === 0 ? '.4' : '0') + ';drawEnemy(actor);');
      }
    }
    assert.deepEqual(game.snapshot('healthMarks'), []);
  });
}
test('illustrated Shellback also omits HP dots at every health state', async () => {
  const game = await gameWithArt();
  observeDots(game);
  for (const maximum of [1,2,3,7]) {
    game.eval('globalThis.actor=createEnemy("shellback",300,300);actor.maxHealth=' + maximum);
    for (let hp = maximum; hp >= 0; hp--) game.eval('actor.health=' + hp + ';actor.dead=' + (hp === 0 ? '.4' : '0') + ';drawEnemy(actor)');
  }
  assert.deepEqual(game.snapshot('healthMarks'), []);
});
test('one-hit, two-hit and higher-HP enemies retain accepted-hit counts and one-time scoring', () => {
  for (const [type,hp] of [['walker',1],['shellback',2],['sentinel',3],['shellback',7]]) {
    const game = onFlatGround(createGame());
    game.eval('globalThis.actor=createEnemy("' + type + '",400,300);actor.maxHealth=actor.health=' + hp + ';enemies=[actor];');
    for (let hit = 1; hit <= hp; hit++) {
      if(hit>1)game.eval('actor.hitTime=0'); // Isolate successive accepted hits from the independently tested guard.
      assert.equal(game.eval("damageEnemy(actor,'fireball')"), true);
      assert.equal(game.eval('actor.health'), hp-hit);
      assert.equal(game.eval('score'), hit === hp ? 50 : 0);
      assert.equal(game.eval('actor.dead'), hit === hp ? .4 : 0);
    }
    assert.equal(game.eval("damageEnemy(actor,'stomp')"), false);
    assert.equal(game.eval('score'),50);
  }
});
test('the actual five-HP Guardian retains armor, one-hit openings and final defeat', () => {
  const game = onFlatGround(createGame());
  game.eval('startLevel(5);globalThis.actor=enemies.find(e=>e.type==="guardian");');
  assert.equal(game.eval('actor.health'),5);
  assert.equal(game.eval("damageEnemy(actor,'fireball')"),false);
  for(let hit=1;hit<=5;hit++){
    game.eval("actor.attackPhase='recover';actor.openingHit=false;actor.hitTime=0");
    assert.equal(game.eval("damageEnemy(actor,'fireball')"),true);
    assert.equal(game.eval('actor.health'),5-hit);
    assert.equal(game.eval('score'),hit===5?50:0);
  }
  assert.equal(game.eval('bossState.defeated'),true);
});
test('only renderer pixels changed in the canonical HTML and the normal health HUD remains exact', () => {
  const game = createGame();
  const source = fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
  assert(!source.includes('if(!e.dead)for(let i=0;i<e.maxHealth;i++)'));
  game.eval('newGame();lives=2;score=70;');
  const before=game.snapshot('({pl,lives,score,enemies,progress})');
  assert.doesNotThrow(()=>game.eval('hud()'));
  assert.deepEqual(game.snapshot('({pl,lives,score,enemies,progress})'),before);
  assert.equal(game.eval('lives'),2);
});
