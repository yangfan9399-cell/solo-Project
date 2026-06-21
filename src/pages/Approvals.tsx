import { useEffect, useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Approval, ThresholdDiffChange } from '@/types';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'rgba(233, 196, 106, 0.15)', text: 'var(--accent-amber)', label: '待审批' },
  approved: { bg: 'rgba(82, 183, 136, 0.15)', text: 'var(--accent-green)', label: '已通过' },
  rejected: { bg: 'rgba(231, 111, 81, 0.15)', text: 'var(--accent-red)', label: '已驳回' },
};

const dimensionLabels: Record<string, string> = {
  altitude: '采集海拔',
  substrate: '附着基质',
  sporeDensity: '孢子密度',
  humidityExposure: '湿度暴露',
};

export default function Approvals() {
  const { approvals, loading, fetchApprovals, approveApproval, rejectApproval } = useStore();

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  if (loading.approvals) {
    return (
      <div className="flex items-center justify-center h-96">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-green)' }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          审批记录
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          阈值变更审批流程跟踪
        </p>
      </div>

      {approvals.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          暂无审批记录
        </div>
      ) : (
        <div className="relative pl-8">
          <div
            className="absolute left-3 top-0 bottom-0 w-0.5"
            style={{ background: 'var(--border)' }}
          />
          <div className="space-y-4">
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={approveApproval}
                onReject={rejectApproval}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: Approval;
  onApprove: (id: string, comment: string) => Promise<void>;
  onReject: (id: string, comment: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const cfg = statusColors[approval.status];
  const isPending = approval.status === 'pending';

  const handleAction = async (action: 'approve' | 'reject') => {
    setProcessing(true);
    try {
      if (action === 'approve') {
        await onApprove(approval.id, comment);
      } else {
        await onReject(approval.id, comment);
      }
      setComment('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative">
      <div
        className="absolute -left-5 top-5 w-3 h-3 rounded-full border-2"
        style={{
          background: approval.status === 'approved' ? 'var(--accent-green)' : approval.status === 'rejected' ? 'var(--accent-red)' : 'var(--accent-amber)',
          borderColor: 'var(--bg-primary)',
        }}
      />

      <div
        className="rounded-xl border p-5 transition-default"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {approval.ruleName}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.text }}
              >
                {cfg.label}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              提交于 {approval.submittedAt}
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded transition-default"
            style={{ color: 'var(--text-muted)' }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          {approval.reason}
        </p>

        <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>通过→警告: <b style={{ color: 'var(--accent-amber)' }}>{approval.impactSummary.toWarn}</b></span>
          <span>通过→阻断: <b style={{ color: 'var(--accent-red)' }}>{approval.impactSummary.toBlock}</b></span>
          <span>警告→阻断: <b style={{ color: 'var(--accent-red)' }}>{approval.impactSummary.warnToBlock}</b></span>
        </div>

        {expanded && approval.thresholdDiff && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              阈值变更详情 ({approval.thresholdDiff.from} → {approval.thresholdDiff.to})
            </h4>
            {Object.entries(approval.thresholdDiff.changes ?? {}).map(([key, dim]) => {
              const d = dim as ThresholdDiffChange;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-1.5 text-xs"
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {dimensionLabels[key] ?? key}
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--accent-amber)' }}>
                    passMax: {d.passMax} · warnMax: {d.warnMax}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {approval.reviewComment && (
          <div
            className="mt-3 pt-3 border-t text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            审批意见: {approval.reviewComment}
          </div>
        )}

        {isPending && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="输入审批意见..."
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-default"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAction('approve')}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-default"
                style={{ background: 'var(--accent-green)', color: '#0D1B16' }}
              >
                <Check className="w-4 h-4" />
                通过
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-default"
                style={{ background: 'var(--accent-red)', color: '#fff' }}
              >
                <X className="w-4 h-4" />
                驳回
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
