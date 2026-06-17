import { createSignal, Show } from "solid-js";
import type { DefectType, ProjectStatus } from "../lib/types";
import { DEFECT_TYPE_LABELS, PROJECT_STATUS_LABELS } from "../lib/types";

interface FilterState {
  keyword: string;
  defectType: DefectType | "";
  status: ProjectStatus | "";
  severity: number | "";
}

export default function FilterBar(props: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  showDefectType?: boolean;
  showSeverity?: boolean;
  showProjectStatus?: boolean;
}) {
  const update = (key: keyof FilterState, value: any) => {
    props.onChange({ ...props.filters, [key]: value });
  };

  return (
    <div class="card mb-5">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-medium text-gray-500 mb-1">关键词检索</label>
          <input
            type="text"
            class="input-field"
            placeholder="项目名、管线名、标注人…"
            value={props.filters.keyword}
            onInput={(e) => update("keyword", e.currentTarget.value)}
          />
        </div>
        <Show when={props.showProjectStatus}>
          <div class="w-40">
            <label class="block text-xs font-medium text-gray-500 mb-1">项目状态</label>
            <select class="select-field" value={props.filters.status} onChange={(e) => update("status", e.currentTarget.value)}>
              <option value="">全部状态</option>
              {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                <option value={k}>{v}</option>
              ))}
            </select>
          </div>
        </Show>
        <Show when={props.showDefectType}>
          <div class="w-40">
            <label class="block text-xs font-medium text-gray-500 mb-1">缺陷类型</label>
            <select class="select-field" value={props.filters.defectType} onChange={(e) => update("defectType", e.currentTarget.value)}>
              <option value="">全部类型</option>
              {Object.entries(DEFECT_TYPE_LABELS).map(([k, v]) => (
                <option value={k}>{v}</option>
              ))}
            </select>
          </div>
        </Show>
        <Show when={props.showSeverity}>
          <div class="w-36">
            <label class="block text-xs font-medium text-gray-500 mb-1">等级</label>
            <select class="select-field" value={props.filters.severity} onChange={(e) => update("severity", Number(e.currentTarget.value) || "")}>
              <option value="">全部等级</option>
              <option value="1">Ⅰ级(轻微)</option>
              <option value="2">Ⅱ级(中等)</option>
              <option value="3">Ⅲ级(严重)</option>
              <option value="4">Ⅳ级(重大)</option>
            </select>
          </div>
        </Show>
        <button class="btn-secondary" onClick={() => props.onChange({ keyword: "", defectType: "", status: "", severity: "" })}>
          重置
        </button>
      </div>
    </div>
  );
}
