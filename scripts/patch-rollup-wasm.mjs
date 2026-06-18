import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const NATIVE_PATH = path.join(ROOT, "node_modules", "rollup", "dist", "native.js");
const WASM_PATH = path.join(ROOT, "node_modules", "@rollup", "wasm-node", "dist", "native.js");

if (!fs.existsSync(NATIVE_PATH)) {
  process.exit(0);
}

const SHIM = `// Auto-patched by scripts/patch-rollup-wasm.mjs
// Uses @rollup/wasm-node to avoid macOS code-signing conflicts with native .node binaries
const { parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = require(${JSON.stringify(WASM_PATH)});
module.exports.parse = parse;
module.exports.parseAsync = parseAsync;
module.exports.xxhashBase64Url = xxhashBase64Url;
module.exports.xxhashBase36 = xxhashBase36;
module.exports.xxhashBase16 = xxhashBase16;
`;

fs.writeFileSync(NATIVE_PATH, SHIM);
console.log("[patch-rollup] Patched rollup native.js to use @rollup/wasm-node");
