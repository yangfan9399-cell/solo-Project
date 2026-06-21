import { useEffect, useState } from 'react';
import { Mountain, Layers, Microscope, Droplets, AlertTriangle, ShieldAlert, ArrowRight, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ThresholdCard from '@/components/ThresholdCard';
import type { ThresholdGroup, ThresholdDimension } from '@/types';

const dimensionKeys = ['altitude', 'substrate', 'sporeDensity', 'humidityExposure'] as const;

const dimensionLabels: Record<string, string> = {
  altitude: '采集海拔',
  substrate: '附着基质',
  sporeDensity: '孢子密度',
  humidityExposure: '湿度暴露',
};

const dimensionConfig: Record<
  string,
  { unit: string; icon: React.ElementType; min: number; max: number }
> = {
  altitude: { unit: 'm', icon: Mountain, min: 0, max: 6000 },
  substrate: { unit: '编码', icon: Layers, min: 0, max: 100 },
  sporeDensity: { unit: '个/mm²', icon: Microscope, min: 0, max: 500 },
  humidityExposure: { unit: '%', icon: Droplets, min: 0, max: 100 },
};

function hasDiff(draft: ThresholdGroup, published: ThresholdGroup): boolean {
  return dimensionKeys.some(
    (k) =>
      draft[k].passMax !== published[k].passMax ||
      draft[k].warnMax !== published[k].warnMax,
  );
}

function ImpactCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4 border text-center"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-center mb-2" style={{ color }}>
        {icon}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}

function RuleComparison({
  draft,
  published,
}: {
  draft: ThresholdGroup;
  published: ThresholdGroup;
}) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        规则对比
      </h3>
      {dimensionKeys.map((key) => {
        const d: ThresholdDimension = draft[key];
        const p: ThresholdDimension = published[key];
        const changed = d.passMax !== p.passMax || d.warnMax !== p.warnMax;
        return (
          <div
            key={key}
            className="flex items-center justify-between py-2 border-b last:border-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <span
              className="text-xs"
              style={{ color: changed ? 'var(--accent-amber)' : 'var(--text-muted)' }}
            >
              {dimensionLabels[key]}
            </span>
            <div className="flex items-center gap-2 text-xs tabular-nums">
              <span style={{ color: 'var(--text-muted)' }}>
                {p.passMax}/{p.warnMax}
              </span>
              <ArrowRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              <span
                style={{
                  color: changed ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  fontWeight: changed ? 600 : 400,
                }}
              >
                {d.passMax}/{d.warnMax}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ThresholdMatrix() {
  const {
    currentDraftRule,
    currentPublishedRule,
    impactSummary,
    loading,
    fetchRules,
    fetchImpact,
    fetchImpactSummary,
    submitApproval,
  } = useStore();

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchImpact();
    fetchImpactSummary();
  }, [fetchRules, fetchImpact, fetchImpactSummary]);

  const hasChanges =
    currentDraftRule &&
    currentPublishedRule &&
    hasDiff(currentDraftRule.thresholds, currentPublishedRule.thresholds);

  const handleSubmit = async () => {
    if (!hasChanges || !reason.trim()) return;
    setSubmitting(true);
    try {
      await submitApproval(reason.trim());
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading.rules) {
    return (
      <div className="flex items-center justify-center h-96">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-green)' }}
        />
      </div>
    );
  }

  if (!currentDraftRule || !currentPublishedRule) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
        暂无阈值规则数据
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          阈值矩阵
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          调整各维度阈值参数，实时预览影响范围后提交审批
        </p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0" style={{ flexBasis: '60%' }}>
          <div className="grid grid-cols-2 gap-4">
            {dimensionKeys.map((key) => {
              const cfg = dimensionConfig[key];
              return (
                <ThresholdCard
                  key={key}
                  dimension={{
                    key,
                    label: dimensionLabels[key],
                    unit: cfg.unit,
                    icon: cfg.icon,
                    min: cfg.min,
                    max: cfg.max,
                  }}
                  data={currentDraftRule.thresholds[key]}
                  publishedData={currentPublishedRule.thresholds[key]}
                />
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4" style={{ flexBasis: '40%' }}>
          <RuleComparison
            draft={currentDraftRule.thresholds}
            published={currentPublishedRule.thresholds}
          />

          <div className="grid grid-cols-3 gap-3">
            <ImpactCard
              icon={<AlertTriangle className="w-4 h-4" />}
              label="通过→警告"
              value={impactSummary?.toWarn ?? 0}
              color="var(--accent-amber)"
            />
            <ImpactCard
              icon={<ShieldAlert className="w-4 h-4" />}
              label="通过→阻断"
              value={impactSummary?.toBlock ?? 0}
              color="var(--accent-red)"
            />
            <ImpactCard
              icon={<ArrowRight className="w-4 h-4" />}
              label="警告→阻断"
              value={impactSummary?.warnToBlock ?? 0}
              color="var(--accent-red)"
            />
          </div>

          <div
            className="rounded-xl p-5 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              提交审批
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入变更原因..."
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-default"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!hasChanges || !reason.trim() || submitting}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-default disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: hasChanges ? 'var(--accent-green)' : 'var(--border)',
                color: hasChanges ? '#0D1B16' : 'var(--text-muted)',
              }}
            >
              <Send className="w-4 h-4" />
              {submitting ? '提交中...' : '提交审批'}
            </button>
            {!hasChanges && (
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                未检测到与已发布规则的差异
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
