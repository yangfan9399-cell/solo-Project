import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);

let wasmNative;

function findWasmNative() {
  const searchPaths = [
    process.cwd(),
    __dirname,
    join(__dirname, '..'),
    join(__dirname, '..', 'node_modules')
  ];
  
  for (const p of searchPaths) {
    try {
      const wasmPath = require.resolve('@rollup/wasm-node/dist/native.js', { paths: [p] });
      console.log('[rollup-native-shim] Found WASM at:', wasmPath);
      return require(wasmPath);
    } catch (e) {
      // try next
    }
  }
  
  try {
    const wasmPath = require.resolve('@rollup/wasm-node/dist/native.js');
    console.log('[rollup-native-shim] Found WASM (fallback):', wasmPath);
    return require(wasmPath);
  } catch (e) {
    console.warn('[rollup-native-shim] Failed to load WASM native:', e.message);
    throw e;
  }
}

wasmNative = findWasmNative();

export const parse = wasmNative.parse;
export const parseAsync = wasmNative.parseAsync;
export const xxhashBase64Url = wasmNative.xxhashBase64Url;
export const xxhashBase36 = wasmNative.xxhashBase36;
export const xxhashBase16 = wasmNative.xxhashBase16;

export default wasmNative;
