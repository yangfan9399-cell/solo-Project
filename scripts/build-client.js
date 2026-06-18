const path = require('path');
const clientRoot = path.resolve(__dirname, '..', 'client');
process.env.NODE_PATH = path.join(clientRoot, 'node_modules');
require('module').Module._initPaths();

const esbuild = require('esbuild');
const chokidar = require('chokidar');

const outDir = path.resolve(__dirname, '..', 'server', 'public');

const baseConfig = {
  entryPoints: [path.join(clientRoot, 'src', 'main.tsx')],
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'safari15'],
  outfile: path.join(outDir, 'assets', 'app.js'),
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.css': 'css',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl'
  },
  jsx: 'automatic',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`
  },
  logLevel: 'info'
};

function copyHtml() {
  const fs = require('fs');
  const htmlIn = path.join(clientRoot, 'index.html');
  const htmlOut = path.join(outDir, 'index.html');
  let html = fs.readFileSync(htmlIn, 'utf-8');
  html = html.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    '<script src="/assets/app.js"></script>'
  );
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(path.join(outDir, 'assets'))) fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  fs.writeFileSync(htmlOut, html);
  console.log('[build] index.html copied');
}

async function buildOnce() {
  copyHtml();
  await esbuild.build(baseConfig);
  console.log('[build] build done at', new Date().toLocaleTimeString());
}

async function watch() {
  copyHtml();
  const ctx = await esbuild.context(baseConfig);
  await ctx.watch();
  console.log('[build] watching for changes...');

  const htmlWatcher = chokidar.watch(path.join(clientRoot, 'index.html'));
  htmlWatcher.on('change', () => { copyHtml(); });
}

const mode = process.argv[2] || 'build';
if (mode === 'watch') watch();
else buildOnce().then(() => process.exit(0)).catch(() => process.exit(1));
