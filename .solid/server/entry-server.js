import { isServer, createComponent, spread, useAssets, ssr, escape, delegateEvents, ssrHydrationKey, ssrAttribute, ssrElement } from 'solid-js/web';
import { createContext, sharedConfig, createUniqueId, useContext, createRenderEffect, onCleanup, createSignal, getOwner, runWithOwner, createMemo, untrack, on, startTransition, resetErrorBoundaries, createResource, Show, For, Suspense } from 'solid-js';
import 'http';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { mysqlTable, varchar, mysqlEnum, datetime, index, decimal, text, int, json as json$1 } from 'drizzle-orm/mysql-core';
import { eq, sql, or, like, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const MetaContext = createContext();
const cascadingTags = ["title", "meta"];
const titleTagProperties = [];
const metaTagProperties = (
  // https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element
  ["name", "http-equiv", "content", "charset", "media"].concat(["property"])
);
const getTagKey = (tag, properties) => {
  const tagProps = Object.fromEntries(Object.entries(tag.props).filter(([k]) => properties.includes(k)).sort());
  if (Object.hasOwn(tagProps, "name") || Object.hasOwn(tagProps, "property")) {
    tagProps.name = tagProps.name || tagProps.property;
    delete tagProps.property;
  }
  return tag.tag + JSON.stringify(tagProps);
};
function initClientProvider() {
  if (!sharedConfig.context) {
    const ssrTags = document.head.querySelectorAll(`[data-sm]`);
    Array.prototype.forEach.call(ssrTags, (ssrTag) => ssrTag.parentNode.removeChild(ssrTag));
  }
  const cascadedTagInstances = /* @__PURE__ */ new Map();
  function getElement(tag) {
    if (tag.ref) {
      return tag.ref;
    }
    let el = document.querySelector(`[data-sm="${tag.id}"]`);
    if (el) {
      if (el.tagName.toLowerCase() !== tag.tag) {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
        el = document.createElement(tag.tag);
      }
      el.removeAttribute("data-sm");
    } else {
      el = document.createElement(tag.tag);
    }
    return el;
  }
  return {
    addTag(tag) {
      if (cascadingTags.indexOf(tag.tag) !== -1) {
        const properties = tag.tag === "title" ? titleTagProperties : metaTagProperties;
        const tagKey = getTagKey(tag, properties);
        if (!cascadedTagInstances.has(tagKey)) {
          cascadedTagInstances.set(tagKey, []);
        }
        let instances = cascadedTagInstances.get(tagKey);
        let index = instances.length;
        instances = [...instances, tag];
        cascadedTagInstances.set(tagKey, instances);
        let element2 = getElement(tag);
        tag.ref = element2;
        spread(element2, tag.props);
        let lastVisited = null;
        for (var i = index - 1; i >= 0; i--) {
          if (instances[i] != null) {
            lastVisited = instances[i];
            break;
          }
        }
        if (element2.parentNode != document.head) {
          document.head.appendChild(element2);
        }
        if (lastVisited && lastVisited.ref && lastVisited.ref.parentNode) {
          document.head.removeChild(lastVisited.ref);
        }
        return index;
      }
      let element = getElement(tag);
      tag.ref = element;
      spread(element, tag.props);
      if (element.parentNode != document.head) {
        document.head.appendChild(element);
      }
      return -1;
    },
    removeTag(tag, index) {
      const properties = tag.tag === "title" ? titleTagProperties : metaTagProperties;
      const tagKey = getTagKey(tag, properties);
      if (tag.ref) {
        const t = cascadedTagInstances.get(tagKey);
        if (t) {
          if (tag.ref.parentNode) {
            tag.ref.parentNode.removeChild(tag.ref);
            for (let i = index - 1; i >= 0; i--) {
              if (t[i] != null) {
                document.head.appendChild(t[i].ref);
              }
            }
          }
          t[index] = null;
          cascadedTagInstances.set(tagKey, t);
        } else {
          if (tag.ref.parentNode) {
            tag.ref.parentNode.removeChild(tag.ref);
          }
        }
      }
    }
  };
}
function initServerProvider() {
  const tags = [];
  useAssets(() => ssr(renderTags(tags)));
  return {
    addTag(tagDesc) {
      if (cascadingTags.indexOf(tagDesc.tag) !== -1) {
        const properties = tagDesc.tag === "title" ? titleTagProperties : metaTagProperties;
        const tagDescKey = getTagKey(tagDesc, properties);
        const index = tags.findIndex((prev) => prev.tag === tagDesc.tag && getTagKey(prev, properties) === tagDescKey);
        if (index !== -1) {
          tags.splice(index, 1);
        }
      }
      tags.push(tagDesc);
      return tags.length;
    },
    removeTag(tag, index) {
    }
  };
}
const MetaProvider = (props) => {
  const actions = !isServer ? initClientProvider() : initServerProvider();
  return createComponent(MetaContext.Provider, {
    value: actions,
    get children() {
      return props.children;
    }
  });
};
const MetaTag = (tag, props, setting) => {
  useHead({
    tag,
    props,
    setting,
    id: createUniqueId(),
    get name() {
      return props.name || props.property;
    }
  });
  return null;
};
function useHead(tagDesc) {
  const c = useContext(MetaContext);
  if (!c)
    throw new Error("<MetaProvider /> should be in the tree");
  createRenderEffect(() => {
    const index = c.addTag(tagDesc);
    onCleanup(() => c.removeTag(tagDesc, index));
  });
}
function renderTags(tags) {
  return tags.map((tag) => {
    const keys = Object.keys(tag.props);
    const props = keys.map((k) => k === "children" ? "" : ` ${k}="${// @ts-expect-error
    escape(tag.props[k], true)}"`).join("");
    let children = tag.props.children;
    if (Array.isArray(children)) {
      children = children.join("");
    }
    if (tag.setting?.close) {
      return `<${tag.tag} data-sm="${tag.id}"${props}>${// @ts-expect-error
      tag.setting?.escape ? escape(children) : children || ""}</${tag.tag}>`;
    }
    return `<${tag.tag} data-sm="${tag.id}"${props}/>`;
  }).join("");
}
const Title = (props) => MetaTag("title", props, {
  escape: true,
  close: true
});

function bindEvent(target, type, handler) {
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
}
function intercept([value, setValue], get, set) {
    return [get ? () => get(value()) : value, set ? (v) => setValue(set(v)) : setValue];
}
function querySelector(selector) {
    if (selector === "#") {
        return null;
    }
    // Guard against selector being an invalid CSS selector
    try {
        return document.querySelector(selector);
    }
    catch (e) {
        return null;
    }
}
function scrollToHash(hash, fallbackTop) {
    const el = querySelector(`#${hash}`);
    if (el) {
        el.scrollIntoView();
    }
    else if (fallbackTop) {
        window.scrollTo(0, 0);
    }
}
function createIntegration(get, set, init, utils) {
    let ignore = false;
    const wrap = (value) => (typeof value === "string" ? { value } : value);
    const signal = intercept(createSignal(wrap(get()), { equals: (a, b) => a.value === b.value }), undefined, next => {
        !ignore && set(next);
        return next;
    });
    init &&
        onCleanup(init((value = get()) => {
            ignore = true;
            signal[1](wrap(value));
            ignore = false;
        }));
    return {
        signal,
        utils
    };
}
function normalizeIntegration(integration) {
    if (!integration) {
        return {
            signal: createSignal({ value: "" })
        };
    }
    else if (Array.isArray(integration)) {
        return {
            signal: integration
        };
    }
    return integration;
}
function staticIntegration(obj) {
    return {
        signal: [() => obj, next => Object.assign(obj, next)]
    };
}
function pathIntegration() {
    return createIntegration(() => ({
        value: window.location.pathname + window.location.search + window.location.hash,
        state: history.state
    }), ({ value, replace, scroll, state }) => {
        if (replace) {
            window.history.replaceState(state, "", value);
        }
        else {
            window.history.pushState(state, "", value);
        }
        scrollToHash(window.location.hash.slice(1), scroll);
    }, notify => bindEvent(window, "popstate", () => notify()), {
        go: delta => window.history.go(delta)
    });
}

function createBeforeLeave() {
    let listeners = new Set();
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
    let ignore = false;
    function confirm(to, options) {
        if (ignore)
            return !(ignore = false);
        const e = {
            to,
            options,
            defaultPrevented: false,
            preventDefault: () => (e.defaultPrevented = true)
        };
        for (const l of listeners)
            l.listener({
                ...e,
                from: l.location,
                retry: (force) => {
                    force && (ignore = true);
                    l.navigate(to, options);
                }
            });
        return !e.defaultPrevented;
    }
    return {
        subscribe,
        confirm
    };
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|(\/)\/+$/g;
function normalizePath(path, omitSlash = false) {
    const s = path.replace(trimPathRegex, "$1");
    return s ? (omitSlash || /^[?#]/.test(s) ? s : "/" + s) : "";
}
function resolvePath(base, path, from) {
    if (hasSchemeRegex.test(path)) {
        return undefined;
    }
    const basePath = normalizePath(base);
    const fromPath = from && normalizePath(from);
    let result = "";
    if (!fromPath || path.startsWith("/")) {
        result = basePath;
    }
    else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
        result = basePath + fromPath;
    }
    else {
        result = fromPath;
    }
    return (result || "/") + normalizePath(path, !result);
}
function invariant(value, message) {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}
function extractSearchParams(url) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
function createMemoObject(fn) {
    const map = new Map();
    const owner = getOwner();
    return new Proxy({}, {
        get(_, property) {
            if (!map.has(property)) {
                runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
            }
            return map.get(property)();
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true
            };
        },
        ownKeys() {
            return Reflect.ownKeys(fn());
        }
    });
}

const MAX_REDIRECTS = 100;
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
let TempRoute;
const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
const useNavigate = () => useRouter().navigatorFactory();
const useParams = () => useRoute().params;
function createLocation(path, state) {
    const origin = new URL("http://sar");
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin, {
        equals: (a, b) => a.href === b.href
    });
    const pathname = createMemo(() => url().pathname);
    const search = createMemo(() => url().search, true);
    const hash = createMemo(() => url().hash);
    const key = createMemo(() => "");
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: createMemoObject(on(search, () => extractSearchParams(url())))
    };
}
function createRouterContext(integration, base = "", data, out) {
    const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const beforeLeave = utils.beforeLeave || createBeforeLeave();
    const basePath = resolvePath("", base);
    const output = isServer && out
        ? Object.assign(out, {
            matches: [],
            url: undefined
        })
        : undefined;
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, setIsRouting] = createSignal(false);
    const start = async (callback) => {
        setIsRouting(true);
        try {
            await startTransition(callback);
        }
        finally {
            setIsRouting(false);
        }
    };
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state);
    const referrers = [];
    const baseRoute = {
        pattern: basePath,
        params: {},
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    if (data) {
        try {
            TempRoute = baseRoute;
            baseRoute.data = data({
                data: undefined,
                params: {},
                location,
                navigate: navigatorFactory(baseRoute)
            });
        }
        finally {
            TempRoute = undefined;
        }
    }
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) ;
                else if (utils.go) {
                    beforeLeave.confirm(to, options) && utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: true,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                if (isServer) {
                    if (output) {
                        output.url = resolvedTo;
                    }
                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
                }
                else if (beforeLeave.confirm(resolvedTo, options)) {
                    const len = referrers.push({ value: current, replace, scroll, state: state() });
                    start(() => {
                        setReference(resolvedTo);
                        setState(nextState);
                        resetErrorBoundaries();
                    }).then(() => {
                        if (referrers.length === len) {
                            navigateEnd({
                                value: resolvedTo,
                                state: nextState
                            });
                        }
                    });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    function navigateEnd(next) {
        const first = referrers[0];
        if (first) {
            if (next.value !== first.value || next.state !== first.state) {
                setSource({
                    ...next,
                    replace: first.replace,
                    scroll: first.scroll
                });
            }
            referrers.length = 0;
        }
    }
    createRenderEffect(() => {
        const { value, state } = source();
        // Untrack this whole block so `start` doesn't cause Solid's Listener to be preserved
        untrack(() => {
            if (value !== reference()) {
                start(() => {
                    setReference(value);
                    setState(state);
                });
            }
        });
    });
    if (!isServer) {
        function handleAnchorClick(evt) {
            if (evt.defaultPrevented ||
                evt.button !== 0 ||
                evt.metaKey ||
                evt.altKey ||
                evt.ctrlKey ||
                evt.shiftKey)
                return;
            const a = evt
                .composedPath()
                .find(el => el instanceof Node && el.nodeName.toUpperCase() === "A");
            if (!a || !a.hasAttribute("link"))
                return;
            const href = a.href;
            if (a.target || (!href && !a.hasAttribute("state")))
                return;
            const rel = (a.getAttribute("rel") || "").split(/\s+/);
            if (a.hasAttribute("download") || (rel && rel.includes("external")))
                return;
            const url = new URL(href);
            if (url.origin !== window.location.origin ||
                (basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase())))
                return;
            const to = parsePath(url.pathname + url.search + url.hash);
            const state = a.getAttribute("state");
            evt.preventDefault();
            navigateFromRoute(baseRoute, to, {
                resolve: false,
                replace: a.hasAttribute("replace"),
                scroll: !a.hasAttribute("noscroll"),
                state: state && JSON.parse(state)
            });
        }
        // ensure delegated events run first
        delegateEvents(["click"]);
        document.addEventListener("click", handleAnchorClick);
        onCleanup(() => document.removeEventListener("click", handleAnchorClick));
    }
    return {
        base: baseRoute,
        out: output,
        location,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory,
        beforeLeave
    };
}

const Router = (props) => {
  const {
    source,
    url,
    base,
    data,
    out
  } = props;
  const integration = source || (isServer ? staticIntegration({
    value: url || ""
  }) : pathIntegration());
  const routerState = createRouterContext(integration, base, data, out);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,
    get children() {
      return props.children;
    }
  });
};

const routeLayouts = {
  "/certificates": {
    "id": "/certificates",
    "layouts": []
  },
  "/disputes": {
    "id": "/disputes",
    "layouts": []
  },
  "/": {
    "id": "/",
    "layouts": []
  },
  "/registrations/:id": {
    "id": "/registrations/:id",
    "layouts": []
  }
};
var layouts = routeLayouts;

function flattenIslands(match, manifest, islands) {
  let result = [...match];
  match.forEach((m) => {
    if (m.type !== "island")
      return;
    const islandManifest = manifest[m.href];
    if (islandManifest) {
      const res = flattenIslands(islandManifest.assets, manifest);
      result.push(...res);
    }
  });
  return result;
}
function getAssetsFromManifest(event, matches) {
  let match = matches.reduce((memo, m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match2) => previous + match2.originalPath, "");
      const route = layouts[fullPath];
      if (route) {
        memo.push(...event.env.manifest?.[route.id]?.assets || []);
        const layoutsManifestEntries = route.layouts.flatMap((manifestKey) => event.env.manifest?.[manifestKey]?.assets || []);
        memo.push(...layoutsManifestEntries);
      }
    }
    return memo;
  }, []);
  match.push(...event.env.manifest?.["entry-client"]?.assets || []);
  match = flattenIslands(match, event.env.manifest, event.$islands);
  return match;
}

const FETCH_EVENT = "$FETCH";

const ServerContext = /* @__PURE__ */ createContext({
  $type: FETCH_EVENT
});
const useRequest = () => {
  return useContext(ServerContext);
};

const ContentTypeHeader = "content-type";
function json(data, init = {}) {
  let responseInit = init;
  if (typeof init === "number") {
    responseInit = { status: init };
  }
  let headers = new Headers(responseInit.headers);
  if (!headers.has(ContentTypeHeader)) {
    headers.set(ContentTypeHeader, "application/json; charset=utf-8");
  }
  const response = new Response(JSON.stringify(data), {
    ...responseInit,
    headers
  });
  return response;
}

var _tmpl$$5 = ["<link", ' rel="stylesheet"', ">"], _tmpl$2$5 = ["<link", ' rel="modulepreload"', ">"];
function Links() {
  const context = useRequest();
  useAssets(() => {
    let match = getAssetsFromManifest(context, context.routerContext.matches);
    const links = match.reduce((r, src) => {
      let el = src.type === "style" ? ssr(_tmpl$$5, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : src.type === "script" ? ssr(_tmpl$2$5, ssrHydrationKey(), ssrAttribute("href", escape(src.href, true), false)) : void 0;
      if (el)
        r[src.href] = el;
      return r;
    }, {});
    return Object.values(links);
  });
  return null;
}

function Html(props) {
  {
    return ssrElement("html", props, void 0, false);
  }
}
function Head(props) {
  {
    return ssrElement("head", props, () => [escape(props.children), createComponent(Links, {})], false);
  }
}
function Body(props) {
  {
    return ssrElement("body", props, () => escape(props.children) , false);
  }
}

var _tmpl$$4 = ["<h1", ' class="text-2xl font-bold text-gray-900 mb-6">证书管理</h1>'], _tmpl$2$4 = ["<div", ' class="mt-2 text-sm"><span class="text-gray-500">审核意见：</span><!--$-->', "<!--/--></div>"], _tmpl$3$4 = ["<div", ' class="mb-4"><h3 class="font-semibold text-gray-700 mb-2">证书信息</h3><div class="grid grid-cols-2 gap-2 text-sm"><div><span class="text-gray-500">证书编号：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">持证人：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">发证人：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">发证日期：</span><!--$-->', "<!--/--></div></div><!--$-->", "<!--/--></div>"], _tmpl$4$4 = ["<div", ' class="mb-4"><h3 class="font-semibold text-gray-700 mb-2">采用的报名材料</h3><!--$-->', "<!--/--></div>"], _tmpl$5$4 = ["<div", '><h3 class="font-semibold text-gray-700 mb-2">审核流程</h3><!--$-->', "<!--/--></div>"], _tmpl$6$2 = ["<div", ' class="mt-4 border-t pt-4">', "</div>"], _tmpl$7$2 = ["<div", ' class="bg-white rounded-lg shadow p-6 mb-6"><h2 class="text-lg font-semibold text-gray-800 mb-3">证书溯源查询</h2><p class="text-sm text-gray-500 mb-3">输入证书ID，回查采用的报名材料和审核意见</p><div class="flex gap-3"><input type="text" class="border rounded px-3 py-2 text-sm flex-1" placeholder="输入证书ID..."', '><button class="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">查询</button></div><!--$-->', "<!--/--></div>"], _tmpl$8$2 = ["<div", ' class="bg-white rounded-lg shadow overflow-hidden"><h2 class="text-lg font-semibold text-gray-800 p-6 pb-3">证书列表</h2><table class="w-full text-sm"><thead class="bg-gray-100"><tr><th class="px-4 py-3 text-left font-semibold text-gray-600">证书编号</th><th class="px-4 py-3 text-left font-semibold text-gray-600">持证人</th><th class="px-4 py-3 text-left font-semibold text-gray-600">发证人</th><th class="px-4 py-3 text-left font-semibold text-gray-600">发证日期</th><th class="px-4 py-3 text-left font-semibold text-gray-600">状态</th><th class="px-4 py-3 text-left font-semibold text-gray-600">审核意见</th></tr></thead><tbody>', "</tbody></table></div>"], _tmpl$9$2 = ["<div", ' class="text-red-500 text-sm">未找到证书</div>'], _tmpl$0$1 = ["<div", ' class="text-gray-400 text-sm">无材料记录</div>'], _tmpl$1$1 = ["<div", ' class="flex items-center justify-between py-1 border-b last:border-0 text-sm"><span><!--$-->', "<!--/--> (<!--$-->", "<!--/-->)</span><span", ">", "</span></div>"], _tmpl$10$1 = ["<div", ' class="text-gray-400 text-sm">无审核记录</div>'], _tmpl$11$1 = ["<div", ' class="text-gray-500 text-xs">', "</div>"], _tmpl$12$1 = ["<div", ' class="text-sm border-l-2 border-indigo-300 pl-3 mb-2"><div class="font-medium"><!--$-->', "<!--/--> — <!--$-->", "<!--/--> (<!--$-->", "<!--/-->)</div><!--$-->", '<!--/--><div class="text-xs text-gray-400">', "</div></div>"], _tmpl$13$1 = ["<div", ' class="text-center py-6 text-gray-400">暂无证书</div>'], _tmpl$14$1 = ["<tr", ' class="border-t hover:bg-gray-50"><td class="px-4 py-3 font-mono text-xs">', '</td><td class="px-4 py-3">', '</td><td class="px-4 py-3">', '</td><td class="px-4 py-3 text-xs">', '</td><td class="px-4 py-3"><span class="', '">', '</span></td><td class="px-4 py-3 text-xs text-gray-500 max-w-48 truncate">', "</td></tr>"];
function Certificates() {
  const [traceCertId, setTraceCertId] = createSignal("");
  const [traceData, setTraceData] = createSignal(null);
  const fetchCerts = async () => {
    const res = await fetch("/api/certificates");
    return res.json();
  };
  const [certs] = createResource(fetchCerts);
  return [createComponent(Title, {
    children: "证书管理 - 资格审核平台"
  }), ssr(_tmpl$$4, ssrHydrationKey()), ssr(_tmpl$7$2, ssrHydrationKey(), ssrAttribute("value", escape(traceCertId(), true), false), escape(createComponent(Show, {
    get when() {
      return traceData();
    },
    get children() {
      return ssr(_tmpl$6$2, ssrHydrationKey(), escape(createComponent(Show, {
        get when() {
          return traceData().certificate;
        },
        get fallback() {
          return ssr(_tmpl$9$2, ssrHydrationKey());
        },
        get children() {
          return [ssr(_tmpl$3$4, ssrHydrationKey(), escape(traceData().certificate.certNo), escape(traceData().certificate.applicantName), escape(traceData().certificate.issuedBy), escape(new Date(traceData().certificate.issuedAt).toLocaleDateString("zh-CN")), escape(createComponent(Show, {
            get when() {
              return traceData().certificate.reviewOpinion;
            },
            get children() {
              return ssr(_tmpl$2$4, ssrHydrationKey(), escape(traceData().certificate.reviewOpinion));
            }
          }))), ssr(_tmpl$4$4, ssrHydrationKey(), escape(createComponent(For, {
            get each() {
              return traceData().materials ?? [];
            },
            get fallback() {
              return ssr(_tmpl$0$1, ssrHydrationKey());
            },
            children: (mat) => ssr(_tmpl$1$1, ssrHydrationKey(), escape(mat.name), escape(mat.type), ssrAttribute("class", mat.status === "verified" ? "text-green-600" : "text-gray-400", false), mat.status === "verified" ? "已核实" : escape(mat.status))
          }))), ssr(_tmpl$5$4, ssrHydrationKey(), escape(createComponent(For, {
            get each() {
              return traceData().auditLogs ?? [];
            },
            get fallback() {
              return ssr(_tmpl$10$1, ssrHydrationKey());
            },
            children: (log) => ssr(_tmpl$12$1, ssrHydrationKey(), escape(log.action), escape(log.operator), log.operatorRole === "handler" ? "经办人" : "复核人", escape(createComponent(Show, {
              get when() {
                return log.detail;
              },
              get children() {
                return ssr(_tmpl$11$1, ssrHydrationKey(), escape(log.detail));
              }
            })), escape(new Date(log.createdAt).toLocaleString("zh-CN")))
          })))];
        }
      })));
    }
  }))), ssr(_tmpl$8$2, ssrHydrationKey(), escape(createComponent(For, {
    get each() {
      return certs() ?? [];
    },
    get fallback() {
      return ssr(_tmpl$13$1, ssrHydrationKey());
    },
    children: (cert) => ssr(_tmpl$14$1, ssrHydrationKey(), escape(cert.certNo), escape(cert.applicantName), escape(cert.issuedBy), escape(new Date(cert.issuedAt).toLocaleDateString("zh-CN")), `px-2 py-1 rounded text-xs font-medium ${cert.status === "active" ? "bg-green-100 text-green-700" : cert.status === "archived" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`, cert.status === "active" ? "有效" : cert.status === "archived" ? "已归档" : "已撤销", escape(cert.reviewOpinion || "-"))
  })))];
}

var _tmpl$$3 = ["<h1", ' class="text-2xl font-bold text-gray-900 mb-6">资格争议处理</h1>'], _tmpl$2$3 = ["<div", ' class="bg-white rounded-lg shadow overflow-hidden"><table class="w-full text-sm"><thead class="bg-gray-100"><tr><th class="px-4 py-3 text-left font-semibold text-gray-600">争议ID</th><th class="px-4 py-3 text-left font-semibold text-gray-600">报名ID</th><th class="px-4 py-3 text-left font-semibold text-gray-600">争议原因</th><th class="px-4 py-3 text-left font-semibold text-gray-600">提交人</th><th class="px-4 py-3 text-left font-semibold text-gray-600">状态</th><th class="px-4 py-3 text-left font-semibold text-gray-600">处理结果</th><th class="px-4 py-3 text-left font-semibold text-gray-600">操作</th></tr></thead><tbody>', "</tbody></table></div>"], _tmpl$3$3 = ["<div", ' class="text-center py-8 text-gray-400">暂无争议记录</div>'], _tmpl$4$3 = ["<div", ' class="flex gap-2"><button class="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">解决</button><button class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">驳回</button></div>'], _tmpl$5$3 = ["<tr", ' class="border-t hover:bg-gray-50"><td class="px-4 py-3 font-mono text-xs"><!--$-->', '<!--/-->...</td><td class="px-4 py-3"><a href="', '" class="text-indigo-600 hover:underline text-xs">查看报名</a></td><td class="px-4 py-3 max-w-64 truncate">', '</td><td class="px-4 py-3">', '</td><td class="px-4 py-3"><span class="', '">', '</span></td><td class="px-4 py-3 text-xs text-gray-500 max-w-48 truncate">', '</td><td class="px-4 py-3">', "</td></tr>"];
function Disputes() {
  const fetchDisputes = async () => {
    const res = await fetch("/api/disputes");
    return res.json();
  };
  const [disputes, {
    refetch
  }] = createResource(fetchDisputes);
  return [createComponent(Title, {
    children: "资格争议 - 资格审核平台"
  }), ssr(_tmpl$$3, ssrHydrationKey()), ssr(_tmpl$2$3, ssrHydrationKey(), escape(createComponent(For, {
    get each() {
      return disputes() ?? [];
    },
    get fallback() {
      return ssr(_tmpl$3$3, ssrHydrationKey());
    },
    children: (dis) => ssr(_tmpl$5$3, ssrHydrationKey(), escape(dis.id.slice(0, 8)), `/registrations/${escape(dis.registrationId, true)}`, escape(dis.reason), escape(dis.submittedBy), `px-2 py-1 rounded text-xs font-medium ${dis.status === "open" ? "bg-yellow-100 text-yellow-700" : dis.status === "under_review" ? "bg-blue-100 text-blue-700" : dis.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`, dis.status === "open" ? "待处理" : dis.status === "under_review" ? "处理中" : dis.status === "resolved" ? "已解决" : "已驳回", escape(dis.resolution || "-"), escape(createComponent(Show, {
      get when() {
        return dis.status === "open";
      },
      get children() {
        return ssr(_tmpl$4$3, ssrHydrationKey());
      }
    })))
  })))];
}

var _tmpl$$2 = ["<div", ' class="mb-6"><h1 class="text-2xl font-bold text-gray-900 mb-4">报名队列</h1><div class="flex gap-3 items-center flex-wrap"><select class="border rounded px-3 py-2 text-sm"', "><option value>全部状态</option><!--$-->", '<!--/--></select><input type="text" class="border rounded px-3 py-2 text-sm flex-1 min-w-48" placeholder="搜索姓名或报名编号..."', '><button class="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">查询</button></div></div>'], _tmpl$2$2 = ["<div", ' class="text-center py-8 text-gray-400">暂无报名记录</div>'], _tmpl$3$2 = ["<div", ' class="bg-white rounded-lg shadow overflow-hidden"><table class="w-full text-sm"><thead class="bg-gray-100"><tr><th class="px-4 py-3 text-left font-semibold text-gray-600">报名编号</th><th class="px-4 py-3 text-left font-semibold text-gray-600">姓名</th><th class="px-4 py-3 text-left font-semibold text-gray-600">证件号</th><th class="px-4 py-3 text-left font-semibold text-gray-600">报名来源</th><th class="px-4 py-3 text-left font-semibold text-gray-600">状态</th><th class="px-4 py-3 text-left font-semibold text-gray-600">当前责任人</th><th class="px-4 py-3 text-left font-semibold text-gray-600">冲突报名</th><th class="px-4 py-3 text-left font-semibold text-gray-600">操作</th></tr></thead><tbody>', "</tbody></table><!--$-->", "<!--/--></div>"], _tmpl$4$2 = ["<option", ">", "</option>"], _tmpl$5$2 = ["<div", ' class="text-gray-500">加载中...</div>'], _tmpl$6$1 = ["<span", ' class="ml-1 text-xs text-gray-400">(<!--$-->', "<!--/-->)</span>"], _tmpl$7$1 = ["<span", ' class="text-red-600 font-mono text-xs font-semibold">', "</span>"], _tmpl$8$1 = ["<tr", ' class="border-t hover:bg-gray-50"><td class="px-4 py-3 font-mono text-xs">', '</td><td class="px-4 py-3">', '</td><td class="px-4 py-3 text-xs text-gray-500">', '</td><td class="px-4 py-3">', '</td><td class="px-4 py-3"><span class="', '">', '</span></td><td class="px-4 py-3 text-sm"><span class="text-gray-600">', "</span><!--$-->", '<!--/--></td><td class="px-4 py-3">', '</td><td class="px-4 py-3"><a href="', '" class="text-indigo-600 hover:underline text-sm">详情</a></td></tr>'], _tmpl$9$1 = ["<span", ' class="text-gray-300">-</span>'];
const STATUS_MAP$1 = {
  pending: {
    label: "待审核",
    color: "bg-yellow-100 text-yellow-800"
  },
  material_missing: {
    label: "材料缺失",
    color: "bg-orange-100 text-orange-800"
  },
  under_review: {
    label: "审核中",
    color: "bg-blue-100 text-blue-800"
  },
  qualified: {
    label: "资格通过",
    color: "bg-green-100 text-green-800"
  },
  unqualified: {
    label: "资格不通过",
    color: "bg-red-100 text-red-800"
  },
  grade_not_met: {
    label: "成绩未达标",
    color: "bg-red-100 text-red-800"
  },
  duplicate: {
    label: "重复报名",
    color: "bg-purple-100 text-purple-800"
  },
  course_completed: {
    label: "课程完成",
    color: "bg-teal-100 text-teal-800"
  },
  cert_issued: {
    label: "已发证",
    color: "bg-indigo-100 text-indigo-800"
  },
  archived: {
    label: "已归档",
    color: "bg-gray-200 text-gray-700"
  }
};
function RegistrationQueue() {
  const [statusFilter, setStatusFilter] = createSignal("");
  const [keyword, setKeyword] = createSignal("");
  const fetchRegistrations = async () => {
    const params = new URLSearchParams();
    if (statusFilter())
      params.set("status", statusFilter());
    if (keyword())
      params.set("keyword", keyword());
    const res = await fetch(`/api/registrations?${params}`);
    return res.json();
  };
  const [registrations, {
    refetch
  }] = createResource(fetchRegistrations);
  return [createComponent(Title, {
    children: "报名队列 - 资格审核平台"
  }), ssr(_tmpl$$2, ssrHydrationKey(), ssrAttribute("value", escape(statusFilter(), true), false), escape(createComponent(For, {
    get each() {
      return Object.entries(STATUS_MAP$1);
    },
    children: ([key, val]) => ssr(_tmpl$4$2, ssrHydrationKey() + ssrAttribute("value", escape(key, true), false), escape(val.label))
  })), ssrAttribute("value", escape(keyword(), true), false)), createComponent(Show, {
    get when() {
      return !registrations.loading;
    },
    get fallback() {
      return ssr(_tmpl$5$2, ssrHydrationKey());
    },
    get children() {
      return ssr(_tmpl$3$2, ssrHydrationKey(), escape(createComponent(For, {
        get each() {
          return registrations() ?? [];
        },
        children: (reg) => ssr(_tmpl$8$1, ssrHydrationKey(), escape(reg.regNo), escape(reg.applicantName), escape(reg.applicantIdNo), escape(reg.source), `px-2 py-1 rounded text-xs font-medium ${escape(STATUS_MAP$1[reg.status]?.color || "bg-gray-100 text-gray-600", true)}`, escape(STATUS_MAP$1[reg.status]?.label || reg.status), escape(reg.currentAssignee || "-"), escape(createComponent(Show, {
          get when() {
            return reg.currentRole;
          },
          get children() {
            return ssr(_tmpl$6$1, ssrHydrationKey(), reg.currentRole === "handler" ? "经办人" : "复核人");
          }
        })), escape(createComponent(Show, {
          get when() {
            return reg.conflictRegNo;
          },
          get fallback() {
            return ssr(_tmpl$9$1, ssrHydrationKey());
          },
          get children() {
            return ssr(_tmpl$7$1, ssrHydrationKey(), escape(reg.conflictRegNo));
          }
        })), `/registrations/${escape(reg.id, true)}`)
      })), escape(createComponent(Show, {
        get when() {
          return (registrations() ?? []).length === 0;
        },
        get children() {
          return ssr(_tmpl$2$2, ssrHydrationKey());
        }
      })));
    }
  })];
}

var _tmpl$$1 = ["<div", ' class="text-gray-500">加载中...</div>'], _tmpl$2$1 = ["<div", ' class="text-red-500">未找到报名记录</div>'], _tmpl$3$1 = ["<div", ' class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"><div class="flex items-center gap-2 text-red-700 font-semibold"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>重复报名 — 冲突报名编号：<span class="font-mono text-lg">', '</span></div><p class="text-red-600 text-sm mt-1">该报名与已有报名冲突，证书发放已被阻断。如需处理请提交资格争议。</p></div>'], _tmpl$4$1 = ["<div", ' class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-blue-700 text-sm">', "</div>"], _tmpl$5$1 = ["<div", ' class="mt-2 text-xs text-gray-400">及格线：<!--$-->', "<!--/--> 分</div>"], _tmpl$6 = ["<div", ' class="bg-white rounded-lg shadow p-6"><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">证书信息</h2><!--$-->', "<!--/--></div>"], _tmpl$7 = ["<div", ' class="bg-white rounded-lg shadow p-6"><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">资格争议</h2><!--$-->', "<!--/--></div>"], _tmpl$8 = ["<div", ' class="text-xs text-gray-500 mb-2 font-semibold">经办人操作</div>'], _tmpl$9 = ["<div", ' class="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 mb-2">有材料缺失，请补交后流转复核人</div>'], _tmpl$0 = ["<button", ' class="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">补交其他材料</button>'], _tmpl$1 = ["<button", ' class="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">补交材料</button>'], _tmpl$10 = ["<button", ' class="w-full bg-teal-600 text-white px-4 py-2 rounded text-sm hover:bg-teal-700">录入/更新成绩</button>'], _tmpl$11 = ["<button", ' class="w-full bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700">提交资格争议</button>'], _tmpl$12 = ["<div", ' class="text-xs text-gray-500 mb-2 font-semibold">复核人操作</div>'], _tmpl$13 = ["<div", ' class="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-2">重复报名 — 冲突编号：<span class="font-mono font-bold">', "</span><br>证书发放已阻断，如需处理请通过资格争议</div>"], _tmpl$14 = ["<div", ' class="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 mb-2">材料缺失中，等待经办人补交材料</div>'], _tmpl$15 = ["<div", ' class="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mb-2">成绩未达标，等待经办人更新成绩</div>'], _tmpl$16 = ["<button", ' class="w-full bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">审核通过</button>'], _tmpl$17 = ["<button", ' class="w-full bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">审核不通过</button>'], _tmpl$18 = ["<button", ' class="w-full bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700">标记材料缺失</button>'], _tmpl$19 = ["<button", ' class="w-full bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">退回经办人</button>'], _tmpl$20 = ["<button", ' class="w-full bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 mt-1">确认发放证书</button>'], _tmpl$21 = ["<div", ' class="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 mb-2">证书已发放，可进行归档</div>'], _tmpl$22 = ["<div", ' class="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-600 mb-2">已归档，无需进一步操作</div>'], _tmpl$23 = ["<div", '><div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="text-gray-500 hover:text-gray-700 text-sm">← 返回列表</button><h1 class="text-2xl font-bold text-gray-900">报名详情</h1></div><span class="', '">', "</span></div><!--$-->", "<!--/--><!--$-->", '<!--/--><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2 space-y-6"><div class="bg-white rounded-lg shadow p-6"><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">基本信息</h2><div class="grid grid-cols-2 gap-4 text-sm"><div><span class="text-gray-500">报名编号：</span><span class="font-mono">', '</span></div><div><span class="text-gray-500">姓名：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">证件号：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">报名来源：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">课程：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">当前责任人：</span><!--$-->', "<!--/--> (<!--$-->", '<!--/-->)</div><div><span class="text-gray-500">创建时间：</span><!--$-->', '<!--/--></div><div><span class="text-gray-500">最近更新：</span><!--$-->', '<!--/--></div></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">材料清单</h2><!--$-->', '<!--/--></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">成绩记录</h2><!--$-->', "<!--/--><!--$-->", "<!--/--></div><!--$-->", "<!--/--><!--$-->", '<!--/--></div><div class="space-y-6"><div class="bg-white rounded-lg shadow p-6"><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">操作</h2><div class="space-y-3"><!--$-->', "<!--/--><!--$-->", '<!--/--></div></div><div class="bg-white rounded-lg shadow p-6"><h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">最近改动</h2><div class="space-y-3 max-h-80 overflow-y-auto">', "</div></div></div></div></div>"], _tmpl$24 = ["<div", ' class="text-gray-400 text-sm">暂无材料</div>'], _tmpl$25 = ["<div", ' class="flex items-center justify-between py-2 border-b last:border-0 text-sm"><div><span class="font-medium">', '</span><span class="text-gray-400 ml-2">(<!--$-->', '<!--/-->)</span></div><span class="', '">', "</span></div>"], _tmpl$26 = ["<div", ' class="text-gray-400 text-sm">暂无成绩</div>'], _tmpl$27 = ["<div", ' class="flex items-center justify-between py-2 border-b last:border-0 text-sm"><div><span class="font-medium"><!--$-->', '<!--/--> 分</span><span class="text-gray-400 ml-2">录入人：<!--$-->', '<!--/--></span></div><span class="', '">', "</span></div>"], _tmpl$28 = ["<div", ' class="text-xs text-gray-500 mt-1">审核意见：<!--$-->', "<!--/--></div>"], _tmpl$29 = ["<button", ' class="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">归档证书</button>'], _tmpl$30 = ["<div", ' class="py-3 border-b last:border-0"><div class="flex items-center justify-between text-sm mb-2"><span class="font-mono font-semibold text-indigo-700">', '</span><span class="', '">', '</span></div><div class="text-xs text-gray-500">发证人：<!--$-->', "<!--/--> | 发证日期：<!--$-->", "<!--/--></div><!--$-->", "<!--/--><!--$-->", "<!--/--></div>"], _tmpl$31 = ["<div", ' class="text-sm text-gray-500 mt-1">处理结果：<!--$-->', "<!--/--></div>"], _tmpl$32 = ["<div", ' class="mt-2 flex gap-2"><button class="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">解决争议</button><button class="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">驳回争议</button></div>'], _tmpl$33 = ["<div", ' class="py-3 border-b last:border-0"><div class="flex items-center justify-between text-sm mb-1"><span class="', '">', '</span><span class="text-xs text-gray-400">', '</span></div><div class="text-sm text-gray-700">', "</div><!--$-->", "<!--/--><!--$-->", "<!--/--></div>"], _tmpl$34 = ["<button", ' class="w-full bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 mb-1">补交：<!--$-->', "<!--/-->（<!--$-->", "<!--/-->）</button>"], _tmpl$35 = ["<div", ' class="text-gray-400 text-sm">暂无操作记录</div>'], _tmpl$36 = ["<div", ' class="text-gray-600 text-xs mt-0.5">', "</div>"], _tmpl$37 = ["<div", ' class="text-sm border-l-2 border-indigo-300 pl-3"><div class="flex items-center justify-between"><span class="font-medium text-gray-700">', '</span><span class="text-xs text-gray-400">', '</span></div><div class="text-gray-500 text-xs mt-0.5"><!--$-->', "<!--/--> (<!--$-->", "<!--/-->)</div><!--$-->", "<!--/--></div>"];
const STATUS_MAP = {
  pending: {
    label: "待审核",
    color: "bg-yellow-100 text-yellow-800"
  },
  material_missing: {
    label: "材料缺失",
    color: "bg-orange-100 text-orange-800"
  },
  under_review: {
    label: "审核中",
    color: "bg-blue-100 text-blue-800"
  },
  qualified: {
    label: "资格通过",
    color: "bg-green-100 text-green-800"
  },
  unqualified: {
    label: "资格不通过",
    color: "bg-red-100 text-red-800"
  },
  grade_not_met: {
    label: "成绩未达标",
    color: "bg-red-100 text-red-800"
  },
  duplicate: {
    label: "重复报名",
    color: "bg-purple-100 text-purple-800"
  },
  course_completed: {
    label: "课程完成",
    color: "bg-teal-100 text-teal-800"
  },
  cert_issued: {
    label: "已发证",
    color: "bg-indigo-100 text-indigo-800"
  },
  archived: {
    label: "已归档",
    color: "bg-gray-200 text-gray-700"
  }
};
function RegistrationDetail() {
  const params = useParams();
  useNavigate();
  const [actionMsg, setActionMsg] = createSignal("");
  const fetchDetail = async () => {
    const res = await fetch(`/api/registrations/${params.id}`);
    return res.json();
  };
  const [detail, {
    refetch
  }] = createResource(fetchDetail);
  return [createComponent(Title, {
    children: "报名详情 - 资格审核平台"
  }), createComponent(Show, {
    get when() {
      return !detail.loading;
    },
    get fallback() {
      return ssr(_tmpl$$1, ssrHydrationKey());
    },
    get children() {
      return createComponent(Show, {
        get when() {
          return detail();
        },
        get fallback() {
          return ssr(_tmpl$$1, ssrHydrationKey());
        },
        get children() {
          return (() => {
            const d = detail();
            if (!d?.registration)
              return ssr(_tmpl$2$1, ssrHydrationKey());
            const reg = d.registration;
            return ssr(_tmpl$23, ssrHydrationKey(), `px-3 py-1 rounded text-sm font-medium ${escape(STATUS_MAP[reg.status]?.color || "bg-gray-100 text-gray-600", true)}`, escape(STATUS_MAP[reg.status]?.label || reg.status), escape(createComponent(Show, {
              get when() {
                return reg.status === "duplicate";
              },
              get children() {
                return ssr(_tmpl$3$1, ssrHydrationKey(), escape(reg.conflictRegNo));
              }
            })), escape(createComponent(Show, {
              get when() {
                return actionMsg();
              },
              get children() {
                return ssr(_tmpl$4$1, ssrHydrationKey(), escape(actionMsg()));
              }
            })), escape(reg.regNo), escape(reg.applicantName), escape(reg.applicantIdNo), escape(reg.source), escape(d.course?.name || reg.courseId), escape(reg.currentAssignee || "-"), reg.currentRole === "handler" ? "经办人" : "复核人", escape(new Date(reg.createdAt).toLocaleString("zh-CN")), escape(new Date(reg.updatedAt).toLocaleString("zh-CN")), escape(createComponent(For, {
              get each() {
                return d.materials ?? [];
              },
              get fallback() {
                return ssr(_tmpl$24, ssrHydrationKey());
              },
              children: (mat) => ssr(_tmpl$25, ssrHydrationKey(), escape(mat.name), escape(mat.type), `px-2 py-0.5 rounded text-xs ${mat.status === "verified" ? "bg-green-100 text-green-700" : mat.status === "submitted" ? "bg-blue-100 text-blue-700" : mat.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`, mat.status === "verified" ? "已核实" : mat.status === "submitted" ? "已提交" : mat.status === "rejected" ? "已驳回" : "待提交")
            })), escape(createComponent(For, {
              get each() {
                return d.grades ?? [];
              },
              get fallback() {
                return ssr(_tmpl$26, ssrHydrationKey());
              },
              children: (g) => ssr(_tmpl$27, ssrHydrationKey(), escape(g.score), escape(g.recordedBy), `px-2 py-0.5 rounded text-xs ${Number(g.passed) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`, Number(g.passed) ? "达标" : "未达标")
            })), escape(createComponent(Show, {
              get when() {
                return d.course;
              },
              get children() {
                return ssr(_tmpl$5$1, ssrHydrationKey(), escape(d.course.passingScore));
              }
            })), escape(createComponent(Show, {
              get when() {
                return (d.certificates ?? []).length > 0;
              },
              get children() {
                return ssr(_tmpl$6, ssrHydrationKey(), escape(createComponent(For, {
                  get each() {
                    return d.certificates;
                  },
                  children: (cert) => ssr(_tmpl$30, ssrHydrationKey(), escape(cert.certNo), `px-2 py-0.5 rounded text-xs ${cert.status === "active" ? "bg-green-100 text-green-700" : cert.status === "archived" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`, cert.status === "active" ? "有效" : cert.status === "archived" ? "已归档" : "已撤销", escape(cert.issuedBy), escape(new Date(cert.issuedAt).toLocaleDateString("zh-CN")), escape(createComponent(Show, {
                    get when() {
                      return cert.reviewOpinion;
                    },
                    get children() {
                      return ssr(_tmpl$28, ssrHydrationKey(), escape(cert.reviewOpinion));
                    }
                  })), escape(createComponent(Show, {
                    get when() {
                      return cert.status === "active";
                    },
                    get children() {
                      return ssr(_tmpl$29, ssrHydrationKey());
                    }
                  })))
                })));
              }
            })), escape(createComponent(Show, {
              get when() {
                return (d.disputes ?? []).length > 0;
              },
              get children() {
                return ssr(_tmpl$7, ssrHydrationKey(), escape(createComponent(For, {
                  get each() {
                    return d.disputes;
                  },
                  children: (dis) => ssr(_tmpl$33, ssrHydrationKey(), `px-2 py-0.5 rounded text-xs ${dis.status === "open" ? "bg-yellow-100 text-yellow-700" : dis.status === "under_review" ? "bg-blue-100 text-blue-700" : dis.status === "resolved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`, dis.status === "open" ? "待处理" : dis.status === "under_review" ? "处理中" : dis.status === "resolved" ? "已解决" : "已驳回", escape(new Date(dis.createdAt).toLocaleString("zh-CN")), escape(dis.reason), escape(createComponent(Show, {
                    get when() {
                      return dis.resolution;
                    },
                    get children() {
                      return ssr(_tmpl$31, ssrHydrationKey(), escape(dis.resolution));
                    }
                  })), escape(createComponent(Show, {
                    get when() {
                      return dis.status === "open";
                    },
                    get children() {
                      return ssr(_tmpl$32, ssrHydrationKey());
                    }
                  })))
                })));
              }
            })), escape(createComponent(Show, {
              get when() {
                return reg.currentRole === "handler";
              },
              get children() {
                return [ssr(_tmpl$8, ssrHydrationKey()), createComponent(Show, {
                  get when() {
                    return reg.status === "material_missing";
                  },
                  get children() {
                    return [ssr(_tmpl$9, ssrHydrationKey()), createComponent(For, {
                      get each() {
                        return (d.materials ?? []).filter((m) => m.status === "pending" || m.status === "rejected");
                      },
                      children: (mat) => ssr(_tmpl$34, ssrHydrationKey(), escape(mat.name), mat.status === "pending" ? "待提交" : "已驳回")
                    }), ssr(_tmpl$0, ssrHydrationKey())];
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status !== "material_missing" && reg.status !== "cert_issued" && reg.status !== "archived" && reg.status !== "duplicate";
                  },
                  get children() {
                    return ssr(_tmpl$1, ssrHydrationKey());
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status !== "cert_issued" && reg.status !== "archived" && reg.status !== "duplicate";
                  },
                  get children() {
                    return ssr(_tmpl$10, ssrHydrationKey());
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status !== "cert_issued" && reg.status !== "archived";
                  },
                  get children() {
                    return ssr(_tmpl$11, ssrHydrationKey());
                  }
                })];
              }
            })), escape(createComponent(Show, {
              get when() {
                return reg.currentRole === "reviewer";
              },
              get children() {
                return [ssr(_tmpl$12, ssrHydrationKey()), createComponent(Show, {
                  get when() {
                    return reg.status === "duplicate";
                  },
                  get children() {
                    return ssr(_tmpl$13, ssrHydrationKey(), escape(reg.conflictRegNo));
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status === "material_missing";
                  },
                  get children() {
                    return ssr(_tmpl$14, ssrHydrationKey());
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status === "grade_not_met";
                  },
                  get children() {
                    return ssr(_tmpl$15, ssrHydrationKey());
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status !== "duplicate" && reg.status !== "cert_issued" && reg.status !== "archived" && reg.status !== "material_missing" && reg.status !== "grade_not_met";
                  },
                  get children() {
                    return [ssr(_tmpl$16, ssrHydrationKey()), ssr(_tmpl$17, ssrHydrationKey()), ssr(_tmpl$18, ssrHydrationKey()), ssr(_tmpl$19, ssrHydrationKey())];
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status === "course_completed" || reg.status === "qualified";
                  },
                  get children() {
                    return ssr(_tmpl$20, ssrHydrationKey());
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status === "cert_issued";
                  },
                  get children() {
                    return ssr(_tmpl$21, ssrHydrationKey());
                  }
                }), createComponent(Show, {
                  get when() {
                    return reg.status === "archived";
                  },
                  get children() {
                    return ssr(_tmpl$22, ssrHydrationKey());
                  }
                })];
              }
            })), escape(createComponent(For, {
              get each() {
                return (d.auditLogs ?? []).slice(0, 10);
              },
              get fallback() {
                return ssr(_tmpl$35, ssrHydrationKey());
              },
              children: (log) => ssr(_tmpl$37, ssrHydrationKey(), escape(log.action), escape(new Date(log.createdAt).toLocaleString("zh-CN")), escape(log.operator), log.operatorRole === "handler" ? "经办人" : "复核人", escape(createComponent(Show, {
                get when() {
                  return log.detail;
                },
                get children() {
                  return ssr(_tmpl$36, ssrHydrationKey(), escape(log.detail));
                }
              })))
            })));
          })();
        }
      });
    }
  })];
}

const fileRoutes = [{
  component: Certificates,
  path: "/certificates"
}, {
  component: Disputes,
  path: "/disputes"
}, {
  component: RegistrationQueue,
  path: "/"
}, {
  component: RegistrationDetail,
  path: "/registrations/:id"
}];
const FileRoutes = () => {
  return fileRoutes;
};

var _tmpl$ = ["<meta", ' charset="utf-8">'], _tmpl$2 = ["<meta", ' name="viewport" content="width=device-width, initial-scale=1">'], _tmpl$3 = ["<title", ">培训报名资格审核与证书发放平台</title>"], _tmpl$4 = ["<nav", ' class="bg-indigo-700 text-white shadow-lg"><div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between"><a href="/" class="text-xl font-bold">培训报名资格审核与证书发放平台</a><div class="flex gap-6 text-sm"><a href="/" class="hover:text-indigo-200">报名队列</a><a href="/certificates" class="hover:text-indigo-200">证书管理</a><a href="/disputes" class="hover:text-indigo-200">资格争议</a></div></div></nav>'], _tmpl$5 = ["<main", ' class="max-w-7xl mx-auto px-4 py-6">', "</main>"];
function Root() {
  return createComponent(Html, {
    lang: "zh-CN",
    get children() {
      return [createComponent(Head, {
        get children() {
          return [ssr(_tmpl$, ssrHydrationKey()), ssr(_tmpl$2, ssrHydrationKey()), ssr(_tmpl$3, ssrHydrationKey())];
        }
      }), createComponent(Body, {
        "class": "bg-gray-50 min-h-screen",
        get children() {
          return [ssr(_tmpl$4, ssrHydrationKey()), ssr(_tmpl$5, ssrHydrationKey(), escape(createComponent(Suspense, {
            get children() {
              return createComponent(FileRoutes, {});
            }
          })))];
        }
      })];
    }
  });
}

const rootData = Object.values(/* #__PURE__ */ Object.assign({

}))[0];
const dataFn = rootData ? rootData.default : void 0;
const composeMiddleware = (exchanges) => ({
  forward
}) => exchanges.reduceRight((forward2, exchange) => exchange({
  forward: forward2
}), forward);
function createHandler(...exchanges) {
  const exchange = composeMiddleware(exchanges);
  return async (event) => {
    return await exchange({
      forward: async (op) => {
        return new Response(null, {
          status: 404
        });
      }
    })(event);
  };
}
function StartRouter(props) {
  return createComponent(Router, props);
}
const docType = ssr("<!DOCTYPE html>");
function StartServer({
  event
}) {
  const parsed = new URL(event.request.url);
  const path = parsed.pathname + parsed.search;
  sharedConfig.context.requestContext = event;
  return createComponent(ServerContext.Provider, {
    value: event,
    get children() {
      return createComponent(MetaProvider, {
        get children() {
          return createComponent(StartRouter, {
            url: path,
            get out() {
              return event.routerContext;
            },
            location: path,
            get prevLocation() {
              return event.prevUrl;
            },
            data: dataFn,
            routes: fileRoutes,
            get children() {
              return [docType, createComponent(Root, {})];
            }
          });
        }
      });
    }
  });
}

const registrations = mysqlTable(
  "registrations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    regNo: varchar("reg_no", { length: 20 }).notNull().unique(),
    applicantName: varchar("applicant_name", { length: 100 }).notNull(),
    applicantIdNo: varchar("applicant_id_no", { length: 50 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    courseId: varchar("course_id", { length: 36 }).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "material_missing",
      "under_review",
      "qualified",
      "unqualified",
      "grade_not_met",
      "duplicate",
      "course_completed",
      "cert_issued",
      "archived"
    ]).notNull().default("pending"),
    currentRole: mysqlEnum("current_role", ["handler", "reviewer"]).notNull().default("handler"),
    currentAssignee: varchar("current_assignee", { length: 100 }),
    conflictRegNo: varchar("conflict_reg_no", { length: 20 }),
    createdAt: datetime("created_at").notNull().default(/* @__PURE__ */ new Date()),
    updatedAt: datetime("updated_at").notNull().default(/* @__PURE__ */ new Date())
  },
  (table) => ({
    applicantIdIdx: index("idx_applicant_id").on(table.applicantIdNo),
    courseIdIdx: index("idx_course_id").on(table.courseId),
    statusIdx: index("idx_status").on(table.status)
  })
);
const courses = mysqlTable("courses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).notNull().default("60.00"),
  description: text("description"),
  createdAt: datetime("created_at").notNull().default(/* @__PURE__ */ new Date())
});
const materials = mysqlTable(
  "materials",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    type: mysqlEnum("type", ["id_copy", "certificate", "transcript", "photo", "other"]).notNull(),
    fileUrl: varchar("file_url", { length: 500 }),
    status: mysqlEnum("status", ["pending", "submitted", "verified", "rejected"]).notNull().default("pending"),
    reviewedBy: varchar("reviewed_by", { length: 100 }),
    reviewNote: text("review_note"),
    createdAt: datetime("created_at").notNull().default(/* @__PURE__ */ new Date()),
    updatedAt: datetime("updated_at").notNull().default(/* @__PURE__ */ new Date())
  },
  (table) => ({
    regIdx: index("idx_mat_reg").on(table.registrationId)
  })
);
const grades = mysqlTable(
  "grades",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    courseId: varchar("course_id", { length: 36 }).notNull(),
    score: decimal("score", { precision: 5, scale: 2 }).notNull(),
    passed: int("passed", { unsigned: true }).notNull().default(0),
    recordedBy: varchar("recorded_by", { length: 100 }),
    recordedAt: datetime("recorded_at").notNull().default(/* @__PURE__ */ new Date())
  },
  (table) => ({
    regIdx: index("idx_grade_reg").on(table.registrationId)
  })
);
const certificates = mysqlTable(
  "certificates",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    certNo: varchar("cert_no", { length: 30 }).notNull().unique(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    applicantName: varchar("applicant_name", { length: 100 }).notNull(),
    courseId: varchar("course_id", { length: 36 }).notNull(),
    issuedBy: varchar("issued_by", { length: 100 }).notNull(),
    issuedAt: datetime("issued_at").notNull().default(/* @__PURE__ */ new Date()),
    reviewOpinion: text("review_opinion"),
    materialSnapshot: json$1("material_snapshot").$type(),
    archivedAt: datetime("archived_at"),
    status: mysqlEnum("status", ["active", "archived", "revoked"]).notNull().default("active")
  },
  (table) => ({
    regIdx: index("idx_cert_reg").on(table.registrationId)
  })
);
const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    operator: varchar("operator", { length: 100 }).notNull(),
    operatorRole: mysqlEnum("operator_role", ["handler", "reviewer"]).notNull(),
    detail: text("detail"),
    createdAt: datetime("created_at").notNull().default(/* @__PURE__ */ new Date())
  },
  (table) => ({
    regIdx: index("idx_audit_reg").on(table.registrationId),
    createdIdx: index("idx_audit_created").on(table.createdAt)
  })
);
const disputes = mysqlTable(
  "disputes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    reason: text("reason").notNull(),
    status: mysqlEnum("status", ["open", "under_review", "resolved", "rejected"]).notNull().default("open"),
    submittedBy: varchar("submitted_by", { length: 100 }).notNull(),
    resolvedBy: varchar("resolved_by", { length: 100 }),
    resolution: text("resolution"),
    createdAt: datetime("created_at").notNull().default(/* @__PURE__ */ new Date()),
    resolvedAt: datetime("resolved_at")
  },
  (table) => ({
    regIdx: index("idx_dispute_reg").on(table.registrationId)
  })
);

const schema = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    auditLogs,
    certificates,
    courses,
    disputes,
    grades,
    materials,
    registrations
}, Symbol.toStringTag, { value: 'Module' }));

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "qualification_review"
});
const db = drizzle(connection, { schema, mode: "default" });

const STATUS_LABELS = {
  pending: "待审核",
  material_missing: "材料缺失",
  under_review: "审核中",
  qualified: "资格通过",
  unqualified: "资格不通过",
  grade_not_met: "成绩未达标",
  duplicate: "重复报名",
  course_completed: "课程完成",
  cert_issued: "已发证",
  archived: "已归档"
};
async function checkDuplicate(applicantIdNo, courseId, excludeRegId) {
  const conditions = [eq(registrations.applicantIdNo, applicantIdNo), eq(registrations.courseId, courseId)];
  if (excludeRegId) {
    conditions.push(sql`${registrations.id} != ${excludeRegId}`);
  }
  const existing = await db.select().from(registrations).where(and(...conditions));
  return existing;
}
async function createRegistration(data) {
  const id = randomUUID();
  const regNo = `REG-${( new Date()).getFullYear()}-${String(await getNextRegSeq()).padStart(4, "0")}`;
  const duplicates = await checkDuplicate(data.applicantIdNo, data.courseId);
  let status = "pending";
  let conflictRegNo = null;
  if (duplicates.length > 0) {
    status = "duplicate";
    conflictRegNo = duplicates[0].regNo;
    await db.update(registrations).set({ status: "duplicate", conflictRegNo: regNo, updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, duplicates[0].id));
    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: duplicates[0].id,
      action: "detect_duplicate",
      operator: "系统",
      operatorRole: "reviewer",
      detail: `检测到重复报名，冲突报名编号：${regNo}`
    });
  }
  await db.insert(registrations).values({
    id,
    regNo,
    applicantName: data.applicantName,
    applicantIdNo: data.applicantIdNo,
    source: data.source,
    courseId: data.courseId,
    status,
    conflictRegNo,
    currentAssignee: "经办人"
  });
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: id,
    action: "submit_registration",
    operator: "系统",
    operatorRole: "handler",
    detail: `${data.applicantName}提交报名申请`
  });
  return { id, regNo, isDuplicate: duplicates.length > 0, conflictRegNo };
}
async function getNextRegSeq() {
  const result = await db.select({ count: sql`count(*)` }).from(registrations);
  return (result[0]?.count ?? 0) + 1;
}
async function getRegistrations(filters) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(registrations.status, filters.status));
  }
  if (filters?.keyword) {
    conditions.push(
      or(
        like(registrations.applicantName, `%${filters.keyword}%`),
        like(registrations.regNo, `%${filters.keyword}%`)
      )
    );
  }
  return db.select().from(registrations).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(registrations.createdAt));
}
async function getRegistrationDetail(regId) {
  const reg = await db.select().from(registrations).where(eq(registrations.id, regId)).then((rows) => rows[0]);
  if (!reg)
    return null;
  const [courseList, materialList, gradeList, logList, certList, disputeList] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, reg.courseId)).then((r) => r[0]),
    db.select().from(materials).where(eq(materials.registrationId, regId)),
    db.select().from(grades).where(eq(grades.registrationId, regId)),
    db.select().from(auditLogs).where(eq(auditLogs.registrationId, regId)).orderBy(desc(auditLogs.createdAt)),
    db.select().from(certificates).where(eq(certificates.registrationId, regId)),
    db.select().from(disputes).where(eq(disputes.registrationId, regId))
  ]);
  return {
    registration: reg,
    course: courseList,
    materials: materialList,
    grades: gradeList,
    auditLogs: logList,
    certificates: certList,
    disputes: disputeList
  };
}
async function supplementMaterial(regId, data) {
  const reg = await db.select().from(registrations).where(eq(registrations.id, regId)).then((r) => r[0]);
  if (!reg)
    throw new Error("报名记录不存在");
  if (data.materialId) {
    const existing = await db.select().from(materials).where(and(eq(materials.id, data.materialId), eq(materials.registrationId, regId))).then((r) => r[0]);
    if (!existing)
      throw new Error("材料记录不存在");
    await db.update(materials).set({ status: "submitted", fileUrl: data.fileUrl || existing.fileUrl, updatedAt: /* @__PURE__ */ new Date() }).where(eq(materials.id, data.materialId));
    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: regId,
      action: "supplement_material",
      operator: data.operator,
      operatorRole: "handler",
      detail: `经办人补交材料：${existing.name}（${existing.status} → submitted）`
    });
  } else {
    await db.insert(materials).values({
      id: randomUUID(),
      registrationId: regId,
      name: data.name,
      type: data.type,
      fileUrl: data.fileUrl,
      status: "submitted"
    });
    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: regId,
      action: "supplement_material",
      operator: data.operator,
      operatorRole: "handler",
      detail: `经办人补交材料：${data.name}`
    });
  }
  if (reg.status === "material_missing") {
    const allMaterials = await db.select().from(materials).where(eq(materials.registrationId, regId));
    const hasMissing = allMaterials.some((m) => m.status === "pending" || m.status === "rejected");
    await db.update(registrations).set({
      status: hasMissing ? "material_missing" : "under_review",
      currentRole: "reviewer",
      currentAssignee: "复核人",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(registrations.id, regId));
    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: regId,
      action: "route_to_reviewer",
      operator: data.operator,
      operatorRole: "handler",
      detail: hasMissing ? "仍有材料缺失，提交复核人审阅" : "材料已补齐，流转复核人审核"
    });
  } else {
    await db.update(registrations).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, regId));
  }
}
async function updateGrade(regId, data) {
  const reg = await db.select().from(registrations).where(eq(registrations.id, regId)).then((r) => r[0]);
  if (!reg)
    throw new Error("报名记录不存在");
  if (reg.status === "duplicate")
    throw new Error("重复报名，不可更新成绩");
  if (reg.status === "cert_issued")
    throw new Error("已发证，不可更新成绩");
  if (reg.status === "archived")
    throw new Error("已归档，不可更新成绩");
  const course = await db.select().from(courses).where(eq(courses.id, data.courseId)).then((r) => r[0]);
  const passingScore = Number(course?.passingScore ?? 60);
  const score = Number(data.score);
  const passed = score >= passingScore ? 1 : 0;
  const existingGrade = await db.select().from(grades).where(and(eq(grades.registrationId, regId), eq(grades.courseId, data.courseId))).then((r) => r[0]);
  if (existingGrade) {
    await db.update(grades).set({ score: data.score, passed, recordedBy: data.operator, recordedAt: /* @__PURE__ */ new Date() }).where(eq(grades.id, existingGrade.id));
  } else {
    await db.insert(grades).values({
      id: randomUUID(),
      registrationId: regId,
      courseId: data.courseId,
      score: data.score,
      passed,
      recordedBy: data.operator
    });
  }
  const newStatus = passed ? "course_completed" : "grade_not_met";
  const newRole = passed ? "reviewer" : "handler";
  const newAssignee = passed ? "复核人" : "经办人";
  await db.update(registrations).set({ status: newStatus, currentRole: newRole, currentAssignee: newAssignee, updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, regId));
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "record_grade",
    operator: data.operator,
    operatorRole: "handler",
    detail: `成绩录入：${data.score}分，${passed ? `达标，流转复核人确认发证（要求${passingScore}分）` : `未达标（要求${passingScore}分），当前责任人：经办人`}`
  });
  return { passed, passingScore };
}
async function reviewQualification(regId, data) {
  const reg = await db.select().from(registrations).where(eq(registrations.id, regId)).then((r) => r[0]);
  if (!reg)
    throw new Error("报名记录不存在");
  if (reg.status === "duplicate") {
    throw new Error(`重复报名（冲突编号：${reg.conflictRegNo}），不可审核通过。如需处理请提交资格争议`);
  }
  if (reg.status === "cert_issued") {
    throw new Error("已发证，不可再审核资格");
  }
  if (reg.status === "archived") {
    throw new Error("已归档，不可再审核资格");
  }
  const newStatus = data.qualified ? "qualified" : "unqualified";
  const newRole = data.qualified ? "reviewer" : "reviewer";
  const newAssignee = data.qualified ? "复核人" : data.operator;
  await db.update(registrations).set({
    status: newStatus,
    currentRole: newRole,
    currentAssignee: newAssignee,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(registrations.id, regId));
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: data.qualified ? "review_qualified" : "review_unqualified",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: data.qualified ? `${data.opinion}（资格通过，复核人可确认发证）` : `${data.opinion}（资格不通过）`
  });
}
async function markMaterialMissing(regId, data) {
  await db.update(registrations).set({
    status: "material_missing",
    currentRole: "handler",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(registrations.id, regId));
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "mark_material_missing",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: data.note
  });
}
async function returnToHandler(regId, data) {
  await db.update(registrations).set({
    currentRole: "handler",
    currentAssignee: "经办人",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(registrations.id, regId));
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "return_to_handler",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: data.reason
  });
}
async function issueCertificate(regId, data) {
  const reg = await db.select().from(registrations).where(eq(registrations.id, regId)).then((r) => r[0]);
  if (!reg)
    throw new Error("报名记录不存在");
  if (reg.status === "duplicate") {
    throw new Error(`重复报名，禁止发放证书（冲突编号：${reg.conflictRegNo}）`);
  }
  if (reg.status === "material_missing") {
    throw new Error("材料缺失，请先由经办人补齐材料后再发证");
  }
  if (reg.status === "grade_not_met") {
    throw new Error("成绩未达标，请先由经办人更新成绩后再发证");
  }
  if (reg.status === "unqualified") {
    throw new Error("资格审核未通过，不可发放证书");
  }
  if (reg.status === "pending" || reg.status === "under_review") {
    throw new Error("资格尚未审核，请先完成资格审核");
  }
  if (reg.status !== "course_completed" && reg.status !== "qualified") {
    throw new Error(`当前状态为"${STATUS_LABELS[reg.status] || reg.status}"，不可发放证书`);
  }
  const materialList = await db.select().from(materials).where(eq(materials.registrationId, regId));
  const materialSnapshot = {};
  for (const m of materialList) {
    materialSnapshot[m.id] = {
      name: m.name,
      type: m.type,
      status: m.status,
      reviewNote: m.reviewNote
    };
  }
  const certId = randomUUID();
  const certNo = `CERT-${( new Date()).getFullYear()}-${String(await getNextCertSeq()).padStart(4, "0")}`;
  await db.insert(certificates).values({
    id: certId,
    certNo,
    registrationId: regId,
    applicantName: reg.applicantName,
    courseId: reg.courseId,
    issuedBy: data.operator,
    reviewOpinion: data.reviewOpinion,
    materialSnapshot
  });
  await db.update(registrations).set({
    status: "cert_issued",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(registrations.id, regId));
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "issue_certificate",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: `发放证书：${certNo}，审核意见：${data.reviewOpinion}`
  });
  return { certId, certNo };
}
async function getNextCertSeq() {
  const result = await db.select({ count: sql`count(*)` }).from(certificates);
  return (result[0]?.count ?? 0) + 1;
}
async function archiveCertificate(certId, operator) {
  await db.update(certificates).set({ status: "archived", archivedAt: /* @__PURE__ */ new Date() }).where(eq(certificates.id, certId));
  const cert = await db.select().from(certificates).where(eq(certificates.id, certId)).then((r) => r[0]);
  if (cert) {
    await db.update(registrations).set({ status: "archived", updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, cert.registrationId));
    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: cert.registrationId,
      action: "archive_certificate",
      operator,
      operatorRole: "reviewer",
      detail: `证书归档：${cert.certNo}`
    });
  }
}
async function traceFromCertificate(certId) {
  const cert = await db.select().from(certificates).where(eq(certificates.id, certId)).then((r) => r[0]);
  if (!cert)
    return null;
  const materialList = await db.select().from(materials).where(eq(materials.registrationId, cert.registrationId));
  const logList = await db.select().from(auditLogs).where(eq(auditLogs.registrationId, cert.registrationId)).orderBy(desc(auditLogs.createdAt));
  return {
    certificate: cert,
    materials: materialList,
    auditLogs: logList
  };
}
async function createDispute(data) {
  const id = randomUUID();
  await db.insert(disputes).values({
    id,
    registrationId: data.registrationId,
    reason: data.reason,
    submittedBy: data.submittedBy
  });
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: data.registrationId,
    action: "create_dispute",
    operator: data.submittedBy,
    operatorRole: "handler",
    detail: `提交资格争议：${data.reason}`
  });
  return { id };
}
async function resolveDispute(disputeId, data) {
  const dispute = await db.select().from(disputes).where(eq(disputes.id, disputeId)).then((r) => r[0]);
  if (!dispute)
    throw new Error("争议记录不存在");
  await db.update(disputes).set({
    status: data.status,
    resolution: data.resolution,
    resolvedBy: data.resolvedBy,
    resolvedAt: /* @__PURE__ */ new Date()
  }).where(eq(disputes.id, disputeId));
  if (data.status === "resolved") {
    await db.update(registrations).set({ status: "under_review", updatedAt: /* @__PURE__ */ new Date() }).where(eq(registrations.id, dispute.registrationId));
  }
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: dispute.registrationId,
    action: "resolve_dispute",
    operator: data.resolvedBy,
    operatorRole: "reviewer",
    detail: `争议${data.status === "resolved" ? "解决" : "驳回"}：${data.resolution}`
  });
}
async function getDisputes(regId) {
  if (regId) {
    return db.select().from(disputes).where(eq(disputes.registrationId, regId));
  }
  return db.select().from(disputes).orderBy(desc(disputes.createdAt));
}
async function getCertificates() {
  return db.select().from(certificates).orderBy(desc(certificates.issuedAt));
}

async function GET$3(event) {
  const url = new URL(event.request.url);
  const traceCertId = url.searchParams.get("trace");
  if (traceCertId) {
    const data2 = await traceFromCertificate(traceCertId);
    if (!data2)
      return json({ error: "未找到" }, { status: 404 });
    return json(data2);
  }
  const data = await getCertificates();
  return json(data);
}
async function POST$5(event) {
  const body = await event.request.json();
  const { action } = body;
  try {
    if (action === "issue") {
      const result = await issueCertificate(body.regId, body);
      return json(result);
    } else if (action === "archive") {
      await archiveCertificate(body.certId, body.operator);
      return json({ success: true });
    }
    return json({ error: "未知操作" }, { status: 400 });
  } catch (e) {
    return json({ error: e.message }, { status: 400 });
  }
}

async function GET$2(event) {
  const url = new URL(event.request.url);
  const regId = url.searchParams.get("regId") || void 0;
  const data = await getDisputes(regId);
  return json(data);
}
async function POST$4(event) {
  const body = await event.request.json();
  const { action } = body;
  try {
    if (action === "create") {
      const result = await createDispute(body);
      return json(result);
    } else if (action === "resolve") {
      await resolveDispute(body.disputeId, body);
      return json({ success: true });
    }
    return json({ error: "未知操作" }, { status: 400 });
  } catch (e) {
    return json({ error: e.message }, { status: 400 });
  }
}

async function GET$1(event) {
  const url = new URL(event.request.url);
  const status = url.searchParams.get("status") || void 0;
  const keyword = url.searchParams.get("keyword") || void 0;
  const data = await getRegistrations({ status, keyword });
  return json(data);
}

async function POST$3(event) {
  const body = await event.request.json();
  const { action } = body;
  try {
    if (action === "review") {
      await reviewQualification(body.regId, body);
    } else if (action === "mark_missing") {
      await markMaterialMissing(body.regId, body);
    } else if (action === "return") {
      await returnToHandler(body.regId, body);
    } else {
      return json({ error: "未知操作" }, { status: 400 });
    }
    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, { status: 400 });
  }
}

async function POST$2(event) {
  const body = await event.request.json();
  try {
    const result = await updateGrade(body.regId, body);
    return json(result);
  } catch (e) {
    return json({ error: e.message }, { status: 400 });
  }
}

async function POST$1(event) {
  const body = await event.request.json();
  try {
    await supplementMaterial(body.regId, body);
    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, { status: 400 });
  }
}

async function GET(event) {
  const regId = event.params.id;
  const data = await getRegistrationDetail(regId);
  if (!data)
    return json({ error: "未找到" }, { status: 404 });
  return json(data);
}
async function POST(event) {
  const body = await event.request.json();
  const result = await createRegistration(body);
  return json(result);
}

const api = [
  {
    GET: "skip",
    path: "/certificates"
  },
  {
    GET: "skip",
    path: "/disputes"
  },
  {
    GET: "skip",
    path: "/"
  },
  {
    GET: GET$3,
    POST: POST$5,
    path: "/api/certificates"
  },
  {
    GET: GET$2,
    POST: POST$4,
    path: "/api/disputes"
  },
  {
    GET: GET$1,
    path: "/api/registrations"
  },
  {
    POST: POST$3,
    path: "/api/reviews"
  },
  {
    GET: "skip",
    path: "/registrations/:id"
  },
  {
    POST: POST$2,
    path: "/api/grades/update"
  },
  {
    POST: POST$1,
    path: "/api/materials/supplement"
  },
  {
    GET: GET,
    POST: POST,
    path: "/api/registrations/:id"
  }
];
function expandOptionals(pattern) {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match)
    return [pattern];
  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes = [prefix, prefix += match[1]];
  while (match = /^(\/\:[^\/]+)\?/.exec(suffix)) {
    prefixes.push(prefix += match[1]);
    suffix = suffix.slice(match[0].length);
  }
  return expandOptionals(suffix).reduce(
    (results, expansion) => [...results, ...prefixes.map((p) => p + expansion)],
    []
  );
}
function routeToMatchRoute(route) {
  const segments = route.path.split("/").filter(Boolean);
  const params = [];
  const matchSegments = [];
  let score = 0;
  let wildcard = false;
  for (const [index, segment] of segments.entries()) {
    if (segment[0] === ":") {
      const name = segment.slice(1);
      score += 3;
      params.push({
        type: ":",
        name,
        index
      });
      matchSegments.push(null);
    } else if (segment[0] === "*") {
      score -= 1;
      params.push({
        type: "*",
        name: segment.slice(1),
        index
      });
      wildcard = true;
    } else {
      score += 4;
      matchSegments.push(segment);
    }
  }
  return {
    ...route,
    score,
    params,
    matchSegments,
    wildcard
  };
}
api.flatMap((route) => {
  const paths = expandOptionals(route.path);
  return paths.map((path) => ({ ...route, path }));
}).map(routeToMatchRoute).sort((a, b) => b.score - a.score);

const entryServer = createHandler((event) => createComponent(StartServer, {
  event
}));

export { entryServer as default };
