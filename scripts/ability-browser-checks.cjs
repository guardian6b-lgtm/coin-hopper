// Real browser input/rendering with explicit fixtures for power collisions/audio.
// The no-ability route checks remain in verify-browser.cjs without world edits.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const roster = ['hopper', 'minty', 'ember', 'nova', 'bolt'];

module.exports = async function verifyAbilities(browser, url, output) {
  const results = [], errors = [], audio = {};
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await context.addInitScript(() => { window.requestAnimationFrame = () => 1; });
  const page = await context.newPage();page.on('pageerror', error => errors.push(error.message));
  const step = count => page.evaluate(count => { for (let i = 0; i < count; i++) update();draw(); }, count);
  try {
    for (const id of roster) {
      await page.goto(url);
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.getByRole('button', { name: id[0].toUpperCase() + id.slice(1), exact: true }).click();
      await page.getByRole('button', { name: 'Start game', exact: true }).click();
      await page.evaluate(id => {
        startLevel(3);shields=[];pl.x=4*T;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true;pl.inv=0;
        enemies=[{x:pl.x+80,y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true,type:'hopper',hop:.7}];
        if (id === 'hopper' || id === 'nova') { pl.y=300;pl.ground=false;pl.vy=180; }
        if (id === 'ember') enemies[0].x=pl.x+180;
        if (id === 'bolt') enemies.push({x:pl.x+150,y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true});
        draw();
      }, id);
      await page.keyboard.press('KeyE');await step(1);
      assert.ok(await page.evaluate('ability.cooldown>0'), id);
      assert.equal(await page.locator('#ability-button').isDisabled(), true);
      assert.match(await page.locator('#ability-name').innerText(), new RegExp(id[0].toUpperCase() + id.slice(1)));
      await step(3);
      await page.screenshot({ path: path.join(output, `ability-${id}.png`) });
      const before = await page.evaluate('JSON.stringify({ability,enemies,pl,parts,score,lives,timer})');
      await page.keyboard.press('KeyP');
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page.keyboard.press('KeyE');await step(60);
      assert.equal(await page.evaluate('JSON.stringify({ability,enemies,pl,parts,score,lives,timer})'), before);
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
      if (id === 'hopper') {
        for (let i = 0; i < 35 && !(await page.evaluate('pl.ground')); i++) await step(1);
        assert.equal(await page.evaluate('score'), 50);
        await step(10);await page.screenshot({ path: path.join(output, 'ability-hopper-impact.png') });
      } else if (id === 'minty') {
        assert.ok(await page.evaluate('enemies[0].root>0'));
        await step(122);assert.equal(await page.evaluate('enemies[0].root'), 0);
      } else if (id === 'ember') {
        await step(30);assert.equal(await page.evaluate('score'), 50);
        assert.equal(await page.evaluate('ability.projectiles.length'), 0);
      } else if (id === 'nova') {
        assert.equal(await page.evaluate('pl.vy'), 140);
        await step(90);assert.equal(await page.evaluate('ability.active'), '');
      } else assert.equal(await page.evaluate('score'), 100);
      results.push(`PASS ${id}: E activation, effect rendering, cooldown, pause freeze and intended resolution`);

      // Render real Web Audio graphs without depending on speakers/audio devices.
      // Existing snd() and each actual cast function are used through useAbility().
      audio[id] = {};
      for (const volume of [0, 1]) {
        const measurement = await page.evaluate(async ({ id, volume }) => {
          resetAbility();pl.y=300;pl.ground=false;pl.vy=100;
          enemies=[{x:pl.x+90,y:pl.y+4,w:28,h:28,vx:0,vy:0,dead:0,ground:false}];
          const previousAc=ac,previousGain=effectsGain,previousVolume=settings.effects;
          try {
            ac=new OfflineAudioContext(1,24000,48000);effectsGain=ac.createGain();effectsGain.connect(ac.destination);
            settings.effects=volume;applySettings();
            if (!useAbility()) throw new Error('Audio fixture did not activate ' + id);
            const rendered=await ac.startRendering(),samples=rendered.getChannelData(0);
            return Math.sqrt(samples.reduce((total,value)=>total+value*value,0)/samples.length);
          } finally { ac=previousAc;effectsGain=previousGain;settings.effects=previousVolume;applySettings();resetAbility(); }
        }, { id, volume });
        assert.ok(volume === 0 ? measurement === 0 : measurement > .001, `${id} audio ${volume}: ${measurement}`);
        audio[id][volume] = measurement;
      }
      results.push(`PASS ${id}: real Web Audio effects-volume mute/unmute (signal only; no listening)`);
      await page.evaluate('pl.y=ROWS*T+60');await step(1);
      assert.equal(await page.evaluate('lives'), 2);
      assert.equal(await page.evaluate('ability.cooldown===0 && !ability.active && !ability.projectiles.length && !ability.effects.length'), true);
      await page.keyboard.press('KeyP');await page.getByRole('button', { name: 'Restart level', exact: true }).click();
      await page.getByRole('button', { name: 'Restart level', exact: true }).click();
      assert.equal(await page.evaluate('ability.cooldown'), 0);
    }

    const mobile = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    try {
      await mobile.addInitScript(() => { window.requestAnimationFrame = () => 1; });
      const mp = await mobile.newPage();mp.on('pageerror', error => errors.push(error.message));
      await mp.goto(url);await mp.getByRole('button', { name: 'Play', exact: true }).tap();
      await mp.getByRole('button', { name: 'Ember', exact: true }).tap();
      await mp.getByRole('button', { name: 'Start game', exact: true }).tap();
      await mp.evaluate('for(let i=0;i<10;i++)update();draw()');
      const client = await mobile.newCDPSession(mp);
      const point = async (id, name) => {const b=await mp.locator('#'+name).boundingBox();return {id,x:b.x+b.width/2,y:b.y+b.height/2,radiusX:3,radiusY:3};};
      const right=await point(0,'touch-right'),jump=await point(1,'touch-jump'),power=await point(2,'ability-button');
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right,jump,power] });
      await mp.evaluate('for(let i=0;i<25;i++)update();draw()');
      assert.equal(await mp.evaluate('held("right")&&held("jump")&&ability.charging&&ability.cooldown===0'),true);
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[power]});
      await mp.evaluate('update();draw()');assert.equal(await mp.evaluate('ability.projectiles.length'),1);
      await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await mp.waitForFunction('!held("right")&&!held("jump")',null,{polling:10});
      await mp.screenshot({ path: path.join(output, 'ability-mobile-landscape.png') });
      for (const size of [{ width: 390, height: 844 }, { width: 320, height: 240 }]) {
        await mp.setViewportSize(size);
        await mp.waitForFunction('Math.abs(parseFloat(cv.style.width)-(touchMode&&innerWidth>innerHeight&&innerWidth>=480?innerWidth/960:Math.min(innerWidth/960,innerHeight/540))*960)<.1',null,{polling:50});
        await mp.evaluate('draw()');
        const box=await mp.locator('#ability-button').boundingBox(),canvas=await mp.locator('#c').boundingBox();
        assert.ok(box.width>=44&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width&&box.y+box.height<=size.height,JSON.stringify({box,size}));
        const jumpBox=await mp.locator('#touch-jump').boundingBox();
        assert.ok(box.x+box.width<=jumpBox.x||jumpBox.x+jumpBox.width<=box.x||box.y+box.height<=jumpBox.y||jumpBox.y+jumpBox.height<=box.y,'Separate Ability and Jump targets');
        if(size.height===844)await mp.screenshot({ path: path.join(output, 'ability-mobile-portrait.png') });
      }
      results.push('PASS mobile three-finger movement+jump+Ability, cancellation and responsive non-overlapping 44px+ button');
    } finally { await mobile.close(); }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'ability-results.json'), JSON.stringify({ results, audio, errors, listening: 'NOT TESTED' }, null, 2));
    return results;
  } finally { await context.close(); }
};
