import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { storage } from "../../lib/storage";
import { ensureSeedData } from "../../lib/seed";
import type { Project, Defect, Anomaly } from "../../lib/types";
import { ANOMALY_TYPE_LABELS } from "../../lib/types";
import { anomalyTypeLabel, formatDateTime, uid } from "../../lib/utils";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = createSignal<Anomaly[]>([]);
  const [showResolved, setShowResolved] = createSignal(false);
  const [selectedProject, setSelectedProject] = createSignal<string>("");
  const [projects, setProjects] = createSignal<Project[]>([]);

  onMount(() => {
    ensureSeedData();
    setAnomalies(storage.anomalies.getAll());
    setProjects(storage.projects.getAll());
  });

  const filtered = () => {
    let list = anomalies();
    if (!showResolved()) {
      list = list.filter((a) => !a.resolved);
    }
    if (selectedProject()) {
      list = list.filter((a) => a.projectId === selectedProject());
    }
    return list;
  };

  const resolve = (id: string) => {
    storage.anomalies.resolve(id);
    setAnomalies(storage.anomalies.getAll());
  };

  const projectName = (pid: string) => projects().find((p) => p.id === pid)?.name || pid;
  const errorCount = () => anomalies().filter((a) => a.severity === "error" && !a.resolved).length;
  const warningCount = () => anomalies().filter((a) => a.severity === "warning" && !a.resolved).length;

  return (
    <div>
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-gray-900">异常数据提示</h2>
          <p class="text-sm text-gray-500 mt-1">自动检测里程重叠、帧缺失、等级不匹配、重复标注、超期未复核等异常</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-5">
        <div class="card text-center border-l-4 border-red-400">
          <div class="text-2xl font-bold text-red-600">{errorCount()}</div>
          <div class="text-xs text-gray-500">严重异常</div>
        </div>
        <div class="card text-center border-l-4 border-amber-400">
          <div class="text-2xl font-bold text-amber-600">{warningCount()}</div>
          <div class="text-xs text-gray-500">警告提示</div>
        </div>
        <div class="card text-center border-l-4 border-green-400">
          <div class="text-2xl font-bold text-green-600">{anomalies().filter((a) => a.resolved).length}</div>
          <div class="text-xs text-gray-500">已处理</div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="flex items-end gap-3">
          <div class="w-64">
            <label class="block text-xs font-medium text-gray-500 mb-1">筛选项目</label>
            <select class="select-field" value={selectedProject()} onChange={(e) => setSelectedProject(e.currentTarget.value)}>
              <option value="">全部项目</option>
              <For each={projects()}>
                {(p) => <option value={p.id}>{p.name}</option>}
              </For>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showResolved()} onChange={(e) => setShowResolved(e.currentTarget.checked)} />
            显示已处理
          </label>
        </div>
      </div>

      <div class="space-y-3">
        <For each={filtered()} fallback={
          <div class="card text-center py-8 text-gray-400 text-sm">暂无异常数据</div>
        }>
          {(a) => (
            <div class={`card border-l-4 ${a.severity === "error" ? "border-l-red-500" : "border-l-amber-500"} ${a.resolved ? "opacity-60" : ""}`}>
              <div class="flex items-start gap-3">
                <div class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${a.severity === "error" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01" /></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium text-gray-500">[{anomalyTypeLabel(a.type)}]</span>
                    <span class="text-xs text-gray-400">{projectName(a.projectId)}</span>
                    <Show when={a.resolved}>
                      <span class="badge bg-green-100 text-green-800">已处理</span>
                    </Show>
                  </div>
                  <p class="text-sm text-gray-800">{a.description}</p>
                  <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>发现时间: {formatDateTime(a.createdAt)}</span>
                    <Show when={a.resolvedAt}>
                      <span>处理时间: {formatDateTime(a.resolvedAt)}</span>
                    </Show>
                  </div>
                </div>
                <Show when={!a.resolved}>
                  <button class="btn-secondary btn-sm flex-shrink-0" onClick={() => resolve(a.id)}>标为已处理</button>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
