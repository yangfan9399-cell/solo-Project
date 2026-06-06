import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import "~/styles/globals.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "试剂列表" },
    { path: "/requisitions", label: "我的领用" },
    { path: "/approvals", label: "审批中心" },
    { path: "/returns", label: "归还核验" },
    { path: "/statistics", label: "统计分析" },
  ];

  return (
    <Layout>
      <header className="header">
        <div className="header-inner">
          <div className="logo">🧪 危化品领用管理平台</div>
          <nav className="nav">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path)) ? "active" : ""}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </Layout>
  );
}
