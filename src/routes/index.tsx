import { Component, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { useDatabase, getAnomalies, resolveAnomaly } from "~/lib/database";
import { StatCard, StatusBadge, SeverityBadge, EntityTypeBadge } from "~/components/common";
import { formatDistance } from "date-fns";
import { zhCN } from "date-fns/locale";

const Dashboard: Component = () => {
  const { state } = useDatabase();
  const anomalies = createMemo(() => getAnomalies());

  const stats = createMemo(() => {
    const s = state();
    const all = [...s.channels, ...s.entrances, ...s.signs, ...s.equipment, ...s.maps, ...s.inspections];
    return {
      total: all.length,
      channels: s.channels.length,
      entrances: s.entrances.length,
      signs: s.signs.length,
      equipment: s.equipment.length,
      maps: s.maps.length,
      inspections: s.inspections.length,
      normal: all.filter(e => e.status === "normal").length,
      warning: all.filter(e => e.status === "warning").length,
      fault: all.filter(e => e.status === "fault").length,
      maintenance: all.filter(e => e.status === "maintenance").length,
      offline: all.filter(e => e.status === "offline").length,
      pendingInspections: s.inspections.filter(i => i.result === "pending").length,
      maintenanceDue: s.equipment.filter(e => new Date(e.nextMaintenanceDate) < new Date()).length
    };
  });

  const recentActivity = createMemo(() => {
    return state().versionHistory
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
      .slice(0, 8);
  });

  const handleResolve = (id: string) => {
    if (confirm("确认标记该异常为已解决？")) {
      resolveAnomaly(id, "管理员");
    }
  };

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="实体总数"
          value={stats().total}
          icon="📋"
          color="blue"
          trend={{ value: 12, label: "较上月" }}
        />
        <StatCard
          title="待处理异常"
          value={anomalies().length}
          icon="⚠️"
          color="red"
          trend={{ value: -5, label: "较上周" }}
        />
        <StatCard
          title="维护逾期"
          value={stats().maintenanceDue}
          icon="🔧"
          color="yellow"
        />
        <StatCard
          title="待巡检任务"
          value={stats().pendingInspections}
          icon="✅"
          color="purple"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> 状态分布
          </h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center p-4 rounded-lg bg-success-50">
              <div class="text-2xl font-bold text-success-600">{stats().normal}</div>
              <div class="text-sm text-gray-600">正常</div>
            </div>
            <div class="text-center p-4 rounded-lg bg-warning-50">
              <div class="text-2xl font-bold text-warning-600">{stats().warning}</div>
              <div class="text-sm text-gray-600">警告</div>
            </div>
            <div class="text-center p-4 rounded-lg bg-danger-50">
              <div class="text-2xl font-bold text-danger-600">{stats().fault + stats().offline}</div>
              <div class="text-sm text-gray-600">故障/离线</div>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <div class="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden flex">
              <div class="bg-success-500" style={{ width: `${(stats().normal / stats().total) * 100}%` }}></div>
              <div class="bg-warning-500" style={{ width: `${(stats().warning / stats().total) * 100}%` }}></div>
              <div class="bg-danger-500" style={{ width: `${((stats().fault + stats().maintenance + stats().offline) / stats().total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏗️</span> 类型分布
          </h3>
          <div class="space-y-3">
            {[
              { label: "通道", value: stats().channels, icon: "↔️", color: "bg-blue-500" },
              { label: "出入口", value: stats().entrances, icon: "🚪", color: "bg-green-500" },
              { label: "指示牌", value: stats().signs, icon: "🪧", color: "bg-yellow-500" },
              { label: "设备点位", value: stats().equipment, icon: "⚙️", color: "bg-purple-500" },
              { label: "导览地图", value: stats().maps, icon: "🗺️", color: "bg-indigo-500" },
              { label: "巡检任务", value: stats().inspections, icon: "✅", color: "bg-pink-500" }
            ].map(item => (
              <div class="flex items-center gap-3">
                <span class="text-xl">{item.icon}</span>
                <span class="w-16 text-sm text-gray-600">{item.label}</span>
                <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div class={`h-full ${item.color}`} style={{ width: `${(item.value / stats().total) * 100}%` }}></div>
                </div>
                <span class="w-8 text-sm font-medium text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 card overflow-hidden">
          <div class="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <span>🚨</span> 异常数据提示
              {anomalies().length > 0 && (
                <span class="badge bg-danger-100 text-danger-600">{anomalies().length} 项待处理</span>
              )}
            </h3>
            <A href="/ledger?filter=anomalies" class="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </A>
          </div>
          <div class="max-h-96 overflow-y-auto">
            {anomalies().length === 0 ? (
              <div class="p-12 text-center text-gray-500">
                <div class="text-4xl mb-3">✅</div>
                <div>当前无异常数据</div>
              </div>
            ) : (
              <table class="w-full">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="table-header">实体名称</th>
                    <th class="table-header">类型</th>
                    <th class="table-header">异常类型</th>
                    <th class="table-header">严重程度</th>
                    <th class="table-header">检测时间</th>
                    <th class="table-header">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  {anomalies().slice(0, 6).map((a: any) => (
                    <tr class="hover:bg-gray-50">
                      <td class="table-cell">
                        <A href={`/detail/${a.entityType}/${a.entityId}`} class="text-primary-600 hover:text-primary-700 font-medium">
                          {a.entityName}
                        </A>
                      </td>
                      <td class="table-cell"><EntityTypeBadge type={a.entityType} /></td>
                      <td class="table-cell">
                        <span class="text-sm text-gray-600">{a.description}</span>
                      </td>
                      <td class="table-cell"><SeverityBadge severity={a.severity} /></td>
                      <td class="table-cell text-sm text-gray-500">
                        {formatDistance(new Date(a.detectedAt), new Date(), { addSuffix: true, locale: zhCN })}
                      </td>
                      <td class="table-cell">
                        <button
                          onClick={() => handleResolve(a.id)}
                          class="text-xs text-success-600 hover:text-success-700 font-medium"
                        >
                          标记解决
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div class="card overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <span>📜</span> 最近变更
            </h3>
          </div>
          <div class="max-h-96 overflow-y-auto">
            <div class="divide-y divide-gray-100">
              {recentActivity().map(activity => (
                <div class="p-4 hover:bg-gray-50">
                  <div class="flex items-start gap-3">
                    <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                      activity.changeType === "create" ? "bg-green-100 text-green-700" :
                      activity.changeType === "update" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {activity.changeType === "create" ? "+" : activity.changeType === "update" ? "~" : "×"}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-gray-900 truncate">{activity.changeSummary}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <EntityTypeBadge type={activity.entityType} />
                        <span class="text-xs text-gray-500">v{activity.version}</span>
                        <span class="text-xs text-gray-400">•</span>
                        <span class="text-xs text-gray-500">{activity.changedBy}</span>
                      </div>
                      <p class="text-xs text-gray-400 mt-1">
                        {formatDistance(new Date(activity.changedAt), new Date(), { addSuffix: true, locale: zhCN })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📋</span> 快捷操作
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "新增通道", icon: "↔️", href: "/ledger?type=channel&action=create", color: "hover:bg-blue-50 hover:border-blue-200" },
            { label: "新增出入口", icon: "🚪", href: "/ledger?type=entrance&action=create", color: "hover:bg-green-50 hover:border-green-200" },
            { label: "新增指示牌", icon: "🪧", href: "/ledger?type=sign&action=create", color: "hover:bg-yellow-50 hover:border-yellow-200" },
            { label: "新增设备", icon: "⚙️", href: "/ledger?type=equipment&action=create", color: "hover:bg-purple-50 hover:border-purple-200" },
            { label: "创建巡检", icon: "✅", href: "/inspections?action=create", color: "hover:bg-pink-50 hover:border-pink-200" },
            { label: "导出数据", icon: "📤", href: "/exports?action=export", color: "hover:bg-indigo-50 hover:border-indigo-200" }
          ].map(item => (
            <A
              href={item.href}
              class={`p-4 border-2 border-dashed border-gray-200 rounded-xl text-center transition-all ${item.color}`}
            >
              <div class="text-3xl mb-2">{item.icon}</div>
              <div class="text-sm font-medium text-gray-700">{item.label}</div>
            </A>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
