import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();

const rollupDir = path.join(ROOT, 'node_modules/rollup');
try {
  fs.rmSync(rollupDir, { recursive: true, force: true });
  console.log('1. removed old rollup dir');
} catch(e) { console.log('1. rm error (ok if not exists):', e.code); }

const wasmNative = path.join(ROOT, 'node_modules/@rollup/wasm-node/dist/native.js');
const correctContent = `const {
        parse,
        xxhashBase64Url,
        xxhashBase36,
        xxhashBase16
} = require('./wasm-node/bindings_wasm.js');

exports.parse = parse;
exports.parseAsync = async (code, allowReturnOutsideFunction, jsx, _signal) =>
        parse(code, allowReturnOutsideFunction, jsx);
exports.xxhashBase64Url = xxhashBase64Url;
exports.xxhashBase36 = xxhashBase36;
exports.xxhashBase16 = xxhashBase16;
`;
fs.writeFileSync(wasmNative, correctContent);
const verify = fs.readFileSync(wasmNative, 'utf8');
console.log('2. wasm-node native.js correct:', verify.includes('bindings_wasm'));

fs.symlinkSync('@rollup/wasm-node', rollupDir, 'dir');
console.log('3. symlink created, is symlink:', fs.lstatSync(rollupDir).isSymbolicLink());

const verifyRollup = fs.readFileSync(path.join(rollupDir, 'dist/native.js'), 'utf8');
console.log('4. rollup native.js uses wasm:', verifyRollup.includes('bindings_wasm'));
console.log('All done.');
