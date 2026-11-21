'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { startPreview } = require('./preview.cjs');

const host = '127.0.0.1';
const defaultPort = 4174;
const root = path.resolve(__dirname, '..');
const assetDirectory = path.join(root, 'dev', 'ember-v31');
const baselineHash = '80ab671de40be1bec752b7e2c080fb1695e46529a5a759e31ffdcd69d6bc3984';
const manifestHash = 'e1d6f0714df2719d0c8b71d06467a372acf1e88af1c4b1eff893e7a19b31923a';
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const usage = 'Usage: node scripts/ember-preview.cjs [--enable-ember-v31] [--enable-walker-b1] [--port 4174]';

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function loadPack(assetRoot) {
  const bytes = fs.readFileSync(path.join(assetRoot, 'manifest.json'));
  if (hash(bytes) !== manifestHash) throw new Error('Ember v3.1 manifest failed checksum validation.');
  const pack = JSON.parse(bytes);
  for (const [name, clip] of Object.entries(pack.clips)) {
    const image = fs.readFileSync(path.join(assetRoot, clip.file));
    if (hash(image) !== clip.sha256 || !image.subarray(0, 8).equals(pngSignature) ||
        image.readUInt32BE(16) !== clip.width * clip.count || image.readUInt32BE(20) !== clip.height) {
      throw new Error('Ember v3.1 ' + name + ' strip failed validation.');
    }
    clip.data = 'data:image/png;base64,' + image.toString('base64');
  }
  return pack;
}

function composeEmberPage({ enabled = false, assetRoot = assetDirectory, onFallback = () => {} } = {}) {
  const baseline = fs.readFileSync(path.join(root, 'index.html'));
  if (enabled !== true) return baseline;
  if (hash(baseline) !== baselineHash) throw new Error('This experiment requires the exact R6-C HTML.');
  try {
    const pack = loadPack(assetRoot);
    const runtime = ['shadow.js', 'picker.js', 'runtime.js']
      .map(name => fs.readFileSync(path.join(assetDirectory, name), 'utf8')).join('\n');
    if (/<\/script/i.test(runtime)) throw new Error('Unexpected inline script terminator.');
    const pickerStyle = fs.readFileSync(path.join(assetDirectory, 'picker.css'), 'utf8');
    if (/<\/style/i.test(pickerStyle)) throw new Error('Unexpected inline style terminator.');
    const original = baseline.toString('utf8');
    // Compose the picker styles and terrain shadow only in the opt-in page.
    const shadowLine = /^  cx\.save\(\);cx\.globalAlpha=\.16;cx\.fillStyle='#283655';[^\r\n]+cx\.restore\(\);$/gm;
    if (Array.from(original.matchAll(shadowLine)).length !== 1) throw new Error('R6-C player shadow unavailable.');
    const source = original.replace('</style>', () => pickerStyle + '\n</style>').replace(shadowLine, line =>
      "  if (p.character === 'ember' && emberV31GroundShadowReady()) drawEmberGroundShadow(p, anchors);\n" +
      '  else {\n' + line + '\n  }');
    const offset = source.lastIndexOf('</script>');
    if (offset < 0) throw new Error('R6-C script terminator unavailable.');
    return Buffer.from(source.slice(0, offset) + '\n' + runtime + '\ninstallEmberV31(' +
      JSON.stringify(pack) + ');\n' + source.slice(offset));
  } catch (error) {
    onFallback(error);
    return baseline;
  }
}

function composeDevelopmentPage(options = {}) {
  const page = composeEmberPage(options);
  if (options.walker !== true) return page;
  return require('./walker-page.cjs').addWalkerPreview(page, options);
}

async function startEmberPreview(port = defaultPort, options = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid preview port.');
  if (options.enabled !== true && options.walker !== true) return startPreview(port);
  const page = composeDevelopmentPage(options);
  const server = http.createServer({ requestTimeout: 15000, headersTimeout: 10000, keepAliveTimeout: 1000 },
    (request, response) => {
      const boundPort = request.socket.localPort;
      const hosts = request.headersDistinct.host;
      const allowedHost = hosts?.length === 1 &&
        (hosts[0] === host + ':' + boundPort || (boundPort === 80 && hosts[0] === host));
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      if (!allowedHost) {
        response.writeHead(403).end();
        return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
      }
      if (request.url !== '/' && request.url !== '/index.html') {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': page.length
      }).end(request.method === 'HEAD' ? undefined : page);
    });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  return server;
}

async function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage);
    return;
  }
  let enabled = false;
  let walker = false;
  let port;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--enable-ember-v31' && !enabled) enabled = true;
    else if (args[index] === '--enable-walker-b1' && !walker) walker = true;
    else if (args[index] === '--port' && port === undefined && /^\d+$/.test(args[index + 1] ?? '')) {
      port = Number(args[++index]);
    } else throw new Error(usage);
  }
  let fallback = false;
  let walkerFallback = false;
  const server = await startEmberPreview(port, {
    enabled, walker,
    onWalkerFallback(error) {
      walkerFallback = true;
      console.warn('Walker B1 is OFF. ' + error.message);
    },
    onFallback(error) {
      fallback = true;
      console.warn('Ember v3.1 is OFF. ' + error.message);
    }
  });
  console.log('Ember v3.1 ' + (enabled && !fallback ? 'ON' : 'OFF') +
    (walker ? ', Walker B1 ' + (walkerFallback ? 'OFF' : 'ON') : '') + ' at http://' +
    host + ':' + server.address().port + '/');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
}

module.exports = { composeEmberPage, composeDevelopmentPage, startEmberPreview };

if (require.main === module) {
  main(process.argv.slice(2)).catch(error => {
    console.error('Ember preview: ' + error.message);
    process.exitCode = 1;
  });
}
