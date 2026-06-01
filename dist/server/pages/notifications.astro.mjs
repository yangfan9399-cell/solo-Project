/* empty css                                */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_D2NMvV5T.mjs';
import 'piccolore';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DpfIgqQ0.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { L as LoadingSpinner } from '../chunks/LoadingSpinner_BsJ3zWzQ.mjs';
import { E as EmptyState } from '../chunks/EmptyState_Bwz99_Gu.mjs';
import { E as ErrorState } from '../chunks/ErrorState_B_cSgjGT.mjs';
export { renderers } from '../renderers.mjs';

const typeConfig = {
  approval: { label: "审批通知", icon: "📝", className: "bg-blue-50 border-blue-200" },
  check_in: { label: "签到通知", icon: "✅", className: "bg-green-50 border-green-200" },
  check_out: { label: "签退通知", icon: "🚪", className: "bg-gray-50 border-gray-200" },
  timeout: { label: "超时提醒", icon: "⚠️", className: "bg-orange-50 border-orange-200" }
};
function NotificationCenter({ showUserFilter = true, compact = false }) {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterRead, setFilterRead] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterUser) params.append("user_id", filterUser);
      if (filterRead !== "") params.append("is_read", filterRead);
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) throw new Error("获取通知列表失败");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("获取用户列表失败", err);
    }
  };
  const markAsRead = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("标记已读失败");
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(false);
    }
  };
  const markAllAsRead = async () => {
    if (!filterUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true, user_id: parseInt(filterUser) })
      });
      if (!res.ok) throw new Error("标记全部已读失败");
      setNotifications((prev) => prev.map((n) => n.user_id === parseInt(filterUser) ? { ...n, is_read: 1 } : n));
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(false);
    }
  };
  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [filterUser, filterRead]);
  const unreadCount = notifications.filter((n) => n.is_read === 0).length;
  if (loading) return /* @__PURE__ */ jsx(LoadingSpinner, { text: "加载通知列表..." });
  if (error) return /* @__PURE__ */ jsx(ErrorState, { message: error, onRetry: fetchNotifications });
  return /* @__PURE__ */ jsxs("div", { className: compact ? "" : "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
      showUserFilter && /* @__PURE__ */ jsxs(
        "select",
        {
          value: filterUser,
          onChange: (e) => setFilterUser(e.target.value),
          className: "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "全部用户" }),
            users.map((u) => /* @__PURE__ */ jsxs("option", { value: u.id, children: [
              u.name,
              " (",
              u.role === "admin" ? "管理员" : u.role === "security" ? "安保" : "员工",
              ")"
            ] }, u.id))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: filterRead,
          onChange: (e) => setFilterRead(e.target.value),
          className: "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "全部状态" }),
            /* @__PURE__ */ jsx("option", { value: "0", children: "未读" }),
            /* @__PURE__ */ jsx("option", { value: "1", children: "已读" })
          ]
        }
      ),
      filterUser && unreadCount > 0 && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: markAllAsRead,
          disabled: actionLoading,
          className: "px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors",
          children: actionLoading ? "处理中..." : `全部标记已读 (${unreadCount})`
        }
      )
    ] }),
    notifications.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "暂无通知", description: "目前没有任何通知消息", icon: "🔔" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: notifications.map((n) => {
      const config = typeConfig[n.type] || { label: n.type, icon: "📬", className: "bg-gray-50 border-gray-200" };
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: `p-4 rounded-lg border ${config.className} ${n.is_read === 0 ? "ring-2 ring-blue-300" : "opacity-75"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-lg", children: config.icon }),
                /* @__PURE__ */ jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${n.is_read === 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`, children: config.label }),
                n.is_read === 0 && /* @__PURE__ */ jsx("span", { className: "inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full" })
              ] }),
              /* @__PURE__ */ jsx("h4", { className: "font-medium text-gray-800 mb-1", children: n.title }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: n.message }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-2", children: new Date(n.created_at).toLocaleString("zh-CN") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              n.is_read === 0 && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => markAsRead(n.id),
                  disabled: actionLoading,
                  className: "text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors",
                  children: "标记已读"
                }
              ),
              n.appointment_id && /* @__PURE__ */ jsx(
                "a",
                {
                  href: `/appointments/${n.appointment_id}`,
                  className: "text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors text-center",
                  children: "查看预约"
                }
              )
            ] })
          ] })
        },
        n.id
      );
    }) })
  ] });
}

const $$Notifications = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\u901A\u77E5\u4E2D\u5FC3 - \u56ED\u533A\u8BBF\u5BA2\u9884\u7EA6\u7CFB\u7EDF", "currentPage": "/notifications" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-6"> <h2 class="text-2xl font-bold text-gray-900">通知中心</h2> <p class="mt-1 text-sm text-gray-500">查看和管理所有审批、签到、签退和超时提醒通知</p> </div> <div class="bg-white rounded-lg border border-gray-200 p-5"> ${renderComponent($$result2, "NotificationCenter", NotificationCenter, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/components/NotificationCenter", "client:component-export": "default" })} </div> ` })}`;
}, "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/notifications.astro", void 0);

const $$file = "/Users/yangfan/Desktop/code4/trae-solo-coder-2/src/pages/notifications.astro";
const $$url = "/notifications";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Notifications,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
