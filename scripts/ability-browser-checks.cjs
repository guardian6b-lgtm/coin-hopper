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
      await page.keyboard.down('KeyE');await step(1);await page.keyboard.up('KeyE');
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
      const rect = await mp.locator('#c').boundingBox();
      const ability = await mp.locator('#ability-button').boundingBox();
      const point = (id, x, y) => ({ id, x, y, radiusX: 3, radiusY: 3 });
      const right=point(0,rect.x+190*rect.width/960,rect.y+470*rect.height/540);
      const jump=point(1,rect.x+875*rect.width/960,rect.y+465*rect.height/540);
      const power=point(2,ability.x+ability.width/2,ability.y+ability.height/2);
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right,jump] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right,jump,power] });
      assert.equal(await mp.evaluate('held("right")&&held("jump")&&abilityEdge'), true);
      await mp.evaluate('update();draw()');
      assert.equal(await mp.evaluate('ability.projectiles.length'), 1);
      // CDP's compositor acknowledgement can precede delivery of touchcancel to
      // the page under load. Observe that event before asserting handler state.
      await mp.evaluate('window.__cancelSeen=false;cv.addEventListener("touchcancel",e=>{if(!e.targetTouches.length)window.__cancelSeen=true;})');
      await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await mp.waitForFunction('window.__cancelSeen===true',null,{polling:10,timeout:1000});
      assert.equal(await mp.evaluate('held("right")||held("jump")||abilityEdge'), false);
      await mp.screenshot({ path: path.join(output, 'ability-mobile-landscape.png') });
      for (const size of [{ width: 390, height: 844 }, { width: 320, height: 240 }]) {
        await mp.setViewportSize(size);
        await mp.waitForFunction('Math.abs(parseFloat(cv.style.width)-Math.min(innerWidth/960,innerHeight/540)*960)<.1',null,{polling:50});
        await mp.evaluate('draw()');
        const box=await mp.locator('#ability-button').boundingBox(),canvas=await mp.locator('#c').boundingBox();
        assert.ok(box.width>=44&&box.height>=44&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width&&box.y+box.height<=size.height,JSON.stringify({box,size}));
        const cx=canvas.x+875*canvas.width/960,cy=canvas.y+465*canvas.height/540,r=58*1.35*canvas.width/960;
        const nearX=Math.max(box.x,Math.min(cx,box.x+box.width)),nearY=Math.max(box.y,Math.min(cy,box.y+box.height));
        assert.ok(Math.hypot(cx-nearX,cy-nearY)>r, 'Ability target must not cover the Jump touch target');
        if(size.height===844)assert.ok(box.y>=canvas.y+canvas.height+8,'Portrait Ability button belongs in the lower letterbox, outside the world');
        if(size.height===844)await mp.screenshot({ path: path.join(output, 'ability-mobile-portrait.png') });
      }
      results.push('PASS mobile three-finger movement+jump+Ability, cancellation and responsive non-overlapping 44px+ button');
    } finally { await mobile.close(); }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'ability-results.json'), JSON.stringify({ results, audio, errors, listening: 'NOT TESTED' }, null, 2));
    return results;
  } finally { await context.close(); }
};
