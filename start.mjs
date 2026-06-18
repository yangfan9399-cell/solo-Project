import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = __dirname;

function printBanner(port) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║   💎  稀有矿物薄片显微观察档案管理系统                           ║');
  console.log('║                                                                  ║');
  console.log('║   Mineral Thin Section Microscopy Observation Archive            ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  if (port) {
    console.log(`🌐 本地访问:  http://localhost:${port}`);
    console.log('');
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });
    p.on('close', (code) => {
      if (code === 0) resolve(null);
      else reject(new Error(`${cmd} ${args.join(' ')} 失败，退出码: ${code}`));
    });
    p.on('error', reject);
  });
}

async function buildIfNeeded() {
  const serverEntry = join(rootDir, 'server', 'entry.express.js');
  if (fs.existsSync(serverEntry)) {
    console.log('✅ 构建产物已存在，跳过构建');
    return;
  }
  console.log('🔨 正在构建服务器...');
  await run('npx', ['vite', 'build', '-c', 'adapters/node/vite.config.ts']);
  console.log('✅ 构建完成');
}

async function start() {
  printBanner();
  console.log('📦 正在初始化数据库...');
  await run('npx', ['tsx', 'src/server/init-db.ts']);
  console.log('');
  await buildIfNeeded();
  console.log('');
  console.log('🚀 正在启动服务器...');
  printBanner(process.env.PORT || 3000);
  console.log('💡 提示: 按 Ctrl+C 停止服务器');
  console.log('');
  await run('node', [join(rootDir, 'server', 'entry.express.js')]);
}

start().catch((err) => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});
