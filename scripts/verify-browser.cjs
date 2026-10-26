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
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Restart level', exact: true }).click();
    await page.getByRole('button', { name: 'Restart level', exact: true }).click();
    assert.equal(await page.evaluate('!pl.shield && shields.every(s=>!s.got) && lives===2'), true);
    results.push('PASS live keyboard shield pickup, protected hit, fatal pit, pause/settings/resume and restart');

    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(30);
      const rect = await page.locator('canvas').boundingBox();
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
    await rp.goto(url);
    await rp.getByRole('button', { name: 'Play', exact: true }).click();
    for (const [index, route] of routes.entries()) {
      await rp.keyboard.down('ArrowRight');
      let tick = 0;
      for (const [next, down] of [...route.jump, [1100, false]]) {
        if (await rp.evaluate('state') !== 'play') break;
        await rp.evaluate(count => {
          for (let i = 0; i < count && state === 'play'; i++) { update(); draw(); }
        }, next - tick);
        tick = next;
        if (await rp.evaluate('state') !== 'play') break;
        await rp.keyboard[down ? 'down' : 'up']('Space');
      }
      assert.equal(await rp.evaluate('state'), 'done', route.name);
      assert.equal(await rp.evaluate('lvl'), index);
      assert.equal(await rp.evaluate('lives'), 3);
      assert.equal(await rp.evaluate('shields.some(s=>s.got)'), false);
      await rp.keyboard.up('ArrowRight');
      await rp.keyboard.up('Space');
      if (index === 3) await rp.screenshot({ path: path.join(output, 'moonlit-complete.png') });
      await rp.getByRole('button', { name: index === 3 ? 'Finish' : 'Next level', exact: true }).click();
      results.push(`PASS real-browser deterministic input route, no damage/shields: ${route.name}`);
    }
    assert.equal(await rp.evaluate('state'), 'win');
    results.push('PASS continuous four-level browser run reaches Win');
    await replay.close();

    const mobile = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const mp = await mobile.newPage();
    mp.on('pageerror', error => errors.push(error.message));
    await mp.goto(url);
    await mp.getByRole('button', { name: 'Play', exact: true }).tap();
    await mp.evaluate('startLevel(3)');
    await mp.waitForFunction('pl.ground');
    const cdp = await mobile.newCDPSession(mp);
    async function touch(type, points) {
      const rect = await mp.locator('canvas').boundingBox();
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
    results.push('PASS simulated mobile pickup, multi-touch move/jump, cancellation, pause/resume and rotation');
    await mobile.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ browser: browser.version(), results, errors }, null, 2));
    console.log(results.join('\n'));
    console.log(`Artifacts: ${output}`);
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
