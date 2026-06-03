import { A, useLocation } from "@solidjs/router";

export default function Nav() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "仪表盘", icon: "📊" },
    { path: "/requests", label: "借阅申请", icon: "📋" },
    { path: "/requests/new", label: "新建申请", icon: "➕" },
    { path: "/kanban", label: "流转看板", icon: "📈" },
    { path: "/renewals", label: "续借管理", icon: "🔄" },
    { path: "/overdue", label: "逾期催还", icon: "⚠️" },
    { path: "/exceptions", label: "异常反馈", icon: "🚨" }
  ];

  return (
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-2">
            <span class="text-2xl">📚</span>
            <span class="text-xl font-bold text-primary-700">馆际互借系统</span>
          </div>
          
          <div class="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <A
                key={item.path}
                href={item.path}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span class="mr-1">{item.icon}</span>
                {item.label}
              </A>
            ))}
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">读者服务馆员</span>
            <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
              馆
            </div>
          </div>
        </div>
      </div>
      
      <div class="md:hidden border-t border-gray-200 px-2 py-2 overflow-x-auto">
        <div class="flex space-x-1">
          {navItems.map((item) => (
            <A
              key={item.path}
              href={item.path}
              class={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                location.pathname === item.path
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span class="mr-1">{item.icon}</span>
              {item.label}
            </A>
          ))}
        </div>
      </div>
    </nav>
  );
}
