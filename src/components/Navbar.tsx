'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Thermometer, ClipboardCheck, ShieldCheck, BarChart3, Users } from 'lucide-react'
import clsx from 'clsx'
import { Role, RoleLabels } from '@/lib/types'
import { useState } from 'react'

interface NavbarProps {
  currentRole: Role
  onRoleChange: (role: Role) => void
}

const navItems = [
  { href: '/', label: '批次列表', icon: Package },
  { href: '/register', label: '入库登记', icon: Thermometer, roles: [Role.WAREHOUSE_CLERK] },
  { href: '/deviation', label: '偏差判定', icon: ClipboardCheck, roles: [Role.QUALITY_MANAGER] },
  { href: '/review', label: '复核处置', icon: ShieldCheck, roles: [Role.REVIEWER] },
  { href: '/analysis', label: '复盘分析', icon: BarChart3 },
]

export function Navbar({ currentRole, onRoleChange }: NavbarProps) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole)
  )

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">冷链药品管理系统</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">角色：</span>
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(Role).map((role) => (
                  <option key={role} value={role}>
                    {RoleLabels[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
