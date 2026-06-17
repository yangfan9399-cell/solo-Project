import { component$, Slot, useStyles$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import styles from './layout.css?inline';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: '工作台', icon: '📊' },
  { path: '/sections', label: '项目台账', icon: '📋' },
  { path: '/sections/new', label: '新建薄片', icon: '➕' },
  { path: '/boxes', label: '样本盒管理', icon: '📦' },
  { path: '/versions', label: '版本历史', icon: '📜' },
  { path: '/anomalies', label: '数据异常', icon: '⚠️' },
];

export const AppLayout = component$(() => {
  useStyles$(styles);
  const loc = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return loc.url.pathname === '/';
    return loc.url.pathname.startsWith(path);
  };

  return (
    <div class="flex min-h-screen bg-mineral-950">
      <aside class="w-64 bg-mineral-900 border-r border-mineral-700 flex flex-col">
        <div class="p-6 border-b border-mineral-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-polar-blue to-polar-purple flex items-center justify-center">
              <span class="text-xl">🔬</span>
            </div>
            <div>
              <h1 class="font-bold text-mineral-50 text-sm leading-tight">稀有矿物薄片</h1>
              <p class="text-xs text-mineral-400">显微观察档案</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              class={[
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive(item.path)
                  ? 'bg-mineral-700 text-white shadow-lg shadow-mineral-900/50'
                  : 'text-mineral-300 hover:bg-mineral-800 hover:text-mineral-100'
              ]}
            >
              <span class="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div class="p-4 border-t border-mineral-700">
          <div class="bg-mineral-800 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span class="text-xs text-mineral-300">系统状态</span>
            </div>
            <p class="text-xs text-mineral-400">数据库正常运行</p>
            <p class="text-xs text-mineral-500 mt-1">v1.0.0 · Qwik City</p>
          </div>
        </div>
      </aside>

      <main class="flex-1 flex flex-col min-w-0">
        <header class="h-16 bg-mineral-900/50 border-b border-mineral-700 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div class="flex items-center gap-4">
            <h2 class="text-lg font-semibold text-mineral-100">
              {navItems.find(n => isActive(n.path))?.label || '系统'}
            </h2>
          </div>
          <div class="flex items-center gap-4">
            <div class="relative">
              <input
                type="text"
                placeholder="搜索薄片编号、矿物名称..."
                class="w-72 px-4 py-2 pl-10 bg-mineral-800 border border-mineral-600 rounded-lg text-sm text-mineral-100 placeholder-mineral-400 focus:outline-none focus:ring-2 focus:ring-mineral-500 focus:border-transparent transition-all"
              />
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-mineral-400">🔍</span>
            </div>
            <button class="p-2 hover:bg-mineral-800 rounded-lg transition-colors">
              <span class="text-xl">⚙️</span>
            </button>
          </div>
        </header>

        <div class="flex-1 overflow-auto">
          <Slot />
        </div>
      </main>
    </div>
  );
});
