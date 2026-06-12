import { MOCK_USERS, getCurrentUser } from "@/lib/auth";
import type { CurrentUser } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  OPERATOR: "经办人",
  REVIEWER: "复核人",
  ADMIN: "管理员",
};

const ROLE_COLORS: Record<string, string> = {
  OPERATOR: "bg-blue-100 text-blue-800",
  REVIEWER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-gray-200 text-gray-800",
};

export async function UserSwitcher() {
  const currentUser: CurrentUser = await getCurrentUser();

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">当前身份切换</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${ROLE_COLORS[currentUser.role]}`}>
          {ROLE_LABELS[currentUser.role]}
        </span>
      </div>
      <div className="text-sm text-gray-600 mb-3">
        当前用户：<span className="font-medium text-gray-900">{currentUser.name}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {MOCK_USERS.map((user) => (
          <form key={user.id} action="/api/switch-user" method="POST">
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentUser.id === user.id
                  ? "bg-primary-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {user.name}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
