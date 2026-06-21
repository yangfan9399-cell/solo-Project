import { useEffect, useState } from 'react';
import { Link2, Inbox } from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/StatusBadge';
import type { ImpactResult } from '@/types';

const seasonLabels: Record<string, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

const dimensionLabels: Record<string, string> = {
  altitude: '海拔',
  substrate: '基质',
  sporeDensity: '孢子密度',
  humidityExposure: '湿度',
};

export default function ImpactSamples() {
  const { impactResults, loading, fetchImpact, specimens } = useStore();
  const [filter, setFilter] = useState<'all' | 'cross'>('all');

  useEffect(() => {
    fetchImpact();
  }, [fetchImpact]);

  const filtered = filter === 'cross' ? impactResults.filter((r) => r.isCrossSeason) : impactResults;

  const getLinkedSpecimen = (specimenId: string) =>
    specimens.find((s) => s.id === specimenId);

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
          受阈值变更影响的标本一览
        </p>
      </div>

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
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <Inbox className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            暂无影响样本数据
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
                <th className="px-4 py-3 font-medium">原归属</th>
                <th className="px-4 py-3 font-medium">新归属</th>
                <th className="px-4 py-3 font-medium">变更维度</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ImpactRow
                  key={item.specimenId}
                  item={item}
                  linkedSpecimen={
                    item.isCrossSeason
                      ? getLinkedSpecimen(item.specimenId)
                      : undefined
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ImpactRow({
  item,
  linkedSpecimen,
}: {
  item: ImpactResult;
  linkedSpecimen?: { code: string; collectionPoint: string; season: string } | undefined;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      className="border-b transition-default relative"
      style={{
        borderColor: 'var(--border)',
        borderLeftWidth: item.isCrossSeason ? '3px' : '1px',
        borderLeftColor: item.isCrossSeason ? 'var(--accent-amber)' : 'var(--border)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
        <div className="flex items-center gap-2">
          {item.code}
          {item.isCrossSeason && (
            <Link2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {item.collectionPoint}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {seasonLabels[item.season] ?? item.season}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.originalStatus} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.newStatus} />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {item.changedDimensions.map((d) => (
            <span
              key={d}
              className="text-xs px-2 py-0.5 rounded-full"
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

      {item.isCrossSeason && hovered && linkedSpecimen && (
        <td className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <div
            className="px-3 py-2 rounded-lg text-xs shadow-lg whitespace-nowrap"
            style={{
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            关联标本: {linkedSpecimen.code} · {linkedSpecimen.collectionPoint} ·{' '}
            {seasonLabels[linkedSpecimen.season] ?? linkedSpecimen.season}
          </div>
        </td>
      )}
    </tr>
  );
}
