import type { LinksFunction, MetaFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from "@remix-run/react";
import runSeed from "~/db/seed.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "/styles.css" },
];

export const meta: MetaFunction = () => [
  { charset: "utf-8" },
  { title: "黑胶唱片清洗批次记录工具" },
  { name: "viewport", content: "width=device-width,initial-scale=1" },
];

export const loader: LoaderFunction = async () => {
  runSeed();
  return json({ ok: true });
};

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  let status = 500;
  let statusText = "服务器内部错误";
  let message = "发生未预期的错误，请稍后再试或返回首页。";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      statusText = "页面不存在";
      message = "您访问的唱片/批次记录或页面链接无效，可能记录已被删除或地址输入有误。";
    } else if (error.status === 401) {
      statusText = "未授权";
      message = "当前会话无权限访问此页面。";
    } else if (error.status === 409) {
      statusText = "数据冲突";
      message = "数据版本冲突，请刷新页面后重试。";
    } else {
      statusText = error.statusText || "请求错误";
      message = "处理您的请求时发生问题，请返回首页重试。";
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <html lang="zh-CN">
      <head>
        <Meta />
        <Links />
        <title>出错了 · 黑胶唱片清洗批次记录工具</title>
      </head>
      <body style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #FDF6EC 0%, #EAD9C3 100%)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', sans-serif",
        padding: 20,
      }}>
        <div style={{
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(92, 59, 30, 0.12)",
          border: "1px solid #E6D4BB",
          padding: 40,
          maxWidth: 560,
          width: "100%",
        }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              fontSize: 56,
              lineHeight: 1,
              fontWeight: 700,
              color: status === 404 ? "#8B5A2B" : "#A9411F",
              fontFamily: "'Georgia', serif",
            }}>{status}</div>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#2C2420",
            }}>{statusText}</div>
          </div>

          <p style={{
            color: "#5C4A3E",
            lineHeight: 1.7,
            margin: "0 0 24px 0",
            fontSize: 14,
          }}>{message}</p>

          {error instanceof Error && (
            <div style={{
              background: "#FBF4EB",
              padding: 12,
              borderRadius: 6,
              marginBottom: 24,
              border: "1px solid #EAD9C3",
              fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
              fontSize: 12,
              color: "#7A5A3A",
              overflow: "auto",
              maxHeight: 200,
            }}>
              {error.name}: {error.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/" style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "9px 18px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              background: "#8B5A2B",
              color: "#ffffff",
              textDecoration: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}>🏠 返回工作台</Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "9px 18px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                background: "#FBF4EB",
                color: "#5C4A3E",
                border: "1px solid #DBC6A8",
                cursor: "pointer",
              }}>↻ 刷新重试</button>
          </div>
        </div>
      </body>
    </html>
  );
}
