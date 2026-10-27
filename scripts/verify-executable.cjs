// Exercise the actual packaged executable through its temporary debug endpoints.
// No test hooks or altered source are added to the shipped app. Requires Playwright.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { chromium } = require('playwright');
const verifyExecutableAbilities = require('./ability-executable-checks.cjs');
const verifyExecutableEnemies = require('./enemy-executable-checks.cjs');
const verifyExecutableCampaign = require('./campaign-executable-checks.cjs');
const captureVisual = require('./visual-captures.cjs');
const verifyMusicPage = require('./music-page-checks.cjs');
const { values } = parseArgs({ options: {
  executable: { type: 'string' }, label: { type: 'string', default: 'packaged' },
  output: { type: 'string' }, profile: { type: 'string' },
  'captures-only': { type: 'boolean', default: false },
} });
assert.ok(values.executable && values.output, '--executable and --output are required');
assert.match(values.label, /^[a-z-]+$/);
const output = path.resolve(values.output);
fs.mkdirSync(output, { recursive: true });
const profile = values.profile || path.join(os.tmpdir(), `coin-hopper-${values.label}-${process.pid}`);
const report = { label: values.label, executable: path.basename(values.executable),
  startedAt: new Date().toISOString(), platform: process.platform, arch: process.arch,
  commit: process.env.GITHUB_SHA || null, checks: [], errors: [] };
const save = () => fs.writeFileSync(path.join(output, `${values.label}.json`), JSON.stringify(report, null, 2));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, timeout = 30000) {
  const start = Date.now(); let last;
  while (Date.now() - start < timeout) {
    try { const result = await fn(); if (result) return result; } catch (error) { last = error; }
    await pause(100);
  }
  throw new Error(`Readiness check timed out${last ? ': ' + last.message : ''}`);
}
async function port() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const number = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return number;
}
function json(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, response => {
      let body = ''; response.on('data', data => { body += data; });
      response.on('end', () => { try { resolve(JSON.parse(body)); } catch (error) { reject(error); } });
    });
    request.setTimeout(1000, () => request.destroy(new Error('Local debugger request timed out')));
    request.on('error', reject);
  });
}
async function inspector(url) {
  const socket = new WebSocket(url), pending = new Map(); let id = 0;
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('Main-process inspector unavailable')), { once: true });
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data), operation = pending.get(message.id);
    if (!operation) return;
    pending.delete(message.id); clearTimeout(operation.timer);
    if (message.error) operation.reject(new Error(message.error.message)); else operation.resolve(message.result);
  });
  const call = (method, params) => new Promise((resolve, reject) => {
    const next = ++id;
    const timer = setTimeout(() => { pending.delete(next); reject(new Error(`Inspector ${method} timed out`)); }, 10000);
    pending.set(next, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  await call('Runtime.enable', {});
  return {
    async evaluate(expression) {
      const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    },
    close() { socket.close(); },
  };
}
async function launch() {
  const mainPort = await port(), rendererPort = await port();
  const args = [`--inspect=${mainPort}`, `--remote-debugging-port=${rendererPort}`, `--user-data-dir=${profile}`];
  if (process.platform === 'linux') args.push('--no-sandbox', '--ozone-platform=headless');
  const child = spawn(path.resolve(values.executable), args, { windowsHide: false, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '', main, browser, page;
  const append = data => { logs = (logs + data).slice(-100000); };
  child.stdout.on('data', append); child.stderr.on('data', append);
  child.on('error', append);
  async function close() {
    main?.close();
    await page?.close().catch(() => {});
    await browser?.close().catch(() => {});
    if (child.exitCode === null) {
      try { await until(() => child.exitCode !== null, 10000); }
      catch {
        if (process.platform === 'win32') {
          try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
        } else child.kill('SIGTERM');
      }
    }
    fs.appendFileSync(path.join(output, `${values.label}.log`), logs);
  }
  try {
    const targets = await until(async () => {
      const list = await json(`http://127.0.0.1:${mainPort}/json/list`);
      return list.length && list;
    }, 60000);
    main = await inspector(targets[0].webSocketDebuggerUrl);
    await until(async () => main.evaluate("!!process.mainModule && !!process.mainModule.require('electron').BrowserWindow.getAllWindows().length"));
    await main.evaluate("globalThis.ciElectron=process.mainModule.require('electron');globalThis.ciWindow=ciElectron.BrowserWindow.getAllWindows()[0];true");
    await until(() => json(`http://127.0.0.1:${rendererPort}/json/version`));
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${rendererPort}`);
    const context = browser.contexts()[0];
    page = context.pages()[0] || await context.waitForEvent('page');
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => report.errors.push(error.message));
    await page.waitForFunction("typeof state!=='undefined' && state==='title'");
    assert.match(page.url(), /^file:.*app\.asar[\\/]index\.html$/);
    if (process.platform === 'linux') await page.setViewportSize({ width: 960, height: 540 });
    return { main, browser, page, context, close };
  } catch (error) { await close(); throw error; }
}
const pass = (name, detail) => { report.checks.push({ name, status: 'PASS', detail }); save(); };
async function main() {
  save(); let app;
  try {
    app = await launch();
    report.versions = await app.main.evaluate('({electron:process.versions.electron,chrome:process.versions.chrome,node:process.versions.node})');
    assert.deepEqual(await app.page.evaluate('LEVELS.slice(0,4).map(l=>l.name)'), ['Sunny Meadow', 'Brick Hills', 'Starry Night', 'Moonlit Gardens']);
    pass('launch', 'Actual packaged executable opens the expanded game from app.asar and preserves the four original levels');
    await app.context.setOffline(true);
    await app.page.reload();
    await app.page.waitForFunction("state==='title'");
    if(values['captures-only']){
      report.captures=await captureVisual(app.page,output,values.label,async size=>{
        if(process.platform==='win32')await app.main.evaluate(`ciWindow.setContentSize(${size.width},${size.height});true`);
        else await app.page.setViewportSize(size);
      });
      assert.deepEqual(report.errors,[]);
      pass('actual-offline-visual-captures','28 actual packaged renderer captures; native window sizes on Windows, emulated viewport on Linux. Scenes are controlled fixtures.');
      report.status='PASS';report.completedAt=new Date().toISOString();return;
    }
    report.music=await verifyMusicPage(app.page,output,values.label);
    pass('music-and-audio','Actual offline renderer: eight themes/two loops, volume/mute persistence, keyboard pause/resume, blur and real Web Audio mixing measurements. Audible/device acceptance NOT TESTED.');
    if(process.platform==='win32'){
      await app.page.getByRole('button',{name:'Play',exact:true}).click();await app.page.getByRole('button',{name:'Start game',exact:true}).click();
      await app.main.evaluate('ciWindow.minimize();true');
      await app.page.waitForFunction('state==="pause"&&musicState.source===null&&(ac.state!=="running"||masterGain.gain.value===0)');
      const retained=await app.page.evaluate('musicState.offset');
      await app.main.evaluate('ciWindow.restore();ciWindow.focus();true');
      await app.page.waitForFunction('!document.hidden');
      assert.equal(await app.page.evaluate('state'), 'pause');assert.equal(await app.page.evaluate('musicState.offset'),retained);
      await app.page.getByRole('button',{name:'Resume',exact:true}).click();await app.page.waitForFunction('!!musicState.source&&ac.state==="running"');
      await app.page.keyboard.press('Escape');await app.page.getByRole('button',{name:'Title screen',exact:true}).click();
      pass('native-window-audio-pause','Actual Windows minimize/restore pauses game/music, retains loop position and requires explicit Resume; automated window APIs, not physical input.');
    }else report.checks.push({name:'native-window-audio-pause',status:'NOT TESTED',detail:'Headless Linux has no native desktop; actual Windows CI runs minimize/restore checks.'});
    await app.page.getByRole('button', { name: 'Settings', exact: true }).click();
    for (const [name, value] of [['effects', 25], ['music', 80]]) {
      await app.page.locator(`#${name}-volume`).evaluate((input, next) => {
        input.value = next; input.dispatchEvent(new Event('input', { bubbles: true }));
      }, String(value));
    }
    await app.page.getByRole('button', { name: 'Back', exact: true }).click();
    await app.page.getByRole('button', { name: 'Play', exact: true }).click();
    assert.equal(await app.page.locator('.character-card').count(), 5);
    await app.page.getByRole('button', { name: 'Nova', exact: true }).click();
    await app.page.screenshot({ path: path.join(output, `${values.label}-character-select.png`) });
    await app.page.getByRole('button', { name: 'Start game', exact: true }).click();
    assert.equal(await app.page.evaluate('pl.character'), 'nova');
    pass('character-select', 'Five character choices, Nova chosen and used by the actual offline executable');
    await app.page.waitForFunction('pl.ground');
    const x = await app.page.evaluate('pl.x');
    await app.page.keyboard.down('ArrowRight');
    await app.page.waitForFunction(start => pl.x > start + 30, x);
    await app.page.keyboard.up('ArrowRight');
    await app.page.waitForFunction('pl.ground');
    const y = await app.page.evaluate('pl.y');
    await app.page.keyboard.down('Space');
    await app.page.waitForFunction(start => pl.y < start - 20, y);
    await app.page.keyboard.up('Space');
    await app.page.keyboard.press('KeyP');
    await app.page.waitForFunction("state==='pause'");
    const frozen = await app.page.evaluate('JSON.stringify({pl,enemies,timer,score,lives})');
    await app.page.waitForTimeout(150);
    assert.equal(await app.page.evaluate('JSON.stringify({pl,enemies,timer,score,lives})'), frozen);
    await app.page.getByRole('button', { name: 'Resume', exact: true }).click();
    await app.page.waitForFunction("state==='play'");
    pass('offline-game-controls', 'Reload offline, native menus, move, jump, pause/frozen state and resume');

    if (process.platform === 'win32') {
      const originalSize = await app.main.evaluate('ciWindow.getSize()');
      // CDP keyboard input bypasses Electron's main-process before-input-event;
      // its native sendInputEvent exercises the shipped F11 handler instead.
      const f11 = () => app.main.evaluate("ciWindow.webContents.sendInputEvent({type:'keyDown',keyCode:'F11'});ciWindow.webContents.sendInputEvent({type:'keyUp',keyCode:'F11'});true");
      await f11(); await until(() => app.main.evaluate('ciWindow.isFullScreen()'));
      const full = await app.main.evaluate('({bounds:ciWindow.getBounds(),display:ciElectron.screen.getDisplayMatching(ciWindow.getBounds()).bounds})');
      assert.ok(full.bounds.width >= full.display.width - 2 && full.bounds.height >= full.display.height - 2, JSON.stringify(full));
      await app.page.screenshot({ path: path.join(output, `${values.label}-fullscreen.png`) });
      await f11(); await until(async () => !(await app.main.evaluate('ciWindow.isFullScreen()')));
      pass('f11-fullscreen', { enteredAndExited: true, full, originalSize });
      await app.main.evaluate('ciWindow.setSize(1120,720);true');
      await until(async () => (await app.main.evaluate('ciWindow.getSize()')).join(',') === '1120,720');
      await app.page.waitForFunction('innerWidth>1000 && innerHeight>600');
      const canvas = await app.page.locator('#c').boundingBox();
      const viewport = await app.page.evaluate('({width:innerWidth,height:innerHeight})');
      assert.ok(canvas.width <= viewport.width + 1 && canvas.height <= viewport.height + 1);
      assert.ok(Math.abs(canvas.width / canvas.height - 960 / 540) < .01);
      pass('resize', { window: [1120, 720], viewport, canvas });
    } else {
      report.checks.push({ name: 'f11-fullscreen-and-native-resize', status: 'NOT TESTED', detail: 'Local Linux headless validation only; Windows CI must execute these checks' });
    }
    report.abilities=await verifyExecutableAbilities(app,output,values.label);
    pass('all-five-abilities','All five powers activate and resolve in the actual offline executable, with cooldown/pause checks');
    report.enemies=await verifyExecutableEnemies(app,output,values.label);
    pass('multi-hit-enemies','All five heroes interact with and defeat both new types; Sentinel shots, pause, shield and cleanup pass in the actual executable');
    report.expansionRoutes=await verifyExecutableCampaign(app,output,values.label);
    pass('expansion-no-power-routes','All five heroes complete each new level in the actual offline renderer with legal keyboard inputs, no powers/shield/damage and expected scores; fixed 60 Hz replay');
    // Show the new level in the packaged binary; this is a runtime fixture, not
    // a natural completion route (all four routes run in the Node suite).
    await app.page.evaluate('startLevel(3)');
    await app.page.waitForFunction('pl.ground');
    await app.page.keyboard.down('ArrowRight');
    await app.page.waitForFunction('pl.shield');
    await app.page.keyboard.up('ArrowRight');
    assert.equal(await app.page.evaluate('lives===3 && shields[0].got'), true);
    await app.page.waitForFunction('pl.inv<=0');
    await app.page.screenshot({ path: path.join(output, `${values.label}-moonlit.png`) });
    assert.equal(await app.page.evaluate('pl.character'), 'nova');
    await app.page.evaluate('pl.y=ROWS*T+60');
    await app.page.waitForFunction('lives===2');
    assert.equal(await app.page.evaluate('pl.character'), 'nova');
    await app.page.keyboard.press('Escape');
    await app.page.getByRole('button', { name: 'Restart level', exact: true }).click();
    await app.page.getByRole('button', { name: 'Restart level', exact: true }).click();
    assert.equal(await app.page.evaluate('pl.character'), 'nova');
    pass('character-lifecycle', 'Nova appearance survives level setup, pit death and native restart flow');
    pass('moonlit-shield', 'Actual fourth-level page renders and keyboard movement collects its shield');
    await app.close(); app = null;
    app = await launch();
    assert.deepEqual(await app.page.evaluate('({effects:settings.effects,music:settings.music})'), { effects: .25, music: .8 });
    assert.equal(await app.page.evaluate('selectedCharacter'), 'nova');
    await app.page.getByRole('button', { name: 'Play', exact: true }).click();
    assert.equal(await app.page.locator('#character-nova').getAttribute('aria-pressed'), 'true');
    pass('saved-character', 'Nova preference restores after a full executable restart');
    pass('saved-settings', 'Effects 25% and music preference 80% survive a complete executable restart');
    assert.deepEqual(report.errors, []);
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAIL'; report.errors.push(error.stack || error.message);
    if(app)report.rendererAtFailure=await app.page.evaluate('({state,menuReturn,lvl,hidden:document.hidden,audioBlurred,context:ac?.state,time:ac?.currentTime,theme:musicState.theme,source:!!musicState.source,master:masterGain?.gain.value,masterTarget:masterGain?gainValues.get(masterGain):null,music:musicGain?.gain.value,effects:effectsGain?.gain.value,muted:audioPrefs.muted,matchingContext:musicGain?.context===ac})').catch(()=>null);
    if (app) await app.page.screenshot({ path: path.join(output, `${values.label}-failure.png`) }).catch(() => {});
    throw error;
  } finally {
    if (app) await app.close();
    report.completedAt = new Date().toISOString(); save();
  }
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => {
  console.error(error);
  if(process.env.GITHUB_ACTIONS){
    const detail=(String(error.stack||error)+'\nRenderer: '+JSON.stringify(report.rendererAtFailure)).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
    console.error(`::error title=Coin Hopper ${values.label} smoke::${detail}`);
  }
  process.exitCode = 1;
});
