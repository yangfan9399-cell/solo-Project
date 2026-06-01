/* empty css                                   */
import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../../chunks/astro/server_D2NMvV5T.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DpfIgqQ0.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { L as LoadingSpinner } from '../../chunks/LoadingSpinner_BsJ3zWzQ.mjs';
import { E as ErrorState } from '../../chunks/ErrorState_B_cSgjGT.mjs';
import { S as StatusBadge } from '../../chunks/StatusBadge_Dh84ksTW.mjs';
export { renderers } from '../../renderers.mjs';

const statusTimeline = [
  { key: "pending", label: "提交预约" },
  { key: "approved", label: "审批通过" },
  { key: "checked_in", label: "签到入园" },
  { key: "checked_out", label: "签退离园" }
];
const statusOrder = {
  pending: 0,
  approved: 1,
  rejected: 1,
  checked_in: 2,
  checked_out: 3,
  timeout: 2,
  cancelled: -1
};
function AppointmentDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${id}`);
      if (!res.ok) throw new Error("获取预约详情失败");
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
  }, [id]);
  const handleApprove = async (action) => {
    if (action === "reject" && !rejectReason.trim()) {
      setShowRejectInput(true);
      return;
    }
    setActionLoading(true);
    try {
      const body = { appointment_id: id, action };
      if (action === "reject") body.rejected_reason = rejectReason;
      const res = await fetch("/api/appointments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "操作失败");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(false);
      setShowRejectInput(false);
      setRejectReason("");
    }
  };
  const handleCheckin = async (action) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: id, action })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "操作失败");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx(LoadingSpinner, { text: "加载预约详情..." });
  if (error && !data) return /* @__PURE__ */ jsx(ErrorState, { message: error, onRetry: fetchData });
  if (!data) return /* @__PURE__ */ jsx(ErrorState, { message: "预约不存在" });
  const currentOrder = statusOrder[data.status] ?? -1;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    error && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold text-gray-800", children: [
            "预约单 #",
            data.id
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [
            "创建于 ",
            new Date(data.created_at).toLocaleString("zh-CN")
          ] })
        ] }),
        /* @__PURE__ */ jsx(StatusBadge, { status: data.status })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsx(InfoItem, { label: "访客姓名", value: data.visitor_name }),
        /* @__PURE__ */ jsx(InfoItem, { label: "访客手机号", value: data.visitor_phone }),
        /* @__PURE__ */ jsx(InfoItem, { label: "证件类型", value: data.visitor_id_type }),
        /* @__PURE__ */ jsx(InfoItem, { label: "证件号码", value: data.visitor_id_number }),
        /* @__PURE__ */ jsx(InfoItem, { label: "访客公司", value: data.visitor_company || "-" }),
        /* @__PURE__ */ jsx(InfoItem, { label: "来访事由", value: data.purpose }),
        /* @__PURE__ */ jsx(InfoItem, { label: "被访人", value: `${data.visitee_name || "-"}${data.visitee_department ? ` (${data.visitee_department})` : ""}` }),
        /* @__PURE__ */ jsx(InfoItem, { label: "预计到达", value: new Date(data.expected_arrival).toLocaleString("zh-CN") }),
        /* @__PURE__ */ jsx(InfoItem, { label: "预计离开", value: new Date(data.expected_leave).toLocaleString("zh-CN") }),
        /* @__PURE__ */ jsx(InfoItem, { label: "备注", value: data.notes || "-" }),
        data.approved_at && /* @__PURE__ */ jsx(InfoItem, { label: "审批时间", value: new Date(data.approved_at).toLocaleString("zh-CN") }),
        data.rejected_reason && /* @__PURE__ */ jsx(InfoItem, { label: "驳回原因", value: data.rejected_reason }),
        data.check_in_time && /* @__PURE__ */ jsx(InfoItem, { label: "签到时间", value: new Date(data.check_in_time).toLocaleString("zh-CN") }),
        data.check_out_time && /* @__PURE__ */ jsx(InfoItem, { label: "签退时间", value: new Date(data.check_out_time).toLocaleString("zh-CN") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "状态流程" }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center", children: statusTimeline.map((step, idx) => {
        const stepOrder = statusOrder[step.key] ?? 0;
        const isCompleted = currentOrder >= stepOrder && currentOrder >= 0;
        const isCurrent = data.status === step.key;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isCurrent ? "bg-blue-500 text-white ring-4 ring-blue-100" : isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`,
                children: isCompleted && !isCurrent ? "✓" : idx + 1
              }
            ),
            /* @__PURE__ */ jsx("span", { className: `mt-2 text-xs ${isCurrent ? "text-blue-600 font-medium" : isCompleted ? "text-green-600" : "text-gray-400"}`, children: step.label })
          ] }),
          idx < statusTimeline.length - 1 && /* @__PURE__ */ jsx("div", { className: `flex-1 h-0.5 mx-2 ${isCompleted && currentOrder > stepOrder ? "bg-green-400" : "bg-gray-200"}` })
        ] }, step.key);
      }) })
    ] }),
    (data.status === "pending" || data.status === "approved" || data.status === "checked_in" || data.status === "timeout") && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "操作" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
        data.status === "pending" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleApprove("approve"),
              disabled: actionLoading,
              className: "px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium",
              children: actionLoading ? "处理中..." : "审批通过"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowRejectInput(true),
              disabled: actionLoading,
              className: "px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-medium",
              children: "驳回"
            }
          )
        ] }),
        data.status === "approved" && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleCheckin("check_in"),
            disabled: actionLoading,
            className: "px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium",
            children: actionLoading ? "处理中..." : "签到入园"
          }
        ),
        (data.status === "checked_in" || data.status === "timeout") && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleCheckin("check_out"),
            disabled: actionLoading,
            className: "px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium",
            children: actionLoading ? "处理中..." : "签退离园"
          }
        )
      ] }),
      showRejectInput && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-red-50 rounded-lg border border-red-200", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-red-700 mb-2", children: "驳回原因" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: rejectReason,
            onChange: (e) => setRejectReason(e.target.value),
            rows: 3,
            placeholder: "请输入驳回原因...",
            className: "w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleApprove("reject"),
              disabled: actionLoading || !rejectReason.trim(),
              className: "px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors",
              children: "确认驳回"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowRejectInput(false);
                setRejectReason("");
              },
              className: "px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors",
              children: "取消"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function InfoItem({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("dt", { className: "text-xs font-medium text-gray-500", children: label }),
    /* @__PURE__ */ jsx("dd", { className: "mt-0.5 text-sm text-gray-800", children: value })
  ] });
}

const $$Astro = createAstro();
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u9884\u7EA6\u8BE6\u60C5 - \u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", "currentPage": "/appointments" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-6"> <div class="flex items-center gap-2 text-sm text-gray-500 mb-2"> <a href="/appointments" class="hover:text-primary-600 transition-colors">访客预约</a> <span>/</span> <span class="text-gray-900">预约详情</span> </div> <h2 class="text-2xl font-bold text-gray-900">预约详情</h2> <p class="mt-1 text-sm text-gray-500">查看预约详细信息与审批状态</p> </div> ${renderComponent($$result2, "AppointmentDetail", AppointmentDetail, { "client:load": true, "id": Number(id), "client:component-hydration": "load", "client:component-path": "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/AppointmentDetail.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/[id].astro", void 0);

const $$file = "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/[id].astro";
const $$url = "/appointments/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
