#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ROLLUP_DIST = join(ROOT, 'node_modules', 'rollup', 'dist');
const WASM_DIST = join(ROOT, 'node_modules', '@rollup', 'wasm-node', 'dist');

function log(msg) {
  console.log(`[patch-rollup-wasm] ${msg}`);
}

if (!existsSync(ROLLUP_DIST)) {
  log(`rollup dist not found at ${ROLLUP_DIST}, skip patching`);
  process.exit(0);
}

if (!existsSync(WASM_DIST)) {
  log('@rollup/wasm-node not installed, run npm install first');
  process.exit(0);
}

const WASM_SRC_DIR = join(WASM_DIST, 'wasm-node');
const JS_SRC = join(WASM_SRC_DIR, 'bindings_wasm.js');
const WASM_SRC = join(WASM_SRC_DIR, 'bindings_wasm_bg.wasm');
const NATIVE_SRC = join(WASM_DIST, 'native.js');

if (!existsSync(JS_SRC) || !existsSync(WASM_SRC) || !existsSync(NATIVE_SRC)) {
  log('required WASM files not found in @rollup/wasm-node, skip');
  process.exit(0);
}

if (!existsSync(ROLLUP_DIST)) {
  mkdirSync(ROLLUP_DIST, { recursive: true });
}

const JS_DEST = join(ROLLUP_DIST, 'bindings_wasm.js');
const WASM_DEST = join(ROLLUP_DIST, 'bindings_wasm_bg.wasm');
const NATIVE_DEST = join(ROLLUP_DIST, 'native.js');

log('copy bindings_wasm.js ...');
copyFileSync(JS_SRC, JS_DEST);

log('copy bindings_wasm_bg.wasm ...');
copyFileSync(WASM_SRC, WASM_DEST);

log('replace rollup/dist/native.js with WASM-backed version ...');

const NATIVE_CONTENT = `// Auto-patched by scripts/patch-rollup-wasm.mjs
// Replaces native Rollup binary with @rollup/wasm-node WASM build to avoid
// code-signing issues on Node.js v24+ macOS environments.
const {
\tparse,
\txxhashBase64Url,
\txxhashBase36,
\txxhashBase16
} = require('./bindings_wasm.js');

exports.parse = parse;
exports.parseAsync = async (code, allowReturnOutsideFunction, jsx, _signal) =>
\tparse(code, allowReturnOutsideFunction, jsx);
exports.xxhashBase64Url = xxhashBase64Url;
exports.xxhashBase36 = xxhashBase36;
exports.xxhashBase16 = xxhashBase16;
`;

writeFileSync(NATIVE_DEST, NATIVE_CONTENT, 'utf8');

log('removing conflicting native optional dependencies...');
const optDir = join(ROOT, 'node_modules', '@rollup');
const toRemove = ['rollup-android-arm-eabi', 'rollup-android-arm64', 'rollup-darwin-arm64',
  'rollup-darwin-x64', 'rollup-linux-arm-gnueabihf', 'rollup-linux-arm64-gnu',
  'rollup-linux-arm64-musl', 'rollup-linux-riscv64-gnu', 'rollup-linux-x64-gnu',
  'rollup-linux-x64-musl', 'rollup-win32-arm64-msvc', 'rollup-win32-ia32-msvc',
  'rollup-win32-x64-msvc'];
for (const name of toRemove) {
  const p = join(optDir, name);
  if (existsSync(p)) {
    try {
      rmSync(p, { recursive: true, force: true });
      log(`  removed ${name}`);
    } catch (e) {
      log(`  skip removing ${name}: ${e.message}`);
    }
  }
}

log('✅ rollup WASM patch applied successfully');
