/* empty css                                */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D2NMvV5T.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DpfIgqQ0.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useCallback, useEffect } from 'react';
import { L as LoadingSpinner } from '../chunks/LoadingSpinner_BsJ3zWzQ.mjs';
import { E as EmptyState } from '../chunks/EmptyState_Bwz99_Gu.mjs';
import { E as ErrorState } from '../chunks/ErrorState_B_cSgjGT.mjs';
export { renderers } from '../renderers.mjs';

function BlacklistManager() {
  const [entries, setEntries] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedVisitorId, setSelectedVisitorId] = useState("");
  const [reason, setReason] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/blacklist${params}`);
      if (!res.ok) throw new Error("获取黑名单失败");
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, [search]);
  useEffect(() => {
    fetch("/api/visitors").then((res) => res.json()).then(setVisitors).catch(() => {
    });
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedVisitorId || !reason.trim()) {
      setFormError("请选择访客并填写拉黑原因");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_id: Number(selectedVisitorId), reason: reason.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "添加失败");
      }
      setSelectedVisitorId("");
      setReason("");
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setFormLoading(false);
    }
  };
  const handleRemove = async (id) => {
    if (!confirm("确定要移除此黑名单记录吗？")) return;
    try {
      const res = await fetch("/api/blacklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("移除失败");
      await fetchData();
    } catch {
      setError("移除失败，请重试");
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-1 max-w-md", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex gap-2 flex-1", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "搜索姓名/证件号",
            className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors", children: "搜索" })
      ] }) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowForm(!showForm),
          className: "px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium",
          children: showForm ? "取消" : "添加黑名单"
        }
      )
    ] }),
    showForm && /* @__PURE__ */ jsxs("form", { onSubmit: handleAdd, className: "bg-white rounded-lg border border-gray-200 p-5 space-y-4", children: [
      formError && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200", children: formError }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "选择访客 *" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: selectedVisitorId,
            onChange: (e) => setSelectedVisitorId(e.target.value),
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "请选择访客" }),
              visitors.map((v) => /* @__PURE__ */ jsxs("option", { value: v.id, children: [
                v.name,
                " (",
                v.id_number,
                ")"
              ] }, v.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "拉黑原因 *" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: reason,
            onChange: (e) => setReason(e.target.value),
            required: true,
            rows: 3,
            placeholder: "请输入拉黑原因...",
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: formLoading,
          className: "px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-medium",
          children: formLoading ? "添加中..." : "确认添加"
        }
      ) })
    ] }),
    error && /* @__PURE__ */ jsx(ErrorState, { message: error, onRetry: fetchData }),
    loading ? /* @__PURE__ */ jsx(LoadingSpinner, {}) : entries.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "暂无黑名单记录", description: "黑名单为空", icon: "🛡️" }) : /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg border border-gray-200 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-gray-50 border-b border-gray-200", children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "访客姓名" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "证件号" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "拉黑原因" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "添加时间" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left font-medium text-gray-600", children: "操作" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: entries.map((entry) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-gray-100 hover:bg-gray-50", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-800 font-medium", children: entry.visitor_name || "-" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600 font-mono text-xs", children: entry.visitor_id_number || "-" }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-600 max-w-[300px] truncate", children: entry.reason }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-gray-500 text-xs", children: new Date(entry.created_at).toLocaleString("zh-CN") }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleRemove(entry.id),
            className: "px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors",
            children: "移除"
          }
        ) })
      ] }, entry.id)) })
    ] }) }) })
  ] });
}

const $$Blacklist = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u9ED1\u540D\u5355\u7BA1\u7406 - \u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", "currentPage": "/blacklist" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-6"> <h2 class="text-2xl font-bold text-gray-900">黑名单管理</h2> <p class="mt-1 text-sm text-gray-500">管理被禁止入园的访客黑名单记录</p> </div> ${renderComponent($$result2, "BlacklistManager", BlacklistManager, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/BlacklistManager.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/blacklist.astro", void 0);

const $$file = "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/blacklist.astro";
const $$url = "/blacklist";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Blacklist,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
