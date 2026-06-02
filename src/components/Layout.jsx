import { useState, useEffect } from 'react';
import { useRouter } from 'astro/client';
import { getUser, removeToken, formatMoney } from '../utils/api';

export default function Layout({ children, activeMenu }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    removeToken();
    window.location.href = '/login';
  };

  const menuItems = [
    { id: 'dashboard', label: '工作台', icon: '📊', href: '/dashboard' },
    { id: 'preorders', label: '预售订单', icon: '📦', href: '/preorders' },
    { id: 'books', label: '图书管理', icon: '📚', href: '/books' },
    { id: 'members', label: '会员管理', icon: '👥', href: '/members' },
    { id: 'purchase', label: '采购管理', icon: '🛒', href: '/purchase' },
    { id: 'sorting', label: '分拣看板', icon: '📋', href: '/sorting' },
    { id: 'notifications', label: '通知中心', icon: '🔔', href: '/notifications' },
    { id: 'exceptions', label: '异常处理', icon: '⚠️', href: '/exceptions' },
    { id: 'transactions', label: '交易记录', icon: '💰', href: '/transactions' },
  ];

  if (user) {
    if (user.role === 'purchaser') {
      menuItems.splice(2, 4);
      menuItems.splice(3, 2);
    } else if (user.role === 'clerk') {
      menuItems.splice(4, 1);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm fixed w-full z-10 h-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                ☰
              </button>
              <h1 className="ml-4 text-xl font-bold text-primary-600">
                📚 书店预售管理系统
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {user?.name}
              </span>
              <span className={`status-badge status-${user?.role === 'admin' ? 'platinum' : user?.role === 'manager' ? 'gold' : 'normal'}`}>
                {user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '客户经理' : user?.role === 'purchaser' ? '采购负责人' : '店员'}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`${sidebarOpen ? 'w-56' : 'w-16'} transition-all duration-300 fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-sm z-10 overflow-y-auto`}
        >
          <nav className="mt-5 px-2">
            {menuItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md mb-1 ${
                activeMenu === item.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
          </nav>
        </aside>

        <main className={`flex-1 ${sidebarOpen ? 'ml-56' : 'ml-16'} p-6 transition-all duration-300`}>
          {children}
        </main>
      </div>
    </div>
  );
}
