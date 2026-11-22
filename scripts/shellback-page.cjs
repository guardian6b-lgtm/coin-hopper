
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const directory = path.resolve(__dirname, '../dev/shellback-s1');
const hashes = {
  'shellback_v1.0_metadata.json': '09667e075d5c70138662b516623e8290a6bc23f7361223208f502487affcae1d',
  'shellback_v1.0_intact_1x.png': '6b1399da16342deeec1f9af95e5e0f504e3e6de1fd85bf9dfef95d9e850ecfaa',
  'shellback_v1.0_cracked_1x.png': 'eec5490b8699a0aa9eef368df978fab8f4458677fd647cdee0457c82108e45f7'
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
    const metadata = JSON.parse(readVerified(shellbackAssetRoot, 'shellback_v1.0_metadata.json'));
    const sprites = {};
    for (const state of ['intact', 'cracked']) {
      const spec = metadata.sprites[state + '_1x'];
      const png = readVerified(shellbackAssetRoot, spec.file);
      if (png.readUInt32BE(16) !== 44 || png.readUInt32BE(20) !== 40) {
        throw new Error('Shellback PNG dimensions differ from the master');
      }
      sprites[state] = 'data:image/png;base64,' + png.toString('base64');
    }
    const pack = { width: 44, height: 40, pivot: metadata.sprites.intact_1x.pivot, sprites };
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
