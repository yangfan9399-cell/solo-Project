import{w as d,x as me,y as X,z as de,F as z,A as pe,c as M,i as ee,B as he,b as be,e as _,d as v,j as ye,p as O,h as ve,C as ge,R as we,Q as $e}from"./q-B_2tfdSc.js";const R=null;/**
 * @license
 * @builder.io/qwik/server 1.20.0
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/QwikDev/qwik/blob/main/LICENSE
 */var _e=!1,qe="",Se=(t,...e)=>{const n=Pe(_e,t,...e);debugger;return n},Ee=t=>t,Pe=(t,e,...n)=>{const r=e instanceof Error?e:new Error(e);return console.error("%cQWIK ERROR",qe,r.message,...Ee(n),r.stack),r},ke=(t,...e)=>`Code(${t}) https://github.com/QwikDev/qwik/blob/main/packages/qwik/src/core/error/error.ts#L${8+t}`,Ae=11,xe=(t,...e)=>{const n=ke(t,...e);return Se(n,...e)},Ne="<sync>";function te(t,e){const n=e==null?void 0:e.mapper,r=t.symbolMapper?t.symbolMapper:(i,a,s)=>{var l;if(n){const u=L(i),c=n[u];if(!c){if(u===Ne)return[u,""];if((l=globalThis.__qwik_reg_symbols)==null?void 0:l.has(u))return[i,"_"];if(s)return[i,`${s}?qrl=${i}`];console.error("Cannot resolve symbol",i,"in",n,s)}return c}};return{isServer:!0,async importSymbol(i,a,s){var c;const l=L(s),u=(c=globalThis.__qwik_reg_symbols)==null?void 0:c.get(l);if(u)return u;throw xe(Ae,s)},raf:()=>(console.error("server can not rerender"),Promise.resolve()),nextTick:i=>new Promise(a=>{setTimeout(()=>{a(i())})}),chunkForSymbol(i,a,s){return r(i,n,s)}}}async function Le(t,e){const n=te(t,e);X(n)}var L=t=>{const e=t.lastIndexOf("_");return e>-1?t.slice(e+1):t},Ce="q:instance",D={$DEBUG$:!1,$invPreloadProbability$:.65},Ie=Date.now(),Te=/\.[mc]?js$/,ne=0,Oe=1,Be=2,Re=3,j,F,De=(t,e)=>({$name$:t,$state$:Te.test(t)?ne:Re,$deps$:oe?e==null?void 0:e.map(n=>({...n,$factor$:1})):e,$inverseProbability$:1,$createdTs$:Date.now(),$waitedMs$:0,$loadedMs$:0}),je=t=>{const e=new Map;let n=0;for(;n<t.length;){const r=t[n++],o=[];let i,a=1;for(;i=t[n],typeof i=="number";)i<0?a=-i/10:o.push({$name$:t[i],$importProbability$:a,$factor$:1}),n++;e.set(r,o)}return e},re=t=>{let e=Q.get(t);if(!e){let n;if(F){if(n=F.get(t),!n)return;n.length||(n=void 0)}e=De(t,n),Q.set(t,e)}return e},Fe=(t,e)=>{e&&("debug"in e&&(D.$DEBUG$=!!e.debug),typeof e.preloadProbability=="number"&&(D.$invPreloadProbability$=1-e.preloadProbability)),!(j!=null||!t)&&(j="",F=je(t))},Q=new Map,oe,C,ie=0,k=[],Qe=(...t)=>{console.log(`Preloader ${Date.now()-Ie}ms ${ie}/${k.length} queued>`,...t)},He=()=>{Q.clear(),C=!1,oe=!0,ie=0,k.length=0},Ue=()=>{C&&(k.sort((t,e)=>t.$inverseProbability$-e.$inverseProbability$),C=!1)},ze=()=>{Ue();let t=.4;const e=[];for(const n of k){const r=Math.round((1-n.$inverseProbability$)*10);r!==t&&(t=r,e.push(t)),e.push(n.$name$)}return e},ae=(t,e,n)=>{if(n!=null&&n.has(t))return;const r=t.$inverseProbability$;if(t.$inverseProbability$=e,!(r-t.$inverseProbability$<.01)&&(j!=null&&t.$state$<Be&&(t.$state$===ne&&(t.$state$=Oe,k.push(t),D.$DEBUG$&&Qe(`queued ${Math.round((1-t.$inverseProbability$)*100)}%`,t.$name$)),C=!0),t.$deps$)){n||(n=new Set),n.add(t);const o=1-t.$inverseProbability$;for(const i of t.$deps$){const a=re(i.$name$);if(a.$inverseProbability$===0)continue;let s;if(o===1||o>=.99&&H<100)H++,s=Math.min(.01,1-i.$importProbability$);else{const l=1-i.$importProbability$*o,u=i.$factor$,c=l/u;s=Math.max(.02,a.$inverseProbability$*c),i.$factor$=c}ae(a,s,n)}}},Y=(t,e)=>{const n=re(t);n&&n.$inverseProbability$>e&&ae(n,e)},H,Ge=(t,e)=>{if(!(t!=null&&t.length))return;H=0;let n=e?1-e:.4;if(Array.isArray(t))for(let r=t.length-1;r>=0;r--){const o=t[r];typeof o=="number"?n=1-o/10:Y(o,n)}else Y(t,n)};function Je(t){const e=[],n=r=>{if(r)for(const o of r)e.includes(o.url)||(e.push(o.url),o.imports&&n(o.imports))};return n(t),e}var We=t=>{var r;const e=pe(),n=(r=t==null?void 0:t.qrls)==null?void 0:r.map(o=>{var l;const i=o.$refSymbol$||o.$symbol$,a=o.$chunk$,s=e.chunkForSymbol(i,a,(l=o.dev)==null?void 0:l.file);return s?s[1]:a}).filter(Boolean);return[...new Set(n)]};function Ve(t,e,n){const r=e.prefetchStrategy;if(r===null)return[];if(!(n!=null&&n.manifest.bundleGraph))return We(t);if(typeof(r==null?void 0:r.symbolsToPrefetch)=="function")try{const i=r.symbolsToPrefetch({manifest:n.manifest});return Je(i)}catch(i){console.error("getPrefetchUrls, symbolsToPrefetch()",i)}const o=new Set;for(const i of(t==null?void 0:t.qrls)||[]){const a=L(i.$refSymbol$||i.$symbol$);a&&a.length>=10&&o.add(a)}return[...o]}var Ze=(t,e)=>{if(!(e!=null&&e.manifest.bundleGraph))return[...new Set(t)];He();let n=.99;for(const r of t.slice(0,15))Ge(r,n),n*=.85;return ze()},U=(t,e)=>{if(e==null)return null;const n=`${t}${e}`.split("/"),r=[];for(const o of n)o===".."&&r.length>0?r.pop():r.push(o);return r.join("/")},Ke=(t,e,n,r,o)=>{var l;const i=U(t,(l=e==null?void 0:e.manifest)==null?void 0:l.preloader),a="/"+(e==null?void 0:e.manifest.bundleGraphAsset);if(i&&a&&n!==!1){const u=typeof n=="object"?{debug:n.debug,preloadProbability:n.ssrPreloadProbability}:void 0;Fe(e==null?void 0:e.manifest.bundleGraph,u);const c=[];n!=null&&n.debug&&c.push("d:1"),n!=null&&n.maxIdlePreloads&&c.push(`P:${n.maxIdlePreloads}`),n!=null&&n.preloadProbability&&c.push(`Q:${n.preloadProbability}`);const b=c.length?`,{${c.join(",")}}`:"",q=`let b=fetch("${a}");import("${i}").then(({l})=>l(${JSON.stringify(t)},b${b}));`;r.push(d("link",{rel:"modulepreload",href:i,nonce:o,crossorigin:"anonymous"}),d("link",{rel:"preload",href:a,as:"fetch",crossorigin:"anonymous",nonce:o}),d("script",{type:"module",async:!0,dangerouslySetInnerHTML:q,nonce:o}))}const s=U(t,e==null?void 0:e.manifest.core);s&&r.push(d("link",{rel:"modulepreload",href:s,nonce:o}))},Ye=(t,e,n,r,o)=>{if(r.length===0||n===!1)return null;const{ssrPreloads:i,ssrPreloadProbability:a}=Me(typeof n=="boolean"?void 0:n);let s=i;const l=[],u=[],c=e==null?void 0:e.manifest.manifestHash;if(s){const g=e==null?void 0:e.manifest.preloader,f=e==null?void 0:e.manifest.core,h=Ze(r,e);let E=4;const A=a*10;for(const y of h)if(typeof y=="string"){if(E<A)break;if(y===g||y===f)continue;if(u.push(y),--s===0)break}else E=y}const b=U(t,c&&(e==null?void 0:e.manifest.preloader));let S=u.length?`${JSON.stringify(u)}.map((l,e)=>{e=document.createElement('link');e.rel='modulepreload';e.href=${JSON.stringify(t)}+l;document.head.appendChild(e)});`:"";return b&&(S+=`window.addEventListener('load',f=>{f=_=>import("${b}").then(({p})=>p(${JSON.stringify(r)}));try{requestIdleCallback(f,{timeout:2000})}catch(e){setTimeout(f,200)}})`),S&&l.push(d("script",{type:"module","q:type":"preload",async:!0,dangerouslySetInnerHTML:S,nonce:o})),l.length>0?d(z,{children:l}):null},Xe=(t,e,n,r,o)=>{var i;if(n.preloader!==!1){const a=Ve(e,n,r);if(a.length>0){const s=Ye(t,r,n.preloader,a,(i=n.serverData)==null?void 0:i.nonce);s&&o.push(s)}}};function Me(t){return{...et,...t}}var et={ssrPreloads:7,ssrPreloadProbability:.5,debug:!1,maxIdlePreloads:25,preloadProbability:.35},tt='const t=document,e=window,n=new Set,o=new Set([t]);let r;const s=(t,e)=>Array.from(t.querySelectorAll(e)),a=t=>{const e=[];return o.forEach(n=>e.push(...s(n,t))),e},i=t=>{w(t),s(t,"[q\\\\:shadowroot]").forEach(t=>{const e=t.shadowRoot;e&&i(e)})},c=t=>t&&"function"==typeof t.then,l=(t,e,n=e.type)=>{a("[on"+t+"\\\\:"+n+"]").forEach(o=>{b(o,t,e,n)})},f=e=>{if(void 0===e._qwikjson_){let n=(e===t.documentElement?t.body:e).lastElementChild;for(;n;){if("SCRIPT"===n.tagName&&"qwik/json"===n.getAttribute("type")){e._qwikjson_=JSON.parse(n.textContent.replace(/\\\\x3C(\\/?script)/gi,"<$1"));break}n=n.previousElementSibling}}},p=(t,e)=>new CustomEvent(t,{detail:e}),b=async(e,n,o,r=o.type)=>{const s="on"+n+":"+r;e.hasAttribute("preventdefault:"+r)&&o.preventDefault(),e.hasAttribute("stoppropagation:"+r)&&o.stopPropagation();const a=e._qc_,i=a&&a.li.filter(t=>t[0]===s);if(i&&i.length>0){for(const t of i){const n=t[1].getFn([e,o],()=>e.isConnected)(o,e),r=o.cancelBubble;c(n)&&await n,r&&o.stopPropagation()}return}const l=e.getAttribute(s);if(l){const n=e.closest("[q\\\\:container]"),r=n.getAttribute("q:base"),s=n.getAttribute("q:version")||"unknown",a=n.getAttribute("q:manifest-hash")||"dev",i=new URL(r,t.baseURI);for(const p of l.split("\\n")){const l=new URL(p,i),b=l.href,h=l.hash.replace(/^#?([^?[|]*).*$/,"$1")||"default",q=performance.now();let _,d,y;const w=p.startsWith("#"),g={qBase:r,qManifest:a,qVersion:s,href:b,symbol:h,element:e,reqTime:q};if(w){const e=n.getAttribute("q:instance");_=(t["qFuncs_"+e]||[])[Number.parseInt(h)],_||(d="sync",y=Error("sym:"+h))}else{u("qsymbol",g);const t=l.href.split("#")[0];try{const e=import(t);f(n),_=(await e)[h],_||(d="no-symbol",y=Error(`${h} not in ${t}`))}catch(t){d||(d="async"),y=t}}if(!_){u("qerror",{importError:d,error:y,...g}),console.error(y);break}const m=t.__q_context__;if(e.isConnected)try{t.__q_context__=[e,o,l];const n=_(o,e);c(n)&&await n}catch(t){u("qerror",{error:t,...g})}finally{t.__q_context__=m}}}},u=(e,n)=>{t.dispatchEvent(p(e,n))},h=t=>t.replace(/([A-Z])/g,t=>"-"+t.toLowerCase()),q=async t=>{let e=h(t.type),n=t.target;for(l("-document",t,e);n&&n.getAttribute;){const o=b(n,"",t,e);let r=t.cancelBubble;c(o)&&await o,r||(r=r||t.cancelBubble||n.hasAttribute("stoppropagation:"+t.type)),n=t.bubbles&&!0!==r?n.parentElement:null}},_=t=>{l("-window",t,h(t.type))},d=()=>{const s=t.readyState;if(!r&&("interactive"==s||"complete"==s)&&(o.forEach(i),r=1,u("qinit"),(e.requestIdleCallback??e.setTimeout).bind(e)(()=>u("qidle")),n.has("qvisible"))){const t=a("[on\\\\:qvisible]"),e=new IntersectionObserver(t=>{for(const n of t)n.isIntersecting&&(e.unobserve(n.target),b(n.target,"",p("qvisible",n)))});t.forEach(t=>e.observe(t))}},y=(t,e,n,o=!1)=>{t.addEventListener(e,n,{capture:o,passive:!1})},w=(...t)=>{for(const r of t)"string"==typeof r?n.has(r)||(o.forEach(t=>y(t,r,q,!0)),y(e,r,_,!0),n.add(r)):o.has(r)||(n.forEach(t=>y(r,t,q,!0)),o.add(r))};if(!("__q_context__"in t)){t.__q_context__=0;const r=e.qwikevents;r&&(Array.isArray(r)?w(...r):w("click","input")),e.qwikevents={events:n,roots:o,push:w},y(t,"readystatechange",d),d()}',nt=`const doc = document;
const win = window;
const events = /* @__PURE__ */ new Set();
const roots = /* @__PURE__ */ new Set([doc]);
let hasInitialized;
const nativeQuerySelectorAll = (root, selector) => Array.from(root.querySelectorAll(selector));
const querySelectorAll = (query) => {
  const elements = [];
  roots.forEach((root) => elements.push(...nativeQuerySelectorAll(root, query)));
  return elements;
};
const findShadowRoots = (fragment) => {
  processEventOrNode(fragment);
  nativeQuerySelectorAll(fragment, "[q\\\\:shadowroot]").forEach((parent) => {
    const shadowRoot = parent.shadowRoot;
    shadowRoot && findShadowRoots(shadowRoot);
  });
};
const isPromise = (promise) => promise && typeof promise.then === "function";
const broadcast = (infix, ev, type = ev.type) => {
  querySelectorAll("[on" + infix + "\\\\:" + type + "]").forEach((el) => {
    dispatch(el, infix, ev, type);
  });
};
const resolveContainer = (containerEl) => {
  if (containerEl._qwikjson_ === void 0) {
    const parentJSON = containerEl === doc.documentElement ? doc.body : containerEl;
    let script = parentJSON.lastElementChild;
    while (script) {
      if (script.tagName === "SCRIPT" && script.getAttribute("type") === "qwik/json") {
        containerEl._qwikjson_ = JSON.parse(
          script.textContent.replace(/\\\\x3C(\\/?script)/gi, "<$1")
        );
        break;
      }
      script = script.previousElementSibling;
    }
  }
};
const createEvent = (eventName, detail) => new CustomEvent(eventName, {
  detail
});
const dispatch = async (element, onPrefix, ev, eventName = ev.type) => {
  const attrName = "on" + onPrefix + ":" + eventName;
  if (element.hasAttribute("preventdefault:" + eventName)) {
    ev.preventDefault();
  }
  if (element.hasAttribute("stoppropagation:" + eventName)) {
    ev.stopPropagation();
  }
  const ctx = element._qc_;
  const relevantListeners = ctx && ctx.li.filter((li) => li[0] === attrName);
  if (relevantListeners && relevantListeners.length > 0) {
    for (const listener of relevantListeners) {
      const results = listener[1].getFn([element, ev], () => element.isConnected)(ev, element);
      const cancelBubble = ev.cancelBubble;
      if (isPromise(results)) {
        await results;
      }
      if (cancelBubble) {
        ev.stopPropagation();
      }
    }
    return;
  }
  const attrValue = element.getAttribute(attrName);
  if (attrValue) {
    const container = element.closest("[q\\\\:container]");
    const qBase = container.getAttribute("q:base");
    const qVersion = container.getAttribute("q:version") || "unknown";
    const qManifest = container.getAttribute("q:manifest-hash") || "dev";
    const base = new URL(qBase, doc.baseURI);
    for (const qrl of attrValue.split("\\n")) {
      const url = new URL(qrl, base);
      const href = url.href;
      const symbol = url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default";
      const reqTime = performance.now();
      let handler;
      let importError;
      let error;
      const isSync = qrl.startsWith("#");
      const eventData = {
        qBase,
        qManifest,
        qVersion,
        href,
        symbol,
        element,
        reqTime
      };
      if (isSync) {
        const hash = container.getAttribute("q:instance");
        handler = (doc["qFuncs_" + hash] || [])[Number.parseInt(symbol)];
        if (!handler) {
          importError = "sync";
          error = new Error("sym:" + symbol);
        }
      } else {
        emitEvent("qsymbol", eventData);
        const uri = url.href.split("#")[0];
        try {
          const module = import(
                        uri
          );
          resolveContainer(container);
          handler = (await module)[symbol];
          if (!handler) {
            importError = "no-symbol";
            error = new Error(\`\${symbol} not in \${uri}\`);
          }
        } catch (err) {
          importError || (importError = "async");
          error = err;
        }
      }
      if (!handler) {
        emitEvent("qerror", {
          importError,
          error,
          ...eventData
        });
        console.error(error);
        break;
      }
      const previousCtx = doc.__q_context__;
      if (element.isConnected) {
        try {
          doc.__q_context__ = [element, ev, url];
          const results = handler(ev, element);
          if (isPromise(results)) {
            await results;
          }
        } catch (error2) {
          emitEvent("qerror", { error: error2, ...eventData });
        } finally {
          doc.__q_context__ = previousCtx;
        }
      }
    }
  }
};
const emitEvent = (eventName, detail) => {
  doc.dispatchEvent(createEvent(eventName, detail));
};
const camelToKebab = (str) => str.replace(/([A-Z])/g, (a) => "-" + a.toLowerCase());
const processDocumentEvent = async (ev) => {
  let type = camelToKebab(ev.type);
  let element = ev.target;
  broadcast("-document", ev, type);
  while (element && element.getAttribute) {
    const results = dispatch(element, "", ev, type);
    let cancelBubble = ev.cancelBubble;
    if (isPromise(results)) {
      await results;
    }
    cancelBubble || (cancelBubble = cancelBubble || ev.cancelBubble || element.hasAttribute("stoppropagation:" + ev.type));
    element = ev.bubbles && cancelBubble !== true ? element.parentElement : null;
  }
};
const processWindowEvent = (ev) => {
  broadcast("-window", ev, camelToKebab(ev.type));
};
const processReadyStateChange = () => {
  const readyState = doc.readyState;
  if (!hasInitialized && (readyState == "interactive" || readyState == "complete")) {
    roots.forEach(findShadowRoots);
    hasInitialized = 1;
    emitEvent("qinit");
    const riC = win.requestIdleCallback ?? win.setTimeout;
    riC.bind(win)(() => emitEvent("qidle"));
    if (events.has("qvisible")) {
      const results = querySelectorAll("[on\\\\:qvisible]");
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            dispatch(entry.target, "", createEvent("qvisible", entry));
          }
        }
      });
      results.forEach((el) => observer.observe(el));
    }
  }
};
const addEventListener = (el, eventName, handler, capture = false) => {
  el.addEventListener(eventName, handler, { capture, passive: false });
};
const processEventOrNode = (...eventNames) => {
  for (const eventNameOrNode of eventNames) {
    if (typeof eventNameOrNode === "string") {
      if (!events.has(eventNameOrNode)) {
        roots.forEach(
          (root) => addEventListener(root, eventNameOrNode, processDocumentEvent, true)
        );
        addEventListener(win, eventNameOrNode, processWindowEvent, true);
        events.add(eventNameOrNode);
      }
    } else {
      if (!roots.has(eventNameOrNode)) {
        events.forEach(
          (eventName) => addEventListener(eventNameOrNode, eventName, processDocumentEvent, true)
        );
        roots.add(eventNameOrNode);
      }
    }
  }
};
if (!("__q_context__" in doc)) {
  doc.__q_context__ = 0;
  const qwikevents = win.qwikevents;
  if (qwikevents) {
    if (Array.isArray(qwikevents)) {
      processEventOrNode(...qwikevents);
    } else {
      processEventOrNode("click", "input");
    }
  }
  win.qwikevents = {
    events,
    roots,
    push: processEventOrNode
  };
  addEventListener(doc, "readystatechange", processReadyStateChange);
  processReadyStateChange();
}`;function rt(t={}){return t.debug?nt:tt}function B(){if(typeof performance>"u")return()=>0;const t=performance.now();return()=>(performance.now()-t)/1e6}function ot(t){let e=t.base;return typeof t.base=="function"&&(e=t.base(t)),typeof e=="string"?(e.endsWith("/")||(e+="/"),e):"/build/"}var it="<!DOCTYPE html>";async function at(t,e){var W,V;let n=e.stream,r=0,o=0,i=0,a=0,s="",l;const u=((W=e.streaming)==null?void 0:W.inOrder)??{strategy:"auto",maximunInitialChunk:5e4,maximunChunk:3e4},c=e.containerTagName??"html",b=e.containerAttributes??{},q=n,S=B(),g=ot(e),f=se(e.manifest),h=(V=e.serverData)==null?void 0:V.nonce;function E(){s&&(q.write(s),s="",r=0,i++,i===1&&(a=S()))}function A(m){const p=m.length;r+=p,o+=p,s+=m}switch(u.strategy){case"disabled":n={write:A};break;case"direct":n=q;break;case"auto":let m=0,p=!1;const Z=u.maximunChunk??0,T=u.maximunInitialChunk??0;n={write(w){w==="<!--qkssr-f-->"?p||(p=!0):w==="<!--qkssr-pu-->"?m++:w==="<!--qkssr-po-->"?m--:A(w),m===0&&(p||r>=(i===0?T:Z))&&(p=!1,E())}};break}c==="html"?n.write(it):n.write("<!--cq-->"),f||console.warn("Missing client manifest, loading symbols in the client might 404. Please ensure the client build has run and generated the manifest for the server build."),await Le(e,f);const y=f==null?void 0:f.manifest.injections,x=y?y.map(m=>d(m.tag,m.attributes??{})):[];let N=e.qwikLoader?typeof e.qwikLoader=="object"?e.qwikLoader.include==="never"?2:0:e.qwikLoader==="inline"?1:e.qwikLoader==="never"?2:0:0;const I=f==null?void 0:f.manifest.qwikLoader;if(N===0&&!I&&(N=1),N===0)x.unshift(d("link",{rel:"modulepreload",href:`${g}${I}`,nonce:h}),d("script",{type:"module",async:!0,src:`${g}${I}`,nonce:h}));else if(N===1){const m=rt({debug:e.debug});x.unshift(d("script",{id:"qwikloader",type:"module",async:!0,nonce:h,dangerouslySetInnerHTML:m}))}Ke(g,f,e.preloader,x,h);const le=B(),ce=[];let G=0,J=0;await me(t,{stream:n,containerTagName:c,containerAttributes:b,serverData:e.serverData,base:g,beforeContent:x,beforeClose:async(m,p,Z,T)=>{G=le();const w=B();l=await de(m,p,void 0,T);const $=[];Xe(g,l,e,f,$);const fe=JSON.stringify(l.state,void 0,void 0);if($.push(d("script",{type:"qwik/json",dangerouslySetInnerHTML:lt(fe),nonce:h})),l.funcs.length>0){const P=b[Ce];$.push(d("script",{"q:func":"qwik/json",dangerouslySetInnerHTML:ft(P,l.funcs),nonce:h}))}const K=Array.from(p.$events$,P=>JSON.stringify(P));if(K.length>0){const P=`(window.qwikevents||(window.qwikevents=[])).push(${K.join(",")})`;$.push(d("script",{dangerouslySetInnerHTML:P,nonce:h}))}return ct(ce,m),J=w(),d(z,{children:$})},manifestHash:(f==null?void 0:f.manifest.manifestHash)||"dev"+st()}),c!=="html"&&n.write("<!--/cq-->"),E();const ue=l.resources.some(m=>m._cache!==1/0);return{prefetchResources:void 0,snapshotResult:l,flushes:i,manifest:f==null?void 0:f.manifest,size:o,isStatic:!ue,timing:{render:G,snapshot:J,firstFlush:a}}}function st(){return Math.random().toString(36).slice(2)}function se(t){const e=t?{...R,...t}:R;if(!e||"mapper"in e)return e;if(e.mapping){const n={};return Object.entries(e.mapping).forEach(([r,o])=>{n[L(r)]=[r,o]}),{mapper:n,manifest:e,injections:e.injections||[]}}}var lt=t=>t.replace(/<(\/?script)/gi,"\\x3C$1");function ct(t,e){var n;for(const r of e){const o=(n=r.$componentQrl$)==null?void 0:n.getSymbol();o&&!t.includes(o)&&t.push(o)}}var ut='document["qFuncs_HASH"]=';function ft(t,e){return ut.replace("HASH",t)+`[${e.join(`,
`)}]`}async function vt(t){const e=te({},se(t));X(e)}const mt=()=>{const t=he(),e=be();return _(z,{children:[v("title",null,null,t.title||"稀有矿物薄片显微观察档案",1,null),v("link",null,{rel:"canonical",href:ye(n=>n.url.href,[e],"p0.url.href")},null,3,null),v("meta",null,{name:"viewport",content:"width=device-width, initial-scale=1.0"},null,3,null),v("link",null,{rel:"icon",type:"image/svg+xml",href:"/favicon.svg"},null,3,null),t.meta.map(n=>O("meta",{...n},null,0,n.key)),t.links.map(n=>O("link",{...n},null,0,n.key)),t.styles.map(n=>O("style",{...n.props,get dangerouslySetInnerHTML(){return n.style},dangerouslySetInnerHTML:ve(n,"style")},null,0,n.key))]},1,"Zx_0")},dt=M(ee(mt,"s_ZW0Z9LznOLY")),pt=()=>_($e,{children:[v("head",null,null,[v("meta",null,{charSet:"utf-8"},null,3,null),v("link",null,{rel:"manifest",href:"/manifest.json"},null,3,null),_(dt,null,3,"G9_0"),_(ge,null,3,"G9_1")],1,null),v("body",null,{lang:"zh-CN",class:"bg-mineral-950 text-mineral-50 antialiased"},_(we,null,3,"G9_2"),1,null)]},1,"G9_3"),ht=M(ee(pt,"s_vfSlkcmi7VA"));function gt(t){return at(_(ht,null,3,"j1_0"),{manifest:R,...t,containerAttributes:{lang:"zh-CN",...t.containerAttributes}})}export{R as m,gt as r,vt as s};
