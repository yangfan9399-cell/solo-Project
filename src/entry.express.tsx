/* eslint-disable */
import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const distDir = join(fileURLToPath(import.meta.url), '..', '..', 'dist');

const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  static: {
    cacheControl: 'public, max-age=31536000, immutable',
  },
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = createServer();

server.on('request', async (req: IncomingMessage, res: ServerResponse) => {
  try {
    await staticFile(req, res, () => {});
    if (res.headersSent) return;

    await router(req, res, () => {});
    if (res.headersSent) return;

    await notFound(req, res, () => {});
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`古代水钟校时经营游戏 - 服务已启动: http://localhost:${PORT}/`);
  console.log(`静态资源目录: ${distDir}`);
});
