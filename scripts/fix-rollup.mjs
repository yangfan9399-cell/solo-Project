import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const nativePath = join(root, 'node_modules', 'rollup', 'dist', 'native.js');

if (existsSync(nativePath)) {
  const wasmFallback = `const {
\tparse,
\txxhashBase64Url,
\txxhashBase36,
\txxhashBase16
} = require('@rollup/wasm-node/dist/wasm-node/bindings_wasm.js');

exports.parse = parse;
exports.parseAsync = async (code, allowReturnOutsideFunction, jsx, _signal) =>
\tparse(code, allowReturnOutsideFunction, jsx);
exports.xxhashBase64Url = xxhashBase64Url;
exports.xxhashBase36 = xxhashBase36;
exports.xxhashBase16 = xxhashBase16;
`;
  writeFileSync(nativePath, wasmFallback);
  console.log('Patched rollup native.js to use WASM fallback');
} else {
  console.log('rollup native.js not found, skipping patch');
}
