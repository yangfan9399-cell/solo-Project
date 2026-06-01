import { NavLink } from "@remix-run/react";

type UserRole = "ADMIN" | "SOCIAL_WORKER" | "MANAGER";

interface SidebarProps {
  userRole: UserRole;
}

interface MenuItem {
  label: string;
  to: string;
  icon: string;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { label: "仪表盘", to: "/dashboard", icon: "📊", roles: ["ADMIN", "SOCIAL_WORKER", "MANAGER"] },
  { label: "捐赠批次", to: "/donations", icon: "📦", roles: ["ADMIN", "MANAGER"] },
  { label: "待质检批次", to: "/donations?status=PENDING", icon: "✅", roles: ["ADMIN"] },
  { label: "待入库批次", to: "/donations?status=APPROVED", icon: "📥", roles: ["ADMIN"] },
  { label: "库存管理", to: "/stock", icon: "🏪", roles: ["ADMIN", "MANAGER"] },
  { label: "受助对象", to: "/recipients", icon: "👥", roles: ["SOCIAL_WORKER", "MANAGER"] },
  { label: "发放申请", to: "/applications", icon: "📝", roles: ["SOCIAL_WORKER", "MANAGER"] },
  { label: "发放管理", to: "/distributions", icon: "🚚", roles: ["ADMIN", "SOCIAL_WORKER"] },
  { label: "异常记录", to: "/exceptions", icon: "⚠️", roles: ["ADMIN", "MANAGER"] },
];

export function Sidebar({ userRole }: SidebarProps) {
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
          <span className="text-2xl">❤️</span>
          公益物资追踪
        </h1>
      </div>
      <nav className="p-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
