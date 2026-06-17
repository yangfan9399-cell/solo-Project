import express from 'express';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const app = express();

const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  manifest,
  static: {
    root: join(distDir, 'client'),
  },
});

app.use(staticFile);
app.use(router);
app.use(notFound);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║   💎  稀有矿物薄片显微观察档案管理系统                           ║');
  console.log('║                                                                  ║');
  console.log('║   Mineral Thin Section Microscopy Observation Archive            ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 服务器已启动: http://localhost:${port}`);
  console.log('');
});
