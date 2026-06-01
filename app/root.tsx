import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/styles.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
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
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data || "页面不存在或访问出错"}</p>
        <a href="/" className="btn btn-primary">返回首页</a>
      </div>
    );
  }

  const errorMessage = error instanceof Error ? error.message : "未知错误";

  return (
    <div className="error-container">
      <div className="error-icon">❌</div>
      <h1>出错了</h1>
      <p>{errorMessage}</p>
      <a href="/" className="btn btn-primary">返回首页</a>
    </div>
  );
}
