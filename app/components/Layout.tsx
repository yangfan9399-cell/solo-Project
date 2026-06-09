import { Form, NavLink } from "@remix-run/react";
import type { Role } from "@prisma/client";

interface LayoutProps {
  user: { id: string; email: string; name: string; role: Role };
  children: React.ReactNode;
}

const roleLabels: Record<Role, string> = {
  CONSULTANT: "顾问",
  CLIENT: "客户",
  AGENT: "代理人",
  SUPERVISOR: "主管",
};

export default function Layout({ user, children }: LayoutProps) {
  const navItems = getNavItems(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">商标续展系统</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-700 font-medium">{user.name}</span>
                <span className="ml-2 text-gray-500">({roleLabels[user.role]})</span>
              </div>
              <Form action="/logout" method="post">
                <button
                  type="submit"
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  退出登录
                </button>
              </Form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function getNavItems(role: Role): { to: string; label: string; end?: boolean }[] {
  const base = [
    { to: "/", label: "首页", end: true },
  ];

  switch (role) {
    case "CONSULTANT":
      return [
        ...base,
        { to: "/trademarks", label: "商标管理" },
        { to: "/analytics", label: "数据复盘" },
      ];
    case "CLIENT":
      return [
        ...base,
        { to: "/trademarks", label: "我的商标" },
      ];
    case "AGENT":
      return [
        ...base,
        { to: "/trademarks", label: "审核队列" },
        { to: "/analytics", label: "数据复盘" },
      ];
    case "SUPERVISOR":
      return [
        ...base,
        { to: "/trademarks", label: "复核队列" },
        { to: "/analytics", label: "数据复盘" },
      ];
    default:
      return base;
  }
}
