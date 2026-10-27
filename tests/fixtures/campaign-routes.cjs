// Original fixtures stay byte-for-byte intact; expansion routes are appended.
const original = require('./routes.cjs');
const scores = [500, 545, 545, 600];
module.exports = [
  ...original.map((route, index) => ({ ...route, score: scores[index], maxFrames: 1100 })),
  require('./crystal-caverns.cjs'),
];
