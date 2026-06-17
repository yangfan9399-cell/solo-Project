import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, "src");
const OUT_DIR = path.join(__dirname, "dist");

await esbuild.build({
  entryPoints: [path.join(SRC_DIR, "index.tsx")],
  bundle: true,
  outdir: OUT_DIR,
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "solid-js",
  target: "esnext",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  alias: { "~": SRC_DIR },
  logLevel: "info",
});

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>管线机器人巡检缺陷帧标注平台</title>
</head>
<body class="bg-gray-50 text-gray-900 antialiased">
  <div id="app"></div>
  <script src="/app.js" type="module"></script>
</body>
</html>`;

import fs from "fs";
fs.writeFileSync(path.join(OUT_DIR, "index.html"), HTML);
console.log("Build complete!");
