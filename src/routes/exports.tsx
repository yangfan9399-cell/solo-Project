import { Component, createSignal, createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { useDatabase, getExportSummaries, createExportSummary } from "~/lib/database";
import { exportToExcel, type ExportFilter } from "~/lib/exporter";
import { FilterBar, Modal, StatusBadge } from "~/components/common";
import type { EntityType } from "~/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const typeOptions: { label: string; value: EntityType }[] = [
  { label: "通道", value: "channel" },
  { label: "出入口", value: "entrance" },
  { label: "指示牌", value: "sign" },
  { label: "设备点位", value: "equipment" },
  { label: "导览地图", value: "map" },
  { label: "巡检任务", value: "inspection" }
];

const statusOptions = [
  { label: "正常", value: "normal" },
  { label: "警告", value: "warning" },
  { label: "故障", value: "fault" },
  { label: "维护中", value: "maintenance" },
  { label: "离线", value: "offline" }
];

const Exports: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useDatabase();
  const summaries = createMemo(() => getExportSummaries());

  const [showExportModal, setShowExportModal] = createSignal(searchParams.action === "export");
  const [exportTypes, setExportTypes] = createSignal<EntityType[]>([]);
  const [exportStatuses, setExportStatuses] = createSignal<string[]>([]);
  const [dateRange, setDateRange] = createSignal({ start: "", end: "" });
  const [exportSearch, setExportSearch] = createSignal("");
  const [showSummary, setShowSummary] = createSignal<any>(null);

  if (searchParams.action === "export") {
    setSearchParams({ ...searchParams, action: undefined }, { replace: true });
  }

  const toggleType = (type: EntityType) => {
    const current = exportTypes();
    if (current.includes(type)) {
      setExportTypes(current.filter(t => t !== type));
    } else {
      setExportTypes([...current, type]);
    }
  };

  const toggleStatus = (status: string) => {
    const current = exportStatuses();
    if (current.includes(status)) {
      setExportStatuses(current.filter(s => s !== status));
    } else {
      setExportStatuses([...current, status]);
    }
  };

  const handleExport = () => {
    const filters: ExportFilter = {
      entityTypes: exportTypes().length > 0 ? exportTypes() : undefined,
      statuses: exportStatuses().length > 0 ? exportStatuses() : undefined,
      search: exportSearch() || undefined,
      dateRange: dateRange().start && dateRange().end ? dateRange() : undefined
    };

    const result = exportToExcel(state(), filters);

    const summary = createExportSummary(
      exportTypes().length > 0 ? exportTypes().join(",") : "all",
      filters as Record<string, unknown>,
      result.totalRecords,
      result.fileName,
      "计算中..."
    );

    setShowSummary(summary);
  };

  return (
    <div class="space-y-6">
      <FilterBar
        searchValue=""
        onSearch={() => {}}
        filters={[]}
        actions={
          <button onClick={() => setShowExportModal(true)} class="btn btn-primary">
            <span>📤</span> 导出数据
          </button>
        }
      />

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="card p-5">
          <div class="text-3xl font-bold text-primary-600">{summaries().length}</div>
          <div class="text-sm text-gray-500 mt-1">累计导出次数</div>
        </div>
        <div class="card p-5">
          <div class="text-3xl font-bold text-green-600">
            {summaries().reduce((sum: number, s: any) => sum + s.recordCount, 0)}
          </div>
          <div class="text-sm text-gray-500 mt-1">累计导出记录</div>
        </div>
        <div class="card p-5">
          <div class="text-3xl font-bold text-purple-600">
            {summaries().length > 0 ? format(new Date(summaries()[0].exportedAt), "MM-dd HH:mm", { locale: zhCN }) : "-"}
          </div>
          <div class="text-sm text-gray-500 mt-1">最近导出时间</div>
        </div>
        <div class="card p-5">
          <div class="text-3xl font-bold text-orange-600">
            {summaries().reduce((sum: number, s: any) => sum + s.summary.anomalies, 0)}
          </div>
          <div class="text-sm text-gray-500 mt-1">异常记录累计</div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">导出历史记录</h3>
        </div>
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="table-header">文件名</th>
              <th class="table-header">导出类型</th>
              <th class="table-header">记录数</th>
              <th class="table-header">异常数</th>
              <th class="table-header">维护逾期</th>
              <th class="table-header">导出人</th>
              <th class="table-header">导出时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {summaries().map((s: any) => (
              <tr class="hover:bg-gray-50">
                <td class="table-cell font-medium text-gray-900">{s.fileName}</td>
                <td class="table-cell">
                  <span class="badge bg-blue-100 text-blue-700">
                    {s.exportType === "full_export" ? "完整导出" : s.exportType}
                  </span>
                </td>
                <td class="table-cell text-sm text-gray-900">{s.recordCount} 条</td>
                <td class="table-cell">
                  {s.summary.anomalies > 0 ? (
                    <span class="text-danger-600 font-medium">{s.summary.anomalies}</span>
                  ) : (
                    <span class="text-gray-500">0</span>
                  )}
                </td>
                <td class="table-cell">
                  {s.summary.maintenanceDue > 0 ? (
                    <span class="text-warning-600 font-medium">{s.summary.maintenanceDue}</span>
                  ) : (
                    <span class="text-gray-500">0</span>
                  )}
                </td>
                <td class="table-cell text-sm text-gray-600">{s.exportedBy}</td>
                <td class="table-cell text-sm text-gray-500">
                  {format(new Date(s.exportedAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        show={showExportModal()}
        onClose={() => setShowExportModal(false)}
        title="导出数据"
        width="max-w-3xl"
      >
        <div class="space-y-6">
          <div>
            <label class="label">选择实体类型（不选则导出全部）</label>
            <div class="flex flex-wrap gap-2">
              {typeOptions.map(opt => (
                <button
                  type="button"
                  onClick={() => toggleType(opt.value)}
                  class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    exportTypes().includes(opt.value)
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label class="label">选择状态（不选则导出全部）</label>
            <div class="flex flex-wrap gap-2">
              {statusOptions.map(opt => (
                <button
                  type="button"
                  onClick={() => toggleStatus(opt.value)}
                  class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    exportStatuses().includes(opt.value)
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">开始日期</label>
              <input
                type="date"
                class="input"
                value={dateRange().start}
                onInput={(e) => setDateRange({ ...dateRange(), start: e.target.value })}
              />
            </div>
            <div>
              <label class="label">结束日期</label>
              <input
                type="date"
                class="input"
                value={dateRange().end}
                onInput={(e) => setDateRange({ ...dateRange(), end: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label class="label">关键词搜索</label>
            <input
              type="text"
              class="input"
              placeholder="搜索名称、编码..."
              value={exportSearch()}
              onInput={(e) => setExportSearch(e.target.value)}
            />
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-2">当前筛选条件</h4>
            <div class="text-sm text-gray-600 space-y-1">
              <div>实体类型: {exportTypes().length > 0 ? exportTypes().map(t => typeOptions.find(o => o.value === t)?.label).join(", ") : "全部"}</div>
              <div>状态: {exportStatuses().length > 0 ? exportStatuses().map(s => statusOptions.find(o => o.value === s)?.label).join(", ") : "全部"}</div>
              <div>日期范围: {dateRange().start && dateRange().end ? `${dateRange().start} 至 ${dateRange().end}` : "不限"}</div>
              <div>关键词: {exportSearch() || "无"}</div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowExportModal(false)} class="btn btn-secondary">
              取消
            </button>
            <button type="button" onClick={handleExport} class="btn btn-primary">
              📤 导出 Excel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        show={!!showSummary()}
        onClose={() => setShowSummary(null)}
        title="导出摘要"
        width="max-w-2xl"
      >
        {showSummary() && (
          <div class="space-y-6">
            <div class="text-center p-6 bg-success-50 rounded-lg">
              <div class="text-5xl mb-3">✅</div>
              <h3 class="text-xl font-semibold text-gray-900">导出成功！</h3>
              <p class="text-gray-600 mt-1">{showSummary().fileName}</p>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">{showSummary().recordCount}</div>
                <div class="text-sm text-gray-600">导出记录</div>
              </div>
              <div class="text-center p-4 bg-red-50 rounded-lg">
                <div class="text-2xl font-bold text-red-600">{showSummary().summary.anomalies}</div>
                <div class="text-sm text-gray-600">异常待处理</div>
              </div>
              <div class="text-center p-4 bg-yellow-50 rounded-lg">
                <div class="text-2xl font-bold text-yellow-600">{showSummary().summary.maintenanceDue}</div>
                <div class="text-sm text-gray-600">维护逾期</div>
              </div>
            </div>

            <div>
              <h4 class="font-medium text-gray-900 mb-3">按类型统计</h4>
              <div class="grid grid-cols-3 gap-2">
                {Object.entries(showSummary().summary.byType).map(([type, count]) => (
                  <div class="flex justify-between p-2 bg-gray-50 rounded text-sm">
                    <span class="text-gray-600">
                      {typeOptions.find(o => o.value === type)?.label || type}
                    </span>
                    <span class="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 class="font-medium text-gray-900 mb-3">按状态统计</h4>
              <div class="grid grid-cols-3 gap-2">
                {Object.entries(showSummary().summary.byStatus).map(([status, count]) => (
                  <div class="flex justify-between p-2 bg-gray-50 rounded text-sm">
                    <span class="text-gray-600">{status}</span>
                    <span class="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class="flex justify-end">
              <button onClick={() => setShowSummary(null)} class="btn btn-primary">
                完成
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Exports;
