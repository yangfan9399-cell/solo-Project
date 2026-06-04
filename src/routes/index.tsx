import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SOURCE_LABELS,
  ISSUE_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from "~/lib/types";
import { formatDateShort, getDaysRemaining, isOverdue } from "~/lib/utils";
import type { InspectionStatus } from "@prisma/client";

export const useInspectionsList = routeLoader$(async (requestEvent) => {
  const cookie = userCookie.get(requestEvent);
  const currentUser = await getCurrentUser(cookie);

  const status = requestEvent.query.get("status") as InspectionStatus | null;
  const role = currentUser?.role;

  let whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (role === "INSPECTOR") {
    whereClause.OR = [
      { createdById: currentUser?.id },
      { assignedToId: currentUser?.id },
    ];
  }

  const inspections = await prisma.inspection.findMany({
    where: whereClause,
    include: {
      building: {
        select: { id: true, name: true, code: true, responsible: true },
      },
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      lastChange: {
        include: {
          operator: { select: { id: true, name: true, role: true } },
        },
      },
      evidences: {
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [
      { isOverdue: "desc" },
      { createdAt: "desc" },
    ],
  });

  const stats = await prisma.inspection.groupBy({
    by: ["status"],
    where: role === "INSPECTOR" ? {
      OR: [
        { createdById: currentUser?.id },
        { assignedToId: currentUser?.id },
      ],
    } : {},
    _count: { status: true },
  });

  const allStats = await prisma.inspection.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  return {
    inspections,
    stats: stats.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {} as Record<string, number>),
    allStats: allStats.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {} as Record<string, number>),
    currentUser,
    activeStatus: status,
  };
});

export default component$(() => {
  const data = useInspectionsList();
  const activeFilter = useSignal<string>(data.value.activeStatus || "all");

  const handleFilterChange = $((status: string) => {
    activeFilter.value = status;
    const url = new URL(window.location.href);
    if (status === "all") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", status);
    }
    window.location.href = url.toString();
  });

  const statusFilters = [
    { key: "all", label: "全部", color: "bg-gray-100 text-gray-800" },
    { key: "PENDING_RECTIFICATION", label: "待整改", color: "bg-yellow-100 text-yellow-800" },
    { key: "PENDING_REVIEW", label: "待复核", color: "bg-orange-100 text-orange-800" },
    { key: "RETURNED", label: "已退回", color: "bg-red-100 text-red-800" },
    { key: "CLOSED", label: "已销项", color: "bg-emerald-100 text-emerald-800" },
  ];

  return (
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            {data.value.currentUser?.role === "INSPECTOR" ? "我的巡查任务" : "巡查记录管理"}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            当前用户：{data.value.currentUser?.name} · 
            角色：{data.value.currentUser?.role === "INSPECTOR" ? "巡查员" : data.value.currentUser?.role === "REVIEWER" ? "复核员" : "管理员"}
          </p>
        </div>
        <div class="mt-4 md:mt-0">
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <span class="flex items-center">
              <span class="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
              系统演示模式：4类预置样本数据
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">四类业务样本演示</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="border-2 border-emerald-200 bg-emerald-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                样本1
              </span>
              <span class="text-sm text-emerald-600">✓ 已完成</span>
            </div>
            <h4 class="font-medium text-gray-900">合格销项</h4>
            <p class="text-sm text-gray-600 mt-1">INSP-2025-0001</p>
            <p class="text-xs text-gray-500 mt-1">证据完整、楼栋匹配、正常销项</p>
          </div>

          <div class="border-2 border-amber-200 bg-amber-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                样本2
              </span>
              <span class="text-sm text-amber-600">⚠ 待处理</span>
            </div>
            <h4 class="font-medium text-gray-900">照片缺失</h4>
            <p class="text-sm text-gray-600 mt-1">INSP-2025-0002</p>
            <p class="text-xs text-gray-500 mt-1">缺少整改后照片和过程照片</p>
          </div>

          <div class="border-2 border-rose-200 bg-rose-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                样本3
              </span>
              <span class="text-sm text-rose-600">✗ 已退回</span>
            </div>
            <h4 class="font-medium text-gray-900">楼栋不匹配</h4>
            <p class="text-sm text-gray-600 mt-1">INSP-2025-0003</p>
            <p class="text-xs text-gray-500 mt-1">整改地点与问题发生楼栋不一致</p>
          </div>

          <div class="border-2 border-red-200 bg-red-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                样本4
              </span>
              <span class="text-sm text-red-600">!! 超期</span>
            </div>
            <h4 class="font-medium text-gray-900">整改超期</h4>
            <p class="text-sm text-gray-600 mt-1">INSP-2025-0004</p>
            <p class="text-xs text-gray-500 mt-1">整改已超期48小时未处理</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusFilters.map((filter) => {
          const count = filter.key === "all"
            ? Object.values(data.value.stats).reduce((a: number, b: number) => a + b, 0)
            : (data.value.stats[filter.key] || 0);
          return (
            <button
              key={filter.key}
              onClick$={() => handleFilterChange(filter.key)}
              class={`p-4 rounded-xl border-2 transition-all ${
                activeFilter.value === filter.key
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div class={`text-2xl font-bold ${
                filter.key === "all" ? "text-gray-900" : ""
              }`}>
                {count}
              </div>
              <div class="text-sm text-gray-600 mt-1">{filter.label}</div>
            </button>
          );
        })}
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {activeFilter.value === "all" ? "全部巡查记录" : STATUS_LABELS[activeFilter.value as InspectionStatus] || "巡查记录"}
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  巡查编号
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  来源
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  问题描述
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  楼栋
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  责任人
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  严重程度
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  截止日期
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {data.value.inspections.length === 0 ? (
                <tr>
                  <td colSpan={9} class="px-6 py-12 text-center text-gray-500">
                    <div class="text-4xl mb-2">📋</div>
                    <p>暂无巡查记录</p>
                  </td>
                </tr>
              ) : (
                data.value.inspections.map((inspection) => {
                  const overdue = isOverdue(inspection.deadline);
                  const daysRemaining = getDaysRemaining(inspection.deadline);

                  return (
                    <tr
                      key={inspection.id}
                      class={`hover:bg-gray-50 transition-colors ${
                        inspection.isOverdue ? "bg-red-50" : ""
                      }`}
                    >
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                          {inspection.inspectionNo}
                        </div>
                        <div class="text-xs text-gray-500">
                          {formatDateShort(inspection.createdAt)}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {SOURCE_LABELS[inspection.source]}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">
                          {ISSUE_TYPE_LABELS[inspection.issueType]}
                        </div>
                        <div class="text-xs text-gray-500 truncate max-w-xs">
                          {inspection.description}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {inspection.building.name}
                        </div>
                        <div class="text-xs text-gray-500">
                          {inspection.building.code}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {inspection.assignedTo?.name || "-"}
                        </div>
                        {inspection.building.responsible && (
                          <div class="text-xs text-gray-500">
                            物业：{inspection.building.responsible}
                          </div>
                        )}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[inspection.severity]}`}>
                          {SEVERITY_LABELS[inspection.severity]}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inspection.status]}`}>
                          {STATUS_LABELS[inspection.status]}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class={`text-sm ${overdue ? "text-red-600 font-medium" : "text-gray-900"}`}>
                          {formatDateShort(inspection.deadline)}
                        </div>
                        <div class={`text-xs ${overdue ? "text-red-500" : "text-gray-500"}`}>
                          {overdue
                            ? `已超期 ${Math.abs(daysRemaining)} 天`
                            : daysRemaining > 0
                            ? `剩余 ${daysRemaining} 天`
                            : "今天到期"}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/inspections/${inspection.id}`}
                          class="inline-flex items-center px-3 py-1.5 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                        >
                          查看详情
                          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data.value.currentUser?.role === "REVIEWER" && (
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">全局统计（复核员视角）</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-yellow-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-yellow-600">
                {data.value.allStats.PENDING_RECTIFICATION || 0}
              </div>
              <div class="text-sm text-yellow-800 mt-1">待整改</div>
            </div>
            <div class="bg-orange-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-orange-600">
                {data.value.allStats.PENDING_REVIEW || 0}
              </div>
              <div class="text-sm text-orange-800 mt-1">待复核</div>
            </div>
            <div class="bg-red-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-red-600">
                {data.value.allStats.RETURNED || 0}
              </div>
              <div class="text-sm text-red-800 mt-1">已退回</div>
            </div>
            <div class="bg-emerald-50 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-emerald-600">
                {data.value.allStats.CLOSED || 0}
              </div>
              <div class="text-sm text-emerald-800 mt-1">已销项</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
