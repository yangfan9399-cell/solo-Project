import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplets,
  FileText,
  ClipboardList,
  Bell,
  Megaphone,
  Menu,
  X,
  Users,
  MapPin,
} from 'lucide-react';
import { cn } from '../utils/cn';

const navigation = [
  { name: '调度看板', href: '/', icon: LayoutDashboard, roles: ['admin', 'chemist', 'repair_crew', 'hotline'] },
  { name: '水质检测', href: '/water-quality', icon: Droplets, roles: ['admin', 'chemist'] },
  { name: '报修管理', href: '/repair-reports', icon: FileText, roles: ['admin', 'hotline', 'repair_crew'] },
  { name: '工单调度', href: '/work-orders', icon: ClipboardList, roles: ['admin', 'repair_crew'] },
  { name: '停水公告', href: '/water-stop-notices', icon: Megaphone, roles: ['admin', 'hotline'] },
  { name: '通知中心', href: '/notifications', icon: Bell, roles: ['admin', 'chemist', 'repair_crew', 'hotline'] },
  { name: '地点管理', href: '/locations', icon: MapPin, roles: ['admin'] },
  { name: '人员管理', href: '/users', icon: Users, roles: ['admin'] },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [currentRole] = useState('admin');

  const filteredNav = navigation.filter((item) => item.roles.includes(currentRole));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={cn('fixed inset-0 bg-gray-900/50 z-40 lg:hidden', sidebarOpen ? 'block' : 'hidden')} onClick={() => setSidebarOpen(false)} />

      <aside className={cn('fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-gray-900">供水调度系统</span>
          </div>
          <button className="lg:hidden p-2 rounded-md hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button className="lg:hidden p-2 rounded-md hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                当前角色：<span className="font-medium text-gray-900">管理员</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                管
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
