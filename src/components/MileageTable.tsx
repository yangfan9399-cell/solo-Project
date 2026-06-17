import { For, Show } from "solid-js";
import type { Defect } from "../lib/types";
import { DEFECT_TYPE_LABELS, SEVERITY_LABELS } from "../lib/types";
import { defectTypeBadgeClass, severityBadgeClass, reviewStatusLabel, reviewStatusBadgeClass } from "../lib/utils";

interface Props {
  defects: Defect[];
  totalLength: number;
}

export default function MileageTable(props: Props) {
  const sorted = () => [...props.defects].sort((a, b) => a.mileage - b.mileage);
  const maxMileage = () => props.totalLength || Math.max(...props.defects.map((d) => d.mileage), 1);

  return (
    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="table-header">里程(m)</th>
              <th class="table-header">里程比例</th>
              <th class="table-header">缺陷类型</th>
              <th class="table-header">等级</th>
              <th class="table-header">位置</th>
              <th class="table-header">尺寸</th>
              <th class="table-header">描述</th>
              <th class="table-header">复核状态</th>
              <th class="table-header">标注人</th>
            </tr>
          </thead>
          <tbody>
            <For each={sorted()}>
              {(d) => {
                const pct = () => ((d.mileage / maxMileage()) * 100).toFixed(1);
                return (
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="table-cell font-mono font-medium">{d.mileage.toFixed(1)}</td>
                    <td class="table-cell">
                      <div class="flex items-center gap-2">
                        <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div class="h-full bg-primary-500 rounded-full" style={{ width: `${pct()}%` }} />
                        </div>
                        <span class="text-xs text-gray-400">{pct()}%</span>
                      </div>
                    </td>
                    <td class="table-cell"><span class={defectTypeBadgeClass(d.type)}>{DEFECT_TYPE_LABELS[d.type]}</span></td>
                    <td class="table-cell"><span class={severityBadgeClass(d.severity)}>{SEVERITY_LABELS[d.severity]}</span></td>
                    <td class="table-cell">{d.position}</td>
                    <td class="table-cell text-xs">
                      <Show when={d.length > 0}>L:{d.length}mm </Show>
                      <Show when={d.width > 0}>W:{d.width}mm</Show>
                      <Show when={d.length === 0 && d.width === 0}>-</Show>
                    </td>
                    <td class="table-cell max-w-[200px] truncate">{d.description}</td>
                    <td class="table-cell"><span class={reviewStatusBadgeClass(d.reviewStatus)}>{reviewStatusLabel(d.reviewStatus)}</span></td>
                    <td class="table-cell">{d.annotatedBy}</td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </div>
      <div class="mt-4 pt-3 border-t border-gray-100">
        <div class="relative h-8 bg-gray-100 rounded">
          <For each={sorted()}>
            {(d) => {
              const left = () => `${(d.mileage / maxMileage()) * 100}%`;
              const color = () => {
                const map: Record<string, string> = { crack: "#ef4444", deposit: "#f59e0b", misalign: "#8b5cf6", leak: "#3b82f6", corrosion: "#f97316", disjoint: "#ec4899", branch: "#14b8a6", deform: "#6366f1" };
                return map[d.type] || "#6b7280";
              };
              return (
                <div
                  class="absolute top-0 h-full w-0.5 opacity-80"
                  style={{ left: left(), "background-color": color() }}
                  title={`${d.mileage}m - ${DEFECT_TYPE_LABELS[d.type]}`}
                />
              );
            }}
          </For>
          <div class="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 px-1">
            <span>0m</span>
            <span>{maxMileage().toFixed(0)}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
