import { Link, useLocation } from '@remix-run/react';
import type { LedgerSummary } from '../types';
import clsx from 'clsx';

interface Props {
  summary: LedgerSummary;
  currentPageTitle: string;
  currentPageSubtitle?: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/', icon: '📊', label: '自差台账工作台', match: '/' },
  { to: '/ships', icon: '⚓', label: '船舶档案库' },
  { to: '/records/new', icon: '➕', label: '新建校正记录' },
  { to: '/anomalies', icon: '⚠️', label: '异常数据监测' },
];

export default function AppShell({ summary, currentPageTitle, currentPageSubtitle, children }: Props) {
  const location = useLocation();
  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('zh-CN', { hour12: false });
    } catch { return d; }
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{ fontSize: '26px', marginBottom: '8px' }}>🧭</div>
          <div className="brand-title">罗经自差校正台账</div>
          <div className="brand-sub">COMPASS DEVIATION LEDGER</div>
        </div>
        {NAV_ITEMS.map(item => {
          const isActive = item.match === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to) && item.to !== '/records/new'
              ? true
              : location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} className={clsx('nav-item', isActive && 'active')}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '8px' }}>系统数据统计</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', lineHeight: '1.8' }}>
            <div>在管船舶：<span style={{ color: 'var(--gold-400)', fontWeight: 600 }}>{summary.totalShips}</span> 艘</div>
            <div>校正记录：<span style={{ color: 'var(--gold-400)', fontWeight: 600 }}>{summary.totalRecords}</span> 份</div>
            <div>异常待处理：<span style={{ color: summary.abnormalRecords > 0 ? '#f87171' : 'var(--gold-400)', fontWeight: 600 }}>{summary.abnormalRecords}</span> 项</div>
          </div>
        </div>
      </aside>
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">{currentPageTitle}</div>
            {currentPageSubtitle && <div className="topbar-meta">{currentPageSubtitle}</div>}
          </div>
          <div className="text-sm text-muted" style={{ textAlign: 'right' }}>
            <div>数据最后更新</div>
            <div style={{ color: 'var(--gray-700)', fontWeight: 500 }}>{fmtDate(summary.lastUpdateDate)}</div>
          </div>
        </div>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
