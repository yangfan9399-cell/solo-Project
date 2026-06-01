import { Form } from "@remix-run/react";
import type { User } from "@prisma/client";
import { getRoleName } from "../../../.server/session.server";

interface HeaderProps {
  user: Pick<User, "name" | "role">;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">公益物资捐赠入库与发放追踪系统</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
        </div>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            退出登录
          </button>
        </Form>
      </div>
    </header>
  );
}
