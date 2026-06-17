import { Component, createSignal, createMemo } from "solid-js";
import { A, useSearchParams } from "@solidjs/router";
import { useDatabase, getVersionHistory, startNewBatch } from "~/lib/database";
import { EntityTypeBadge, FilterBar } from "~/components/common";
import type { EntityType, VersionHistory } from "~/types";
import { format, formatDistance } from "date-fns";
import { zhCN } from "date-fns/locale";

const typeOptions: { label: string; value: EntityType }[] = [
  { label: "通道", value: "channel" },
  { label: "出入口", value: "entrance" },
  { label: "指示牌", value: "sign" },
  { label: "设备点位", value: "equipment" },
  { label: "导览地图", value: "map" },
  { label: "巡检任务", value: "inspection" }
];

const changeTypeOptions = [
  { label: "创建", value: "create" },
  { label: "更新", value: "update" },
  { label: "删除", value: "delete" },
  { label: "导入", value: "import" }
];

const Versions: Component = () => {
  const [searchParams] = useSearchParams();
  const { state } = useDatabase();
  const [search, setSearch] = createSignal("");
  const [typeFilter, setTypeFilter] = createSignal<EntityType | "">("");
  const [changeTypeFilter, setChangeTypeFilter] = createSignal("");
  const [batchFilter, setBatchFilter] = createSignal("");
  const [viewMode, setViewMode] = createSignal<"list" | "batch">("list");

  const allHistory = createMemo(() => {
    const entityParam = Array.isArray(searchParams.entity) ? searchParams.entity[0] : searchParams.entity;
    let list = getVersionHistory(entityParam);
    const q = search().toLowerCase();

    if (q) {
      list = list.filter(h =>
        h.changeSummary.toLowerCase().includes(q) ||
        h.changedBy.toLowerCase().includes(q) ||
        h.entityId.toLowerCase().includes(q) ||
        h.batchId.toLowerCase().includes(q)
      );
    }

    if (typeFilter()) {
      list = list.filter(h => h.entityType === typeFilter());
    }

    if (changeTypeFilter()) {
      list = list.filter(h => h.changeType === changeTypeFilter());
    }

    if (batchFilter()) {
      list = list.filter(h => h.batchId === batchFilter());
    }

    return list;
  });

  const batches = createMemo(() => {
    const batchMap = new Map<string, VersionHistory[]>();
    allHistory().forEach(h => {
      if (!batchMap.has(h.batchId)) {
        batchMap.set(h.batchId, []);
      }
      batchMap.get(h.batchId)!.push(h);
    });
    return Array.from(batchMap.entries())
      .map(([batchId, items]) => ({ batchId, items, count: items.length, time: items[0].changedAt }))
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  });

  const handleNewBatch = () => {
    if (confirm("确定要开启新的批次吗？后续所有操作将归入新批次。")) {
      const newBatchId = startNewBatch();
      alert(`新批次已开启：${newBatchId}`);
    }
  };

  return (
    <div class="space-y-6">
      <FilterBar
        searchValue={search()}
        onSearch={setSearch}
        filters={[
          { label: "全部类型", value: typeFilter(), options: typeOptions, onChange: (v) => setTypeFilter(v as EntityType | "") },
          { label: "全部操作", value: changeTypeFilter(), options: changeTypeOptions, onChange: setChangeTypeFilter },
          {
            label: "全部批次",
            value: batchFilter(),
            options: batches().slice(0, 10).map(b => ({ label: b.batchId, value: b.batchId })),
            onChange: setBatchFilter
          }
        ]}
        actions={
          <div class="flex items-center gap-2">
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                class={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode() === "list" ? "bg-white shadow text-primary-600 font-medium" : "text-gray-600"}`}
              >
                列表视图
              </button>
              <button
                onClick={() => setViewMode("batch")}
                class={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode() === "batch" ? "bg-white shadow text-primary-600 font-medium" : "text-gray-600"}`}
              >
                批次视图
              </button>
            </div>
            <button onClick={handleNewBatch} class="btn btn-primary">
              <span>📦</span> 开启新批次
            </button>
          </div>
        }
      />

      <div class="flex items-center gap-4 text-sm text-gray-500">
        <span>共 <b class="text-gray-900">{allHistory().length}</b> 条历史记录</span>
        <span>•</span>
        <span>当前批次: <span class="font-mono bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{state().currentBatchId}</span></span>
        {batchFilter() && <span>• 筛选批次: {batchFilter()}</span>}
      </div>

      {viewMode() === "list" ? (
        <div class="card overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header w-16">操作</th>
                <th class="table-header w-24">类型</th>
                <th class="table-header">变更摘要</th>
                <th class="table-header w-16">版本</th>
                <th class="table-header w-32">操作人</th>
                <th class="table-header w-40">时间</th>
                <th class="table-header w-32">批次</th>
                <th class="table-header w-24">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {allHistory().map(h => (
                <tr class="hover:bg-gray-50">
                  <td class="table-cell">
                    <span class={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                      h.changeType === "create" ? "bg-green-100 text-green-700" :
                      h.changeType === "update" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {h.changeType === "create" ? "+" : h.changeType === "update" ? "~" : "×"}
                    </span>
                  </td>
                  <td class="table-cell">
                    <EntityTypeBadge type={h.entityType} />
                  </td>
                  <td class="table-cell font-medium text-gray-900">{h.changeSummary}</td>
                  <td class="table-cell text-sm text-gray-500">v{h.version}</td>
                  <td class="table-cell text-sm text-gray-600">{h.changedBy}</td>
                  <td class="table-cell text-sm text-gray-500">
                    <div>{format(new Date(h.changedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}</div>
                    <div class="text-xs text-gray-400">{formatDistance(new Date(h.changedAt), new Date(), { addSuffix: true, locale: zhCN })}</div>
                  </td>
                  <td class="table-cell">
                    <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {h.batchId.slice(-10)}
                    </span>
                  </td>
                  <td class="table-cell">
                    <A
                      href={`/detail/${h.entityType}/${h.entityId}`}
                      class="text-sm text-primary-600 hover:text-primary-700"
                    >
                      查看实体
                    </A>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="space-y-4">
          {batches().map(batch => (
            <div class="card overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xl">
                    📦
                  </div>
                  <div>
                    <div class="font-mono font-medium text-gray-900">{batch.batchId}</div>
                    <div class="text-sm text-gray-500">
                      {format(new Date(batch.time), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })} • {batch.count} 项变更
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBatchFilter(batch.batchId)}
                  class="text-sm text-primary-600 hover:text-primary-700"
                >
                  仅查看此批次
                </button>
              </div>
              <div class="p-4 space-y-2">
                {batch.items.map((h: any) => (
                  <div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <span class={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      h.changeType === "create" ? "bg-green-100 text-green-700" :
                      h.changeType === "update" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {h.changeType === "create" ? "+" : h.changeType === "update" ? "~" : "×"}
                    </span>
                    <EntityTypeBadge type={h.entityType} />
                    <span class="flex-1 text-sm text-gray-900">{h.changeSummary}</span>
                    <span class="text-xs text-gray-500">v{h.version}</span>
                    <span class="text-xs text-gray-500">{h.changedBy}</span>
                    <A
                      href={`/detail/${h.entityType}/${h.entityId}`}
                      class="text-xs text-primary-600 hover:text-primary-700"
                    >
                      查看
                    </A>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Versions;
