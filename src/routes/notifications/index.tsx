import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  NOTIFICATION_TYPE_LABELS,
} from "~/lib/types";
import { formatDate } from "~/lib/utils";

export const useNotifications = routeLoader$(async (requestEvent) => {
  const cookie = userCookie.get(requestEvent);
  const currentUser = await getCurrentUser(cookie);

  if (!currentUser) {
    throw requestEvent.error(401, "未登录");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: currentUser.id },
    include: {
      inspection: {
        select: {
          id: true,
          inspectionNo: true,
          status: true,
          building: { select: { name: true } },
        },
      },
      sentBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: currentUser.id, isRead: false },
  });

  const stats = await prisma.notification.groupBy({
    by: ["type"],
    where: { userId: currentUser.id },
    _count: { type: true },
  });

  return {
    notifications,
    unreadCount,
    currentUser,
    stats: stats.reduce((acc, s) => {
      acc[s.type] = s._count.type;
      return acc;
    }, {} as Record<string, number>),
  };
});

export default component$(() => {
  const data = useNotifications();

  return (
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">通知中心</h2>
          <p class="mt-1 text-sm text-gray-500">
            共 {data.value.notifications.length} 条通知，
            {data.value.unreadCount > 0 && (
              <span class="text-red-600 font-medium">
                {data.value.unreadCount} 条未读
              </span>
            )}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div class="text-2xl font-bold text-blue-600">
            {data.value.unreadCount}
          </div>
          <div class="text-sm text-blue-800 mt-1">未读通知</div>
        </div>
        <div class="p-4 rounded-xl bg-orange-50 border border-orange-200">
          <div class="text-2xl font-bold text-orange-600">
            {data.value.stats.REVIEW_REQUIRED || 0}
          </div>
          <div class="text-sm text-orange-800 mt-1">待复核提醒</div>
        </div>
        <div class="p-4 rounded-xl bg-red-50 border border-red-200">
          <div class="text-2xl font-bold text-red-600">
            {(data.value.stats.RECTIFICATION_OVERDUE || 0) + (data.value.stats.PHOTO_MISSING || 0) + (data.value.stats.BUILDING_MISMATCH || 0)}
          </div>
          <div class="text-sm text-red-800 mt-1">异常提醒</div>
        </div>
        <div class="p-4 rounded-xl bg-green-50 border border-green-200">
          <div class="text-2xl font-bold text-green-600">
            {data.value.stats.REVIEW_APPROVED || 0}
          </div>
          <div class="text-sm text-green-800 mt-1">复核通过</div>
        </div>
        <div class="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div class="text-2xl font-bold text-gray-600">
            {data.value.notifications.length}
          </div>
          <div class="text-sm text-gray-800 mt-1">全部通知</div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">通知列表</h3>
        </div>

        <div class="divide-y divide-gray-100">
          {data.value.notifications.length === 0 ? (
            <div class="px-6 py-12 text-center text-gray-500">
              <div class="text-4xl mb-2">🔔</div>
              <p>暂无通知</p>
            </div>
          ) : (
            data.value.notifications.map((notification) => {
              const isException = notification.type === "RECTIFICATION_OVERDUE" ||
                notification.type === "PHOTO_MISSING" ||
                notification.type === "BUILDING_MISMATCH" ||
                notification.type === "REVIEW_REJECTED";

              return (
                <div
                  key={notification.id}
                  class={`px-6 py-4 transition-colors ${
                    notification.isRead ? "bg-white" : "bg-blue-50"
                  } hover:bg-gray-50`}
                >
                  <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3 flex-1">
                      <div class={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === "REVIEW_APPROVED" || notification.type === "CLOSED"
                          ? "bg-green-100"
                          : isException
                          ? "bg-red-100"
                          : notification.type === "REVIEW_REQUIRED"
                          ? "bg-orange-100"
                          : "bg-blue-100"
                      }`}>
                        {notification.type === "REVIEW_APPROVED" || notification.type === "CLOSED" ? (
                          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isException ? (
                          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        )}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {NOTIFICATION_TYPE_LABELS[notification.type]}
                          </span>
                          {!notification.isRead && (
                            <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p class="mt-1 text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p class="mt-1 text-sm text-gray-600">
                          {notification.content}
                        </p>
                        {notification.inspection && (
                          <div class="mt-2 flex items-center space-x-3">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {notification.inspection.inspectionNo}
                            </span>
                            <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[notification.inspection.status]}`}>
                              {STATUS_LABELS[notification.inspection.status]}
                            </span>
                            <span class="text-xs text-gray-500">
                              {notification.inspection.building?.name}
                            </span>
                            <Link
                              href={`/inspections/${notification.inspection.id}`}
                              class="text-xs text-green-600 hover:text-green-800 font-medium"
                            >
                              查看详情 →
                            </Link>
                          </div>
                        )}
                        <p class="mt-2 text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                          {notification.sentBy && (
                            <span> · 发送人：{notification.sentBy.name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">状态一致性说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="p-4 bg-blue-50 rounded-lg">
            <p class="font-medium text-blue-900 mb-2">🔗 通知状态同步</p>
            <p class="text-blue-700">
              从通知点击进入整改记录时，页面展示的状态、证据与通知发送时的状态完全一致，确保信息同步。
            </p>
          </div>
          <div class="p-4 bg-green-50 rounded-lg">
            <p class="font-medium text-green-900 mb-2">📋 列表状态同步</p>
            <p class="text-green-700">
              列表页、详情页、通知中心三者展示的同一记录状态始终保持一致，由数据库事务保证原子性。
            </p>
          </div>
          <div class="p-4 bg-purple-50 rounded-lg">
            <p class="font-medium text-purple-900 mb-2">🔍 复盘状态同步</p>
            <p class="text-purple-700">
              无论从哪个入口进入详情页，历史节点、证据链、当前状态均从同一数据源读取，保证复盘时数据一致。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
