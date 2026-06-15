import type { LinksFunction, MetaFunction } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import appStyles from '~/styles/app.css?url';

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStyles },
];

export const meta: MetaFunction = () => [
  { title: "古钟楼齿轮报时校准游戏" },
  { name: "description", content: "维修一座走时漂移的古钟楼，通过调整摆长、齿轮比、润滑程度和锤击顺序让报时恢复准确" },
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
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="app">
      <Outlet />
    </div>
  );
}
