import * as esbuild from "esbuild";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "dist");
const SRC_DIR = path.join(__dirname, "src");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

try {
  execSync("npx tailwindcss -i ./src/app.css -o ./dist/app.css --minify", {
    cwd: __dirname,
    stdio: "inherit",
  });
} catch {
  console.warn("Tailwind CSS build failed, using raw CSS");
  fs.copyFileSync(path.join(SRC_DIR, "app.css"), path.join(OUT_DIR, "app.css"));
}

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>管线机器人巡检缺陷帧标注平台</title>
  <link rel="stylesheet" href="/app.css" />
</head>
<body class="bg-gray-50 text-gray-900 antialiased">
  <div id="app"></div>
  <script src="/index.js" type="module"></script>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, "index.html"), HTML);

const solidPlugin = {
  name: "solid-jsx",
  setup(build) {
    build.onResolve({ filter: /^solid-js\/jsx-runtime$/ }, (args) => ({
      path: path.join(__dirname, "node_modules/solid-js/h/jsx-runtime/dist/jsx.js"),
    }));
    build.onResolve({ filter: /^solid-js\/jsx-dev-runtime$/ }, (args) => ({
      path: path.join(__dirname, "node_modules/solid-js/h/jsx-runtime/dist/jsx.js"),
    }));
  },
};

const ctx = await esbuild.context({
  entryPoints: [path.join(SRC_DIR, "index.tsx")],
  bundle: true,
  outdir: OUT_DIR,
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "solid-js",
  target: "esnext",
  sourcemap: true,
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "info",
  plugins: [solidPlugin],
});

await ctx.watch();

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let filePath = path.join(OUT_DIR, url.pathname === "/" ? "index.html" : url.pathname);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(OUT_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || "application/octet-stream";
  try {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": `${mime}; charset=utf-8`,
      "Content-Length": stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

const PORT = 3100;
server.listen(PORT, () => {
  console.log(`\n  管线机器人巡检缺陷帧标注平台\n`);
  console.log(`  ➜  Local:   http://localhost:${PORT}/\n`);
});

let cssTimer = null;
fs.watch(SRC_DIR, { recursive: true }, (event, filename) => {
  if (filename && filename.endsWith(".css")) {
    if (cssTimer) clearTimeout(cssTimer);
    cssTimer = setTimeout(() => {
      try {
        execSync("npx tailwindcss -i ./src/app.css -o ./dist/app.css", {
          cwd: __dirname,
          stdio: "pipe",
        });
        console.log("  CSS rebuilt");
      } catch { /* ignore */ }
    }, 300);
  }
});
