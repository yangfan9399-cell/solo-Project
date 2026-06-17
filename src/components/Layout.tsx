import { Component, ParentProps, children as Children, createMemo } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useDatabase, getAnomalies } from "~/lib/database";

const navItems = [
  { path: "/", label: "工作台", icon: "📊" },
  { path: "/ledger", label: "项目台账", icon: "📋" },
  { path: "/map", label: "导览地图", icon: "🗺️" },
  { path: "/inspections", label: "巡检任务", icon: "✅" },
  { path: "/versions", label: "版本历史", icon: "📜" },
  { path: "/exports", label: "导出记录", icon: "📤" }
];

const Layout: Component<ParentProps> = (props) => {
  const location = useLocation();
  const { state } = useDatabase();
  const anomalies = createMemo(() => getAnomalies());
  const c = Children(() => props.children);

  const totalEntities = () => {
    const s = state();
    return s.channels.length + s.entrances.length + s.signs.length +
           s.equipment.length + s.maps.length + s.inspections.length;
  };

  return (
    <div class="min-h-screen flex bg-slate-100">
      <aside class="w-64 bg-slate-900 text-white flex flex-col fixed h-full">
        <div class="p-6 border-b border-slate-700">
          <h1 class="text-lg font-bold flex items-center gap-2">
            <span class="text-2xl">🏛️</span>
            <div>
              <div>人防空间</div>
              <div class="text-xs text-slate-400 font-normal">导览维护系统</div>
            </div>
          </h1>
        </div>

        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <A
              href={item.path}
              class={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                location.pathname === item.path
                  ? "bg-primary-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span class="text-lg">{item.icon}</span>
              <span class="font-medium">{item.label}</span>
              {item.path === "/ledger" && (
                <span class="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded-full">
                  {totalEntities()}
                </span>
              )}
              {item.path === "/" && anomalies().length > 0 && (
                <span class="ml-auto text-xs bg-danger-500 px-2 py-0.5 rounded-full">
                  {anomalies().length}
                </span>
              )}
            </A>
          ))}
        </nav>

        <div class="p-4 border-t border-slate-700">
          <div class="text-xs text-slate-400">
            <div>当前批次: {state().currentBatchId}</div>
            <div class="mt-1">最后更新: {new Date().toLocaleDateString("zh-CN")}</div>
          </div>
        </div>
      </aside>

      <main class="flex-1 ml-64">
        <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div class="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">
                {navItems.find(n => n.path === location.pathname)?.label || "系统"}
              </h2>
              <p class="text-sm text-gray-500">
                城市地下人防空间数字化管理平台
              </p>
            </div>
            <div class="flex items-center gap-4">
              {anomalies().length > 0 && (
                <A href="/" class="flex items-center gap-2 px-4 py-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors">
                  <span>⚠️</span>
                  <span class="text-sm font-medium">{anomalies().length} 项异常待处理</span>
                </A>
              )}
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  管
                </div>
                <div class="text-sm">
                  <div class="font-medium text-gray-800">管理员</div>
                  <div class="text-xs text-gray-500">system@cdms.gov</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div class="p-8">
          {c()}
        </div>
      </main>
    </div>
  );
};

export default Layout;
