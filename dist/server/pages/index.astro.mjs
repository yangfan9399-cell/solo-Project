/* empty css                                */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DWnod6f9.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_EcGP2ujl.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { L as LoadingSpinner } from '../chunks/LoadingSpinner_BsJ3zWzQ.mjs';
import { E as EmptyState } from '../chunks/EmptyState_Bwz99_Gu.mjs';
import { E as ErrorState } from '../chunks/ErrorState_B_cSgjGT.mjs';
import { S as StatusBadge } from '../chunks/StatusBadge_Dh84ksTW.mjs';
export { renderers } from '../renderers.mjs';

const statCards = [
  { key: "todayCount", label: "今日预约", icon: "📅", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "pendingCount", label: "待审批", icon: "⏳", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { key: "checkedInCount", label: "已签到", icon: "✅", color: "bg-green-50 text-green-700 border-green-200" },
  { key: "timeoutCount", label: "超时未离", icon: "⚠️", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { key: "blacklistCount", label: "黑名单数", icon: "🚫", color: "bg-red-50 text-red-700 border-red-200" }
];
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("获取统计数据失败");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  if (loading) return /* @__PURE__ */ jsx(LoadingSpinner, { text: "加载统计数据..." });
  if (error) return /* @__PURE__ */ jsx(ErrorState, { message: error, onRetry: fetchData });
  if (!data) return /* @__PURE__ */ jsx(EmptyState, { title: "暂无数据" });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4", children: statCards.map((card) => /* @__PURE__ */ jsxs("div", { className: `rounded-lg border p-4 ${card.color}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xl", children: card.icon }),
        /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold", children: data[card.key] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-medium", children: card.label })
    ] }, card.key)) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-800 mb-4", children: "最近预约" }),
        data.recentAppointments.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "暂无预约记录", description: "目前没有最近的预约", icon: "📋" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data.recentAppointments.map((apt) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: `/appointments/${apt.id}`,
            className: "block p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-800", children: apt.visitor_name }),
                /* @__PURE__ */ jsx(StatusBadge, { status: apt.status })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center justify-between text-sm text-gray-500", children: [
                /* @__PURE__ */ jsx("span", { children: apt.purpose }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "被访人: ",
                  apt.visitee_name || "-"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-1 text-xs text-gray-400", children: new Date(apt.expected_arrival).toLocaleString("zh-CN") })
            ]
          },
          apt.id
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-gray-800 mb-4", children: [
          "超时预警",
          data.timeoutVisitors.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700", children: data.timeoutVisitors.length })
        ] }),
        data.timeoutVisitors.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "暂无超时记录", description: "所有访客都已按时签退", icon: "🎉" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data.timeoutVisitors.map((v) => /* @__PURE__ */ jsxs(
          "a",
          {
            href: `/appointments/${v.id}`,
            className: "block p-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-orange-800", children: v.visitor_name }),
                /* @__PURE__ */ jsx(StatusBadge, { status: "timeout" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 text-sm text-orange-600", children: [
                "被访人: ",
                v.visitee_name || "-"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-orange-500", children: [
                "应离时间: ",
                new Date(v.expected_leave).toLocaleString("zh-CN")
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-orange-400", children: [
                "签到时间: ",
                v.check_in_time ? new Date(v.check_in_time).toLocaleString("zh-CN") : "-"
              ] })
            ]
          },
          v.id
        )) })
      ] })
    ] })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u5DE5\u4F5C\u53F0 - \u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", "currentPage": "/" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-6"> <h2 class="text-2xl font-bold text-gray-900">工作台</h2> <p class="mt-1 text-sm text-gray-500">园区访客预约审批与门禁核验系统概览</p> </div> ${renderComponent($$result2, "Dashboard", Dashboard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/Dashboard.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/index.astro", void 0);

const $$file = "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
