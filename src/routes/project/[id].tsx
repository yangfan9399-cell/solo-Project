import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { storage } from "../../lib/storage";
import { ensureSeedData } from "../../lib/seed";
import type { Project, InspectionFrame, Defect, DefectType, SeverityLevel } from "../../lib/types";
import { DEFECT_TYPE_LABELS, SEVERITY_LABELS } from "../../lib/types";
import { uid, formatDate, formatDateTime, defectTypeBadgeClass, severityBadgeClass, reviewStatusLabel, reviewStatusBadgeClass } from "../../lib/utils";
import FrameViewer from "../../components/FrameViewer";
import DefectAnnotation from "../../components/DefectAnnotation";
import AlertBanner from "../../components/AlertBanner";

export default function ProjectDetail() {
  const params = useParams();
  const [project, setProject] = createSignal<Project | null>(null);
  const [frames, setFrames] = createSignal<InspectionFrame[]>([]);
  const [defects, setDefects] = createSignal<Defect[]>([]);
  const [selectedFrame, setSelectedFrame] = createSignal<string | null>(null);
  const [tab, setTab] = createSignal<"defects" | "annotate">("defects");

  const [newDefectType, setNewDefectType] = createSignal<DefectType>("crack");
  const [newDefectSeverity, setNewDefectSeverity] = createSignal<SeverityLevel>(2);
  const [newDefectPosition, setNewDefectPosition] = createSignal("");
  const [newDefectDesc, setNewDefectDesc] = createSignal("");
  const [newDefectLength, setNewDefectLength] = createSignal(0);
  const [newDefectWidth, setNewDefectWidth] = createSignal(0);

  onMount(() => {
    ensureSeedData();
    refresh();
  });

  const refresh = () => {
    const p = storage.projects.getById(params.id);
    if (p) {
      setProject(p);
      const f = storage.frames.getByProject(p.id);
      setFrames(f);
      const d = storage.defects.getByProject(p.id);
      setDefects(d);
      if (f.length > 0 && !selectedFrame()) {
        setSelectedFrame(f[0].id);
      }
    }
  };

  const currentFrame = () => frames().find((f) => f.id === selectedFrame());
  const currentDefects = () => defects().filter((d) => d.frameId === selectedFrame());

  const addDefect = () => {
    const frame = currentFrame();
    const p = project();
    if (!frame || !p) return;

    const now = new Date().toISOString();
    const defect: Defect = {
      id: uid(),
      frameId: frame.id,
      projectId: p.id,
      type: newDefectType(),
      severity: newDefectSeverity(),
      position: newDefectPosition() || "未指定",
      mileage: frame.mileage,
      description: newDefectDesc() || `${DEFECT_TYPE_LABELS[newDefectType()]}缺陷`,
      length: newDefectLength(),
      width: newDefectWidth(),
      annotatedBy: p.annotator,
      annotatedAt: now,
      reviewStatus: "pending",
      reviewedBy: "",
      reviewedAt: "",
      reviewComment: "",
      versionId: "",
    };
    storage.defects.create(defect);
    setNewDefectDesc("");
    setNewDefectPosition("");
    setNewDefectLength(0);
    setNewDefectWidth(0);
    refresh();
  };

  const deleteDefect = (id: string) => {
    if (confirm("确认删除此缺陷标注？")) {
      storage.defects.delete(id);
      refresh();
    }
  };

  const approveDefect = (id: string) => {
    storage.defects.update(id, { reviewStatus: "approved", reviewedBy: "当前用户", reviewedAt: new Date().toISOString(), reviewComment: "直接通过" });
    refresh();
  };

  const rejectDefect = (id: string, comment: string) => {
    storage.defects.update(id, { reviewStatus: "rejected", reviewedBy: "当前用户", reviewedAt: new Date().toISOString(), reviewComment: comment });
    refresh();
  };

  return (
    <Show when={project()} fallback={<div class="text-center py-16 text-gray-400">项目不存在</div>}>
      {(proj) => (
        <div>
          <div class="flex items-start justify-between mb-5">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <A href="/" class="text-xs text-gray-400 hover:text-gray-600">← 返回台账</A>
              </div>
              <h2 class="text-xl font-bold text-gray-900">{proj().name}</h2>
              <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{proj().pipelineName}</span>
                <span>·</span>
                <span>DN{proj().pipelineDiameter}</span>
                <span>·</span>
                <span>{proj().inspectionLength}m</span>
                <span>·</span>
                <span>{proj().robotModel}</span>
                <span>·</span>
                <span>标注: {proj().annotator}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <A href={`/mileage/${proj().id}`} class="btn-secondary btn-sm">里程表</A>
              <A href={`/history/${proj().id}`} class="btn-secondary btn-sm">版本历史</A>
              <A href={`/export/${proj().id}`} class="btn-primary btn-sm">导出</A>
            </div>
          </div>

          <AlertBanner projectId={proj().id} />

          <div class="grid grid-cols-4 gap-4 mb-5">
            <div class="card text-center">
              <div class="text-2xl font-bold text-gray-800">{frames().length}</div>
              <div class="text-xs text-gray-500">巡检帧</div>
            </div>
            <div class="card text-center">
              <div class="text-2xl font-bold text-red-600">{defects().length}</div>
              <div class="text-xs text-gray-500">缺陷标注</div>
            </div>
            <div class="card text-center">
              <div class="text-2xl font-bold text-amber-600">{defects().filter((d) => d.reviewStatus === "pending").length}</div>
              <div class="text-xs text-gray-500">待复核</div>
            </div>
            <div class="card text-center">
              <div class="text-2xl font-bold text-green-600">{defects().filter((d) => d.reviewStatus === "approved").length}</div>
              <div class="text-xs text-gray-500">已通过</div>
            </div>
          </div>

          <div class="card mb-5">
            <h3 class="font-medium text-sm mb-3">帧浏览</h3>
            <FrameViewer
              frames={frames()}
              defects={defects()}
              currentFrameId={selectedFrame()}
              onSelectFrame={setSelectedFrame}
            />
          </div>

          <div class="card">
            <div class="flex items-center gap-4 mb-4 border-b border-gray-200 pb-3">
              <button class={`text-sm font-medium pb-1 ${tab() === "defects" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setTab("defects")}>
                缺陷列表 ({currentDefects().length})
              </button>
              <button class={`text-sm font-medium pb-1 ${tab() === "annotate" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setTab("annotate")}>
                新增标注
              </button>
            </div>

            <Show when={tab() === "defects"}>
              <Show when={currentDefects().length > 0} fallback={
                <p class="text-sm text-gray-400 text-center py-4">当前帧暂无缺陷标注</p>
              }>
                <div class="space-y-3">
                  <For each={currentDefects()}>
                    {(d) => (
                      <div class="relative">
                        <DefectAnnotation defect={d} onApprove={approveDefect} onReject={rejectDefect} showActions />
                        <button class="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500" onClick={() => deleteDefect(d.id)}>删除</button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Show>

            <Show when={tab() === "annotate"}>
              <Show when={selectedFrame()} fallback={<p class="text-sm text-gray-400 text-center py-4">请先选择一帧</p>}>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500 mb-3">为帧 #{currentFrame()?.frameIndex} (里程 {currentFrame()?.mileage}m) 添加缺陷标注</p>
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">缺陷类型</label>
                      <select class="select-field" value={newDefectType()} onChange={(e) => setNewDefectType(e.currentTarget.value as DefectType)}>
                        {Object.entries(DEFECT_TYPE_LABELS).map(([k, v]) => (
                          <option value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">等级</label>
                      <select class="select-field" value={newDefectSeverity()} onChange={(e) => setNewDefectSeverity(Number(e.currentTarget.value) as SeverityLevel)}>
                        {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                          <option value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">位置</label>
                      <input class="input-field" value={newDefectPosition()} onInput={(e) => setNewDefectPosition(e.currentTarget.value)} placeholder="例: 管顶2点钟" />
                    </div>
                    <div class="col-span-3">
                      <label class="block text-xs text-gray-500 mb-1">描述</label>
                      <textarea class="input-field" rows={2} value={newDefectDesc()} onInput={(e) => setNewDefectDesc(e.currentTarget.value)} placeholder="缺陷详细描述…" />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">长度(mm)</label>
                      <input type="number" class="input-field" value={newDefectLength()} onInput={(e) => setNewDefectLength(Number(e.currentTarget.value))} />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-1">宽度(mm)</label>
                      <input type="number" class="input-field" value={newDefectWidth()} onInput={(e) => setNewDefectWidth(Number(e.currentTarget.value))} />
                    </div>
                    <div class="flex items-end">
                      <button class="btn-primary w-full" onClick={addDefect}>添加标注</button>
                    </div>
                  </div>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
}
