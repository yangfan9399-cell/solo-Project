import { execSync } from "child_process";
import { existsSync, readdirSync, statSync, renameSync, unlinkSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

console.log("Fixing native module code signatures...");

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
      } catch (e) {
        // skip
      }
    }
  } catch (e) {
    // skip
  }
  return results;
}

function patchRollupNativeLoader() {
  try {
    const rollupNativePath = join(process.cwd(), "node_modules", "rollup", "dist", "native.js");
    if (!existsSync(rollupNativePath)) {
      console.log("Rollup native.js not found, skipping rollup patch");
      return;
    }

    let content = readFileSync(rollupNativePath, "utf8");

    if (content.includes("FORCE_WASM_FALLBACK_PATCHED")) {
      console.log("Rollup already patched for WASM fallback");
      return;
    }

    const patch = `
// FORCE_WASM_FALLBACK_PATCHED
// Force WASM fallback to avoid macOS code signing issues
function requireWithFriendlyError(id) {
  try {
    throw new Error('Force WASM fallback');
  } catch (e) {
    return requireWasmFallback();
  }
}
`;

    content = content.replace(
      /function requireWithFriendlyError[\s\S]*?^function/m,
      patch + "function"
    );

    if (!content.includes("FORCE_WASM_FALLBACK_PATCHED")) {
      content = "// FORCE_WASM_FALLBACK_PATCHED\n" + content;
      content = content.replace(
        /requireWithFriendlyError\([^)]+\)/g,
        "requireWasmFallback()"
      );
    }

    writeFileSync(rollupNativePath, content);
    console.log("Patched rollup to use WASM fallback");
  } catch (e) {
    console.log("Rollup patch failed:", e.message);
  }
}

try {
  const nodeModulesDir = join(process.cwd(), "node_modules");
  if (!existsSync(nodeModulesDir)) {
    console.log("No node_modules directory found, skipping");
    process.exit(0);
  }

  const nodeFiles = findNodeFiles(nodeModulesDir);
  console.log(`Found ${nodeFiles.length} native modules`);

  for (const file of nodeFiles) {
    if (!existsSync(file)) continue;

    try {
      execSync(`xattr -r -d com.apple.quarantine "${file}" 2>/dev/null || true`);
    } catch (e) {
      // ignore
    }

    try {
      const dylibFile = file.replace(/\.node$/, ".dylib");
      if (existsSync(dylibFile)) {
        execSync(`xattr -r -d com.apple.quarantine "${dylibFile}" 2>/dev/null || true`);
      }
    } catch (e) {
      // ignore
    }
  }

  console.log("Removed quarantine attributes");

  let signFailed = false;
  for (const file of nodeFiles) {
    if (!existsSync(file)) continue;

    try {
      execSync(`/usr/bin/codesign --force --deep --sign - "${file}" 2>/dev/null`);
      console.log(`  Signed: ${file}`);
    } catch (e) {
      console.log(`  Skip (codesign failed): ${file}`);
      signFailed = true;
    }
  }

  if (signFailed) {
    console.log("\nSome modules failed to sign, patching rollup for WASM fallback...");
    patchRollupNativeLoader();
  }

  console.log("\nNative module fix complete");
} catch (e) {
  console.log("No native modules to fix or error occurred:", e.message);
}
