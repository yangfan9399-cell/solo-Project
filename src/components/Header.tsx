"use client";

import { User, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { UserRole } from "@prisma/client";

interface HeaderProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    department?: string | null;
    employeeId?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  const roleLabels: Record<UserRole, string> = {
    INSPECTION_OFFICER: "查验关员",
    LAB_TECHNICIAN: "实验室人员",
    DISPOSAL_REVIEWER: "处置复核人",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          欢迎回来，{user.name}
        </h2>
        <p className="text-sm text-slate-500">
          {roleLabels[user.role]}
          {user.department && ` · ${user.department}`}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-customs-100 flex items-center justify-center">
            <User className="w-5 h-5 text-customs-600" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{user.username}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="退出登录"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
