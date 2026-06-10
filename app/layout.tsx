import './globals.css'
import type { Metadata } from 'next'
import { LayoutDashboard, ClipboardList, FileSearch, BarChart3, Phone, Send, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: '城市供水管网漏损工单系统',
  description: '供水管网漏损工单派发与复核系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { icon: LayoutDashboard, label: '工单列表', href: '/' },
    { icon: Phone, label: '登记报修', href: '/report' },
    { icon: Send, label: '派单管理', href: '/dispatch' },
    { icon: ClipboardList, label: '回填处理', href: '/repair' },
    { icon: CheckCircle, label: '复核确认', href: '/review' },
    { icon: FileSearch, label: '工单详情', href: '/detail' },
    { icon: BarChart3, label: '复盘统计', href: '/statistics' },
  ]

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <div className="flex">
          <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-blue-800">供水管网工单系统</h1>
              <p className="text-sm text-gray-500 mt-1">漏损报修派发与复核</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}