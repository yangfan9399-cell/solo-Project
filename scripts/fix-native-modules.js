import { execSync } from "child_process";
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const nodeModulesDir = join(process.cwd(), "node_modules");
if (!existsSync(nodeModulesDir)) {
  process.exit(0);
}

function findNodeFiles(dir, results = []) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory() && !file.startsWith(".")) {
          findNodeFiles(fullPath, results);
        } else if (file.endsWith(".node")) {
          results.push(fullPath);
        }
      } catch (e) {}
    }
  } catch (e) {}
  return results;
}

const nodeFiles = findNodeFiles(nodeModulesDir);

for (const file of nodeFiles) {
  try {
    execSync(`xattr -r -d com.apple.quarantine "${file}" 2>/dev/null || true`);
  } catch (e) {}
}

for (const file of nodeFiles) {
  try {
    execSync(`/usr/bin/codesign --force --deep --sign - "${file}" 2>/dev/null`);
  } catch (e) {}
}

const nativeJsPath = join(nodeModulesDir, "rollup", "dist", "native.js");
if (existsSync(nativeJsPath)) {
  let content = readFileSync(nativeJsPath, "utf8");
  if (!content.includes("WASM_FALLBACK_PATCH_APPLIED")) {
    const originalLine = `const { parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = requireWithFriendlyError(
\texistsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
);`;
    const patchedLine = `// WASM_FALLBACK_PATCH_APPLIED
let parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16;
try {
\t({ parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = requireWithFriendlyError(
\t\texistsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
\t));
} catch (e) {
\t({ parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = require('@rollup/wasm-node/dist/native.js'));
}`;
    content = content.replace(originalLine, patchedLine);
    writeFileSync(nativeJsPath, content);
  }
}

console.log("Native module fix complete");
