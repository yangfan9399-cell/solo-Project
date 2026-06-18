import * as esbuild from 'esbuild';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 5173;
const SRC = path.resolve('src');
const OUT_DIR = path.resolve('out');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const ctx = await esbuild.context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'out/bundle.js',
  format: 'iife',
  jsx: 'automatic',
  sourcemap: false,
  write: true,
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  logLevel: 'info',
});

await ctx.rebuild();

function proxyRequest(req, res) {
  const opts = {
    hostname: 'localhost',
    port: 3456,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: 'localhost:3456' },
  };
  const proxy = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '后端连接失败' }));
  });
  req.pipe(proxy, { end: true });
}

let rebuildTimer = null;
async function scheduleRebuild() {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(async () => {
    try {
      await ctx.rebuild();
      hmrClients.forEach(c => c.write('data: reload\n\n'));
    } catch (e) {
      console.error('[esbuild] rebuild error:', e.message);
    }
  }, 200);
}

const hmrClients = new Set();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/api/')) {
    proxyRequest(req, res);
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = fs.readFileSync('index.html', 'utf-8').replace(
      '</body>',
      `<script>
        var es = new EventSource('/__esbuild_hmr__');
        es.addEventListener('message', function(e) { if (e.data === 'reload') location.reload(); });
      </script></body>`
    );
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (url.pathname === '/bundle.js') {
    res.writeHead(200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    res.end(fs.readFileSync('out/bundle.js', 'utf-8'));
    return;
  }

  if (url.pathname === '/__esbuild_hmr__') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: connected\n\n');
    hmrClients.add(res);
    req.on('close', () => hmrClients.delete(res));
    return;
  }

  const safePath = path.join('.', path.normalize(url.pathname));
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(fs.readFileSync(safePath));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

fs.watch(SRC, { recursive: true }, () => scheduleRebuild());

server.listen(PORT, () => {
  console.log(`[云母矿灯·前端] 已启动 http://localhost:${PORT}`);
});
