import { Link, useLocation } from "@remix-run/react";
import {
  LayoutDashboard,
  Building2,
  Elevator,
  ClipboardList,
  AlertTriangle,
  Kanban,
  FileWarning,
  Settings,
} from "lucide-react";

interface SidebarProps {
  currentPath: string;
}

const menuItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/elevators", label: "电梯管理", icon: Elevator },
  { path: "/plans", label: "维保计划", icon: ClipboardList },
  { path: "/faults", label: "故障管理", icon: AlertTriangle },
  { path: "/kanban", label: "统计看板", icon: Kanban },
];

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Elevator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">电梯维保</h1>
            <p className="text-xs text-slate-400">管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path ||
              (item.path !== "/" && currentPath.startsWith(item.path));

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3 text-slate-400">
          <Settings className="w-5 h-5" />
          <span className="text-sm">系统设置</span>
        </div>
        <div className="mt-4 px-4">
          <div className="text-xs text-slate-500">当前用户</div>
          <div className="text-sm font-medium">物业管理员</div>
        </div>
      </div>
    </aside>
  );
}
