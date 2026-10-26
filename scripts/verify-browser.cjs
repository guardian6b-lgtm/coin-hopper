// Optional real-browser checks. Requires Playwright; the default Node test suite
// remains dependency-free. See docs/moonlit-gardens.md for usage and limitations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const routes = require('../tests/fixtures/routes.cjs');

const output = process.env.COIN_HOPPER_TEST_OUTPUT || path.join(os.tmpdir(), 'coin-hopper-browser-check');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'));
const server = http.createServer((request, response) => {
  if (request.url !== '/') { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
});
const results = [];
const errors = [];

async function main() {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    assert.match(await page.locator('#menu-content').innerText(), /shields absorb one enemy or spike hit/);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    assert.equal(await page.locator('#menu-title').innerText(), 'Choose Your Hopper');
    assert.equal(await page.locator('.character-card').count(), 5);
    assert.equal(await page.locator('#character-hopper').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#character-bolt').getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
    assert.equal(await page.evaluate('state'), 'characters');
    assert.equal(await page.locator('#character-minty').getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('End');await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('button', { name: 'Start game', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate('state'), 'title');
    assert.equal(await page.evaluate("localStorage.getItem('coinhopper_character_v1')"), null);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: 'Nova', exact: true }).click();
    const portraits = await page.locator('.character-card canvas').evaluateAll(canvases => canvases.map(c => c.toDataURL()));
    assert.equal(new Set(portraits).size, 5, 'all five portraits have distinct artwork');
    await page.screenshot({ path: path.join(output, 'character-select-desktop.png') });
    await page.getByRole('button', { name: 'Start game', exact: true }).click();
    assert.equal(await page.evaluate('pl.character'), 'nova');
    await page.reload();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    assert.equal(await page.locator('#character-nova').getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Play', exact: true }).evaluate(el => el === document.activeElement), true);
    results.push('PASS five distinct portraits, mouse/keyboard selection, cancellation, focus and real reload persistence');
    for (const size of [{ width: 390, height: 844 }, { width: 320, height: 240 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      for (const name of ['Hopper', 'Minty', 'Ember', 'Nova', 'Bolt', 'Start game', 'Back']) {
        const button = page.getByRole('button', { name, exact: true });
        await button.scrollIntoViewIfNeeded();
        const rect = await button.boundingBox();
        assert.ok(rect.width >= 44 && rect.height >= 44, name);
        assert.ok(rect.x >= -1 && rect.x + rect.width <= size.width + 1, name);
        assert.ok(rect.y >= -1 && rect.y + rect.height <= size.height + 1, JSON.stringify({ name, rect, size }));
      }
      assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
      if (size.height === 844) {
        await page.locator('#character-hopper').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, 'character-select-mobile.png') });
      }
      await page.getByRole('button', { name: 'Back', exact: true }).click();
    }
    results.push('PASS responsive picker and reachable 44px+ controls at portrait, landscape and 320x240');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: 'Start game', exact: true }).click();

    // Isolated scenario setup for new mechanics; no shipped test hooks.
    await page.evaluate('startLevel(3)');
    await page.waitForFunction('pl.ground');
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction('pl.shield');
    await page.keyboard.up('ArrowRight');
    assert.equal(await page.evaluate('shields[0].got && score===0 && lives===3'), true);
    await page.waitForFunction('pl.inv<=0');
    await page.screenshot({ path: path.join(output, 'moonlit-shield-desktop.png') });
    await page.keyboard.press('KeyP');
    const snapshot = () => page.evaluate('JSON.stringify({pl,enemies,shields,timer,score,lives})');
    const before = await snapshot();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.waitForTimeout(100);
    assert.equal(await snapshot(), before);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    // Real page, fixture hit: position a hopper at the player for one side hit.
    await page.evaluate('enemies[0].x=pl.x;enemies[0].y=pl.y;enemies[0].vx=0;pl.inv=0');
    await page.waitForFunction('!pl.shield');
    assert.equal(await page.evaluate('lives'), 3);
    await page.evaluate('pl.shield=true;pl.y=ROWS*T+60');
    await page.waitForFunction('lives===2');
    assert.equal(await page.evaluate('pl.shield'), false);
    assert.equal(await page.evaluate('pl.character'), 'nova');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Restart level', exact: true }).click();
    await page.getByRole('button', { name: 'Restart level', exact: true }).click();
    assert.equal(await page.evaluate('!pl.shield && shields.every(s=>!s.got) && lives===2'), true);
    assert.equal(await page.evaluate('pl.character'), 'nova');
    results.push('PASS live keyboard shield pickup, protected hit, fatal pit, pause/settings/resume and restart');

    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(30);
      const rect = await page.locator('#c').boundingBox();
      assert.ok(rect.width <= size.width + .1 && rect.height <= size.height + .1);
      assert.ok(Math.abs(rect.width / rect.height - 960 / 540) < .01);
    }
    results.push('PASS live portrait/landscape canvas resize');
    await context.close();

    // Pause the animation scheduler for exact 60 Hz input replay in a real browser.
    // Only the scheduler changes; real keyboard handlers, simulation and Canvas2D
    // run unchanged. This is not a wall-clock human playthrough.
    const replay = await browser.newContext({ viewport: { width: 960, height: 540 } });
    await replay.addInitScript(() => { window.requestAnimationFrame = () => 1; });
    const rp = await replay.newPage();
    rp.on('pageerror', error => errors.push(error.message));
    for (const id of ['hopper', 'minty', 'ember', 'nova', 'bolt']) {
      await rp.goto(url);
      await rp.getByRole('button', { name: 'Play', exact: true }).click();
      await rp.locator('#character-' + id).click();
      await rp.getByRole('button', { name: 'Start game', exact: true }).click();
      let captured = false;
      for (const [index, route] of routes.entries()) {
        await rp.keyboard.down('ArrowRight');let tick = 0;
        for (const [next, down] of [...route.jump, [1100, false]]) {
          if (await rp.evaluate('state') !== 'play') break;
          await rp.evaluate(count => {
            for (let i = 0; i < count && state === 'play'; i++) { update();draw(); }
          }, next - tick);
          tick = next;
          if (!captured && index === 0 && tick >= 100) {
            await rp.screenshot({ path: path.join(output, `gameplay-${id}.png`) });captured = true;
          }
          if (await rp.evaluate('state') !== 'play') break;
          await rp.keyboard[down ? 'down' : 'up']('Space');
        }
        assert.equal(await rp.evaluate('state'), 'done', route.name);
        assert.equal(await rp.evaluate('lvl'), index);
        assert.equal(await rp.evaluate('lives'), 3);
        assert.equal(await rp.evaluate('pl.character'), id);
        assert.equal(await rp.evaluate('shields.some(s=>s.got)'), false);
        await rp.keyboard.up('ArrowRight');await rp.keyboard.up('Space');
        if (index === 3 && id === 'nova') await rp.screenshot({ path: path.join(output, 'moonlit-complete.png') });
        await rp.getByRole('button', { name: index === 3 ? 'Finish' : 'Next level', exact: true }).click();
        results.push(`PASS browser route and character appearance: ${id} / ${route.name}`);
      }
      assert.equal(await rp.evaluate('state'), 'win');
      assert.equal(await rp.evaluate('score'), 2190);
    }
    results.push('PASS all five characters complete four levels with identical score/lives and no shield pickup');
    await replay.close();

    const mobile = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const mp = await mobile.newPage();
    mp.on('pageerror', error => errors.push(error.message));
    await mp.goto(url);
    await mp.getByRole('button', { name: 'Play', exact: true }).tap();
    await mp.getByRole('button', { name: 'Bolt', exact: true }).tap();
    await mp.screenshot({ path: path.join(output, 'character-select-touch-landscape.png') });
    await mp.getByRole('button', { name: 'Start game', exact: true }).tap();
    assert.equal(await mp.evaluate('pl.character'), 'bolt');
    await mp.evaluate('startLevel(3)');
    await mp.waitForFunction('pl.ground');
    const cdp = await mobile.newCDPSession(mp);
    async function touch(type, points) {
      const rect = await mp.locator('#c').boundingBox();
      await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id, x, y]) => ({
        id, x: rect.x + x * rect.width / 960, y: rect.y + y * rect.height / 540, radiusX: 3, radiusY: 3,
      })) });
    }
    await touch('touchStart', [[0, 190, 470]]);
    await mp.waitForFunction('pl.shield');
    await touch('touchMove', [[0, 190, 470], [1, 875, 465]]);
    await mp.waitForFunction('pl.vy<0');
    assert.equal(await mp.evaluate('held("right") && held("jump") && pl.shield'), true);
    await touch('touchCancel', []);
    assert.equal(await mp.evaluate('!held("right") && !held("jump")'), true);
    await touch('touchStart', [[0, 920, 40]]);
    await mp.waitForFunction('state==="pause"');
    await touch('touchEnd', []);
    await mp.getByRole('button', { name: 'Resume', exact: true }).tap();
    await mp.setViewportSize({ width: 390, height: 844 });
    await mp.waitForTimeout(50);
    await mp.screenshot({ path: path.join(output, 'moonlit-mobile-portrait.png') });
    assert.equal(await mp.evaluate('pl.shield && !held("right") && !held("jump")'), true);
    results.push('PASS touch character selection and simulated mobile pickup, multi-touch move/jump, cancellation, pause/resume and rotation');
    await mobile.close();
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked by test', 'SecurityError'); } }));
    const bp = await blocked.newPage();bp.on('pageerror', error => errors.push(error.message));
    await bp.goto(url);await bp.getByRole('button', { name: 'Play', exact: true }).click();
    await bp.getByRole('button', { name: 'Ember', exact: true }).click();
    await bp.getByRole('button', { name: 'Start game', exact: true }).click();
    assert.equal(await bp.evaluate('pl.character'), 'ember');
    await blocked.close();results.push('PASS blocked browser storage safely permits character choice and gameplay');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ browser: browser.version(), results, errors }, null, 2));
    console.log(results.join('\n'));
    console.log(`Artifacts: ${output}`);
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
