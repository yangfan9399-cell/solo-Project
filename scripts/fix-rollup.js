#!/usr/bin/env node
import { existsSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = join(__dirname, '..');
const rollupDist = join(projectRoot, 'node_modules', 'rollup', 'dist');
const wasmNodeDist = join(projectRoot, 'node_modules', '@rollup', 'wasm-node', 'dist');

if (existsSync(rollupDist) && existsSync(wasmNodeDist)) {
	try {
		const nativeJs = join(rollupDist, 'native.js');
		const wasmNativeJs = join(wasmNodeDist, 'native.js');
		const wasmNodeDir = join(rollupDist, 'wasm-node');
		const wasmSourceDir = join(wasmNodeDist, 'wasm-node');

		if (existsSync(wasmSourceDir)) {
			if (existsSync(wasmNodeDir)) {
				rmSync(wasmNodeDir, { recursive: true, force: true });
			}
			cpSync(wasmSourceDir, wasmNodeDir, { recursive: true });
			console.log('[postinstall] Copied wasm-node directory to rollup/dist');
		}

		if (existsSync(wasmNativeJs)) {
			cpSync(wasmNativeJs, nativeJs);
			console.log('[postinstall] Replaced rollup native.js with WASM version');
		}

		console.log('[postinstall] Rollup WASM fallback applied successfully.');
	} catch (e) {
		console.warn('[postinstall] Failed to apply rollup WASM fallback:', e.message);
	}
} else {
	console.log('[postinstall] Rollup or @rollup/wasm-node not found, skipping.');
}
