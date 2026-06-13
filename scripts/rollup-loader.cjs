const Module = require('node:module');
const path = require('node:path');
const fs = require('node:fs');

const originalResolveFilename = Module._resolveFilename;
let wasmNativePath = null;

function findWasmNativePath() {
  if (wasmNativePath) return wasmNativePath;
  
  const searchPaths = [
    process.cwd(),
    path.join(process.cwd(), 'node_modules'),
    __dirname,
    path.join(__dirname, '..', 'node_modules')
  ];
  
  for (const p of searchPaths) {
    try {
      wasmNativePath = require.resolve('@rollup/wasm-node/dist/native.js', { paths: [p] });
      console.log('[rollup-loader] Found WASM native:', path.basename(wasmNativePath));
      return wasmNativePath;
    } catch (e) {
      // try next
    }
  }
  
  try {
    const glob = require.resolve('@rollup/wasm-node');
    const wasmPkgPath = path.dirname(glob);
    wasmNativePath = path.join(wasmPkgPath, 'dist', 'native.js');
    console.log('[rollup-loader] Found WASM native (fallback):', path.basename(wasmNativePath));
    return wasmNativePath;
  } catch (e) {
    console.warn('[rollup-loader] Cannot resolve @rollup/wasm-node:', e.message);
  }
  
  return null;
}

findWasmNativePath();

const ROLLUP_REDIRECT_PATTERNS = [
  /rollup[\\/]dist[\\/]native\.js$/,
  /@rollup[\\/]rollup-[a-z0-9-]+[\\/].*\.node$/,
  /@rollup[\\/]rollup-[a-z0-9-]+$/
];

function shouldRedirect(filePath) {
  if (!filePath || !wasmNativePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  for (const pattern of ROLLUP_REDIRECT_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  return false;
}

Module._resolveFilename = function (request, parent, isMain, options) {
  const wasmPath = findWasmNativePath();
  if (wasmPath && request) {
    try {
      const resolved = originalResolveFilename.apply(this, arguments);
      if (shouldRedirect(resolved)) {
        return wasmPath;
      }
    } catch (e) {
      if (shouldRedirect(request)) {
        return wasmPath;
      }
    }
  }
  return originalResolveFilename.apply(this, arguments);
};

const originalLoad = Module.prototype.load;
Module.prototype.load = function (filename) {
  const wasmPath = findWasmNativePath();
  if (wasmPath && shouldRedirect(filename)) {
    try {
      const wasmExports = require(wasmPath);
      this.exports = wasmExports;
      this.loaded = true;
      return;
    } catch (e) {
      console.warn('[rollup-loader] Load fallback failed:', e.message);
    }
  }
  return originalLoad.apply(this, arguments);
};

console.log('[rollup-loader] Installed successfully');
module.exports = {};
