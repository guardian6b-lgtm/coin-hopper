const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'index.html');
const target = path.join(__dirname, 'index.html');

if (!fs.existsSync(source)) {
  console.error('Missing game page at ' + source);
  process.exit(1);
}

fs.copyFileSync(source, target);
console.log('Copied ' + source + ' -> ' + target);
