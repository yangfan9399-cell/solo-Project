import { Component } from "solid-js";
import type { EntityStatus, InspectionStatus } from "~/types";

const statusLabels: Record<string, string> = {
  normal: "正常",
  warning: "警告",
  fault: "故障",
  maintenance: "维护中",
  offline: "离线",
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  failed: "未通过"
};

export const StatusBadge: Component<{ status: EntityStatus | InspectionStatus | string }> = (props) => {
  return (
    <span class={`badge status-${props.status}`}>
      {statusLabels[props.status] || props.status}
    </span>
  );
};

export const SeverityBadge: Component<{ severity: "low" | "medium" | "high" | "critical" }> = (props) => {
  const labels = { low: "低", medium: "中", high: "高", critical: "严重" };
  return (
    <span class={`badge severity-${props.severity}`}>
      {labels[props.severity]}
    </span>
  );
};

export const EntityTypeBadge: Component<{ type: string }> = (props) => {
  const typeLabels: Record<string, string> = {
    channel: "通道",
    entrance: "出入口",
    sign: "指示牌",
    equipment: "设备",
    map: "地图",
    inspection: "巡检"
  };
  const colors: Record<string, string> = {
    channel: "bg-blue-100 text-blue-700",
    entrance: "bg-green-100 text-green-700",
    sign: "bg-yellow-100 text-yellow-700",
    equipment: "bg-purple-100 text-purple-700",
    map: "bg-indigo-100 text-indigo-700",
    inspection: "bg-pink-100 text-pink-700"
  };
  return (
    <span class={`badge ${colors[props.type] || "bg-gray-100 text-gray-700"}`}>
      {typeLabels[props.type] || props.type}
    </span>
  );
};

export const StatCard: Component<{
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}> = (props) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600"
  };
  return (
    <div class="card p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">{props.title}</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{props.value}</p>
          {props.trend && (
            <p class={`text-xs mt-2 flex items-center gap-1 ${props.trend.value >= 0 ? "text-green-600" : "text-red-600"}`}>
              <span>{props.trend.value >= 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(props.trend.value)}% {props.trend.label}</span>
            </p>
          )}
        </div>
        <div class={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[props.color || "blue"]} text-white flex items-center justify-center text-2xl`}>
          {props.icon}
        </div>
      </div>
    </div>
  );
};

export const DataTable: Component<{
  columns: { key: string; label: string; width?: string; render?: (row: any) => any }[];
  data: any[];
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}> = (props) => {
  return (
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            {props.columns.map(col => (
              <th class="table-header" style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {props.data.length === 0 ? (
            <tr>
              <td colspan={props.columns.length} class="px-4 py-12 text-center text-gray-500">
                {props.emptyMessage || "暂无数据"}
              </td>
            </tr>
          ) : (
            props.data.map((row, idx) => (
              <tr
                onClick={() => props.onRowClick?.(row)}
                class={`hover:bg-gray-50 transition-colors ${props.onRowClick ? "cursor-pointer" : ""}`}
              >
                {props.columns.map(col => (
                  <td class="table-cell">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const FilterBar: Component<{
  searchValue: string;
  onSearch: (v: string) => void;
  filters?: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }[];
  actions?: any;
}> = (props) => {
  return (
    <div class="bg-white p-4 rounded-xl border border-gray-200 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-64">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={props.searchValue}
              onInput={(e) => props.onSearch(e.target.value)}
              placeholder="搜索名称、编码、备注..."
              class="input pl-10"
            />
          </div>
        </div>
        {props.filters?.map(f => (
          <div class="min-w-40">
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              class="input"
            >
              <option value="">{f.label}</option>
              {f.options.map(opt => (
                <option value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
        {props.actions}
      </div>
    </div>
  );
};

export const Modal: Component<{
  show: boolean;
  onClose: () => void;
  title: string;
  children: any;
  width?: string;
}> = (props) => {
  if (!props.show) return null;
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" onClick={props.onClose}></div>
      <div class={`relative bg-white rounded-xl shadow-2xl ${props.width || "max-w-2xl"} w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">{props.title}</h3>
          <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          {props.children}
        </div>
      </div>
    </div>
  );
};
