import fs from 'node:fs';
import path from 'node:path';
const sharpLocations = [
  './node_modules/sharp',
  './node_modules/imagetools-core/node_modules/sharp',
];
for (const loc of sharpLocations) {
  const dir = path.resolve(loc);
  if (!fs.existsSync(dir)) continue;
  const libDir = path.join(dir, 'lib');
  if (!fs.existsSync(libDir)) continue;
  for (const f of ['sharp.js', 'constructor.js', 'index.js']) {
    const fp = path.join(libDir, f);
    if (fs.existsSync(fp)) {
      const bak = fp + '.bak';
      if (!fs.existsSync(bak)) fs.copyFileSync(fp, bak);
      fs.writeFileSync(fp, 'module.exports = function() { return {}; };\nmodule.exports.default = module.exports;\n', 'utf8');
    }
  }
  const buildDir = path.join(dir, 'build');
  if (fs.existsSync(buildDir)) {
    try { fs.rmSync(buildDir, { recursive: true, force: true }); } catch {}
  }
  console.log(`[patch] patched ${dir}`);
}
console.log('[patch] done');
