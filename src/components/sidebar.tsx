"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const menuItems = [
  {
    title: "缺陷管理",
    icon: AlertTriangle,
    href: "/",
  },
  {
    title: "登记缺陷",
    icon: FileText,
    href: "/defects/new",
    roles: ["inspector"],
  },
  {
    title: "复盘分析",
    icon: BarChart3,
    href: "/analytics",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const visibleItems = menuItems.filter(
    (item) => !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
          <Sun className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">光伏巡检平台</h1>
          <p className="text-xs text-gray-500">缺陷管理系统</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Settings className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {currentUser?.name || "未登录"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {currentUser?.role === "inspector" && "巡检员"}
              {currentUser?.role === "operation_manager" && "运维主管"}
              {currentUser?.role === "maintenance_worker" && "检修人员"}
              {currentUser?.role === "reviewer" && "复核人"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
