import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

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

const init = spawn('npx', ['tsx', 'src/server/init-db.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

init.on('close', (initCode) => {
  if (initCode !== 0) {
    console.error('❌ 数据库初始化失败');
    process.exit(initCode);
  }

  console.log('');
  console.log('🚀 正在启动应用服务器...');
  console.log('');

  const dev = spawn('npx', ['vite', '--mode', 'ssr', '--host'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
    },
  });

  dev.on('close', (code) => {
    console.log('\n👋 服务器已停止');
    process.exit(code ?? 0);
  });

  dev.on('error', (err) => {
    console.error('❌ 启动失败:', err.message);
    process.exit(1);
  });
});
