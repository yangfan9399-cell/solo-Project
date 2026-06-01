import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CMwlbwMA.mjs';
import { manifest } from './manifest_CPyYbJZC.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/appointments/approve.astro.mjs');
const _page2 = () => import('./pages/api/appointments/_id_.astro.mjs');
const _page3 = () => import('./pages/api/appointments.astro.mjs');
const _page4 = () => import('./pages/api/blacklist.astro.mjs');
const _page5 = () => import('./pages/api/checkins.astro.mjs');
const _page6 = () => import('./pages/api/notifications.astro.mjs');
const _page7 = () => import('./pages/api/stats.astro.mjs');
const _page8 = () => import('./pages/api/users.astro.mjs');
const _page9 = () => import('./pages/api/visitors.astro.mjs');
const _page10 = () => import('./pages/appointments/new.astro.mjs');
const _page11 = () => import('./pages/appointments/_id_.astro.mjs');
const _page12 = () => import('./pages/appointments.astro.mjs');
const _page13 = () => import('./pages/blacklist.astro.mjs');
const _page14 = () => import('./pages/gate.astro.mjs');
const _page15 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/api/appointments/approve.ts", _page1],
    ["src/pages/api/appointments/[id].ts", _page2],
    ["src/pages/api/appointments/index.ts", _page3],
    ["src/pages/api/blacklist.ts", _page4],
    ["src/pages/api/checkins.ts", _page5],
    ["src/pages/api/notifications.ts", _page6],
    ["src/pages/api/stats.ts", _page7],
    ["src/pages/api/users.ts", _page8],
    ["src/pages/api/visitors.ts", _page9],
    ["src/pages/appointments/new.astro", _page10],
    ["src/pages/appointments/[id].astro", _page11],
    ["src/pages/appointments/index.astro", _page12],
    ["src/pages/blacklist.astro", _page13],
    ["src/pages/gate.astro", _page14],
    ["src/pages/index.astro", _page15]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/dist/client/",
    "server": "file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/dist/server/",
    "host": false,
    "port": 3000,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
