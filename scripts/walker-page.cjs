'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const assetDirectory = path.resolve(__dirname, '../dev/walker-b1');
const metadataHash = 'ba82a6072e4b27e82f7b016c03e349873e01ed018d87ca20c5faa8eac5085384';
const stripHashes = {
  idle: '31beb40fb56aafa33441304937cd01d54fb29085560cce8a692689a763b5c232',
  walk: 'c9743851974f6f803dd99bb83c721bf1bd961e8809fdd205fa94d29dc332652a',
  idle_to_walk: '3b7c95e0c3f9ab0c3b83a07b92b979db17cfa67ed928379eb1b5f91b3b851e26',
  walk_to_idle: '9f2a86e42876da1da95bcf96ba9786064f936bb98b3b244dabd616578008872d'
};

function readVerified(root, filename, expected) {
  const bytes = fs.readFileSync(path.join(root, filename));
  if (createHash('sha256').update(bytes).digest('hex') !== expected) {
    throw new Error('Walker B1 checksum mismatch for ' + filename);
  }
  return bytes;
}

function addWalkerPreview(page, { walkerAssetRoot = assetDirectory, onWalkerFallback = () => {} } = {}) {
  try {
    const metadata = JSON.parse(readVerified(walkerAssetRoot, 'strips_meta.json', metadataHash));
    const clips = {};
    for (const [name, digest] of Object.entries(stripHashes)) {
      const image = readVerified(walkerAssetRoot, 'walker_' + name + '_strip_1x.png', digest);
      const { frames, fps } = metadata[name];
      clips[name] = { frames, fps, data: 'data:image/png;base64,' + image.toString('base64') };
    }
    const [width, height] = metadata.idle.canvas_1x;
    const pack = { width, height, pivot: metadata.idle.pivot_1x, clips };
    const runtime = fs.readFileSync(path.join(assetDirectory, 'runtime.js'), 'utf8');
    const html = page.toString('utf8');
    const end = html.lastIndexOf('</script>');
    if (end < 0 || /<\/script/i.test(runtime)) throw new Error('Walker preview script boundary unavailable');
    return Buffer.from(html.slice(0, end) + '\n' + runtime + '\ninstallWalkerB1(' +
      JSON.stringify(pack) + ');\n' + html.slice(end));
  } catch (error) {
    onWalkerFallback(error);
    return page;
  }
}

module.exports = { addWalkerPreview };
