import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getUserFromSession } from '~/utils/session.server';
import stylesheet from '~/tailwind.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
];

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  return json({ user });
};

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <div className="min-h-screen flex flex-col">
          {user && (
            <nav className="bg-red-700 text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <span className="text-xl font-bold">🔥 消防隐患巡检系统</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      {user.name} ({user.role === 'INSPECTOR' ? '巡检员' : user.role === 'PROPERTY_MANAGER' ? '物业经办人' : '消防复核人'})
                    </span>
                    <form action="/logout" method="post">
                      <button
                        type="submit"
                        className="bg-red-800 hover:bg-red-900 px-3 py-1 rounded text-sm"
                      >
                        退出
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </nav>
          )}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
