import { NavLink, Outlet } from "react-router";

export default function DashboardLayout() {
  const navItems = [
    { to: "/", label: "仪表盘", icon: "📊" },
    { to: "/permits", label: "作业许可证", icon: "📋" },
    { to: "/workers", label: "人员管理", icon: "👷" },
    { to: "/contractors", label: "承包商", icon: "🏢" },
    { to: "/review/security", label: "安保核验", icon: "🛡️" },
    { to: "/review/safety", label: "安全验收", icon: "⚠️" },
    { to: "/review/manager", label: "项目管理", icon: "📁" },
    { to: "/dashboard", label: "复盘统计", icon: "📈" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">舞台搭建进场系统</h1>
          <p className="text-sm text-slate-400 mt-1">高空作业验收平台</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              管
            </div>
            <div>
              <p className="text-sm font-medium">管理员</p>
              <p className="text-xs text-slate-400">系统管理员</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
