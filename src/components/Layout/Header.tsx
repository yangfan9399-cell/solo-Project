import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScrollText, Menu, Bell, User, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store';

interface HeaderProps {
  className?: string;
}

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: '发布看板', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'audit', label: '审计日志', icon: <ScrollText className="w-4 h-4" /> },
];

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar, sidebarCollapsed } = useAppStore();

  const currentPath = location.pathname;
  const activeNav = currentPath.startsWith('/audit') ? 'audit' : 'dashboard';

  return (
    <header
      className={cn(
        'h-16 bg-gradient-to-r from-ochre-700 via-ochre-600 to-ochre-700',
        'border-b-2 border-ochre-800 shadow-md',
        'flex items-center justify-between px-6',
        'relative overflow-hidden',
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v40c11.046 0 20-8.954 20-20zM0 0c11.046 0 20 8.954 20 20S11.046 40 0 40V0z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="flex items-center gap-4 relative z-10">
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            'text-paper-100 hover:bg-ochre-500/30 transition-colors',
            'border border-ochre-500/50'
          )}
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-paper-100/20 flex items-center justify-center border-2 border-paper-100/40">
            <span className="text-paper-100 font-song font-bold text-lg">古</span>
          </div>
          <div>
            <h1 className="font-song font-bold text-paper-50 text-lg tracking-wider">
              古井铭牌版本差异册
            </h1>
            <p className="text-paper-200/70 text-xs font-heiti">
              金石拓片 · 版本典藏
            </p>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1 relative z-10">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              if (item.key === 'dashboard') navigate('/');
              else if (item.key === 'audit') navigate('/audit');
            }}
            className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300',
              'font-song text-sm',
              activeNav === item.key
                ? 'bg-paper-100/20 text-paper-50 shadow-inner'
                : 'text-paper-200/80 hover:text-paper-50 hover:bg-paper-100/10'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 relative z-10">
        <div className="relative">
          <div className="w-64 h-9 flex items-center bg-paper-100/10 rounded-lg border border-paper-100/20 overflow-hidden">
            <Search className="w-4 h-4 text-paper-200/60 ml-3" />
            <input
              type="text"
              placeholder="搜索发布包、版本..."
              className="flex-1 bg-transparent text-paper-100 placeholder-paper-200/50 text-sm px-3 outline-none font-heiti"
            />
          </div>
        </div>

        <button
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center relative',
            'text-paper-100 hover:bg-paper-100/20 transition-colors'
          )}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cinnabar-400 rounded-full" />
        </button>

        <div className="w-px h-8 bg-paper-100/20" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-paper-100/20 flex items-center justify-center border border-paper-100/30">
            <User className="w-4 h-4 text-paper-100" />
          </div>
          <div className="hidden md:block">
            <p className="text-paper-50 text-sm font-medium">管理者</p>
            <p className="text-paper-200/60 text-xs">admin</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-paper-100/30 to-transparent" />
    </header>
  );
};

export default Header;
