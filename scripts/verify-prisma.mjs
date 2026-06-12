import fs from 'node:fs';
import path from 'node:path';

const f = path.join(process.cwd(), 'node_modules/.prisma/client/index.js');
const c = fs.readFileSync(f, 'utf8');
const idx = c.indexOf('previewFeatures');
console.log('previewFeatures at:', idx);
console.log(c.slice(Math.max(0, idx-30), idx+100));

// 做强制 patch
if (!c.includes('"driverAdapters"')) {
  const patched = c.replace(
    /"previewFeatures": ?\[\]/g,
    '"previewFeatures": ["driverAdapters"]'
  );
  fs.writeFileSync(f, patched);
  console.log('PATCED!');
} else {
  console.log('Already has driverAdapters');
}

// 再读一次确认
const c2 = fs.readFileSync(f, 'utf8');
const idx2 = c2.indexOf('previewFeatures');
console.log('After patch:', c2.slice(idx2-10, idx2+80));
