import type { WorkOrderStatus, RiskLevel, ConflictType } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, RISK_LABELS, RISK_COLORS, CONFLICT_TYPE_LABELS } from '@/types';
import { AlertTriangle, Shield, ShieldAlert, Gauge, Flame } from 'lucide-react';

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`tag ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const Icon =
    level === 'critical' ? Flame :
    level === 'high' ? ShieldAlert :
    level === 'medium' ? AlertTriangle : Shield;
  return (
    <span className={`tag ${RISK_COLORS[level]}`}>
      <Icon className="w-3 h-3" />
      {RISK_LABELS[level]}
    </span>
  );
}

export function ConflictTypeBadge({ type, severity }: { type: ConflictType; severity: 'warning' | 'critical' }) {
  const color = severity === 'critical'
    ? 'bg-alert-red-600 border-alert-red-400 text-white glow-red'
    : 'bg-warn-orange-600 border-warn-orange-400 text-white';
  return (
    <span className={`tag ${color}`}>
      <Gauge className="w-3 h-3" />
      {CONFLICT_TYPE_LABELS[type]}
    </span>
  );
}
