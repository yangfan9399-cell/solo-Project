import { useEffect, useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Approval, ThresholdDiffChange, ImpactSummary } from '@/types';

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

const seasonLabels: Record<string, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            审批记录
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            阈值变更审批流程跟踪，包含影响数量和跨季节归属变化说明
          </p>
        </div>
        <button
          onClick={() => fetchApprovals()}
          className="px-3 py-1.5 rounded-lg text-sm transition-default inline-flex items-center gap-1.5"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          刷新
        </button>
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

function ImpactSummaryBox({ summary }: { summary: ImpactSummary }) {
  if (!summary || summary.total === 0) {
    return (
      <div
        className="rounded-lg p-3 border text-xs"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        本次变更无影响
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg p-3 border"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>影响数量统计</p>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div>
            <p className="mb-0.5" style={{ color: 'var(--text-muted)' }}>通过→警告</p>
            <p className="text-lg font-bold" style={{ color: 'var(--accent-amber)' }}>{summary.toWarn ?? 0}</p>
          </div>
          <div>
            <p className="mb-0.5" style={{ color: 'var(--text-muted)' }}>通过→阻断</p>
            <p className="text-lg font-bold" style={{ color: 'var(--accent-red)' }}>{summary.toBlock ?? 0}</p>
          </div>
          <div>
            <p className="mb-0.5" style={{ color: 'var(--text-muted)' }}>警告→阻断</p>
            <p className="text-lg font-bold" style={{ color: 'var(--accent-red)' }}>{summary.warnToBlock ?? 0}</p>
          </div>
          <div>
            <p className="mb-0.5" style={{ color: 'var(--text-muted)' }}>合计</p>
            <p className="text-lg font-bold" style={{ color: 'var(--accent-blue)' }}>{summary.total ?? 0}</p>
          </div>
        </div>

        {summary.crossSeasonAffected > 0 && (
          <div
            className="mt-3 pt-3 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center gap-2 mb-2"
              style={{ color: 'var(--accent-amber)' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                跨季节复测归属变化：共 {summary.crossSeasonAffected} 个标本，{summary.crossSeasonPairs?.length ?? 0} 组采集点
              </span>
            </div>

            {summary.crossSeasonPairs && summary.crossSeasonPairs.length > 0 && (
              <div className="space-y-1.5">
                {summary.crossSeasonPairs.slice(0, 5).map((pair) => (
                  <div
                    key={pair.pairId}
                    className="rounded p-2 text-[11px]"
                    style={{
                      background: 'rgba(203, 161, 84, 0.08)',
                      border: '1px solid rgba(203, 161, 84, 0.25)',
                    }}
                  >
                    <p className="mb-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                      📍 {pair.specimens[0]?.collection_point ?? '未知'}
                    </p>
                    <div className="space-y-0.5">
                      {pair.specimens.map((s) => (
                        <p key={s.code} style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-mono mr-2">{s.code}</span>
                          <span
                            className="mr-2 px-1 rounded"
                            style={{ background: 'rgba(203, 161, 84, 0.15)', color: 'var(--accent-amber)' }}
                          >
                            {seasonLabels[s.season] ?? s.season}季
                          </span>
                          {s.oldStatus} → {s.newStatus}
                          {s.changedDimensions?.length > 0 && (
                            <span className="ml-2" style={{ color: 'var(--accent-blue)' }}>
                              [{s.changedDimensions.map(d => dimensionLabels[d] ?? d).join(', ')}]
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {(summary.crossSeasonPairs.length ?? 0) > 5 && (
                  <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                    其余 {(summary.crossSeasonPairs.length ?? 0) - 5} 组省略...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {summary.byDimension && Object.keys(summary.byDimension).length > 0 && (
          <div
            className="mt-3 pt-3 border-t text-[11px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <p className="mb-1">各维度触发次数：</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byDimension).map(([dim, n]) => (
                <span
                  key={dim}
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(110, 168, 217, 0.15)',
                    color: 'var(--accent-blue)',
                  }}
                >
                  {dimensionLabels[dim] ?? dim}：{n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
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
  const [error, setError] = useState<string | null>(null);

  const cfg = statusColors[approval.status];
  const isPending = approval.status === 'pending';

  const summary = approval.impactSummary as ImpactSummary;
  const hasCrossSeason = summary?.crossSeasonAffected > 0;

  const handleAction = async (action: 'approve' | 'reject') => {
    setProcessing(true);
    setError(null);
    try {
      if (action === 'approve') {
        await onApprove(approval.id, comment);
      } else {
        await onReject(approval.id, comment);
      }
      setComment('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative">
      <div
        className="absolute -left-5 top-5 w-3 h-3 rounded-full border-2"
        style={{
          background: approval.status === 'approved'
            ? 'var(--accent-green)'
            : approval.status === 'rejected'
            ? 'var(--accent-red)'
            : 'var(--accent-amber)',
          borderColor: 'var(--bg-primary)',
        }}
      />

      <div
        className="rounded-xl border p-5 transition-default"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          borderLeft: hasCrossSeason && isPending
            ? '3px solid var(--accent-amber)'
            : '1px solid var(--border)',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {/^[0-9a-fA-F-]{36}$/.test(approval.ruleName ?? '')
                  ? `地衣标本采集阈值规则 ${approval.ruleVersion ? approval.ruleVersion : ''}`.trim()
                  : approval.ruleName}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.text }}
              >
                {cfg.label}
              </span>
              {hasCrossSeason && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{
                    background: 'rgba(203, 161, 84, 0.12)',
                    color: 'var(--accent-amber)',
                    border: '1px solid rgba(203, 161, 84, 0.3)',
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                  含跨季节变化
                </span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              提交于 {new Date(approval.submittedAt).toLocaleString('zh-CN')}
            </p>
            {approval.reviewedAt && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                处理于 {new Date(approval.reviewedAt).toLocaleString('zh-CN')}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded transition-default flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div
          className="rounded-lg p-3 mb-3"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>变更理由</p>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {approval.reason}
          </p>
        </div>

        {summary && <ImpactSummaryBox summary={summary} />}

        {expanded && approval.thresholdDiff && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              阈值变更详情 ({approval.thresholdDiff.from ?? '无'} → {approval.thresholdDiff.to ?? ''})
            </h4>
            {approval.thresholdDiff.changedDimensions && approval.thresholdDiff.changedDimensions.length > 0 && (
              <p className="text-xs mb-2">
                <span style={{ color: 'var(--text-muted)' }}>实际变更维度：</span>
                {approval.thresholdDiff.changedDimensions.map(d => dimensionLabels[d] ?? d).join('、')}
              </p>
            )}
            <div
              className="rounded-lg p-3"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            >
              {Object.entries(approval.thresholdDiff.changes ?? {}).map(([key, dim]) => {
                const d = dim as ThresholdDiffChange;
                const hasChange = approval.thresholdDiff?.changedDimensions?.includes(key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1.5 text-xs"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: hasChange ? 1 : 0.5,
                    }}
                  >
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {dimensionLabels[key] ?? key}
                      {!hasChange && (
                        <span className="ml-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          (无变化)
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums" style={{ color: hasChange ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                      passMax: {d.passMax} · warnMax: {d.warnMax}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {approval.reviewComment && (
          <div
            className="mt-3 pt-3 border-t text-xs"
            style={{
              borderColor: 'var(--border)',
              color: approval.status === 'approved' ? 'var(--accent-green)' : 'var(--accent-red)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>审批意见：</span>
            {approval.reviewComment}
          </div>
        )}

        {error && (
          <div
            className="mt-3 p-2 rounded text-xs"
            style={{ background: 'rgba(231, 111, 81, 0.1)', color: 'var(--accent-red)' }}
          >
            ⚠️ {error}
          </div>
        )}

        {isPending && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={approval.status === 'pending' ? '输入审批意见 (驳回必填)...' : '输入审批意见...'}
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-default disabled:opacity-50"
                style={{ background: 'var(--accent-green)', color: '#0D1B16' }}
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                通过
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={processing || !comment.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-default disabled:opacity-50"
                style={{ background: 'var(--accent-red)', color: '#fff' }}
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                驳回{!comment.trim() && ' (需填写意见)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
