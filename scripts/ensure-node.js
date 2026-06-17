#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, chmodSync } from 'node:fs';
import { platform, arch } from 'node:process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function codesign(filePath) {
  try {
    execSync(`codesign -f -s - "${filePath}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkCodeSignIssue() {
  if (platform !== 'darwin') return false;
  
  try {
    const nodeInfo = execSync(`codesign -dv $(which node) 2>&1`, { encoding: 'utf8' });
    const hasRuntime = nodeInfo.includes('runtime)');
    const hasTeamId = nodeInfo.includes('TeamIdentifier=') && !nodeInfo.includes('TeamIdentifier=not set');
    return hasRuntime && hasTeamId;
  } catch {
    return false;
  }
}

function ensureLocalNode() {
  const localNodePath = resolve(projectRoot, 'node-local');
  
  if (existsSync(localNodePath)) {
    return localNodePath;
  }
  
  const systemNode = process.execPath;
  console.log('🔧 检测到 macOS hardened runtime，正在创建本地 Node 副本...');
  
  copyFileSync(systemNode, localNodePath);
  chmodSync(localNodePath, 0o755);
  codesign(localNodePath);
  
  console.log('✅ 本地 Node 副本创建完成');
  return localNodePath;
}

function resignRollupNative() {
  const rollupNativePaths = [
    resolve(projectRoot, 'node_modules/@rollup/rollup-darwin-arm64/rollup.darwin-arm64.node'),
    resolve(projectRoot, 'node_modules/@rollup/rollup-darwin-x64/rollup.darwin-x64.node'),
  ];
  
  for (const p of rollupNativePaths) {
    if (existsSync(p)) {
      console.log(`🔧 重新签名: ${p}`);
      codesign(p);
    }
  }
}

export function getNodeExecutable() {
  if (checkCodeSignIssue()) {
    resignRollupNative();
    return ensureLocalNode();
  }
  return process.execPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const nodePath = getNodeExecutable();
  console.log(nodePath);
}
