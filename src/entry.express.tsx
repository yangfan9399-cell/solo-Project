import express from 'express';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { createQwikCity, type PlatformNode } from '@builder.io/qwik-city/middleware/express';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';

declare global {
  interface QwikCityPlatform extends PlatformNode {}
}

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const app = express();

app.use(express.static(`${distDir}/client`));

app.use(
  createQwikCity({ render, qwikCityPlan, manifest })
);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`稀有矿物薄片显微观察档案系统已启动: http://localhost:${port}`);
});
