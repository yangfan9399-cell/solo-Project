import esbuild from "esbuild";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const BACKEND_PUBLIC = path.join(ROOT, "backend", "public");
const SHARED = path.join(ROOT, "shared", "src");

const WATCH = process.argv.includes("--watch");
const DEV = process.argv.includes("--dev") || WATCH;

if (!fs.existsSync(BACKEND_PUBLIC)) fs.mkdirSync(BACKEND_PUBLIC, { recursive: true });

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>珊瑚钟室路径解谜游戏</title>
<link rel="stylesheet" href="/bundle.css" />
</head>
<body>
<div id="root"></div>
<script src="/bundle.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(BACKEND_PUBLIC, "index.html"), indexHtml, "utf-8");

const buildOptions = {
  entryPoints: [
    path.join(FRONTEND, "src", "main.tsx"),
  ],
  outdir: BACKEND_PUBLIC,
  entryNames: "bundle",
  chunkNames: "[name]-[hash]",
  assetNames: "assets/[name]",
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2020", "chrome90", "safari14", "firefox88"],
  sourcemap: DEV ? "inline" : false,
  minify: !DEV,
  treeShaking: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify(DEV ? "development" : "production"),
    global: "window",
  },
  jsx: "automatic",
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
    ".css": "css",
    ".json": "json",
    ".png": "file",
    ".svg": "file",
  },
  resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".css", ".json"],
  metafile: true,
  plugins: [
    {
      name: "shared-alias",
      setup(build) {
        build.onResolve({ filter: /^@cbcp\/shared$/ }, () => ({
          path: path.join(SHARED, "index.ts"),
        }));
        build.onResolve({ filter: /^@cbcp\/shared\// }, (args) => ({
          path: path.join(SHARED, args.path.replace("@cbcp/shared/", "")),
        }));
      },
    },
  ],
  logLevel: "info",
  color: true,
};

async function run() {
  if (WATCH) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("\n✅ esbuild watching... 前端变更会自动重建到 backend/public/");
    console.log(`   输出目录: ${BACKEND_PUBLIC}\n`);
  } else {
    await esbuild.build(buildOptions);
    console.log("\n✅ esbuild 构建完成!");
    const files = fs.readdirSync(BACKEND_PUBLIC);
    files.forEach((f) => {
      const st = fs.statSync(path.join(BACKEND_PUBLIC, f));
      console.log(`   ${f.padEnd(15)} ${(st.size / 1024).toFixed(1)} KB`);
    });
    console.log("");
  }
}

run().catch((e) => {
  console.error("❌ esbuild 构建失败:", e);
  process.exit(1);
});
