import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const wasmBindingsPath = resolve(
  projectRoot,
  "node_modules/@rollup/wasm-node/dist/wasm-node/bindings_wasm.js"
);
const nativeJsPath = resolve(projectRoot, "node_modules/rollup/dist/native.js");

if (!existsSync(wasmBindingsPath)) {
  console.warn("[patch-rollup] @rollup/wasm-node not found, skipping patch");
  process.exit(0);
}

if (!existsSync(nativeJsPath)) {
  console.warn("[patch-rollup] rollup/dist/native.js not found, skipping patch");
  process.exit(0);
}

const currentContent = readFileSync(nativeJsPath, "utf-8");

const patchMarker = "bindings_wasm.js";
if (currentContent.includes(patchMarker)) {
  console.log("[patch-rollup] Already patched, skipping");
  process.exit(0);
}

const patchedContent = `const {
	parse,
	xxhashBase64Url,
	xxhashBase36,
	xxhashBase16
} = require('@rollup/wasm-node/dist/wasm-node/bindings_wasm.js');

exports.parse = parse;
exports.parseAsync = async (code, allowReturnOutsideFunction, jsx, _signal) =>
	parse(code, allowReturnOutsideFunction, jsx);
exports.xxhashBase64Url = xxhashBase64Url;
exports.xxhashBase36 = xxhashBase36;
exports.xxhashBase16 = xxhashBase16;
`;

writeFileSync(nativeJsPath, patchedContent);
console.log("[patch-rollup] Patched rollup/dist/native.js to use WASM bindings");
