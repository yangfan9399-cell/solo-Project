import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { ClipboardList, BarChart3, PlusCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: '校园设备报修系统',
  description: '校园设备报修派单与验收闭环管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-8 w-8 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">校园设备报修系统</h1>
              </div>
              <nav className="flex items-center gap-6">
                <Link 
                  href="/" 
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ClipboardList className="h-4 w-4" />
                  报修列表
                </Link>
                <Link 
                  href="/review" 
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  统计复盘
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
