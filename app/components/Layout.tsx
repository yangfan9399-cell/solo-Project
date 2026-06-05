import { Link, NavLink, useLocation } from "react-router";
import { useState } from "react";
import { USER_ROLE_LABELS, type UserRole } from "~/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function Layout({ children, currentRole, onRoleChange }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { to: "/permits", label: "施工许可", icon: "📋" },
    { to: "/permits/new", label: "新建申请", icon: "➕" },
    { to: "/statistics", label: "复盘统计", icon: "📊" },
  ];

  const roles: UserRole[] = ["SECURITY_OFFICER", "ENGINEERING_MANAGER", "SAFETY_REVIEWER"];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            <span>园区施工管理</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">访客施工许可平台</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/permits"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">当前角色</p>
          <div className="space-y-1">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                  currentRole === role
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {USER_ROLE_LABELS[role]}
                {currentRole === role && <span className="ml-2 text-primary-400">●</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {currentRole === "SECURITY_OFFICER" && "安保经办工作台"}
              {currentRole === "ENGINEERING_MANAGER" && "工程管理工作台"}
              {currentRole === "SAFETY_REVIEWER" && "安全复核工作台"}
            </h2>
            <p className="text-sm text-slate-500">
              {USER_ROLE_LABELS[currentRole]}视角
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">
                {currentRole === "SECURITY_OFFICER" && "张安保"}
                {currentRole === "ENGINEERING_MANAGER" && "李工程"}
                {currentRole === "SAFETY_REVIEWER" && "王安全"}
              </p>
              <p className="text-xs text-slate-500">{USER_ROLE_LABELS[currentRole]}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
              {currentRole === "SECURITY_OFFICER" && "张"}
              {currentRole === "ENGINEERING_MANAGER" && "李"}
              {currentRole === "SAFETY_REVIEWER" && "王"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
}
