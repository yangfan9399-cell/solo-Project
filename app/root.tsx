import type { LinksFunction, MetaFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
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
