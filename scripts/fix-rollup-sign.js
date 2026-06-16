#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rollupNativeDir = join(__dirname, '..', 'node_modules', '@rollup');

if (existsSync(rollupNativeDir)) {
	try {
		const { platform, arch } = process;
		const nativeModule = `rollup-${platform}-${arch}`;
		const nativeFile = join(rollupNativeDir, nativeModule, `rollup.${platform}-${arch}.node`);

		if (existsSync(nativeFile) && platform === 'darwin') {
			console.log(`[postinstall] Re-signing ${nativeFile}...`);
			execSync(`codesign --force --deep --sign - "${nativeFile}"`, { stdio: 'inherit' });
			console.log('[postinstall] Re-sign completed.');
		}
	} catch (e) {
		console.warn('[postinstall] Failed to re-sign rollup native module:', e.message);
		console.warn('[postinstall] You may need to run with Rosetta or use a different Node.js version.');
	}
}
