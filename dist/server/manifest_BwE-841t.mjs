import 'piccolore';
import { p as decodeKey } from './chunks/astro/server_D2NMvV5T.mjs';
import 'clsx';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_BdHm-RAx.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/","cacheDir":"file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/node_modules/.astro/","outDir":"file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/dist/","srcDir":"file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/src/","publicDir":"file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/public/","buildClientDir":"file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/dist/client/","buildServerDir":"file:///Users/yangfan/Desktop/code4/trae-solo-coder-2/dist/server/","adapterName":"@astrojs/node","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/node.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/appointments/approve","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/appointments\\/approve\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"appointments","dynamic":false,"spread":false}],[{"content":"approve","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/appointments/approve.ts","pathname":"/api/appointments/approve","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/appointments/[id]","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/appointments\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"appointments","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/api/appointments/[id].ts","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/appointments","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/appointments\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"appointments","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/appointments/index.ts","pathname":"/api/appointments","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/blacklist","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/blacklist\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"blacklist","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/blacklist.ts","pathname":"/api/blacklist","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/checkins","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/checkins\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"checkins","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/checkins.ts","pathname":"/api/checkins","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/notifications","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/notifications\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"notifications","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/notifications.ts","pathname":"/api/notifications","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/stats","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/stats\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"stats","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/stats.ts","pathname":"/api/stats","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/users","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/users\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"users","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/users.ts","pathname":"/api/users","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/visitors","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/visitors\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"visitors","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/visitors.ts","pathname":"/api/visitors","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.BnNWFF1i.css"}],"routeData":{"route":"/appointments/new","isIndex":false,"type":"page","pattern":"^\\/appointments\\/new\\/?$","segments":[[{"content":"appointments","dynamic":false,"spread":false}],[{"content":"new","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/appointments/new.astro","pathname":"/appointments/new","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.BnNWFF1i.css"}],"routeData":{"route":"/appointments/[id]","isIndex":false,"type":"page","pattern":"^\\/appointments\\/([^/]+?)\\/?$","segments":[[{"content":"appointments","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/appointments/[id].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.BnNWFF1i.css"}],"routeData":{"route":"/appointments","isIndex":true,"type":"page","pattern":"^\\/appointments\\/?$","segments":[[{"content":"appointments","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/appointments/index.astro","pathname":"/appointments","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.BnNWFF1i.css"}],"routeData":{"route":"/blacklist","isIndex":false,"type":"page","pattern":"^\\/blacklist\\/?$","segments":[[{"content":"blacklist","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/blacklist.astro","pathname":"/blacklist","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.BnNWFF1i.css"}],"routeData":{"route":"/gate","isIndex":false,"type":"page","pattern":"^\\/gate\\/?$","segments":[[{"content":"gate","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/gate.astro","pathname":"/gate","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.BnNWFF1i.css"}],"routeData":{"route":"/notifications","isIndex":false,"type":"page","pattern":"^\\/notifications\\/?$","segments":[[{"content":"notifications","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/notifications.astro","pathname":"/notifications","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.BnNWFF1i.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/[id].astro",{"propagation":"none","containsHead":true}],["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/index.astro",{"propagation":"none","containsHead":true}],["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/new.astro",{"propagation":"none","containsHead":true}],["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/blacklist.astro",{"propagation":"none","containsHead":true}],["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/gate.astro",{"propagation":"none","containsHead":true}],["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/notifications.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astro-page:src/pages/api/appointments/[id]@_@ts":"pages/api/appointments/_id_.astro.mjs","\u0000@astro-page:src/pages/api/appointments/approve@_@ts":"pages/api/appointments/approve.astro.mjs","\u0000@astro-page:src/pages/api/appointments/index@_@ts":"pages/api/appointments.astro.mjs","\u0000@astro-page:src/pages/api/blacklist@_@ts":"pages/api/blacklist.astro.mjs","\u0000@astro-page:src/pages/api/checkins@_@ts":"pages/api/checkins.astro.mjs","\u0000@astro-page:src/pages/api/notifications@_@ts":"pages/api/notifications.astro.mjs","\u0000@astro-page:src/pages/api/stats@_@ts":"pages/api/stats.astro.mjs","\u0000@astro-page:src/pages/api/users@_@ts":"pages/api/users.astro.mjs","\u0000@astro-page:src/pages/api/visitors@_@ts":"pages/api/visitors.astro.mjs","\u0000@astro-page:src/pages/appointments/[id]@_@astro":"pages/appointments/_id_.astro.mjs","\u0000@astro-page:src/pages/appointments/index@_@astro":"pages/appointments.astro.mjs","\u0000@astro-page:src/pages/appointments/new@_@astro":"pages/appointments/new.astro.mjs","\u0000@astro-page:src/pages/blacklist@_@astro":"pages/blacklist.astro.mjs","\u0000@astro-page:src/pages/gate@_@astro":"pages/gate.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:src/pages/notifications@_@astro":"pages/notifications.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/node@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_BwE-841t.mjs","/Users/yangfan/Desktop/code4/trae-solo-coder-2/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_D3EpZQcW.mjs","/Users/yangfan/Desktop/code4/trae-solo-coder-2/node_modules/unstorage/drivers/fs-lite.mjs":"chunks/fs-lite_COtHaKzy.mjs","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/AppointmentDetail.tsx":"_astro/AppointmentDetail.BIxUtF-b.js","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/AppointmentForm.tsx":"_astro/AppointmentForm.BqZIejyc.js","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/AppointmentList.tsx":"_astro/AppointmentList.DMBCOh_f.js","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/BlacklistManager.tsx":"_astro/BlacklistManager.CVcMFaHa.js","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/Dashboard.tsx":"_astro/Dashboard.CQy-pOxc.js","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/GateVerify.tsx":"_astro/GateVerify.01PUD_By.js","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/NotificationCenter":"_astro/NotificationCenter.DWLZAcvH.js","@astrojs/react/client.js":"_astro/client.CbHKJimV.js","/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts":"_astro/BaseLayout.astro_astro_type_script_index_0_lang.C8Yry-V1.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts","async function a(){try{const t=await fetch(\"/api/notifications?is_read=0\");if(!t.ok)return;const n=(await t.json()).length,e=document.getElementById(\"nav-notification-badge\");e&&(n>0?(e.textContent=n>99?\"99+\":String(n),e.classList.remove(\"hidden\")):e.classList.add(\"hidden\"))}catch(t){console.error(\"更新通知计数失败\",t)}}a();setInterval(a,3e4);"]],"assets":["/_astro/_id_.BnNWFF1i.css","/_astro/AppointmentDetail.BIxUtF-b.js","/_astro/AppointmentForm.BqZIejyc.js","/_astro/AppointmentList.DMBCOh_f.js","/_astro/BlacklistManager.CVcMFaHa.js","/_astro/Dashboard.CQy-pOxc.js","/_astro/EmptyState.BWGEQpvF.js","/_astro/ErrorState.B9POZ-Ah.js","/_astro/GateVerify.01PUD_By.js","/_astro/LoadingSpinner.DgMhgO_h.js","/_astro/NotificationCenter.DWLZAcvH.js","/_astro/StatusBadge.B1jcpSpf.js","/_astro/client.CbHKJimV.js","/_astro/index.C5BVv2q5.js","/_astro/jsx-runtime.D_zvdyIk.js"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"9eawrejAhNkzXdkZTPkd6iWqcHNS6hUlyv7N06W3Duk=","sessionConfig":{"driver":"fs-lite","options":{"base":"/Users/yangfan/Desktop/code4/trae-solo-coder-2/node_modules/.astro/sessions"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/fs-lite_COtHaKzy.mjs');

export { manifest };
