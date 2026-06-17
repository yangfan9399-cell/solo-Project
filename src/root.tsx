import { onMount, createSignal, Show, lazy, Suspense } from "solid-js";
import { A, HashRouter, Route } from "@solidjs/router";
import "./app.css";
import { ensureSeedData, resetSeedData } from "./lib/seed";
import { storage } from "./lib/storage";

const ProjectLedger = lazy(() => import("./routes/index"));
const ProjectDetail = lazy(() => import("./routes/project/[id]"));
const ReviewWorkbench = lazy(() => import("./routes/review/index"));
const AnomaliesPage = lazy(() => import("./routes/anomalies/index"));
const MileagePage = lazy(() => import("./routes/mileage/[id]"));
const HistoryPage = lazy(() => import("./routes/history/[id]"));
const ExportPage = lazy(() => import("./routes/export/[id]"));

function Layout(props: { children: any }) {
  const [anomalyCount, setAnomalyCount] = createSignal(0);

  const refreshAnomalies = () => {
    const anomalies = storage.anomalies.getAll().filter((a) => !a.resolved);
    setAnomalyCount(anomalies.length);
  };

  onMount(() => {
    ensureSeedData();
    refreshAnomalies();
  });

  return (
    <div class="min-h-screen flex">
      <aside class="w-60 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div class="p-4 border-b border-slate-700">
          <h1 class="text-sm font-bold leading-tight">管线机器人巡检</h1>
          <p class="text-xs text-slate-400 mt-1">缺陷帧标注平台</p>
        </div>
        <nav class="flex-1 py-3">
          <A href="/" class="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" end>
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
          <p class="mb-2">v1.0.0 · 本地存储模式</p>
          <button
            class="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition-colors"
            onClick={() => {
              if (confirm("确定重置所有样例数据？")) {
                resetSeedData();
                window.location.reload();
              }
            }}
          >
            重置样例数据
          </button>
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

export default function App() {
  return (
    <HashRouter root={(props) => (
      <Layout>
        <Suspense fallback={
          <div class="flex items-center justify-center h-64">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        }>
          {props.children}
        </Suspense>
      </Layout>
    )}>
      <Route path="/" component={ProjectLedger} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/review" component={ReviewWorkbench} />
      <Route path="/anomalies" component={AnomaliesPage} />
      <Route path="/mileage/:id" component={MileagePage} />
      <Route path="/history/:id" component={HistoryPage} />
      <Route path="/export/:id" component={ExportPage} />
    </HashRouter>
  );
}
