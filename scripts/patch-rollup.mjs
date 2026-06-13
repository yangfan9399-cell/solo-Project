#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const rollupNativePath = resolve(projectRoot, "node_modules/rollup/dist/native.js");
const wasmBindingsPath = resolve(projectRoot, "node_modules/@rollup/wasm-node/dist/wasm-node/bindings_wasm.js");

if (!existsSync(rollupNativePath)) {
  console.log("[patch-rollup] rollup/dist/native.js not found, skipping.");
  process.exit(0);
}

if (!existsSync(wasmBindingsPath)) {
  console.log("[patch-rollup] @rollup/wasm-node not found, skipping.");
  process.exit(0);
}

const currentContent = readFileSync(rollupNativePath, "utf-8");
if (currentContent.includes("bindings_wasm.js")) {
  console.log("[patch-rollup] Already patched, skipping.");
  process.exit(0);
}

const patchedContent = `// Patched by scripts/patch-rollup.mjs
// Use WASM rollup to bypass native binary code-signature mismatch on macOS
const {
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

writeFileSync(rollupNativePath, patchedContent, "utf-8");
console.log("[patch-rollup] Patched rollup/dist/native.js to use WASM bindings.");
