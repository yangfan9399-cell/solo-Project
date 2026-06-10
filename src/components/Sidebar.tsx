import Link from 'next/link'
import { useState } from 'react'

interface SidebarProps {
  active: string
}

export default function Sidebar({ active }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'applications', label: '申请管理', icon: '📝' },
    { id: 'software', label: '软件管理', icon: '💻' },
    { id: 'statistics', label: '统计分析', icon: '📈' },
    { id: 'alerts', label: '预警管理', icon: '⚠️' },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            {!collapsed && (
              <span className="font-bold text-gray-800">许可证管理</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/${item.id}`}
                  className={`sidebar-link ${active === item.id ? 'active' : ''}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-4 border-t border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-500">{collapsed ? '▶' : '◀'}</span>
        </button>
      </div>
    </aside>
  )
}