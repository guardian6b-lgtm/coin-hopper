'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const { startPreview } = require('../scripts/preview.cjs');

const script = path.join(__dirname, '..', 'scripts', 'preview.cjs');
let server;
let port;

before(async () => {
  server = await startPreview(0);
  port = server.address().port;
});
after(async () => {
  if (server) await new Promise((resolve, reject) =>
    server.close(error => error ? reject(error) : resolve()));
});

function request(target, method = 'GET', headers, setHost = true, targetPort = port) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: targetPort, path: target, method, headers, setHost, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('Preview request timed out.')));
    req.end();
  });
}

test('preview binds only IPv4 loopback and serves identical standalone HTML on the two routes', async () => {
  assert.deepEqual(server.address(), { address: '127.0.0.1', family: 'IPv4', port });
  const original = fs.readFileSync(path.join(__dirname, '..', 'index.html'));
  for (const target of ['/', '/index.html']) {
    const res = await request(target);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, original);
    assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
    assert.equal(res.headers['content-length'], String(original.length));
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['cross-origin-resource-policy'], 'same-origin');
  }
});

test('HEAD returns GET metadata and an empty body', async () => {
  const get = await request('/index.html');
  const head = await request('/index.html', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  for (const name of ['content-length', 'content-type', 'cache-control', 'x-content-type-options', 'cross-origin-resource-policy']) {
    assert.equal(head.headers[name], get.headers[name], name);
  }
});

test('foreign, missing and mismatched Host headers cannot receive the game', async () => {
  for (const host of ['example.invalid:' + port, 'localhost:' + port, '127.0.0.1:' + (port === 65535 ? 65534 : port + 1)]) {
    assert.equal((await request('/', 'GET', { Host: host })).status, 403, host);
  }
  // Node's HTTP/1.1 parser rejects a missing Host before dispatching the request.
  assert.equal((await request('/', 'GET', {}, false)).status, 400);
});

test('a second Host header is rejected even when the first Host matches', async () => {
  const response = await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    let text = '';
    socket.setTimeout(5000, () => socket.destroy(new Error('Raw HTTP request timed out.')));
    socket.setEncoding('utf8');
    socket.once('connect', () => socket.write('GET / HTTP/1.1\r\nHost: 127.0.0.1:' + port +
      '\r\nHost: example.invalid\r\nConnection: close\r\n\r\n'));
    socket.on('data', chunk => { text += chunk; });
    socket.once('error', reject);
    socket.once('end', () => resolve(text));
  });
  assert.match(response, /^HTTP\/1\.1 403 /);
});

test('nonliteral targets cannot read the game or other checkout files', async () => {
  for (const target of ['/.git/config', '/desktop/package.json', '/docs/preview.md', '/missing',
    '/../index.html', '/folder/../index.html', '/%2e/index.html', '//index.html',
    '/index.html?file=.git/config', 'http://127.0.0.1:' + port + '/index.html']) {
    const res = await request(target);
    assert.equal(res.status, 404, target);
    assert.equal(res.body.length, 0, target);
  }
});

test('CLI prints a reachable IPv4 loopback URL with an automatically chosen port', { timeout: 10000 }, async t => {
  const child = spawn(process.execPath, [script, '--port', '0'], { windowsHide: true });
  const closed = once(child, 'close');
  t.after(async () => {
    if (child.exitCode === null) child.kill();
    await closed;
  });
  const reportedPort = await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = /^Coin Hopper preview: http:\/\/127\.0\.0\.1:(\d+)\/\r?\n/.exec(output);
      if (match) resolve(Number(match[1]));
    });
    child.once('error', reject);
    closed.then(([code]) => reject(new Error('Preview CLI exited before listening with code ' + code)), reject);
  });
  assert.ok(reportedPort > 0);
  assert.equal((await request('/', 'HEAD', undefined, true, reportedPort)).status, 200);
});

test('POST, OPTIONS and PUT are rejected with an Allow header', async () => {
  for (const method of ['POST', 'OPTIONS', 'PUT']) {
    const res = await request('/', method);
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.allow, 'GET, HEAD', method);
  }
});

test('CLI rejects binding overrides, LAN flags and invalid port values before listening', () => {
  for (const args of [['--host', '0.0.0.0'], ['--lan'], ['--port'], ['--port', ''], ['--port', '1e2'],
    ['--port', '65536'], ['--port', '-1'], ['--port', '4173', '--port', '4174']]) {
    const run = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 5000 });
    assert.ifError(run.error);
    assert.equal(run.status, 1, JSON.stringify(args));
    assert.match(run.stderr, /Usage:|port must be/);
    assert.equal(run.stdout, '');
  }
});
