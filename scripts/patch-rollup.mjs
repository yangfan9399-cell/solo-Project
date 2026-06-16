import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const rollupNativePath = join(
  projectRoot,
  "node_modules",
  "rollup",
  "dist",
  "native.js"
);
const wasmNativePath = join(
  projectRoot,
  "node_modules",
  "@rollup",
  "wasm-node",
  "dist",
  "native.js"
);

console.log("🔧 Setting up rollup WASM fallback...");

if (!existsSync(rollupNativePath)) {
  console.log("⚠️  rollup native.js not found, skipping patch");
  process.exit(0);
}

if (!existsSync(wasmNativePath)) {
  console.log("⚠️  @rollup/wasm-node not found, skipping patch");
  process.exit(0);
}

const originalContent = readFileSync(rollupNativePath, "utf-8");
const backupPath = rollupNativePath + ".bak";

if (!existsSync(backupPath)) {
  writeFileSync(backupPath, originalContent);
  console.log("📦 Backed up original rollup native.js");
}

const wasmExport = `const { parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = require('@rollup/wasm-node/dist/native.js');

module.exports = {
  parse,
  parseAsync,
  xxhashBase64Url,
  xxhashBase36,
  xxhashBase16
};
`;

writeFileSync(rollupNativePath, wasmExport);
console.log("✅ Rollup WASM fallback applied successfully");
console.log("   Using @rollup/wasm-node instead of native binding");
