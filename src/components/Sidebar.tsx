import { useLocation, Link } from 'react-router-dom';
import { ClipboardCheck, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/', label: '异常核对', icon: ClipboardCheck },
  { href: '/review', label: '复盘统计', icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 bottom-0 w-60 bg-slate-900 text-white flex flex-col z-50">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-base font-bold tracking-tight">餐卡充值异常</h1>
        <p className="text-xs text-slate-400 mt-0.5">退款核对系统</p>
      </div>
      <div className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/' || location.pathname.startsWith('/detail')
              : location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border-r-2 border-amber-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">园区财务管理平台</p>
      </div>
    </nav>
  );
}
