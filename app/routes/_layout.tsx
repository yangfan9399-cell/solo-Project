import { NavLink, Outlet } from "@remix-run/react";
import { ReactNode } from "react";

const navItems = [
  { to: "/", icon: "📋", label: "工作台" },
  { to: "/batches", icon: "🧪", label: "清洗批次" },
  { to: "/records", icon: "💿", label: "唱片库" },
  { to: "/solutions", icon: "🧴", label: "清洗液" },
  { to: "/maintenance", icon: "🔧", label: "维护提醒" },
  { to: "/export", icon: "📤", label: "导出数据" },
];

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">◉ Vinyl Lab</div>
          <div className="sidebar-subtitle">黑胶清洗记录工作台</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
