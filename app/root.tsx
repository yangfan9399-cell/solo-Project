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
import stylesheet from "~/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

const NAV_ITEMS = [
  { to: "/", label: "计划列表" },
  { to: "/dashboard", label: "看板统计" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-full flex">
      <aside className="w-56 bg-slate-800 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <h1 className="text-lg font-bold leading-tight">配网停电计划</h1>
          <p className="text-xs text-slate-400 mt-1">通知确认与复电核验</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-2.5 text-sm transition-colors ${
                location.pathname === item.to ||
                (item.to === "/" && location.pathname.startsWith("/plans"))
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
          电力配网管理系统 v1.0
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
