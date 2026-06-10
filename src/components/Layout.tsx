import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  PieChart,
  Menu,
  X,
  Package,
} from 'lucide-react'

const navItems = [
  { path: '/', label: '盘点记录', icon: ClipboardList },
  { path: '/assets', label: '资产列表', icon: Package },
  { path: '/approval', label: '审批流程', icon: FileText },
  { path: '/review', label: '复盘统计', icon: PieChart },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-600 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8" />
            {sidebarOpen && (
              <span className="font-bold text-lg">固定资产系统</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-blue-700 transition-colors ${
                      isActive ? 'bg-blue-700 border-l-4 border-white' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-blue-700 hover:bg-blue-700 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find((item) => item.path === location.pathname)?.label || '首页'}
          </h1>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}