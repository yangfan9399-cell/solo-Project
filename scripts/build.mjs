import { build as esbuildBuild, context } from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const isDev = process.argv.includes('--watch');
const outDir = resolve(projectRoot, 'dist');

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function clean() {
  try { rmSync(outDir, { recursive: true }); } catch {}
  ensureDir(outDir);
}

async function buildCSS() {
  const cssInput = readFileSync(resolve(projectRoot, 'src/index.css'), 'utf8');
  const result = await postcss([tailwindcss(), autoprefixer]).process(cssInput, {
    from: resolve(projectRoot, 'src/index.css'),
  });
  writeFileSync(resolve(outDir, 'index.css'), result.css);
  console.log('[css] built');
}

function buildHTML() {
  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>餐卡充值异常与退款核对系统</title>
    <link rel="stylesheet" href="/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.js"></script>
  </body>
</html>`;
  writeFileSync(resolve(outDir, 'index.html'), html);
  console.log('[html] built');
}

async function buildJS() {
  const config = {
    entryPoints: [resolve(projectRoot, 'src/main.tsx')],
    bundle: true,
    outfile: resolve(outDir, 'index.js'),
    format: 'esm',
    jsx: 'automatic',
    sourcemap: isDev,
    minify: !isDev,
    define: {
      'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
    },
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
    logLevel: 'info',
  };

  if (isDev) {
    const ctx = await context(config);
    await ctx.watch();
    console.log('[js] watching...');
  } else {
    await esbuildBuild(config);
    console.log('[js] built');
  }
}

function copyAssets() {
  try {
    copyFileSync(resolve(projectRoot, 'public/favicon.svg'), resolve(outDir, 'favicon.svg'));
  } catch {}
}

clean();
await buildCSS();
buildHTML();
copyAssets();
await buildJS();
