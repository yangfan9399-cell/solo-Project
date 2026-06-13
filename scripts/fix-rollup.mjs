import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function findRollupNativeFiles(baseDir) {
  const results = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' && dir !== baseDir) continue;
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'native.js' && fullPath.includes('rollup') && fullPath.includes('/dist/')) {
        results.push(fullPath);
      }
    }
  }
  walk(baseDir);
  return results;
}

const wasmFallbackCode = `
// --- AUTO-PATCH: WASM fallback for code signature issues ---
let __parse, __parseAsync, __xxhashBase64Url, __xxhashBase36, __xxhashBase16;
try {
  const __wasmNative = require('@rollup/wasm-node/dist/native.js');
  __parse = __wasmNative.parse;
  __parseAsync = __wasmNative.parseAsync;
  __xxhashBase64Url = __wasmNative.xxhashBase64Url;
  __xxhashBase36 = __wasmNative.xxhashBase36;
  __xxhashBase16 = __wasmNative.xxhashBase16;
  console.warn('[rollup-patch] Using WASM fallback for native binding');
} catch (__e) {
  console.warn('[rollup-patch] WASM fallback failed:', __e.message);
  const __crypto = require('node:crypto');
  __parse = () => { throw new Error('Parse not available: native binding and WASM fallback both failed'); };
  __parseAsync = async () => { throw new Error('Parse not available: native binding and WASM fallback both failed'); };
  __xxhashBase64Url = (s) => __crypto.createHash('sha256').update(s).digest('base64url').slice(0, -1);
  __xxhashBase36 = (s) => {
    const h = __crypto.createHash('sha256').update(s).digest();
    let r = '';
    for (let i = 0; i < 8; i++) r = (r * 256 + h[i]).toString(36);
    return r;
  };
  __xxhashBase16 = (s) => __crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}
// --- END AUTO-PATCH ---
`;

function patchFile(filePath) {
  if (!existsSync(filePath)) return false;
  let content = readFileSync(filePath, 'utf-8');
  if (content.includes('AUTO-PATCH: WASM fallback')) {
    console.log(`  ✓ Already patched: ${filePath}`);
    return false;
  }
  const requireLine = /const \{[^}]*\} = requireWithFriendlyError\([^)]+\);/;
  const match = content.match(requireLine);
  if (!match) {
    console.log(`  ⚠ No require pattern found in: ${filePath}`);
    return false;
  }
  const original = match[0];
  const varNamesMatch = original.match(/const \{([^}]+)\}/);
  if (!varNamesMatch) return false;
  const vars = varNamesMatch[1].split(',').map(v => v.trim()).filter(Boolean);
  const patched = wasmFallbackCode + `\n// Original statement preserved for reference (replaced by WASM fallback)\n// ${original.replace(/\n/g, '\n// ')}\n\nconst ${vars.join(', ')} = { parse: __parse, parseAsync: __parseAsync, xxhashBase64Url: __xxhashBase64Url, xxhashBase36: __xxhashBase36, xxhashBase16: __xxhashBase16 };`;
  content = content.replace(requireLine, patched);
  writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✓ Patched: ${filePath}`);
  return true;
}

console.log('🔧 Fixing Rollup native binding for code signature compatibility...\n');

const nmDir = join(projectRoot, 'node_modules');
const pnpmDir = join(nmDir, '.pnpm');
const files = [];

if (existsSync(join(nmDir, 'rollup', 'dist', 'native.js'))) {
  files.push(join(nmDir, 'rollup', 'dist', 'native.js'));
}

if (existsSync(pnpmDir)) {
  const pnpmEntries = readdirSync(pnpmDir);
  for (const entry of pnpmEntries) {
    if (entry.startsWith('@rollup+')) continue;
    if (entry.startsWith('rollup@')) {
      const nativePath = join(pnpmDir, entry, 'node_modules', 'rollup', 'dist', 'native.js');
      if (existsSync(nativePath)) files.push(nativePath);
    }
  }
}

console.log(`Found ${files.length} rollup native.js files\n`);

let patchedCount = 0;
for (const file of files) {
  if (patchFile(file)) patchedCount++;
}

console.log(`\n✅ Done! Patched ${patchedCount} file(s).`);
