import { createSignal, onMount, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { storage } from "../lib/storage";
import { ensureSeedData } from "../lib/seed";
import type { Project, ProjectStatus } from "../lib/types";
import { PROJECT_STATUS_LABELS } from "../lib/types";
import { projectStatusLabel, projectStatusBadgeClass, formatDate, uid } from "../lib/utils";
import FilterBar from "../components/FilterBar";
import AlertBanner from "../components/AlertBanner";

export default function ProjectLedger() {
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [keyword, setKeyword] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<ProjectStatus | "">("");
  const [showNewProject, setShowNewProject] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newPipeline, setNewPipeline] = createSignal("");
  const [newDiameter, setNewDiameter] = createSignal(600);
  const [newLength, setNewLength] = createSignal(0);
  const [newRobot, setNewRobot] = createSignal("CCTV-3000");
  const [newAnnotator, setNewAnnotator] = createSignal("");

  onMount(() => {
    ensureSeedData();
    refreshProjects();
  });

  const refreshProjects = () => {
    setProjects(storage.projects.getAll());
  };

  const filtered = () => {
    let list = projects();
    const kw = keyword().toLowerCase();
    if (kw) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(kw) ||
        p.pipelineName.toLowerCase().includes(kw) ||
        p.annotator.toLowerCase().includes(kw)
      );
    }
    if (statusFilter()) {
      list = list.filter((p) => p.status === statusFilter());
    }
    return list;
  };

  const defectCount = (pid: string) => storage.defects.getByProject(pid).length;
  const pendingCount = (pid: string) => storage.defects.getByProject(pid).filter((d) => d.reviewStatus === "pending").length;
  const anomalyCount = (pid: string) => storage.anomalies.getByProject(pid).filter((a) => !a.resolved).length;

  const createProject = () => {
    if (!newName().trim()) return;
    const now = new Date().toISOString();
    const p: Project = {
      id: uid(),
      name: newName().trim(),
      pipelineName: newPipeline().trim() || newName().trim(),
      pipelineDiameter: newDiameter(),
      inspectionDate: now.slice(0, 10),
      inspectionLength: newLength(),
      robotModel: newRobot(),
      status: "ongoing",
      annotator: newAnnotator().trim() || "未指定",
      createdAt: now,
      updatedAt: now,
    };
    storage.projects.create(p);
    setShowNewProject(false);
    setNewName("");
    setNewPipeline("");
    setNewDiameter(600);
    setNewLength(0);
    setNewRobot("CCTV-3000");
    setNewAnnotator("");
    refreshProjects();
  };

  const deleteProject = (id: string) => {
    if (confirm("确认删除该项目及其所有数据？")) {
      storage.projects.delete(id);
      storage.frames.getAll().filter((f) => f.projectId === id).forEach((f) => storage.frames.delete(f.id));
      storage.defects.getAll().filter((d) => d.projectId === id).forEach((d) => storage.defects.delete(d.id));
      refreshProjects();
    }
  };

  return (
    <div>
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-gray-900">项目台账</h2>
          <p class="text-sm text-gray-500 mt-1">共 {projects().length} 个巡检项目，当前显示 {filtered().length} 个</p>
        </div>
        <button class="btn-primary" onClick={() => setShowNewProject(true)}>+ 新建项目</button>
      </div>

      <AlertBanner />

      <FilterBar
        filters={{ keyword: keyword(), defectType: "", status: statusFilter(), severity: "" }}
        onChange={(f) => { setKeyword(f.keyword); setStatusFilter(f.status as any); }}
        showProjectStatus
      />

      <Show when={showNewProject()}>
        <div class="card mb-5 border-primary-200">
          <h3 class="font-medium text-sm mb-3">新建巡检项目</h3>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">项目名称 *</label>
              <input class="input-field" value={newName()} onInput={(e) => setNewName(e.currentTarget.value)} placeholder="例: XX路排水管线检测" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">管线名称</label>
              <input class="input-field" value={newPipeline()} onInput={(e) => setNewPipeline(e.currentTarget.value)} placeholder="例: XX路DN800雨水管" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">管径(mm)</label>
              <input type="number" class="input-field" value={newDiameter()} onInput={(e) => setNewDiameter(Number(e.currentTarget.value))} />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">检测长度(m)</label>
              <input type="number" class="input-field" value={newLength()} onInput={(e) => setNewLength(Number(e.currentTarget.value))} />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">机器人型号</label>
              <select class="select-field" value={newRobot()} onChange={(e) => setNewRobot(e.currentTarget.value)}>
                <option>CCTV-3000</option>
                <option>CCTV-5000</option>
                <option>QV-2000</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">标注人</label>
              <input class="input-field" value={newAnnotator()} onInput={(e) => setNewAnnotator(e.currentTarget.value)} placeholder="标注人姓名" />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-3">
            <button class="btn-secondary" onClick={() => setShowNewProject(false)}>取消</button>
            <button class="btn-primary" onClick={createProject}>创建</button>
          </div>
        </div>
      </Show>

      <div class="card p-0 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="table-header">项目名称</th>
              <th class="table-header">管线</th>
              <th class="table-header">管径</th>
              <th class="table-header">检测日期</th>
              <th class="table-header">长度(m)</th>
              <th class="table-header">缺陷数</th>
              <th class="table-header">待复核</th>
              <th class="table-header">异常</th>
              <th class="table-header">状态</th>
              <th class="table-header">标注人</th>
              <th class="table-header">操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={filtered()} fallback={
              <tr><td colspan={11} class="text-center py-8 text-gray-400 text-sm">暂无匹配项目</td></tr>
            }>
              {(p) => (
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="table-cell">
                    <A href={`/project/${p.id}`} class="text-primary-600 hover:underline font-medium">{p.name}</A>
                  </td>
                  <td class="table-cell text-xs">{p.pipelineName}</td>
                  <td class="table-cell">DN{p.pipelineDiameter}</td>
                  <td class="table-cell">{p.inspectionDate}</td>
                  <td class="table-cell">{p.inspectionLength}</td>
                  <td class="table-cell font-medium">{defectCount(p.id)}</td>
                  <td class="table-cell">
                    <Show when={pendingCount(p.id) > 0}>
                      <span class="text-amber-600 font-medium">{pendingCount(p.id)}</span>
                    </Show>
                    <Show when={pendingCount(p.id) === 0}>
                      <span class="text-gray-300">0</span>
                    </Show>
                  </td>
                  <td class="table-cell">
                    <Show when={anomalyCount(p.id) > 0}>
                      <span class="text-red-600 font-medium">{anomalyCount(p.id)}</span>
                    </Show>
                    <Show when={anomalyCount(p.id) === 0}>
                      <span class="text-gray-300">0</span>
                    </Show>
                  </td>
                  <td class="table-cell"><span class={projectStatusBadgeClass(p.status)}>{projectStatusLabel(p.status)}</span></td>
                  <td class="table-cell">{p.annotator}</td>
                  <td class="table-cell">
                    <div class="flex gap-1">
                      <A href={`/project/${p.id}`} class="text-primary-600 hover:underline text-xs">详情</A>
                      <A href={`/mileage/${p.id}`} class="text-primary-600 hover:underline text-xs">里程表</A>
                      <button class="text-red-500 hover:underline text-xs" onClick={() => deleteProject(p.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
