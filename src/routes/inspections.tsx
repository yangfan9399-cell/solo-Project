import { Component, createSignal, createMemo } from "solid-js";
import { A, useSearchParams } from "@solidjs/router";
import { useDatabase, getEntities, updateEntity, createEntity } from "~/lib/database";
import { StatusBadge, FilterBar, Modal } from "~/components/common";
import EntityForm from "~/components/EntityForm";
import type { InspectionTask, InspectionItem, EntityType } from "~/types";
import { format, formatDistance } from "date-fns";
import { zhCN } from "date-fns/locale";

const inspectionTypeOptions = [
  { label: "例行巡检", value: "routine" },
  { label: "应急检查", value: "emergency" },
  { label: "专项检查", value: "special" },
  { label: "验收检查", value: "acceptance" }
];

const statusOptions = [
  { label: "待处理", value: "pending" },
  { label: "进行中", value: "in_progress" },
  { label: "已完成", value: "completed" },
  { label: "未通过", value: "failed" }
];

const Inspections: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useDatabase();
  const inspections = getEntities<InspectionTask>("inspection");

  const [search, setSearch] = createSignal("");
  const [typeFilter, setTypeFilter] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal("");
  const [showCreateModal, setShowCreateModal] = createSignal(searchParams.action === "create");
  const [selectedInspection, setSelectedInspection] = createSignal<InspectionTask | null>(null);
  const [showCheckModal, setShowCheckModal] = createSignal(false);

  if (searchParams.action === "create") {
    setSearchParams({ ...searchParams, action: undefined }, { replace: true });
  }

  const filtered = createMemo(() => {
    let list = inspections;
    const q = search().toLowerCase();

    if (q) {
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q)
      );
    }

    if (typeFilter()) {
      list = list.filter(i => i.inspectionType === typeFilter());
    }

    if (statusFilter()) {
      list = list.filter(i => i.result === statusFilter());
    }

    return list.sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());
  });

  const stats = createMemo(() => ({
    total: inspections.length,
    pending: inspections.filter(i => i.result === "pending").length,
    inProgress: inspections.filter(i => i.result === "in_progress").length,
    completed: inspections.filter(i => i.result === "completed").length,
    failed: inspections.filter(i => i.result === "failed").length,
    overdue: inspections.filter(i => i.result === "pending" && new Date(i.plannedDate) < new Date()).length
  }));

  const handleCreate = (data: any) => {
    createEntity("inspection", data);
    setShowCreateModal(false);
  };

  const handleStartInspection = (inspection: InspectionTask) => {
    updateEntity("inspection", inspection.id, { result: "in_progress", actualDate: new Date().toISOString() });
    setSelectedInspection(inspection);
    setShowCheckModal(true);
  };

  const handleUpdateItem = (itemId: string, result: "pass" | "fail" | "pending", remarks: string) => {
    if (!selectedInspection()) return;

    const updatedItems = selectedInspection()!.items.map(item =>
      item.id === itemId ? { ...item, result, remarks } : item
    );

    const anomalies = updatedItems.filter(i => i.result === "fail").map(i => i.id);
    const allDone = updatedItems.every(i => i.result !== "pending");
    const hasFailures = anomalies.length > 0;

    const updated: Partial<InspectionTask> = {
      items: updatedItems,
      anomalies
    };

    if (allDone) {
      updated.result = hasFailures ? "failed" : "completed";
    }

    updateEntity("inspection", selectedInspection()!.id, updated);
    setSelectedInspection(prev => prev ? { ...prev, ...updated, items: updatedItems, anomalies } as InspectionTask : null);
  };

  const handleCompleteInspection = () => {
    if (!selectedInspection()) return;
    const items = selectedInspection()!.items;
    const anomalies = items.filter(i => i.result === "fail").map(i => i.id);
    const hasFailures = anomalies.length > 0;

    updateEntity("inspection", selectedInspection()!.id, {
      result: hasFailures ? "failed" : "completed",
      anomalies,
      actualDate: new Date().toISOString()
    });

    setShowCheckModal(false);
    setSelectedInspection(null);
  };

  const getInspectionTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      routine: "例行巡检",
      emergency: "应急检查",
      special: "专项检查",
      acceptance: "验收检查"
    };
    return labels[t] || t;
  };

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="card p-4">
          <div class="text-3xl font-bold text-gray-900">{stats().total}</div>
          <div class="text-sm text-gray-500 mt-1">总任务</div>
        </div>
        <div class="card p-4">
          <div class="text-3xl font-bold text-yellow-600">{stats().pending}</div>
          <div class="text-sm text-gray-500 mt-1">待处理</div>
        </div>
        <div class="card p-4">
          <div class="text-3xl font-bold text-blue-600">{stats().inProgress}</div>
          <div class="text-sm text-gray-500 mt-1">进行中</div>
        </div>
        <div class="card p-4">
          <div class="text-3xl font-bold text-green-600">{stats().completed}</div>
          <div class="text-sm text-gray-500 mt-1">已完成</div>
        </div>
        <div class="card p-4">
          <div class="text-3xl font-bold text-red-600">{stats().failed}</div>
          <div class="text-sm text-gray-500 mt-1">未通过</div>
        </div>
      </div>

      {stats().overdue > 0 && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚠️</span>
            <div>
              <div class="font-medium text-red-800">有 {stats().overdue} 项巡检任务已逾期</div>
              <div class="text-sm text-red-600">请及时安排处理</div>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter("pending")}
            class="btn btn-danger text-sm"
          >
            查看逾期任务
          </button>
        </div>
      )}

      <FilterBar
        searchValue={search()}
        onSearch={setSearch}
        filters={[
          { label: "全部类型", value: typeFilter(), options: inspectionTypeOptions, onChange: setTypeFilter },
          { label: "全部状态", value: statusFilter(), options: statusOptions, onChange: setStatusFilter }
        ]}
        actions={
          <button onClick={() => setShowCreateModal(true)} class="btn btn-primary">
            <span>+</span> 新建巡检任务
          </button>
        }
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered().map(inspection => {
          const isOverdue = inspection.result === "pending" && new Date(inspection.plannedDate) < new Date();
          const passCount = inspection.items.filter(i => i.result === "pass").length;
          const failCount = inspection.items.filter(i => i.result === "fail").length;
          const pendingCount = inspection.items.filter(i => i.result === "pending").length;

          return (
            <div class="card overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class={`badge ${
                      inspection.inspectionType === "routine" ? "bg-blue-100 text-blue-700" :
                      inspection.inspectionType === "emergency" ? "bg-red-100 text-red-700" :
                      inspection.inspectionType === "special" ? "bg-purple-100 text-purple-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {getInspectionTypeLabel(inspection.inspectionType)}
                    </span>
                    {isOverdue && (
                      <span class="badge bg-red-100 text-red-600 animate-pulse">已逾期</span>
                    )}
                    <StatusBadge status={inspection.result || "pending"} />
                  </div>
                  <h3 class="font-semibold text-gray-900">{inspection.name}</h3>
                  <div class="text-sm text-gray-500 mt-0.5">
                    {inspection.code} • {inspection.inspector}
                  </div>
                </div>
                <A
                  href={`/detail/inspection/${inspection.id}`}
                  class="text-sm text-primary-600 hover:text-primary-700"
                >
                  详情 →
                </A>
              </div>

              <div class="px-6 py-4">
                <div class="flex items-center gap-4 mb-4 text-sm">
                  <div class="flex items-center gap-1 text-gray-600">
                    <span>📅</span>
                    <span>计划: {format(new Date(inspection.plannedDate), "yyyy-MM-dd", { locale: zhCN })}</span>
                  </div>
                  {inspection.actualDate && (
                    <div class="flex items-center gap-1 text-gray-600">
                      <span>✅</span>
                      <span>实际: {format(new Date(inspection.actualDate), "yyyy-MM-dd", { locale: zhCN })}</span>
                    </div>
                  )}
                </div>

                <div class="flex items-center gap-2 mb-3">
                  <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div class="bg-green-500" style={{ width: `${(passCount / inspection.items.length) * 100}%` }}></div>
                    <div class="bg-red-500" style={{ width: `${(failCount / inspection.items.length) * 100}%` }}></div>
                    <div class="bg-gray-300" style={{ width: `${(pendingCount / inspection.items.length) * 100}%` }}></div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 text-center text-sm">
                  <div class="bg-green-50 rounded py-2">
                    <div class="font-bold text-green-600">{passCount}</div>
                    <div class="text-xs text-gray-500">通过</div>
                  </div>
                  <div class="bg-red-50 rounded py-2">
                    <div class="font-bold text-red-600">{failCount}</div>
                    <div class="text-xs text-gray-500">不通过</div>
                  </div>
                  <div class="bg-gray-100 rounded py-2">
                    <div class="font-bold text-gray-600">{pendingCount}</div>
                    <div class="text-xs text-gray-500">待检</div>
                  </div>
                </div>
              </div>

              <div class="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div class="text-xs text-gray-500">
                  {formatDistance(new Date(inspection.updatedAt), new Date(), { addSuffix: true, locale: zhCN })}
                </div>
                <div class="flex gap-2">
                  {(inspection.result === "pending" || inspection.result === "in_progress") && (
                    <button
                      onClick={() => handleStartInspection(inspection)}
                      class="btn btn-primary text-sm py-1.5"
                    >
                      {inspection.result === "pending" ? "开始巡检" : "继续巡检"}
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedInspection(inspection); setShowCheckModal(true); }}
                    class="btn btn-secondary text-sm py-1.5"
                  >
                    查看明细
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        show={showCreateModal()}
        onClose={() => setShowCreateModal(false)}
        title="新建巡检任务"
        width="max-w-4xl"
      >
        <EntityForm
          type="inspection"
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        show={showCheckModal()}
        onClose={() => { setShowCheckModal(false); setSelectedInspection(null); }}
        title={`巡检明细 - ${selectedInspection()?.name}`}
        width="max-w-4xl"
      >
        {selectedInspection() && (
          <div class="space-y-6">
            <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <StatusBadge status={selectedInspection()!.result || "pending"} />
                  <span class="text-sm text-gray-600">
                    {selectedInspection()!.items.length} 项检查
                  </span>
                </div>
              </div>
              <div class="text-sm">
                巡检员: <span class="font-medium">{selectedInspection()!.inspector}</span>
              </div>
            </div>

            <div class="space-y-3">
              {selectedInspection()!.items.map((item, idx) => (
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                          {idx + 1}
                        </span>
                        <span class="font-medium text-gray-900">{item.checkItem}</span>
                        <span class={`badge ${
                          item.result === "pass" ? "bg-success-100 text-success-600" :
                          item.result === "fail" ? "bg-danger-100 text-danger-600" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {item.result === "pass" ? "通过" : item.result === "fail" ? "不通过" : "待检"}
                        </span>
                      </div>
                      <div class="text-sm text-gray-500 mt-1">
                        {item.entityName}
                      </div>
                    </div>
                  </div>

                  <div class="bg-gray-50 rounded p-3 mb-3">
                    <div class="text-sm text-gray-600">
                      <span class="font-medium">检查标准:</span> {item.standard}
                    </div>
                  </div>

                  {(selectedInspection()!.result === "pending" || selectedInspection()!.result === "in_progress") && (
                    <div class="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateItem(item.id, "pass", item.remarks)}
                        class={`flex-1 btn py-2 ${item.result === "pass" ? "btn-success" : "btn-secondary"}`}
                      >
                        ✓ 通过
                      </button>
                      <button
                        onClick={() => handleUpdateItem(item.id, "fail", item.remarks)}
                        class={`flex-1 btn py-2 ${item.result === "fail" ? "btn-danger" : "btn-secondary"}`}
                      >
                        ✗ 不通过
                      </button>
                      <input
                        type="text"
                        placeholder="备注..."
                        class="flex-1 input"
                        value={item.remarks}
                        onInput={(e) => handleUpdateItem(item.id, item.result, e.target.value)}
                      />
                    </div>
                  )}

                  {item.remarks && (
                    <div class="mt-2 text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                      💬 {item.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(selectedInspection()!.result === "pending" || selectedInspection()!.result === "in_progress") && (
              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => { setShowCheckModal(false); setSelectedInspection(null); }}
                  class="btn btn-secondary"
                >
                  保存并关闭
                </button>
                <button
                  onClick={handleCompleteInspection}
                  class="btn btn-primary"
                >
                  完成巡检
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inspections;
