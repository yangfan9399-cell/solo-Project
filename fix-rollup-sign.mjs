import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const bindingPath = join(
  process.cwd(),
  "node_modules",
  "@rollup",
  "rollup-darwin-arm64",
  "rollup.darwin-arm64.node"
);

if (existsSync(bindingPath)) {
  try {
    execSync(`codesign --force --sign - "${bindingPath}"`, { stdio: "pipe" });
    console.log("[postinstall] rollup binary re-signed successfully");
  } catch (e) {
    console.warn("[postinstall] could not re-sign rollup binary:", e.message);
  }
}

const rolldownBinding = join(
  process.cwd(),
  "node_modules",
  "@rolldown",
  "binding-darwin-arm64",
  "rolldown-binding.darwin-arm64.node"
);

if (existsSync(rolldownBinding)) {
  try {
    execSync(`codesign --force --sign - "${rolldownBinding}"`, { stdio: "pipe" });
    console.log("[postinstall] rolldown binary re-signed successfully");
  } catch (e) {
    console.warn("[postinstall] could not re-sign rolldown binary:", e.message);
  }
}
