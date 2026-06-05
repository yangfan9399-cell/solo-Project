"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "首页", icon: "🏠" },
    { href: "/reports", label: "上报列表", icon: "📋" },
    { href: "/reports/new", label: "新建上报", icon: "➕" },
    { href: "/pharmacist", label: "药师审核", icon: "🔬" },
    { href: "/finance", label: "财务复核", icon: "💰" },
    { href: "/review", label: "复盘统计", icon: "📊" },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">💊</span>
              <span className="text-xl font-bold text-gray-800">药房近效期药品管理平台</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  pathname === item.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="mr-2">👤</span>
              <span>区域药师王</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
