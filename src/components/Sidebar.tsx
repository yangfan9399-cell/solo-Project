import { NavLink } from 'react-router-dom';
import { Sliders, BarChart3, ClipboardCheck, History, Leaf } from 'lucide-react';
import { useStore } from '@/store/useStore';

const navItems = [
  { to: '/', label: '阈值矩阵', icon: Sliders },
  { to: '/impact', label: '影响样本', icon: BarChart3 },
  { to: '/approvals', label: '审批记录', icon: ClipboardCheck },
  { to: '/history', label: '发布历史', icon: History },
];

export default function Sidebar() {
  const currentDraftRule = useStore((s) => s.currentDraftRule);

  return (
    <aside
      className="h-screen sticky top-0 flex flex-col border-r"
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-green)' }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-sm font-semibold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              地衣标本
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              阈值治理工具
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-default ${
                isActive ? 'font-medium' : ''
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--bg-card-hover)' : 'transparent',
              color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
            })}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span>{label}</span>
            {to === '/' && currentDraftRule && (
              <span
                className="w-2 h-2 rounded-full ml-auto"
                style={{ background: 'var(--accent-green)' }}
              />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: currentDraftRule ? 'var(--accent-green)' : 'var(--text-muted)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {currentDraftRule ? '草案已就绪' : '无活跃草案'}
          </span>
        </div>
      </div>
    </aside>
  );
}
