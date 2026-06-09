"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FlaskConical,
  ClipboardList,
  FileCheck,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface SidebarProps {
  role: UserRole;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "首页概览",
      href: "/",
      icon: Home,
      roles: ["INSPECTION_OFFICER", "LAB_TECHNICIAN", "DISPOSAL_REVIEWER"],
    },
    {
      label: "样品管理",
      href: "/samples",
      icon: FlaskConical,
      roles: ["INSPECTION_OFFICER", "LAB_TECHNICIAN", "DISPOSAL_REVIEWER"],
    },
    {
      label: "检测任务",
      href: "/lab-tasks",
      icon: ClipboardList,
      roles: ["LAB_TECHNICIAN"],
    },
    {
      label: "处置复核",
      href: "/disposals",
      icon: FileCheck,
      roles: ["DISPOSAL_REVIEWER"],
    },
    {
      label: "统计复盘",
      href: "/analytics",
      icon: BarChart3,
      roles: ["INSPECTION_OFFICER", "LAB_TECHNICIAN", "DISPOSAL_REVIEWER"],
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-customs-800 text-white flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-customs-700">
        <Shield className="w-8 h-8 mr-3 text-customs-300" />
        <div>
          <h1 className="font-bold text-lg">海关查验平台</h1>
          <p className="text-xs text-customs-300">样品送检管理系统</p>
        </div>
      </div>
      <nav className="flex-1 py-4">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-sm transition-colors",
                isActive
                  ? "bg-customs-700 text-white border-l-4 border-customs-400"
                  : "text-customs-200 hover:bg-customs-700 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-customs-700">
        <div className="text-xs text-customs-400">
          当前角色：
          <span className="text-customs-200">
            {role === "INSPECTION_OFFICER" && "查验关员"}
            {role === "LAB_TECHNICIAN" && "实验室人员"}
            {role === "DISPOSAL_REVIEWER" && "处置复核人"}
          </span>
        </div>
      </div>
    </aside>
  );
}
