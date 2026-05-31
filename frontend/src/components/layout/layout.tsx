import { component$, Slot, useContext, useStore, $ } from '@builder.io/qwik';
import { Link, useNavigate } from '@builder.io/qwik-city';
import { AppStore, ROLE_LABELS } from '~/constants';
import clsx from 'clsx';

export const Layout = component$(() => {
  const store = useContext(AppStore);
  const nav = useNavigate();

  const handleLogout = $(() => {
    store.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    nav('/login');
  });

  const menuItems = [
    { path: '/', label: '工作台', icon: '📊', roles: ['restorer', 'librarian', 'expert'] },
    { path: '/books', label: '古籍管理', icon: '📚', roles: ['librarian', 'restorer'] },
    { path: '/diseases', label: '病害诊断', icon: '🔬', roles: ['restorer', 'expert'] },
    { path: '/processes', label: '修复工序', icon: '⚙️', roles: ['restorer'] },
    { path: '/schedules', label: '排程管理', icon: '📅', roles: ['restorer', 'librarian'] },
    { path: '/reviews', label: '专家复核', icon: '✅', roles: ['expert'] },
    { path: '/materials', label: '材料管理', icon: '📦', roles: ['restorer', 'librarian'] },
    { path: '/archives', label: '档案统计', icon: '📁', roles: ['librarian', 'expert', 'restorer'] },
  ];

  return (
    <div class="flex min-h-screen">
      {/* Sidebar */}
      <aside class="w-64 bg-antique-900 text-white flex flex-col">
        <div class="p-6 border-b border-antique-700">
          <h1 class="text-xl font-bold">古籍修复馆</h1>
          <p class="text-antique-300 text-sm mt-1">纸张病害诊断系统</p>
        </div>
        
        <nav class="flex-1 p-4">
          <ul class="space-y-2">
            {menuItems
              .filter(item => !store.currentUser || item.roles.includes(store.currentUser.role))
              .map(item => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    class={clsx(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                      'hover:bg-antique-800',
                      'active:bg-antique-700'
                    )}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))
            }
          </ul>
        </nav>

        {/* User Info */}
        {store.currentUser && (
          <div class="p-4 border-t border-antique-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">{store.currentUser.name}</p>
                <p class="text-antique-300 text-sm">
                  {ROLE_LABELS[store.currentUser.role]}
                </p>
              </div>
              <button
                onClick$={handleLogout}
                class="px-3 py-1.5 bg-antique-700 hover:bg-antique-600 rounded text-sm"
              >
                退出
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main class="flex-1 overflow-auto">
        <Slot />
      </main>
    </div>
  );
});
