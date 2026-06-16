const fs = require('fs');
const path = require('path');

// 检查是否存在 rollup 原生绑定问题
// 这个脚本会在 npm install 后自动运行，将 rollup 的 native.js 替换为 WASM 版本

function checkAndFixRollup() {
  try {
    const rollupDir = path.join(__dirname, '../node_modules/rollup');
    const wasmRollupDir = path.join(__dirname, '../node_modules/@rollup/wasm-node');

    // 检查是否已经修复过
    const nativeJsPath = path.join(rollupDir, 'dist/native.js');
    if (!fs.existsSync(nativeJsPath)) {
      console.log('[rollup-fix] rollup 不存在，跳过修复');
      return;
    }

    const currentContent = fs.readFileSync(nativeJsPath, 'utf-8');
    if (currentContent.includes('wasm-node/bindings_wasm')) {
      console.log('[rollup-fix] rollup 已经使用 WASM 版本，跳过修复');
      return;
    }

    // 检查 @rollup/wasm-node 是否存在
    if (!fs.existsSync(wasmRollupDir)) {
      console.log('[rollup-fix] @rollup/wasm-node 不存在，尝试安装...');
      const { execSync } = require('child_process');
      try {
        execSync('npm install @rollup/wasm-node --no-save', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        });
      } catch (e) {
        console.error('[rollup-fix] 安装 @rollup/wasm-node 失败');
        return;
      }
    }

    // 复制 WASM 文件
    const wasmDist = path.join(wasmRollupDir, 'dist');
    const rollupDist = path.join(rollupDir, 'dist');

    // 复制 wasm-node 目录
    const wasmNodeSrc = path.join(wasmDist, 'wasm-node');
    const wasmNodeDest = path.join(rollupDist, 'wasm-node');

    if (fs.existsSync(wasmNodeSrc)) {
      if (!fs.existsSync(wasmNodeDest)) {
        fs.mkdirSync(wasmNodeDest, { recursive: true });
      }
      copyDir(wasmNodeSrc, wasmNodeDest);
      console.log('[rollup-fix] 复制 WASM 文件成功');
    }

    // 替换 native.js
    const wasmNativeJs = path.join(wasmDist, 'native.js');
    if (fs.existsSync(wasmNativeJs)) {
      const wasmContent = fs.readFileSync(wasmNativeJs, 'utf-8');
      fs.writeFileSync(nativeJsPath, wasmContent);
      console.log('[rollup-fix] 替换 native.js 为 WASM 版本成功');
    }

    console.log('[rollup-fix] Rollup WASM 修复完成');
  } catch (e) {
    console.error('[rollup-fix] 修复失败:', e.message);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

checkAndFixRollup();
