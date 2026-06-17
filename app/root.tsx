import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
  useLocation,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import styles from "./styles.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="logo">🐟</div>
              <div className="brand">
                <h1>鱼道流速评估</h1>
                <span>小型水电站专用</span>
              </div>
            </div>
            <nav className="nav">
              <Link to="/" className={location.pathname === "/" ? "nav-item active" : "nav-item"}>
                <span className="nav-icon">📋</span>
                <span>项目台账</span>
              </Link>
              <Link to="/projects/new" className={location.pathname.startsWith("/projects/new") ? "nav-item active" : "nav-item"}>
                <span className="nav-icon">➕</span>
                <span>新建评估</span>
              </Link>
              <Link to="/reports" className={location.pathname.startsWith("/reports") ? "nav-item active" : "nav-item"}>
                <span className="nav-icon">📊</span>
                <span>报告导出</span>
              </Link>
            </nav>
            <div className="sidebar-footer">
              <div className="version-tag">v1.0.0</div>
              <div className="status-dot ok"></div>
              <span className="status-text">数据库在线</span>
            </div>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
