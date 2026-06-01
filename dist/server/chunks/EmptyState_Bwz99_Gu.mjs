import { jsxs, jsx } from 'react/jsx-runtime';

function EmptyState({ title, description, icon = "📭" }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
    /* @__PURE__ */ jsx("span", { className: "text-5xl mb-4", children: icon }),
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-700", children: title }),
    description && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500 max-w-md", children: description })
  ] });
}

export { EmptyState as E };
