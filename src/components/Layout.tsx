import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, FileText, LayoutDashboard, Clock, Building2, AlertTriangle, ChevronRight, User } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '仪表盘', icon: Home },
  { path: '/requests', label: '互借申请', icon: FileText },
  { path: '/kanban', label: '馆际看板', icon: LayoutDashboard },
  { path: '/overdue', label: '逾期追踪', icon: Clock },
  { path: '/libraries', label: '合作馆', icon: Building2 },
  { path: '/exceptions', label: '异常反馈', icon: AlertTriangle },
]

const breadcrumbMap: Record<string, string> = {
  '/': '仪表盘',
  '/requests': '互借申请',
  '/requests/new': '新建申请',
  '/kanban': '馆际看板',
  '/overdue': '逾期追踪',
  '/libraries': '合作馆',
  '/exceptions': '异常反馈',
}

function Breadcrumbs() {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  const crumbs: { label: string; path: string }[] = [{ label: '首页', path: '/' }]

  let currentPath = ''
  for (const segment of pathSegments) {
    currentPath += `/${segment}`
    const label = breadcrumbMap[currentPath] || segment
    crumbs.push({ label, path: currentPath })
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500">
      {crumbs.map((crumb, index) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          <span className={index === crumbs.length - 1 ? 'text-slate-800 font-medium' : 'hover:text-slate-700'}>
            {crumb.label}
          </span>
        </span>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { currentUser, sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'flex flex-col bg-indigo-dark text-white transition-all duration-300 flex-shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className={cn('flex items-center h-16 px-4 border-b border-white/10', sidebarCollapsed ? 'justify-center' : 'gap-3')}>
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-white/10 transition-colors">
            <LayoutDashboard className="w-6 h-6 text-amber-warm" />
          </button>
          {!sidebarCollapsed && (
            <h1 className="text-lg font-serif font-semibold tracking-wide whitespace-nowrap">馆际互借系统</h1>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  sidebarCollapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={cn('border-t border-white/10 p-4', sidebarCollapsed ? 'flex justify-center' : '')}>
          {sidebarCollapsed ? (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.displayName}</p>
                <p className="text-xs text-white/60 truncate">{currentUser.role}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        <header className="flex items-center h-14 px-6 bg-white border-b border-slate-200 flex-shrink-0">
          <Breadcrumbs />
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
