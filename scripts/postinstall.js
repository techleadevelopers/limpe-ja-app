// scripts/postinstall.js
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'fix-podfile.js');

if (fs.existsSync(target)) {
  console.log('postinstall: found fix-podfile.js — executing it');
  require(target);
} else {
  console.log('postinstall: no fix-podfile.js found — skipping');
}
