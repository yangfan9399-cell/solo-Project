import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function initDatabase() {
  return new Promise((resolve, reject) => {
    const init = spawn('npx', ['tsx', 'src/server/init-db.ts'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });
    init.on('close', (code) => {
      if (code === 0) resolve(null);
      else reject(new Error(`数据库初始化失败，退出码: ${code}`));
    });
    init.on('error', reject);
  });
}

async function startServer() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║   💎  稀有矿物薄片显微观察档案管理系统                           ║');
  console.log('║                                                                  ║');
  console.log('║   Mineral Thin Section Microscopy Observation Archive            ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  console.log('📦 正在初始化数据库...');
  await initDatabase();
  console.log('');

  const app = express();

  console.log('⚙️  正在启动应用服务器...');

  const vite = await createViteServer({
    root: rootDir,
    server: {
      middlewareMode: true,
    },
    mode: 'ssr',
  });

  app.use(vite.middlewares);

  const port = process.env.PORT || 5173;

  app.listen(port, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                  ║');
    console.log('║   ✅  稀有矿物薄片显微观察档案管理系统 已启动                     ║');
    console.log('║                                                                  ║');
    console.log(`║   🌐 本地访问:  http://localhost:${port}                            ║`);
    console.log('║                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('� 提示: 按 Ctrl+C 停止服务器');
    console.log('');
  });
}

startServer().catch((err) => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});
