import { A } from "@solidjs/router";
import { Show, onMount } from "solid-js";
import { storage } from "../lib/storage";
import { ensureSeedData } from "../lib/seed";
import { createSignal } from "solid-js";

export default function Layout(props: { children: any }) {
  const [anomalyCount, setAnomalyCount] = createSignal(0);

  onMount(() => {
    ensureSeedData();
    const anomalies = storage.anomalies.getAll().filter((a) => !a.resolved);
    setAnomalyCount(anomalies.length);
  });

  return (
    <div class="min-h-screen flex">
      <aside class="w-60 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div class="p-4 border-b border-slate-700">
          <h1 class="text-sm font-bold leading-tight">管线机器人巡检</h1>
          <p class="text-xs text-slate-400 mt-1">缺陷帧标注平台</p>
        </div>
        <nav class="flex-1 py-3">
          <A href="/" class="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            项目台账
          </A>
          <A href="/review" class="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            复核工作台
          </A>
          <A href="/anomalies" class="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            异常提示
            <Show when={anomalyCount() > 0}>
              <span class="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-medium">{anomalyCount()}</span>
            </Show>
          </A>
        </nav>
        <div class="p-4 border-t border-slate-700 text-xs text-slate-500">
          v1.0.0 · 本地存储模式
        </div>
      </aside>
      <main class="flex-1 overflow-auto">
        <div class="max-w-7xl mx-auto px-6 py-6">
          {props.children}
        </div>
      </main>
    </div>
  );
}
