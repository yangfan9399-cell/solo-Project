import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
process.env.NAPI_RS_FORCE_WASI = '1';
try { require.resolve('nuxt/package.json'); } catch(e) { process.exit(2); }
try { const r = require('rollup'); if (r && typeof r.rollup === 'function') { process.exit(0); } process.exit(1); } catch(e) { process.exit(3); }