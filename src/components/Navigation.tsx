'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/teacher', label: '班主任授权', icon: '👩‍🏫' },
  { href: '/guard', label: '门岗核验', icon: '🚪' },
  { href: '/principal', label: '园长复核', icon: '👨‍💼' },
  { href: '/records', label: '接送记录', icon: '📋' },
  { href: '/statistics', label: '数据统计', icon: '📊' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏫</span>
            <span className="font-bold text-lg">幼儿园接送管理系统</span>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
