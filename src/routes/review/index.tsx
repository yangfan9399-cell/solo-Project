import { createSignal, onMount, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { storage } from "../../lib/storage";
import { ensureSeedData } from "../../lib/seed";
import type { Project, ReviewBatch, Defect, ReviewStatus } from "../../lib/types";
import { REVIEW_STATUS_LABELS } from "../../lib/types";
import { uid, formatDateTime, reviewStatusLabel, reviewStatusBadgeClass, projectStatusLabel } from "../../lib/utils";
import FilterBar from "../../components/FilterBar";
import DefectAnnotation from "../../components/DefectAnnotation";

export default function ReviewWorkbench() {
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [selectedProject, setSelectedProject] = createSignal<string>("");
  const [defects, setDefects] = createSignal<Defect[]>([]);
  const [statusFilter, setStatusFilter] = createSignal<ReviewStatus | "">("");
  const [expandedDefect, setExpandedDefect] = createSignal<string | null>(null);

  onMount(() => {
    ensureSeedData();
    setProjects(storage.projects.getAll());
  });

  const loadDefects = () => {
    const pid = selectedProject();
    if (!pid) {
      setDefects(storage.defects.getAll());
    } else {
      setDefects(storage.defects.getByProject(pid));
    }
  };

  const filtered = () => {
    let list = defects();
    if (statusFilter()) {
      list = list.filter((d) => d.reviewStatus === statusFilter());
    }
    return list;
  };

  const approveDefect = (id: string) => {
    storage.defects.update(id, { reviewStatus: "approved", reviewedBy: "当前用户", reviewedAt: new Date().toISOString(), reviewComment: "复核通过" });
    loadDefects();
  };

  const rejectDefect = (id: string, comment: string) => {
    storage.defects.update(id, { reviewStatus: "rejected", reviewedBy: "当前用户", reviewedAt: new Date().toISOString(), reviewComment: comment });
    loadDefects();
  };

  const batchApprove = () => {
    const pending = filtered().filter((d) => d.reviewStatus === "pending" || d.reviewStatus === "reviewing");
    if (pending.length === 0) return;
    if (!confirm(`确认批量通过 ${pending.length} 条缺陷？`)) return;
    pending.forEach((d) => {
      storage.defects.update(d.id, { reviewStatus: "approved", reviewedBy: "当前用户", reviewedAt: new Date().toISOString(), reviewComment: "批量通过" });
    });
    loadDefects();
  };

  const createReviewBatch = () => {
    const pid = selectedProject();
    if (!pid) return;
    const pendingDefects = defects().filter((d) => d.reviewStatus === "pending");
    if (pendingDefects.length === 0) return;

    const batch: ReviewBatch = {
      id: uid(),
      projectId: pid,
      batchName: `复核批次 ${new Date().toLocaleDateString("zh-CN")}`,
      reviewer: "当前用户",
      status: "reviewing",
      createdAt: new Date().toISOString(),
      completedAt: "",
      defectIds: pendingDefects.map((d) => d.id),
      comment: `共 ${pendingDefects.length} 项待复核`,
    };
    storage.reviews.create(batch);
    pendingDefects.forEach((d) => {
      storage.defects.update(d.id, { reviewStatus: "reviewing" });
    });
    loadDefects();
  };

  const stats = () => {
    const all = defects();
    return {
      total: all.length,
      pending: all.filter((d) => d.reviewStatus === "pending").length,
      reviewing: all.filter((d) => d.reviewStatus === "reviewing").length,
      approved: all.filter((d) => d.reviewStatus === "approved").length,
      rejected: all.filter((d) => d.reviewStatus === "rejected").length,
    };
  };

  return (
    <div>
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-gray-900">复核工作台</h2>
          <p class="text-sm text-gray-500 mt-1">多人复核流程，支持逐条审核与批量操作</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary" onClick={createReviewBatch} disabled={!selectedProject()}>创建复核批次</button>
          <button class="btn-primary" onClick={batchApprove}>批量通过待复核项</button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="card text-center">
          <div class="text-2xl font-bold text-gray-800">{stats().total}</div>
          <div class="text-xs text-gray-500">缺陷总数</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-amber-600">{stats().pending}</div>
          <div class="text-xs text-gray-500">待复核</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-green-600">{stats().approved}</div>
          <div class="text-xs text-gray-500">已通过</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-red-600">{stats().rejected}</div>
          <div class="text-xs text-gray-500">已退回</div>
        </div>
      </div>

      <div class="card mb-5">
        <div class="flex items-end gap-3">
          <div class="w-64">
            <label class="block text-xs font-medium text-gray-500 mb-1">筛选项目</label>
            <select class="select-field" value={selectedProject()} onChange={(e) => { setSelectedProject(e.currentTarget.value); loadDefects(); }}>
              <option value="">全部项目</option>
              <For each={projects()}>
                {(p) => <option value={p.id}>{p.name}</option>}
              </For>
            </select>
          </div>
          <div class="w-40">
            <label class="block text-xs font-medium text-gray-500 mb-1">复核状态</label>
            <select class="select-field" value={statusFilter()} onChange={(e) => setStatusFilter(e.currentTarget.value as ReviewStatus | "")}>
              <option value="">全部状态</option>
              {Object.entries(REVIEW_STATUS_LABELS).map(([k, v]) => (
                <option value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <For each={filtered()} fallback={
          <div class="card text-center py-8 text-gray-400 text-sm">暂无匹配的缺陷记录</div>
        }>
          {(d) => {
            const proj = () => projects().find((p) => p.id === d.projectId);
            return (
              <div>
                <Show when={proj()}>
                  {(p) => (
                    <div class="text-xs text-gray-400 mb-1">
                      <A href={`/project/${p().id}`} class="hover:text-primary-600">{p().name}</A>
                    </div>
                  )}
                </Show>
                <DefectAnnotation defect={d} onApprove={approveDefect} onReject={rejectDefect} showActions />
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
