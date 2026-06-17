import type { DeviationRecord } from '../types';
import clsx from 'clsx';

export function StatusBadge({ status }: { status: DeviationRecord['status'] }) {
  const map: Record<DeviationRecord['status'], { cls: string; label: string; icon: string }> = {
    draft: { cls: 'status-draft', label: '草稿编辑', icon: '📝' },
    verified: { cls: 'status-verified', label: '已复核', icon: '🔍' },
    approved: { cls: 'status-approved', label: '已批准', icon: '✅' },
    archived: { cls: 'status-archived', label: '已归档', icon: '📦' }
  };
  const cfg = map[status];
  return <span className={clsx('status-badge', cfg.cls)}>{cfg.icon} {cfg.label}</span>;
}

export function SeverityDot({ severity }: { severity: 'none' | 'low' | 'medium' | 'high' }) {
  if (severity === 'none') return null;
  return <span className={clsx('severity-dot', `severity-${severity}`)} />;
}

export function StatCard({ label, value, sub, variant, icon }: { label: string; value: string | number; sub?: string; variant?: 'gold' | 'green' | 'red' | 'orange'; icon?: string }) {
  return (
    <div className={clsx('stat-card', variant && `stat-${variant}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: '26px', opacity: 0.5 }}>{icon}</div>}
      </div>
    </div>
  );
}
