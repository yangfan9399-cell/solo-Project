import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Wind, ListChecks, SlidersHorizontal, ClipboardCheck, Menu, X, RefreshCw, ShieldCheck } from 'lucide-react'

const navItems = [
  { label: '异常队列', icon: ListChecks, path: '/' },
  { label: '阈值规则', icon: SlidersHorizontal, path: '/rules' },
  { label: '复测记录', icon: RefreshCw, path: '/retests' },
  { label: '复核面板', icon: ClipboardCheck, path: '/review' },
  { label: '关闭审计', icon: ShieldCheck, path: '/audit' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-30 flex h-full w-64 flex-col bg-[#0A1628] transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-[#1B2A4A] px-6">
          <Wind className="h-6 w-6 text-[#38BDF8]" />
          <span className="text-sm font-bold text-white leading-tight">
            桅骨风车传感器
            <br />
            校准异常处理台
          </span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1B2A4A] text-[#38BDF8]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 bg-[#0F1D32] min-h-screen">
        <div className="flex h-16 items-center border-b border-[#1B2A4A] px-4 lg:px-6">
          <button
            className="lg:hidden mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  )
}
