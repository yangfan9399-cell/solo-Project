'use client'

import { useAuth } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import {
  Home,
  Wrench,
  Building2,
  Zap,
  BarChart3,
  ClipboardList,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { getStatusText } from '@/lib/utils'

const navItems = [
  { href: '/', label: '首页概览', icon: Home, roles: [UserRole.DORM_MANAGER, UserRole.MAINTENANCE_WORKER, UserRole.ENERGY_ADMIN, UserRole.STUDENT] },
  { href: '/repairs', label: '报修管理', icon: Wrench, roles: [UserRole.DORM_MANAGER, UserRole.MAINTENANCE_WORKER, UserRole.STUDENT] },
  { href: '/facilities', label: '设施台账', icon: Building2, roles: [UserRole.DORM_MANAGER, UserRole.MAINTENANCE_WORKER] },
  { href: '/energy', label: '能耗管理', icon: Zap, roles: [UserRole.DORM_MANAGER, UserRole.ENERGY_ADMIN] },
  { href: '/dashboard', label: '风险看板', icon: BarChart3, roles: [UserRole.DORM_MANAGER, UserRole.ENERGY_ADMIN] },
  { href: '/surveys', label: '满意度调查', icon: ClipboardList, roles: [UserRole.DORM_MANAGER, UserRole.STUDENT] },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, login, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loader mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
        <div className="card p-8 w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">高校宿舍管理系统</h1>
            <p className="text-gray-500 mt-2">请选择您的角色登录</p>
          </div>
          <div className="space-y-3">
            {[
              { role: UserRole.DORM_MANAGER, label: '宿管员', desc: '管理报修派单和设施' },
              { role: UserRole.MAINTENANCE_WORKER, label: '维修师傅', desc: '处理维修任务' },
              { role: UserRole.ENERGY_ADMIN, label: '能源管理员', desc: '核查能耗异常' },
              { role: UserRole.STUDENT, label: '学生', desc: '提交报修申请' },
            ].map(({ role, label, desc }) => (
              <button
                key={role}
                onClick={() => login(role)}
                className="w-full p-4 border border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <User className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">宿舍管理</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-500">{getStatusText(user.role)}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg mr-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredNavItems.find((item) => item.href === pathname)?.label || '首页'}
            </h2>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
