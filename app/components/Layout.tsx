import { Link, useLocation } from "@remix-run/react";

export default function Layout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "首页概览", icon: "🏠" },
    { path: "/exhibits", label: "展品档案", icon: "🏺" },
    { path: "/loans", label: "借展申请", icon: "📋" },
    { path: "/kanban", label: "进度看板", icon: "📊" },
    { path: "/exceptions", label: "异常反馈", icon: "⚠️" },
    { path: "/damages", label: "损伤记录", icon: "🔧" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>
            <span>🏛️</span>
            <span>文博借展系统</span>
          </h1>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">主要功能</div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-title">{title}</div>
          <div className="header-user">
            <span>藏品管理员</span>
            <div className="user-avatar">张</div>
          </div>
        </header>
        <div className="content-wrapper">{children}</div>
      </main>
    </div>
  );
}
