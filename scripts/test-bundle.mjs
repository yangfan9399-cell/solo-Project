import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

const bundlePath = path.join(process.cwd(), "backend", "public", "bundle.js");
const bundleCode = fs.readFileSync(bundlePath, "utf-8");

const html = `<!DOCTYPE html>
<html><body>
<div id="root"></div>
<script>
window.onerror = function(msg, url, line, col, err) {
  console.log("[ERR]", msg, "line:", line, "col:", col);
  if (err && err.stack) console.log(err.stack);
  return false;
};
window.addEventListener("unhandledrejection", (e) => console.log("[UNHANDLED]", e.reason));
</script>
</body></html>`;

const dom = new JSDOM(html, {
  url: "http://localhost:41621/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  storageQuota: 10000000,
});

const { window } = dom;

console.log("开始执行 bundle.js...");
try {
  const scriptEl = window.document.createElement("script");
  scriptEl.textContent = bundleCode;
  window.document.body.appendChild(scriptEl);
  console.log("✅ bundle.js 注入成功，无同步抛出");
} catch (e) {
  console.error("❌ 同步执行错误:", e.message);
  console.error(e.stack);
  process.exit(1);
}

setTimeout(() => {
  const rootEl = window.document.getElementById("root");
  const rootHTML = rootEl ? rootEl.innerHTML : "";
  console.log("\n=== root.innerHTML 前1500字符 ===");
  console.log(rootHTML.slice(0, 1500));
  console.log("\n=== 内容摘要 ===");
  console.log("HTML长度:", rootHTML.length);
  console.log("子元素数:", rootEl ? rootEl.children.length : 0);
  if (rootHTML.length > 500) console.log("✅ React 有内容渲染");
  else console.log("⚠️  渲染内容为空或很短");
  process.exit(0);
}, 1000);
