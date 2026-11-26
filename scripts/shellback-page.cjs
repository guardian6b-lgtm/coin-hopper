
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const directory = path.resolve(__dirname, '../dev/shellback-s1');
const hashes = {
  'walk-metadata.json': '31b70521d767e8ad6359195493d5043f87407c5b7e77afd5557d0a6c3ee65529',
  'shellback_intact_walk_strip_1x_56x40x10.png': '232dcaed2f6b85dacccaa929214c82b374275a211a1e5cf5a5d6cbb16d919cb4',
  'shellback_cracked_walk_strip_1x_56x40x10.png': '1ba4ce85c4cc3c71f2a7bdcbde9d7d2be43ee238b74cc86175f50c89e17434d7'
};
function readVerified(root, filename) {
  const bytes = fs.readFileSync(path.join(root, filename));
  if (createHash('sha256').update(bytes).digest('hex') !== hashes[filename]) {
    throw new Error('Shellback checksum mismatch for ' + filename);
  }
  return bytes;
}
function addShellbackPreview(page, { shellbackAssetRoot = directory, onShellbackFallback = () => {} } = {}) {
  try {
    const walk = JSON.parse(readVerified(shellbackAssetRoot, 'walk-metadata.json'));
    const pack = { width: walk.width, height: walk.height, pivot: walk.pivot, frames: walk.frames,
      fps: walk.fps, stride: walk.stride, sprites: {} };
    for (const state of ['intact', 'cracked']) {
      const png = readVerified(shellbackAssetRoot, walk.sprites[state].file);
      if (png.readUInt32BE(16) !== walk.width * walk.frames || png.readUInt32BE(20) !== walk.height) {
        throw new Error('Shellback walk strip dimensions differ from the approved package');
      }
      pack.sprites[state] = 'data:image/png;base64,' + png.toString('base64');
    }
    const runtime = fs.readFileSync(path.join(directory, 'runtime.js'), 'utf8');
    const source = page.toString('utf8');
    const end = source.lastIndexOf('</script>');
    if (end < 0 || /<\/script/i.test(runtime)) throw new Error('Shellback script boundary unavailable');
    return Buffer.from(source.slice(0, end) + '\n' + runtime + '\ninstallShellbackS1(' +
      JSON.stringify(pack) + ');\n' + source.slice(end));
  } catch (error) {
    onShellbackFallback(error);
    return page;
  }
}
module.exports = { addShellbackPreview };
