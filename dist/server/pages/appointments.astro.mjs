/* empty css                                */
import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../chunks/astro/server_D2NMvV5T.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_B74mddp9.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useCallback, useEffect } from 'react';
import { L as LoadingSpinner } from '../chunks/LoadingSpinner_BsJ3zWzQ.mjs';
import { E as EmptyState } from '../chunks/EmptyState_Bwz99_Gu.mjs';
import { S as StatusBadge } from '../chunks/StatusBadge_Dh84ksTW.mjs';
export { renderers } from '../renderers.mjs';

const filterTabs = [
  { value: "", label: "全部" },
  { value: "pending", label: "待审批" },
  { value: "approved", label: "已审批" },
  { value: "checked_in", label: "已签到" },
  { value: "checked_out", label: "已签退" },
  { value: "timeout", label: "超时" },
  { value: "rejected", label: "已驳回" }
];
function AppointmentList({ status: initialStatus, visitee_id }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus || "");
  const [search, setSearch] = useState("");
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.set("status", activeTab);
      if (visitee_id) params.set("visitee_id", String(visitee_id));
      if (search) params.set("search", search);
      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (!res.ok) throw new Error("获取预约列表失败");
      const data = await res.json();
      setAppointments(data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, visitee_id, search]);
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  const handleSearch = (e) => {
    e.preventDefault();
    fetchAppointments();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: filterTabs.map((tab) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setActiveTab(tab.value),
        className: `px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === tab.value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
        children: tab.label
      },
      tab.value
    )) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "搜索访客姓名/手机号",
          className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors",
          children: "搜索"
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsx(LoadingSpinner, {}) : appointments.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "暂无预约记录", description: "没有找到匹配的预约" }) : /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-gray-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-gray-50 border-b border-gray-200", children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "预约单号" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "访客姓名" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "来访事由" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "被访人" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "预约时间" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "状态" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: appointments.map((apt) => /* @__PURE__ */ jsxs(
        "tr",
        {
          onClick: () => {
            window.location.href = `/appointments/${apt.id}`;
          },
          className: "border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors",
          children: [
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-gray-800 font-mono", children: [
              "#",
              apt.id
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-800", children: apt.visitor_name }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600 max-w-[200px] truncate", children: apt.purpose }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-gray-600", children: [
              apt.visitee_name || "-",
              apt.visitee_department ? /* @__PURE__ */ jsxs("span", { className: "text-gray-400 ml-1", children: [
                "(",
                apt.visitee_department,
                ")"
              ] }) : null
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-500 text-xs", children: new Date(apt.expected_arrival).toLocaleString("zh-CN") }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(StatusBadge, { status: apt.status }) })
          ]
        },
        apt.id
      )) })
    ] }) }) })
  ] });
}

const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const status = Astro2.url.searchParams.get("status") || void 0;
  const visitee_id = Astro2.url.searchParams.get("visitee_id") || void 0;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u8BBF\u5BA2\u9884\u7EA6 - \u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", "currentPage": "/appointments" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-6 flex items-center justify-between"> <div> <h2 class="text-2xl font-bold text-gray-900">访客预约</h2> <p class="mt-1 text-sm text-gray-500">管理所有访客预约记录</p> </div> <a href="/appointments/new" class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
+ 新建预约
</a> </div> ${renderComponent($$result2, "AppointmentList", AppointmentList, { "client:load": true, "status": status, "visitee_id": visitee_id, "client:component-hydration": "load", "client:component-path": "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/AppointmentList.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/index.astro", void 0);

const $$file = "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/index.astro";
const $$url = "/appointments";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
