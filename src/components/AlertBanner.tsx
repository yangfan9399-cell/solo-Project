import { Show, For, createSignal, onMount } from "solid-js";
import type { Anomaly } from "../lib/types";
import { storage } from "../lib/storage";
import { anomalyTypeLabel, formatDateTime } from "../lib/utils";

export default function AlertBanner(props: { projectId?: string }) {
  const [anomalies, setAnomalies] = createSignal<Anomaly[]>([]);
  const [dismissed, setDismissed] = createSignal<Set<string>>(new Set());

  onMount(() => {
    const all = props.projectId
      ? storage.anomalies.getByProject(props.projectId)
      : storage.anomalies.getAll();
    setAnomalies(all.filter((a) => !a.resolved));
  });

  const visible = () => anomalies().filter((a) => !dismissed().has(a.id));

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const resolve = (id: string) => {
    storage.anomalies.resolve(id);
    setAnomalies((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Show when={visible().length > 0}>
      <div class="mb-5 space-y-2">
        <For each={visible()}>
          {(a) => (
            <div class={`flex items-center gap-3 px-4 py-3 rounded-lg border ${a.severity === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={a.severity === "error" ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"} />
              </svg>
              <div class="flex-1 min-w-0">
                <span class="font-medium text-xs mr-2">[{anomalyTypeLabel(a.type)}]</span>
                <span class="text-sm">{a.description}</span>
                <span class="text-xs ml-2 opacity-70">{formatDateTime(a.createdAt)}</span>
              </div>
              <button class="text-xs font-medium hover:underline" onClick={() => resolve(a.id)}>标为已处理</button>
              <button class="text-xs opacity-60 hover:opacity-100" onClick={() => dismiss(a.id)}>关闭</button>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}
