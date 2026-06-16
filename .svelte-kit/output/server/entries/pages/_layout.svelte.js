import { c as create_ssr_component } from "../../chunks/ssr.js";
const css = {
  code: ".app-container.svelte-18bl5zh{width:100vw;height:100vh;overflow:hidden;position:relative}",
  map: '{"version":3,"file":"+layout.svelte","sources":["+layout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../app.css\\";\\n<\/script>\\n\\n<main class=\\"app-container\\">\\n\\t<slot />\\n</main>\\n\\n<style>\\n\\t.app-container {\\n\\t\\twidth: 100vw;\\n\\t\\theight: 100vh;\\n\\t\\toverflow: hidden;\\n\\t\\tposition: relative;\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAQC,6BAAe,CACd,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,QAAQ,CAAE,MAAM,CAChB,QAAQ,CAAE,QACX"}'
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<main class="app-container svelte-18bl5zh">${slots.default ? slots.default({}) : ``} </main>`;
});
export {
  Layout as default
};
