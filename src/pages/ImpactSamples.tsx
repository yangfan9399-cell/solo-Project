import { useEffect, useState } from 'react';
import { Link2, Inbox, ArrowRight, RefreshCw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import type { ImpactResult, ImpactSummary, CrossSeasonPair } from '@/types';

const seasonLabels: Record<string, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

const statusLabels: Record<string, string> = {
  pass: '通过',
  warn: '警告',
  block: '阻断',
};

const dimensionLabels: Record<string, string> = {
  altitude: '采集海拔',
  substrate: '附着基质',
  spore_density: '孢子密度',
  humidity_exposure: '湿度暴露',
};

export default function ImpactSamples() {
  const { impactResults, loading, fetchImpact, impactSummary } = useStore();
  const [filter, setFilter] = useState<'all' | 'cross'>('all');

  useEffect(() => {
    fetchImpact();
  }, [fetchImpact]);

  const filtered = filter === 'cross'
    ? impactResults.filter((r) => r.isCrossSeason)
    : impactResults;

  const crossSeasonPairs: CrossSeasonPair[] =
    impactSummary?.crossSeasonPairs ?? [];

  if (loading.impact) {
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
          影响样本列表
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          受阈值变更影响的标本一览，标注同一采集点跨季节复测的归属变化
        </p>
      </div>

      {impactSummary && impactSummary.total > 0 && (
        <ImpactStats summary={impactSummary} />
      )}

      <div className="flex gap-2 mb-4">
        {(['all', 'cross'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-default"
            style={{
              background: filter === f ? 'var(--accent-green)' : 'var(--bg-card)',
              color: filter === f ? '#0D1B16' : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? 'var(--accent-green)' : 'var(--border)'}`,
            }}
          >
            {f === 'all' ? '全部' : '仅跨季节'}
          </button>
        ))}
        <button
          onClick={() => fetchImpact()}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm transition-default inline-flex items-center gap-1.5"
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

      {crossSeasonPairs.length > 0 && (
        <CrossSeasonOverview pairs={crossSeasonPairs} />
      )}

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <Inbox className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {filter === 'cross' ? '暂无跨季节复测样本影响' : '暂无影响样本数据'}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <table className="w-full">
            <thead>
              <tr
                className="border-b text-xs text-left"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <th className="px-4 py-3 font-medium">标本编号</th>
                <th className="px-4 py-3 font-medium">采集点</th>
                <th className="px-4 py-3 font-medium">季节</th>
                <th className="px-4 py-3 font-medium">原归属 → 新归属</th>
                <th className="px-4 py-3 font-medium">变更维度</th>
                <th className="px-4 py-3 font-medium">跨季节关联</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ImpactRow key={item.specimen.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ImpactStats({ summary }: { summary: ImpactSummary }) {
  const cards = [
    { label: '通过→警告', value: summary.toWarn, color: 'var(--accent-amber)' },
    { label: '通过→阻断', value: summary.toBlock, color: 'var(--accent-red)' },
    { label: '警告→阻断', value: summary.warnToBlock, color: 'var(--accent-red)' },
    { label: '合计影响', value: summary.total, color: 'var(--accent-blue)' },
    { label: '跨季节样本', value: summary.crossSeasonAffected, color: 'var(--accent-violet)' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl p-4 border"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
            borderLeft: `3px solid ${c.color}`,
          }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function CrossSeasonOverview({ pairs }: { pairs: CrossSeasonPair[] }) {
  return (
    <div
      className="rounded-xl p-4 mb-6 border"
      style={{
        background: 'rgba(203, 161, 84, 0.08)',
        borderColor: 'rgba(203, 161, 84, 0.4)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--accent-amber)' }}>
          同一采集点跨季节复测归属变化（共 {pairs.length} 组）
        </p>
      </div>
      <div className="space-y-3">
        {pairs.map((pair) => {
          const point = pair.specimens[0]?.collection_point ?? '未知';
          return (
            <div
              key={pair.pairId}
              className="rounded-lg p-3"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                采集点：<span className="font-semibold">{point}</span>
              </p>
              <div className="flex flex-col gap-2">
                {pair.specimens.map((s) => (
                  <div
                    key={s.code}
                    className="flex items-center gap-3 text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                      {s.code}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(203, 161, 84, 0.15)', color: 'var(--accent-amber)' }}
                    >
                      {seasonLabels[s.season] ?? s.season}季
                    </span>
                    <ArrowRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                    <StatusBadge status={s.oldStatus as any} />
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <StatusBadge status={s.newStatus as any} />
                    <div className="flex gap-1 ml-auto">
                      {s.changedDimensions.map((d) => (
                        <span
                          key={d}
                          className="px-1.5 py-0.5 rounded-full text-[10px]"
                          style={{
                            background: 'rgba(110, 168, 217, 0.15)',
                            color: 'var(--accent-blue)',
                          }}
                        >
                          {dimensionLabels[d] ?? d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImpactRow({ item }: { item: ImpactResult }) {
  const hasPairChange =
    item.isCrossSeason &&
    item.pair_info &&
    item.pair_info.linked_status !== item.newStatus;

  return (
    <tr
      className="border-b"
      style={{
        borderColor: 'var(--border)',
        borderLeftWidth: item.isCrossSeason ? '3px' : '1px',
        borderLeftColor: item.isCrossSeason ? 'var(--accent-amber)' : 'var(--border)',
        background: hasPairChange ? 'rgba(203, 161, 84, 0.04)' : 'transparent',
      }}
    >
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{item.specimen.code}</span>
          {item.isCrossSeason && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: 'rgba(203, 161, 84, 0.15)',
                color: 'var(--accent-amber)',
              }}
              title="同一采集点跨季节复测样本"
            >
              <Link2 className="w-2.5 h-2.5" />
              跨季节
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {item.specimen.collection_point}
      </td>
      <td className="px-4 py-3 text-sm">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            background: 'rgba(203, 161, 84, 0.1)',
            color: 'var(--accent-amber)',
          }}
        >
          {seasonLabels[item.specimen.season] ?? item.specimen.season}季
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <StatusBadge status={item.oldStatus} />
          <ArrowRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          <StatusBadge status={item.newStatus} />
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {statusLabels[item.oldStatus]} → {statusLabels[item.newStatus]}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {item.changedDimensions.map((d) => (
            <span
              key={d}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(110, 168, 217, 0.15)',
                color: 'var(--accent-blue)',
              }}
            >
              {dimensionLabels[d] ?? d}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {item.pair_info ? (
          <div>
            <p className="font-mono mb-0.5" style={{ color: 'var(--text-primary)' }}>
              关联: {item.pair_info.linked_code}
            </p>
            <p>
              {seasonLabels[item.pair_info.linked_season] ?? item.pair_info.linked_season}季
              {' '}·{' '}
              <StatusBadge status={item.pair_info.linked_status as any} size="sm" />
            </p>
            {hasPairChange && (
              <p
                className="mt-1 font-medium"
                style={{ color: 'var(--accent-amber)' }}
              >
                ⚠ 归属不同步
              </p>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
    </tr>
  );
}
