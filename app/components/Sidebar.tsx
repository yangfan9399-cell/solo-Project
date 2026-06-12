import { NavLink } from "@remix-run/react";
import { cn } from "~/utils/constants";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: "/", label: "工作台", icon: "🏠" },
  { to: "/records", label: "核验记录", icon: "📋" },
  { to: "/processing", label: "处理台", icon: "⚙️" },
  { to: "/dashboard", label: "复盘看板", icon: "📊" },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ocean-500 rounded-lg flex items-center justify-center text-xl">
            🚢
          </div>
          <div>
            <h1 className="font-bold text-lg">铅封核验系统</h1>
            <p className="text-xs text-slate-400">集装箱放箱审批</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-ocean-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">当前角色</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold">
              李
            </div>
            <div>
              <p className="text-sm font-medium">李明</p>
              <p className="text-xs text-slate-400">检验检疫科 · 处理人</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
