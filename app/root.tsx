import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import tailwindStyles from "./styles/tailwind.css?url";
import { getUser } from "../.server/session.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStyles },
];

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    user: await getUser(request),
    ENV: {
      APP_NAME: "公益物资捐赠追踪系统",
    },
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-gray-50">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <title>出错了</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">页面出错了</h1>
          <p className="text-gray-600 mb-4">请刷新页面重试，或联系系统管理员</p>
          <a href="/" className="text-primary-600 hover:text-primary-700 font-medium">
            返回首页
          </a>
        </div>
      </body>
    </html>
  );
}
