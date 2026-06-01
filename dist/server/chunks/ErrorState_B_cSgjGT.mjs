import { jsxs, jsx } from 'react/jsx-runtime';

function ErrorState({ message, onRetry }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-red-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }),
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-red-700", children: "出错了" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-500 max-w-md", children: message }),
    onRetry && /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onRetry,
        className: "mt-4 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors",
        children: "重试"
      }
    )
  ] });
}

export { ErrorState as E };
