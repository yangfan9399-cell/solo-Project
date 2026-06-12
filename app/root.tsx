import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  NavLink,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import styles from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-slate-50">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl">
                🔊
              </div>
              <div>
                <h1 className="text-xl font-bold">城市噪声投诉监测执法与整改复测平台</h1>
                <p className="text-sm text-slate-400">Urban Noise Complaint Monitoring & Enforcement Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-slate-300">系统运行中</span>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <span className="text-slate-300">当前用户：张伟（执法人员）</span>
            </div>
          </div>
        </div>
        <nav className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white border-b-2 border-blue-500 bg-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`
                }
              >
                📋 投诉列表
              </NavLink>
              <NavLink
                to="/review"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white border-b-2 border-blue-500 bg-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`
                }
              >
                📊 复盘统计
              </NavLink>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-500 text-sm py-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          © 2024 城市噪声投诉监测执法与整改复测平台 · 数据实时同步
        </div>
      </footer>
    </div>
  );
}
