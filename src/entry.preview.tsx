import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';
import { manifest } from '@qwik-client-manifest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticRoot = join(__dirname, '..', 'server');

export default createQwikCity({ 
  render, 
  qwikCityPlan, 
  manifest,
  static: {
    root: staticRoot,
  },
});
