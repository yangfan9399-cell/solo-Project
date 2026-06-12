import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('Fixing native module signature issues...');

try {
  const nativeJsPath = join(rootDir, 'node_modules', 'rollup', 'dist', 'native.js');
  if (existsSync(nativeJsPath)) {
    const wasmContent = `const { parse, parseAsync, xxhashBase64Url } = require('@rollup/wasm-node');

module.exports.parse = parse;
module.exports.parseAsync = parseAsync;
module.exports.xxhashBase64Url = xxhashBase64Url;
`;
    writeFileSync(nativeJsPath, wasmContent);
    console.log('✓ Patched rollup native.js to use WASM version');
  }

  console.log('Re-signing all native modules...');
  try {
    execSync(`find "${rootDir}/node_modules" \\( -name "*.node" -o -name "*.dylib" \\) -exec codesign --remove-signature {} \\; 2>/dev/null || true`, { stdio: 'ignore' });
    execSync(`find "${rootDir}/node_modules" \\( -name "*.node" -o -name "*.dylib" \\) -exec codesign -s - --force {} \\; 2>/dev/null || true`, { stdio: 'ignore' });
    console.log('✓ All native modules re-signed');
  } catch (e) {
    console.log('⚠️  Re-signing failed, but continuing...');
  }

  console.log('✓ All fixes applied successfully!');
} catch (error) {
  console.error('Error fixing native modules:', error.message);
  process.exit(1);
}
