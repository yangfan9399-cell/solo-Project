import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { storage } from "../../lib/storage";
import { ensureSeedData } from "../../lib/seed";
import type { Project, Version, ReviewBatch } from "../../lib/types";
import { REVIEW_STATUS_LABELS } from "../../lib/types";
import { formatDateTime, reviewStatusLabel, reviewStatusBadgeClass, uid } from "../../lib/utils";

export default function HistoryPage() {
  const params = useParams();
  const [project, setProject] = createSignal<Project | null>(null);
  const [versions, setVersions] = createSignal<Version[]>([]);
  const [reviews, setReviews] = createSignal<ReviewBatch[]>([]);
  const [tab, setTab] = createSignal<"versions" | "batches">("versions");
  const [newVersionDesc, setNewVersionDesc] = createSignal("");

  onMount(() => {
    ensureSeedData();
    const p = storage.projects.getById(params.id);
    if (p) {
      setProject(p);
      setVersions(storage.versions.getByProject(p.id));
      setReviews(storage.reviews.getByProject(p.id));
    }
  });

  const createVersion = () => {
    const p = project();
    if (!p) return;
    const defectCount = storage.defects.getByProject(p.id).length;
    const lastVersion = versions().length > 0 ? versions()[versions().length - 1].versionNumber : "0.0";
    const parts = lastVersion.split(".");
    const newMinor = Number(parts[1] || 0) + 1;
    const newVersionNumber = `${parts[0]}.${newMinor}`;

    const version: Version = {
      id: uid(),
      projectId: p.id,
      versionNumber: newVersionDesc().trim() ? newVersionNumber : newVersionNumber,
      description: newVersionDesc().trim() || `版本 ${newVersionNumber} 快照`,
      createdBy: p.annotator,
      createdAt: new Date().toISOString(),
      defectCount,
      snapshotKey: `snap_${p.id}_${newVersionNumber.replace(".", "_")}`,
    };
    storage.versions.create(version);
    setNewVersionDesc("");
    setVersions(storage.versions.getByProject(p.id));
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
              <h2 class="text-xl font-bold text-gray-900">版本与批次历史 · {proj().name}</h2>
            </div>
          </div>

          <div class="flex items-center gap-4 mb-5 border-b border-gray-200 pb-3">
            <button class={`text-sm font-medium pb-1 ${tab() === "versions" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setTab("versions")}>
              版本记录 ({versions().length})
            </button>
            <button class={`text-sm font-medium pb-1 ${tab() === "batches" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setTab("batches")}>
              复核批次 ({reviews().length})
            </button>
          </div>

          <Show when={tab() === "versions"}>
            <div class="card mb-5">
              <h3 class="font-medium text-sm mb-3">创建新版本快照</h3>
              <div class="flex gap-3">
                <input class="input-field flex-1" value={newVersionDesc()} onInput={(e) => setNewVersionDesc(e.currentTarget.value)} placeholder="版本说明（如：初版标注、修复渗漏标注等）" />
                <button class="btn-primary" onClick={createVersion}>创建版本</button>
              </div>
            </div>

            <div class="space-y-3">
              <For each={versions()} fallback={
                <div class="card text-center py-8 text-gray-400 text-sm">暂无版本记录</div>
              }>
                {(v, i) => (
                  <div class="card flex items-center gap-4">
                    <div class="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                      <span class="text-primary-600 font-bold text-sm">{v.versionNumber}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-sm">{v.description}</span>
                      </div>
                      <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>创建人: {v.createdBy}</span>
                        <span>缺陷数: {v.defectCount}</span>
                        <span>{formatDateTime(v.createdAt)}</span>
                      </div>
                    </div>
                    <div class="flex-shrink-0">
                      <span class="text-xs text-gray-400 font-mono">{v.snapshotKey}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={tab() === "batches"}>
            <div class="space-y-3">
              <For each={reviews()} fallback={
                <div class="card text-center py-8 text-gray-400 text-sm">暂无复核批次</div>
              }>
                {(r) => (
                  <div class="card">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <span class="font-medium text-sm">{r.batchName}</span>
                        <span class={reviewStatusBadgeClass(r.status)}>{reviewStatusLabel(r.status)}</span>
                      </div>
                      <span class="text-xs text-gray-400">{r.defectIds.length} 项缺陷</span>
                    </div>
                    <div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span>复核人: {r.reviewer}</span>
                      <span>创建: {formatDateTime(r.createdAt)}</span>
                      <Show when={r.completedAt}>
                        <span>完成: {formatDateTime(r.completedAt)}</span>
                      </Show>
                    </div>
                    <Show when={r.comment}>
                      <p class="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">{r.comment}</p>
                    </Show>
                    <div class="mt-2 flex flex-wrap gap-1">
                      <For each={r.defectIds.slice(0, 5)}>
                        {(did) => {
                          const d = storage.defects.getById(did);
                          return d ? (
                            <span class={`text-[10px] px-1.5 py-0.5 rounded ${d.reviewStatus === "approved" ? "bg-green-50 text-green-600" : d.reviewStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
                              {did.slice(0, 6)}
                            </span>
                          ) : null;
                        }}
                      </For>
                      <Show when={r.defectIds.length > 5}>
                        <span class="text-[10px] text-gray-400">+{r.defectIds.length - 5} more</span>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}
