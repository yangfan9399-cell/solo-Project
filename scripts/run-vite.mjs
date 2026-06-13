import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const projectRoot = path.resolve(__dirname, '..');
const nodeModulesDir = path.join(projectRoot, 'node_modules');

const rollupOrig = path.join(nodeModulesDir, 'rollup');
const rollupWasm = path.join(nodeModulesDir, '@rollup', 'wasm-node');
const rollupBackup = path.join(nodeModulesDir, 'rollup-orig');

const fs = require('fs');

function setupRollupWasm() {
	if (!fs.existsSync(rollupWasm)) {
		console.error('❌ @rollup/wasm-node 未安装，请运行: npm install @rollup/wasm-node');
		process.exit(1);
	}

	if (!fs.existsSync(rollupOrig)) {
		console.error('❌ node_modules/rollup 不存在，请先运行 npm install');
		process.exit(1);
	}

	try {
		const stat = fs.lstatSync(rollupOrig);
		if (stat.isSymbolicLink()) {
			const target = fs.readlinkSync(rollupOrig);
			if (target.includes('@rollup/wasm-node') || target.includes('wasm')) {
				console.log('✅ Rollup WASM 已配置，跳过...');
				return;
			}
		}
	} catch {}

	try {
		if (!fs.existsSync(rollupBackup) && !fs.lstatSync(rollupOrig).isSymbolicLink()) {
			fs.renameSync(rollupOrig, rollupBackup);
			console.log('✅ 已备份原 rollup 到 rollup-orig');
		} else if (fs.existsSync(rollupBackup)) {
			try {
				const stat = fs.lstatSync(rollupOrig);
				if (!stat.isSymbolicLink()) {
					fs.rmSync(rollupOrig, { recursive: true, force: true });
				}
			} catch {
				fs.rmSync(rollupOrig, { recursive: true, force: true });
			}
		}
	} catch (e) {
		console.log('ℹ️  准备创建软链接...');
		try {
			if (fs.lstatSync(rollupOrig).isSymbolicLink()) {
				fs.unlinkSync(rollupOrig);
			} else {
				fs.rmSync(rollupOrig, { recursive: true, force: true });
			}
		} catch {}
	}

	try {
		const stat = fs.lstatSync(rollupOrig);
		if (stat.isSymbolicLink()) {
			fs.unlinkSync(rollupOrig);
		} else {
			fs.rmSync(rollupOrig, { recursive: true, force: true });
		}
	} catch {}

	const relativeTarget = path.relative(nodeModulesDir, rollupWasm);
	fs.symlinkSync(relativeTarget, rollupOrig);
	console.log(`✅ Rollup WASM 软链接已创建: rollup -> ${relativeTarget}`);
}

setupRollupWasm();

const args = process.argv.slice(2);
const viteBin = path.join(require.resolve('vite/package.json'), '..', 'bin', 'vite.js');

console.log(`🏗️  运行 vite: vite ${args.join(' ')}`);
const child = spawn(process.execPath, [viteBin, ...args], {
	stdio: 'inherit',
	env: { ...process.env, FORCE_COLOR: '1' }
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
	console.error('执行失败:', err);
	process.exit(1);
});
