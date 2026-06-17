import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { storage } from "../../lib/storage";
import { ensureSeedData } from "../../lib/seed";
import type { Project, ExportRecord } from "../../lib/types";
import { formatDateTime } from "../../lib/utils";
import ExportPanel from "../../components/ExportPanel";

export default function ExportPage() {
  const params = useParams();
  const [project, setProject] = createSignal<Project | null>(null);
  const [exportHistory, setExportHistory] = createSignal<ExportRecord[]>([]);

  onMount(() => {
    ensureSeedData();
    const p = storage.projects.getById(params.id);
    if (p) {
      setProject(p);
      setExportHistory(storage.exports.getByProject(p.id));
    }
  });

  const refreshHistory = () => {
    const p = project();
    if (p) setExportHistory(storage.exports.getByProject(p.id));
  };

  const exportTypeLabel = (t: string) => {
    const map: Record<string, string> = { summary: "项目摘要", full: "全量数据", mileage: "里程表", review: "复核记录" };
    return map[t] || t;
  };

  return (
    <Show when={project()} fallback={<div class="text-center py-16 text-gray-400">项目不存在</div>}>
      {(proj) => (
        <div>
          <div class="flex items-start justify-between mb-5">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <A href={`/project/${proj().id}`} class="text-xs text-gray-400 hover:text-gray-600">← 返回项目详情</A>
              </div>
              <h2 class="text-xl font-bold text-gray-900">导出摘要 · {proj().name}</h2>
            </div>
          </div>

          <ExportPanel project={proj()} />

          <div class="mt-5 card">
            <h3 class="font-medium text-sm mb-3">导出历史记录</h3>
            <Show when={exportHistory().length > 0} fallback={
              <p class="text-sm text-gray-400 text-center py-4">暂无导出记录</p>
            }>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="table-header">导出类型</th>
                      <th class="table-header">格式</th>
                      <th class="table-header">记录数</th>
                      <th class="table-header">导出人</th>
                      <th class="table-header">导出时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={exportHistory()}>
                      {(r) => (
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                          <td class="table-cell">{exportTypeLabel(r.exportType)}</td>
                          <td class="table-cell"><span class="badge bg-gray-100 text-gray-700">{r.format.toUpperCase()}</span></td>
                          <td class="table-cell">{r.recordCount}</td>
                          <td class="table-cell">{r.createdBy}</td>
                          <td class="table-cell text-xs text-gray-500">{formatDateTime(r.createdAt)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
}
