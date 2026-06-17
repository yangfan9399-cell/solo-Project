import { createSignal, onMount, Show } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { storage } from "../../lib/storage";
import { ensureSeedData } from "../../lib/seed";
import type { Project, Defect } from "../../lib/types";
import { projectStatusLabel, projectStatusBadgeClass } from "../../lib/utils";
import MileageTable from "../../components/MileageTable";

export default function MileagePage() {
  const params = useParams();
  const [project, setProject] = createSignal<Project | null>(null);
  const [defects, setDefects] = createSignal<Defect[]>([]);

  onMount(() => {
    ensureSeedData();
    const p = storage.projects.getById(params.id);
    if (p) {
      setProject(p);
      setDefects(storage.defects.getByProject(p.id));
    }
  });

  return (
    <Show when={project()} fallback={<div class="text-center py-16 text-gray-400">项目不存在</div>}>
      {(proj) => (
        <div>
          <div class="flex items-start justify-between mb-5">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <A href={`/project/${proj().id}`} class="text-xs text-gray-400 hover:text-gray-600">← 返回项目详情</A>
              </div>
              <h2 class="text-xl font-bold text-gray-900">缺陷里程表 · {proj().name}</h2>
              <div class="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{proj().pipelineName}</span>
                <span>·</span>
                <span>总长 {proj().inspectionLength}m</span>
                <span>·</span>
                <span>缺陷 {defects().length} 处</span>
              </div>
            </div>
            <A href={`/export/${proj().id}`} class="btn-primary btn-sm">导出数据</A>
          </div>

          <MileageTable defects={defects()} totalLength={proj().inspectionLength} />
        </div>
      )}
    </Show>
  );
}
