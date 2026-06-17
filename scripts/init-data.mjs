import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { initSampleData } = require('./init-data.js');
initSampleData();
