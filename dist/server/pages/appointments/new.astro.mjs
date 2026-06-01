/* empty css                                   */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_DWnod6f9.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_EcGP2ujl.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../../renderers.mjs';

const idTypeOptions = [
  { value: "身份证", label: "身份证" },
  { value: "护照", label: "护照" },
  { value: "驾照", label: "驾照" },
  { value: "其他", label: "其他" }
];
const initialForm = {
  visitor_name: "",
  visitor_phone: "",
  visitor_id_type: "身份证",
  visitor_id_number: "",
  visitor_company: "",
  visitee_id: "",
  purpose: "",
  expected_arrival: "",
  expected_leave: "",
  notes: ""
};
function AppointmentForm({ onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blacklistError, setBlacklistError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    fetch("/api/users?role=employee").then((res) => res.json()).then(setEmployees).catch(() => {
    });
  }, []);
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setBlacklistError("");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBlacklistError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          visitee_id: Number(form.visitee_id) || void 0,
          visitor_company: form.visitor_company || void 0,
          notes: form.notes || void 0
        })
      });
      if (res.status === 403) {
        const data = await res.json();
        setBlacklistError(data.error || "该访客已被加入黑名单");
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "提交失败");
        return;
      }
      setSuccess(true);
      setForm(initialForm);
      onSuccess?.();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 bg-white rounded-lg border border-gray-200 p-6", children: [
    success && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200", children: "预约提交成功！" }),
    blacklistError && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200", children: [
      "🚫 ",
      blacklistError
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "访客姓名 *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "visitor_name",
            value: form.visitor_name,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "访客手机号 *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "tel",
            name: "visitor_phone",
            value: form.visitor_phone,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "证件类型 *" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            name: "visitor_id_type",
            value: form.visitor_id_type,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
            children: idTypeOptions.map((opt) => /* @__PURE__ */ jsx("option", { value: opt.value, children: opt.label }, opt.value))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "证件号码 *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "visitor_id_number",
            value: form.visitor_id_number,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "访客公司" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "visitor_company",
            value: form.visitor_company,
            onChange: handleChange,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "被访人 *" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            name: "visitee_id",
            value: form.visitee_id,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "请选择被访人" }),
              employees.map((emp) => /* @__PURE__ */ jsxs("option", { value: emp.id, children: [
                emp.name,
                emp.department ? ` - ${emp.department}` : ""
              ] }, emp.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "来访事由 *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            name: "purpose",
            value: form.purpose,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "预计到达时间 *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "datetime-local",
            name: "expected_arrival",
            value: form.expected_arrival,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "预计离开时间 *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "datetime-local",
            name: "expected_leave",
            value: form.expected_leave,
            onChange: handleChange,
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "备注" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            name: "notes",
            value: form.notes,
            onChange: handleChange,
            rows: 3,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium",
        children: loading ? "提交中..." : "提交预约"
      }
    ) })
  ] });
}

const $$New = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u65B0\u5EFA\u9884\u7EA6 - \u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", "currentPage": "/appointments" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-6"> <div class="flex items-center gap-2 text-sm text-gray-500 mb-2"> <a href="/appointments" class="hover:text-primary-600 transition-colors">访客预约</a> <span>/</span> <span class="text-gray-900">新建预约</span> </div> <h2 class="text-2xl font-bold text-gray-900">新建预约</h2> <p class="mt-1 text-sm text-gray-500">填写访客预约信息并提交审批</p> </div> ${renderComponent($$result2, "AppointmentForm", AppointmentForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/AppointmentForm.tsx", "client:component-export": "default" })} ` })}`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/new.astro", void 0);

const $$file = "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/appointments/new.astro";
const $$url = "/appointments/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
