const fs = require('fs');
const path = require('path');

const nativeDir = path.join(__dirname, '..', 'node_modules', '@rollup', 'rollup-darwin-arm64');
const nativePkg = path.join(nativeDir, 'package.json');

if (!fs.existsSync(nativePkg)) {
	process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(nativePkg, 'utf8'));

if (pkg.description && pkg.description.includes('wasm')) {
	const nativeJs = path.join(nativeDir, 'dist', 'native.js');
	if (fs.existsSync(nativeJs)) {
		const wasmNativeJs = path.join(
			__dirname, '..', 'node_modules', '@rollup', 'wasm-node', 'dist', 'native.js'
		);
		if (fs.existsSync(wasmNativeJs)) {
			fs.copyFileSync(wasmNativeJs, nativeJs);
			console.log('[postinstall] Patched @rollup/rollup-darwin-arm64 native.js -> wasm-node native.js');
		}
	}

	pkg.main = 'dist/native.js';
	if (pkg.exports && pkg.exports['.']) {
		pkg.exports['.'].require = './dist/native.js';
		pkg.exports['.'].import = './dist/native.js';
	}
	fs.writeFileSync(nativePkg, JSON.stringify(pkg, null, '\t'));
	console.log('[postinstall] Patched @rollup/rollup-darwin-arm64 package.json main + exports -> dist/native.js');
}
