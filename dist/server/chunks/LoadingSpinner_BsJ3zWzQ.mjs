import { jsxs, jsx } from 'react/jsx-runtime';

function LoadingSpinner({ text = "加载中..." }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-12", children: [
    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" }),
    /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-gray-500", children: text })
  ] });
}

export { LoadingSpinner as L };
