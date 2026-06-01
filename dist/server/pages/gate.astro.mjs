/* empty css                                */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D2NMvV5T.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DpfIgqQ0.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { L as LoadingSpinner } from '../chunks/LoadingSpinner_BsJ3zWzQ.mjs';
import { S as StatusBadge } from '../chunks/StatusBadge_Dh84ksTW.mjs';
import { E as ErrorState } from '../chunks/ErrorState_B_cSgjGT.mjs';
export { renderers } from '../renderers.mjs';

function GateVerify() {
  const [clock, setClock] = useState(/* @__PURE__ */ new Date());
  const [searchInput, setSearchInput] = useState("");
  const [visitor, setVisitor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [blacklist, setBlacklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [searched, setSearched] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setClock(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(timer);
  }, []);
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setLoading(true);
    setError("");
    setVisitor(null);
    setAppointments([]);
    setBlacklist(null);
    setSearched(true);
    try {
      const [visitorsRes, appointmentsRes, blacklistRes] = await Promise.all([
        fetch(`/api/visitors?search=${encodeURIComponent(searchInput.trim())}`),
        fetch(`/api/appointments?search=${encodeURIComponent(searchInput.trim())}`),
        fetch(`/api/blacklist?search=${encodeURIComponent(searchInput.trim())}`)
      ]);
      if (!visitorsRes.ok || !appointmentsRes.ok || !blacklistRes.ok) {
        throw new Error("查询失败");
      }
      const visitorsData = await visitorsRes.json();
      const appointmentsData = await appointmentsRes.json();
      const blacklistData = await blacklistRes.json();
      if (visitorsData.length > 0) {
        setVisitor(visitorsData[0]);
      }
      setAppointments(appointmentsData);
      if (blacklistData.length > 0) {
        setBlacklist(blacklistData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  };
  const handleAction = async (appointmentId, action) => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId, action })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "操作失败");
      }
      setAppointments(
        (prev) => prev.map(
          (apt) => apt.id === appointmentId ? { ...apt, status: action === "check_in" ? "checked_in" : "checked_out" } : apt
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-4xl font-mono font-bold tracking-wider", children: clock.toLocaleTimeString("zh-CN", { hour12: false }) }),
      /* @__PURE__ */ jsx("div", { className: "text-sm mt-1 opacity-80", children: clock.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: searchInput,
          onChange: (e) => setSearchInput(e.target.value),
          placeholder: "输入访客证件号码进行查询",
          className: "flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium",
          children: loading ? "查询中..." : "查询"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx(ErrorState, { message: error }),
    loading && /* @__PURE__ */ jsx(LoadingSpinner, { text: "查询中..." }),
    !loading && searched && !visitor && appointments.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-gray-500", children: [
      /* @__PURE__ */ jsx("span", { className: "text-4xl block mb-3", children: "🔍" }),
      /* @__PURE__ */ jsx("p", { children: "未找到相关访客信息" })
    ] }),
    blacklist && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-lg bg-red-50 border-2 border-red-300", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xl", children: "🚫" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-red-700", children: "黑名单警告" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-red-600", children: [
        "访客 ",
        /* @__PURE__ */ jsx("strong", { children: blacklist.visitor_name }),
        " 已被加入黑名单"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-red-500 text-sm mt-1", children: [
        "原因：",
        blacklist.reason
      ] })
    ] }),
    visitor && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-3", children: "访客信息" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "姓名" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: visitor.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "手机号" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: visitor.phone })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "证件号码" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: visitor.id_number })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "证件类型" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: visitor.id_type })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "公司" }),
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: visitor.company || "-" })
        ] })
      ] })
    ] }),
    appointments.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "相关预约记录" }),
      appointments.map((apt) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-mono text-gray-600 text-sm", children: [
            "预约单 #",
            apt.id
          ] }),
          /* @__PURE__ */ jsx(StatusBadge, { status: apt.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "来访事由" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: apt.purpose })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "被访人" }),
            /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-800", children: [
              apt.visitee_name || "-",
              apt.visitee_department ? ` (${apt.visitee_department})` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "预计到达" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: new Date(apt.expected_arrival).toLocaleString("zh-CN") })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "预计离开" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-800", children: new Date(apt.expected_leave).toLocaleString("zh-CN") })
          ] })
        ] }),
        !blacklist && (apt.status === "approved" || apt.status === "checked_in" || apt.status === "timeout") && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-3 border-t border-gray-100", children: [
          apt.status === "approved" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleAction(apt.id, "check_in"),
              disabled: actionLoading === apt.id,
              className: "px-5 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium",
              children: actionLoading === apt.id ? "处理中..." : "签到入园"
            }
          ),
          (apt.status === "checked_in" || apt.status === "timeout") && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleAction(apt.id, "check_out"),
              disabled: actionLoading === apt.id,
              className: "px-5 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium",
              children: actionLoading === apt.id ? "处理中..." : "签退离园"
            }
          )
        ] })
      ] }, apt.id))
    ] })
  ] });
}

const $$Gate = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u95E8\u5C97\u6838\u9A8C - \u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", "currentPage": "/gate" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-6"> <h2 class="text-2xl font-bold text-gray-900">门岗核验</h2> <p class="mt-1 text-sm text-gray-500">核验访客身份与预约信息，办理入园区登记</p> </div> ${renderComponent($$result2, "GateVerify", GateVerify, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/GateVerify.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/gate.astro", void 0);

const $$file = "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/gate.astro";
const $$url = "/gate";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Gate,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
