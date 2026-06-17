import { Component, createSignal, createMemo, onMount } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { useDatabase, getEntities, createEntity, deleteEntity } from "~/lib/database";
import { exportToExcel } from "~/lib/exporter";
import { StatusBadge, EntityTypeBadge, FilterBar, Modal } from "~/components/common";
import EntityForm from "~/components/EntityForm";
import type { EntityType, AnyEntity } from "~/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const typeLabels: Record<EntityType, string> = {
  channel: "通道",
  entrance: "出入口",
  sign: "指示牌",
  equipment: "设备点位",
  map: "导览地图",
  inspection: "巡检任务"
};

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

const Ledger: Component = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useDatabase();

  const [search, setSearch] = createSignal(searchParams.search || "");
  const [typeFilter, setTypeFilter] = createSignal<EntityType | "">((searchParams.type as EntityType) || "");
  const [statusFilter, setStatusFilter] = createSignal(searchParams.status || "");
  const [showCreateModal, setShowCreateModal] = createSignal(searchParams.action === "create");
  const [showAnomaliesOnly, setShowAnomaliesOnly] = createSignal(searchParams.filter === "anomalies");

  onMount(() => {
    if (searchParams.action === "create") {
      setSearchParams({ ...searchParams, action: undefined }, { replace: true });
    }
    if (searchParams.filter) {
      setSearchParams({ ...searchParams, filter: undefined }, { replace: true });
    }
  });

  const allEntities = createMemo<AnyEntity[]>(() => {
    const type = typeFilter();
    if (type) {
      return getEntities<AnyEntity>(type);
    }
    const s = state();
    return [
      ...s.channels,
      ...s.entrances,
      ...s.signs,
      ...s.equipment,
      ...s.maps,
      ...s.inspections
    ] as AnyEntity[];
  });

  const filteredEntities = createMemo(() => {
    let list = allEntities();
    const searchVal = search();
    const q = (typeof searchVal === "string" ? searchVal : searchVal[0] || "").toLowerCase();

    if (q) {
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.remarks.toLowerCase().includes(q)
      );
    }

    if (statusFilter()) {
      list = list.filter(e => e.status === statusFilter());
    }

    if (showAnomaliesOnly()) {
      const anomalyEntityIds = new Set(state().anomalies.filter(a => !a.resolved).map(a => a.entityId));
      list = list.filter(e => anomalyEntityIds.has(e.id));
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });

  const handleCreate = (data: Partial<AnyEntity>) => {
    const type = (typeFilter() as EntityType) || "channel";
    createEntity(type, { ...data, type } as any);
    setShowCreateModal(false);
  };

  const handleDelete = (type: EntityType, id: string, name: string) => {
    if (confirm(`确认删除「${name}」？此操作将保留删除历史记录。`)) {
      deleteEntity(type, id);
    }
  };

  const handleExport = () => {
    const typeVal = typeFilter();
    const statusVal = statusFilter();
    const searchVal = search();
    const result = exportToExcel(state(), {
      entityTypes: typeVal ? [typeVal as EntityType] : undefined,
      statuses: statusVal ? [statusVal as string] : undefined,
      search: (typeof searchVal === "string" ? searchVal : searchVal[0]) || undefined
    });
    alert(`导出成功：${result.fileName}，共 ${result.totalRecords} 条记录`);
  };

  const handleTypeChange = (v: string) => {
    setTypeFilter(v as EntityType | "");
    setShowCreateModal(false);
  };

  const getSearchValue = () => {
    const v = search();
    return typeof v === "string" ? v : v[0] || "";
  };

  const getTypeFilterValue = () => {
    const v = typeFilter();
    return typeof v === "string" ? v : "";
  };

  const getStatusFilterValue = () => {
    const v = statusFilter();
    return typeof v === "string" ? v : "";
  };

  return (
    <div class="space-y-6">
      <FilterBar
        searchValue={getSearchValue()}
        onSearch={setSearch}
        filters={[
          { label: "全部类型", value: getTypeFilterValue(), options: typeOptions, onChange: handleTypeChange },
          { label: "全部状态", value: getStatusFilterValue(), options: statusOptions, onChange: setStatusFilter }
        ]}
        actions={
          <div class="flex items-center gap-2">
            <button
              onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly())}
              class={`btn ${showAnomaliesOnly() ? "btn-danger" : "btn-secondary"}`}
            >
              <span>⚠️</span>
              <span>仅显示异常</span>
            </button>
            <button onClick={() => setShowCreateModal(true)} class="btn btn-primary">
              <span>+</span>
              <span>新增{typeFilter() ? typeLabels[typeFilter() as EntityType] : "记录"}</span>
            </button>
            <button onClick={handleExport} class="btn btn-secondary">
              <span>📤</span>
              <span>导出</span>
            </button>
          </div>
        }
      />

      <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <span>共 <b class="text-gray-900">{filteredEntities().length}</b> 条记录</span>
        {typeFilter() && <span>• 类型: {typeLabels[typeFilter() as EntityType]}</span>}
        {statusFilter() && <span>• 状态: {statusOptions.find(s => s.value === statusFilter())?.label}</span>}
        {showAnomaliesOnly() && <span class="text-danger-600">• 仅异常</span>}
        {search() && <span>• 搜索: "{search()}"</span>}
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header w-16">类型</th>
                <th class="table-header w-28">编码</th>
                <th class="table-header">名称</th>
                <th class="table-header w-24">状态</th>
                <th class="table-header w-32">版本</th>
                <th class="table-header w-40">更新时间</th>
                <th class="table-header w-48">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {filteredEntities().length === 0 ? (
                <tr>
                  <td colspan={7} class="px-4 py-12 text-center text-gray-500">
                    <div class="text-4xl mb-2">📭</div>
                    <div>暂无数据，请调整筛选条件或新增记录</div>
                  </td>
                </tr>
              ) : (
                filteredEntities().map(entity => (
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="table-cell">
                      <EntityTypeBadge type={entity.type} />
                    </td>
                    <td class="table-cell font-mono text-sm text-gray-600">{entity.code}</td>
                    <td class="table-cell">
                      <div class="font-medium text-gray-900">{entity.name}</div>
                      {entity.remarks && (
                        <div class="text-xs text-gray-500 mt-0.5 truncate max-w-md">
                          {entity.remarks}
                        </div>
                      )}
                    </td>
                    <td class="table-cell">
                      <StatusBadge status={entity.status} />
                    </td>
                    <td class="table-cell">
                      <span class="text-sm text-gray-600">v{entity.version}</span>
                      <span class="text-xs text-gray-400 block">{entity.batchId.slice(-8)}</span>
                    </td>
                    <td class="table-cell text-sm text-gray-500">
                      {format(new Date(entity.updatedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </td>
                    <td class="table-cell">
                      <div class="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/detail/${entity.type}/${entity.id}`)}
                          class="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => navigate(`/detail/${entity.type}/${entity.id}?action=edit`)}
                          class="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => navigate(`/versions?entity=${entity.id}`)}
                          class="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          历史
                        </button>
                        <button
                          onClick={() => handleDelete(entity.type, entity.id, entity.name)}
                          class="px-2 py-1 text-xs text-danger-600 hover:bg-danger-50 rounded transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        show={showCreateModal()}
        onClose={() => setShowCreateModal(false)}
        title={`新增${typeFilter() ? typeLabels[typeFilter() as EntityType] : "记录"}`}
        width="max-w-4xl"
      >
        <EntityForm
          type={typeFilter() || "channel"}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Ledger;
