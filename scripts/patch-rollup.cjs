/**
 * Post-install script: replaces rollup's native bindings with the WASM build.
 *
 * Some Node.js distributions (e.g. bundled Node.js in IDEs) have library
 * validation / signing issues that prevent the native .node modules from loading.
 * The @rollup/wasm-node package provides the same API using WebAssembly,
 * which always works (slower but reliable).
 *
 * This script:
 *  1. Replaces rollup/dist/native.js (CJS) with a proxy to @rollup/wasm-node
 *  2. Patches all ESM files that do named imports from native.js to use default
 *     import instead (ESM imports of CJS modules only expose default exports)
 */

const fs = require('fs');
const path = require('path');

const ROLLUP_DIR = path.join(__dirname, '..', 'node_modules', 'rollup');
const ROLLUP_NATIVE_CJS = path.join(ROLLUP_DIR, 'dist', 'native.js');
const ROLLUP_ESM_DIR = path.join(ROLLUP_DIR, 'dist', 'es');

const WASM_NATIVE_RELATIVE_TO_CJS = path.join('..', '..', '@rollup', 'wasm-node', 'dist', 'native.js');
const WASM_NATIVE_CJS_PATH = path.resolve(path.dirname(ROLLUP_NATIVE_CJS), WASM_NATIVE_RELATIVE_TO_CJS);

const CJS_REPLACEMENT = `// Patched by project postinstall: use @rollup/wasm-node instead of native bindings
// Reason: native .node modules fail library validation on this Node.js build
const wasmNative = require('${WASM_NATIVE_RELATIVE_TO_CJS.replace(/\\/g, '/')}');
module.exports = wasmNative;
`;

const PATCH_MARKER = 'Patched by project postinstall';

function patchCjsNative() {
  if (!fs.existsSync(ROLLUP_NATIVE_CJS)) {
    console.log('[patch-rollup] rollup/dist/native.js not found, skipping CJS patch');
    return false;
  }
  if (!fs.existsSync(WASM_NATIVE_CJS_PATH)) {
    console.warn('[patch-rollup] @rollup/wasm-node not found, skipping CJS patch');
    return false;
  }
  const original = fs.readFileSync(ROLLUP_NATIVE_CJS, 'utf8');
  if (original.includes(PATCH_MARKER)) {
    console.log('[patch-rollup] CJS native already patched, skipping');
    return false;
  }
  const backup = ROLLUP_NATIVE_CJS + '.bak';
  if (!fs.existsSync(backup)) fs.copyFileSync(ROLLUP_NATIVE_CJS, backup);
  fs.writeFileSync(ROLLUP_NATIVE_CJS, CJS_REPLACEMENT, 'utf8');
  console.log('[patch-rollup] replaced CJS native bindings with @rollup/wasm-node');
  return true;
}

function findEsmFilesImportingNative() {
  const results = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("from '../../native.js'") || content.includes("from '../native.js'")) {
          results.push(fullPath);
        }
      }
    }
  }
  if (fs.existsSync(ROLLUP_ESM_DIR)) {
    walk(ROLLUP_ESM_DIR);
  }
  return results;
}

function patchEsmFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(PATCH_MARKER)) {
    console.log(`[patch-rollup] ${path.basename(filePath)} already patched, skipping`);
    return false;
  }

  const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"](\.\.\/)+native\.js['"]\s*;?/g;

  if (!namedImportRegex.test(content)) {
    console.log(`[patch-rollup] no named native imports found in ${path.basename(filePath)}, skipping`);
    return false;
  }
  namedImportRegex.lastIndex = 0;

  const backup = filePath + '.bak';
  if (!fs.existsSync(backup)) fs.copyFileSync(filePath, backup);

  let matchCount = 0;
  content = content.replace(namedImportRegex, (match, namesStr) => {
    matchCount++;
    const names = namesStr.split(',').map(s => s.trim()).filter(Boolean);
    const relativePath = match.match(/from\s*['"]([^'"]+)['"]/)[1];
    return `// ${PATCH_MARKER}: use default import for CJS native module
// Reason: ESM named imports don't work with CJS module.exports
import nativeMod from '${relativePath}';
const { ${names.join(', ')} } = nativeMod;`;
  });

  if (matchCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-rollup] patched ${matchCount} native import(s) in ${path.relative(ROLLUP_DIR, filePath)}`);
    return true;
  }
  return false;
}

function patchAllEsmFiles() {
  const files = findEsmFilesImportingNative();
  if (files.length === 0) {
    console.log('[patch-rollup] no ESM files importing native.js found');
    return;
  }
  for (const file of files) {
    try {
      patchEsmFile(file);
    } catch (e) {
      console.warn(`[patch-rollup] failed to patch ${file}:`, e.message);
    }
  }
}

function main() {
  if (!fs.existsSync(ROLLUP_DIR)) {
    console.log('[patch-rollup] rollup not found, skipping patch');
    return;
  }
  patchCjsNative();
  patchAllEsmFiles();
}

try {
  main();
} catch (e) {
  console.warn('[patch-rollup] patch failed (non-fatal):', e.message);
}
