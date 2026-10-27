const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,onFlatGround}=require('./harness.cjs');
test('Android landscape uses full844px scene width and compact native status, not the96px reserved strip',()=>{
 const g=createGame();g.eval('touchMode=true;innerWidth=844;innerHeight=390;fit();newGame();draw()');assert.equal(g.element('c').style.width,'844px');assert.equal(g.element('ability-hud').hidden,true);assert.equal(g.element('compact-hud').hidden,false);
 assert.match(g.element('compact-hud').textContent,/Sunny Meadow/);assert.equal(g.element('pause-button').hidden,false);
});
test('touch character instructions omit desktop Tab/E hints and midpoint copy acknowledges12levels',()=>{
 const g=createGame();g.eval('touchMode=true');g.click('Play');assert.doesNotMatch(g.element('menu-description').textContent,/Tab|Left \/ Right/);assert.match(g.element('menu-description').textContent,/Tap a hero/);assert.doesNotMatch(g.element('character-choice').textContent,/\(E\)/);
 g.eval("state='win';syncMenu()");assert.match(g.element('menu-title').textContent,/Chapter One/);assert.match(g.element('menu-description').textContent,/First 6 of 12/);assert.doesNotMatch(g.element('menu-description').textContent,/game complete|final boss/i);
});
