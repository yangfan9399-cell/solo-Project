import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();

try { fs.unlinkSync(path.join(ROOT, 'node_modules/rollup')); } catch(e){}

const correctNative = `const {
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

const wasmNative = path.join(ROOT, 'node_modules/@rollup/wasm-node/dist/native.js');
fs.writeFileSync(wasmNative, correctNative);
console.log('wasm-node native.js restored from override backup');

fs.symlinkSync('@rollup/wasm-node', path.join(ROOT, 'node_modules/rollup'), 'dir');
console.log('rollup -> @rollup/wasm-node symlink created');

const verify = fs.readFileSync(path.join(ROOT, 'node_modules/rollup/dist/native.js'), 'utf8');
console.log('Verify native.js OK:', verify.includes('bindings_wasm'));
