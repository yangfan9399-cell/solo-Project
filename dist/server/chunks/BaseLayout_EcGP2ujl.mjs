import { e as createComponent, l as renderHead, g as addAttribute, r as renderTemplate, n as renderSlot, h as createAstro } from './astro/server_DWnod6f9.mjs';
import 'piccolore';
import 'clsx';
/* empty css                        */

const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title = "\u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", currentPage = "" } = Astro2.props;
  const navItems = [
    { href: "/", label: "\u5DE5\u4F5C\u53F0", icon: "\u{1F3E0}" },
    { href: "/appointments", label: "\u8BBF\u5BA2\u9884\u7EA6", icon: "\u{1F4CB}" },
    { href: "/gate", label: "\u95E8\u5C97\u6838\u9A8C", icon: "\u{1F6E1}\uFE0F" },
    { href: "/blacklist", label: "\u9ED1\u540D\u5355", icon: "\u{1F6AB}" }
  ];
  return renderTemplate`<html lang="zh-CN"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏢</text></svg>">${renderHead()}</head> <body class="min-h-screen flex flex-col"> <header class="bg-white border-b border-gray-200 sticky top-0 z-50"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="flex items-center justify-between h-16"> <div class="flex items-center gap-3"> <span class="text-2xl">🏢</span> <h1 class="text-lg font-bold text-gray-900">园区访客预约审批与门禁核验系统</h1> </div> <nav class="flex items-center gap-1"> ${navItems.map((item) => renderTemplate`<a${addAttribute(item.href, "href")}${addAttribute([
    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
    currentPage === item.href ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  ], "class:list")}> <span class="mr-1">${item.icon}</span> ${item.label} </a>`)} </nav> </div> </div> </header> <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"> ${renderSlot($$result, $$slots["default"])} </main> <footer class="bg-white border-t border-gray-200 py-4"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
园区访客预约审批与门禁核验系统 v1.0
</div> </footer> </body></html>`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
