#!/usr/bin/env node
/**
 * postinstall 脚本：在 npm install 后自动执行。
 *
 * 设计原则：
 *   - Rollup：优先依赖 package.json 的 `overrides`（npm 官方机制）
 *     将 `rollup` 整体替换为 `@rollup/wasm-node`（WASM 实现，无需原生 .node）。
 *     此脚本仅做兜底：如果 overrides 未生效（如旧 npm、或未重装），
 *     通过 symlink 将 rollup 指向 @rollup/wasm-node。
 *   - Prisma：通过 `@prisma/adapter-pg` Driver Adapters 用 pg 原生驱动
 *     绕过 libquery_engine。如果 Prisma Client 缺少 previewFeatures，
 *     在生成的客户端中打补丁，并对 dylib 做 ad-hoc codesign（兜底）。
 *
 * 重新安装依赖：删除 node_modules 和 package-lock.json，执行 `npm install`。
 */

import { existsSync, readFileSync, writeFileSync, rmSync, symlinkSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const NODE_MODULES = join(ROOT, 'node_modules');

function ensureRollupWasm() {
  const rollupPath = join(NODE_MODULES, 'rollup');
  const wasmPath = join(NODE_MODULES, '@rollup', 'wasm-node');

  if (!existsSync(wasmPath)) {
    console.log('  ℹ @rollup/wasm-node 尚未安装，跳过 rollup 检查');
    return;
  }

  let isWasm = false;
  if (existsSync(rollupPath)) {
    try {
      if (lstatSync(rollupPath).isSymbolicLink()) {
        isWasm = true;
      } else {
        const native = readFileSync(join(rollupPath, 'dist', 'native.js'), 'utf8');
        isWasm = native.includes('bindings_wasm');
      }
    } catch (e) {
      isWasm = false;
    }
  }

  if (isWasm) {
    console.log('  ✔ Rollup：WASM 实现（overrides 生效）');
    return;
  }

  try {
    if (existsSync(rollupPath)) {
      rmSync(rollupPath, { recursive: true, force: true });
    }
    symlinkSync('@rollup/wasm-node', rollupPath, 'dir');
    console.log('  ✔ Rollup：兜底 symlink → @rollup/wasm-node');
  } catch (e) {
    console.log(`  ⚠ Rollup 兜底失败：${e.message}`);
    process.exitCode = 1;
  }
}

function patchPrismaDriverAdapters() {
  const targets = [
    join(NODE_MODULES, '.prisma', 'client', 'index.js'),
    join(NODE_MODULES, '.prisma', 'client', 'edge.js')
  ];
  let patched = 0;
  for (const t of targets) {
    if (!existsSync(t)) continue;
    try {
      let c = readFileSync(t, 'utf8');
      if (c.includes('"previewFeatures": []')) {
        c = c.replace(
          /"previewFeatures": \[\]/g,
          '"previewFeatures": ["driverAdapters"]'
        );
        writeFileSync(t, c);
        patched++;
      }
    } catch (e) {
      // ignore
    }
  }
  if (patched > 0) {
    console.log(`  ✔ Prisma：启用 driverAdapters preview（${patched} 个文件）`);
  } else {
    console.log('  ℹ Prisma：driverAdapters 已启用');
  }
}

function codesignPrismaEngines() {
  const targets = [
    join(NODE_MODULES, '.prisma', 'client', 'libquery_engine-darwin-arm64.dylib.node'),
    join(NODE_MODULES, '.prisma', 'client', 'libquery_engine-darwin-x64.dylib.node'),
    join(NODE_MODULES, 'prisma', 'libquery_engine-darwin-arm64.dylib.node'),
    join(NODE_MODULES, 'prisma', 'libquery_engine-darwin-x64.dylib.node')
  ];
  let patched = 0;
  for (const t of targets) {
    if (existsSync(t)) {
      try {
        execSync(`codesign --force --sign - "${t}" 2>/dev/null`, { stdio: 'ignore' });
        patched++;
      } catch (e) {
        // ignore
      }
    }
  }
  if (patched > 0) {
    console.log(`  ✔ Prisma：引擎 ad-hoc codesign（${patched} 个文件，CLI 兜底）`);
  }
}

console.log('');
console.log('🔧 运行 postinstall：环境兼容处理...');

ensureRollupWasm();
patchPrismaDriverAdapters();
codesignPrismaEngines();

console.log('');
console.log('✅ postinstall 完成');
console.log('   · 重新安装依赖后：删除 node_modules + package-lock.json → npm install');
console.log('   · 启动服务：npm run dev → 打开 http://localhost:5173/');
console.log('');
