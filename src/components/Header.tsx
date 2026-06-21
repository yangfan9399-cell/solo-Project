import { Wind, Plus, ClipboardCheck, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTicketStore } from '@/store/ticketStore';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { users, currentUser, setCurrentUser, fetchUsers } = useTicketStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const navItems = [
    { path: '/', label: '作业票列表', icon: ClipboardCheck },
    { path: '/create', label: '发起作业票', icon: Plus },
    { path: '/review', label: '复核工作台', icon: Wind },
  ];

  return (
    <header className="no-print bg-industrial-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-safety-orange flex items-center justify-center">
            <Wind className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">桅骨风车双人复核作业票系统</h1>
            <p className="text-xs text-industrial-300">Mast Bone Wind Turbine Dual-Verification Work Order System</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-all ${
                  active
                    ? 'bg-safety-orange text-white shadow-inner'
                    : 'text-industrial-200 hover:bg-industrial-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded bg-industrial-800 hover:bg-industrial-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-industrial-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">{currentUser?.name || '未登录'}</div>
              <div className="text-xs text-industrial-300">
                {currentUser?.role === 'initiator' && '发起人'}
                {currentUser?.role === 'reviewer' && '复核人'}
                {currentUser?.role === 'both' && '发起人/复核人'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-industrial-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-industrial-200 overflow-hidden">
              <div className="px-4 py-2 bg-industrial-50 text-xs font-semibold text-industrial-500 uppercase">
                切换用户身份
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setMenuOpen(false);
                    navigate(0);
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-industrial-50 transition-colors ${
                    currentUser?.id === u.id ? 'bg-safety-orange/10 text-safety-orange font-semibold' : 'text-industrial-800'
                  }`}
                >
                  <div className="text-sm">{u.name}</div>
                  <div className="text-xs text-industrial-500">
                    {u.role === 'initiator' && '发起人'}
                    {u.role === 'reviewer' && '复核人'}
                    {u.role === 'both' && '发起人 / 复核人'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
