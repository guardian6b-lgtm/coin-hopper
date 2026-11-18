'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const host = '127.0.0.1';
const defaultPort = 4173;
const usage = 'Usage: node scripts/preview.cjs [--port 4173]';

function readGame() {
  const root = path.resolve(__dirname, '..');
  const index = path.join(root, 'index.html');
  if (fs.realpathSync(root) !== root) throw new Error('Preview requires a real checkout directory.');
  const entry = fs.lstatSync(index, { bigint: true });
  if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('Preview requires a regular index.html.');

  const file = fs.openSync(index, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fs.fstatSync(file, { bigint: true });
    if (!opened.isFile() || opened.dev !== entry.dev || opened.ino !== entry.ino) {
      throw new Error('index.html changed while opening the preview. Start the preview again.');
    }
    return fs.readFileSync(file);
  } finally {
    fs.closeSync(file);
  }
}

function validPort(port) {
  return Number.isInteger(port) && port >= 0 && port <= 65535;
}

async function startPreview(port = defaultPort) {
  if (!validPort(port)) throw new Error('Preview port must be an integer from 0 to 65535.');
  const page = readGame();
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
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Use the exact printed loopback preview address.');
        return;
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }
      // Match the raw request target. URL normalization can turn traversal into /index.html.
      if (request.url !== '/' && request.url !== '/index.html') {
        response.writeHead(404);
        response.end();
        return;
      }

      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': page.length
      });
      response.end(request.method === 'HEAD' ? undefined : page);
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
  if (args.length && (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1]))) {
    throw new Error(usage);
  }
  const server = await startPreview(args.length ? Number(args[1]) : defaultPort);
  console.log('Coin Hopper preview: http://' + host + ':' + server.address().port + '/');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
}

module.exports = { startPreview };

if (require.main === module) {
  main(process.argv.slice(2)).catch(error => {
    console.error('Preview: ' + error.message);
    process.exitCode = 1;
  });
}
