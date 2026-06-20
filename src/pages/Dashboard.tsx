import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SealBadge, ScrollCard, StatusTag, BambooDivider, Timeline } from '../components/common';
import type { TimelineItem } from '../components/common';
import { useAppStore } from '../store';
import { ReleaseStatus, PackageDimension } from '../shared/types';
import { dimensionTextMap, formatDate, formatNumber, statusTextMap } from '../utils/format';
import { cn } from '../lib/utils';
import { CheckCircle2, RotateCcw, Send } from 'lucide-react';

const statsConfig = [
  { key: 'total', label: '总发布包', color: 'ochre', icon: '📜' },
  { key: 'pending', label: '待发布', color: 'stoneBlue', icon: '⏳' },
  { key: 'blocked', label: '有阻断', color: 'cinnabar', icon: '🚫' },
  { key: 'published', label: '已发布', color: 'bronze', icon: '✅' },
] as const;

const statusFilterOptions = [
  { value: 'all', label: '全部' },
  { value: ReleaseStatus.published, label: '已发布' },
  { value: ReleaseStatus.pending, label: '待发布' },
  { value: ReleaseStatus.blocked, label: '有阻断' },
  { value: ReleaseStatus.draft, label: '草稿' },
  { value: ReleaseStatus.rolled_back, label: '已回滚' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { packages, versions, blockers, getStats, fetchPackages, fetchPackageVersions, fetchPackageBlockers } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    if (packages.length > 0) {
      packages.forEach(pkg => {
        fetchPackageVersions(pkg.id);
        fetchPackageBlockers(pkg.id);
      });
    }
  }, [packages.length, fetchPackageVersions, fetchPackageBlockers]);

  const stats = getStats();

  const getBlockerCount = (packageId: string) => {
    return blockers.filter(b => b.packageId === packageId && b.status === 'open').length;
  };

  const getRecalcCount = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    return pkg ? Math.floor(pkg.affectedSampleCount * 0.3) : 0;
  };

  const sortedVersions = [...versions].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredVersions = statusFilter === 'all'
    ? sortedVersions
    : sortedVersions.filter(v => v.status === statusFilter);

  const getPackageName = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    return pkg?.name || '未知发布包';
  };

  const getTimelineStatus = (status: ReleaseStatus): 'completed' | 'current' | 'pending' | 'failed' => {
    switch (status) {
      case ReleaseStatus.published:
        return 'completed';
      case ReleaseStatus.pending:
        return 'current';
      case ReleaseStatus.blocked:
        return 'failed';
      case ReleaseStatus.draft:
      case ReleaseStatus.rolled_back:
      default:
        return 'pending';
    }
  };

  const timelineItems: TimelineItem[] = filteredVersions.slice(0, 12).map(version => ({
    id: version.id,
    title: `${version.version} - ${getPackageName(version.packageId)}`,
    description: version.description,
    timestamp: formatDate(version.createdAt, 'date'),
    status: getTimelineStatus(version.status),
    extra: (
      <div className="flex items-center gap-3 flex-wrap">
        <StatusTag status={version.status} size="sm" />
        <span className="text-xs text-ochre-500 font-heiti">
          操作人：{version.createdBy}
        </span>
      </div>
    ),
  }));

  const colorClasses: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    ochre: { bg: 'bg-ochre-50', text: 'text-ochre-700', border: 'border-ochre-200', dot: 'bg-ochre-500' },
    stoneBlue: { bg: 'bg-stoneBlue-50', text: 'text-stoneBlue-600', border: 'border-stoneBlue-200', dot: 'bg-stoneBlue-500' },
    cinnabar: { bg: 'bg-cinnabar-50', text: 'text-cinnabar-600', border: 'border-cinnabar-200', dot: 'bg-cinnabar-500' },
    bronze: { bg: 'bg-bronze-50', text: 'text-bronze-600', border: 'border-bronze-200', dot: 'bg-bronze-500' },
  };

  return (
    <div className="min-h-screen bg-paper-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-scroll-reveal">
          <h1 className="font-song text-4xl md:text-5xl font-bold text-ochre-800 mb-3">
            版本发布看板
          </h1>
          <p className="font-kai text-lg text-ochre-600">
            古籍金石文物影像模型版本发布管理平台
          </p>
          <BambooDivider className="max-w-md mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          {statsConfig.map((stat, index) => {
            const colors = colorClasses[stat.color];
            const value = stats[stat.key as keyof typeof stats];
            return (
              <div
                key={stat.key}
                className={cn(
                  'relative bg-paper-100 rounded-lg border p-5 md:p-6',
                  'transition-all duration-300 hover:shadow-scroll hover:-translate-y-1',
                  colors.border
                )}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: `scrollReveal 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl md:text-3xl">{stat.icon}</span>
                  <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
                </div>
                <div className={cn('font-song text-3xl md:text-4xl font-bold mb-2', colors.text)}>
                  {value}
                </div>
                <div className="font-heiti text-sm text-ochre-600">
                  {stat.label}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
                    opacity: 0.2,
                    color: colors.dot.includes('ochre') ? '#B56D32' :
                           colors.dot.includes('stoneBlue') ? '#2C5F8C' :
                           colors.dot.includes('cinnabar') ? '#C23B22' : '#4A7C59',
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-song text-2xl font-bold text-ochre-800 flex items-center gap-3">
              <span className="w-1 h-6 bg-ochre-500 rounded-full" />
              发布包一览
            </h2>
            <span className="text-sm text-ochre-500 font-heiti">
              共 {packages.length} 个发布包
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg, index) => {
              const blockerCount = getBlockerCount(pkg.id);
              const recalcCount = getRecalcCount(pkg.id);

              return (
                <ScrollCard
                  key={pkg.id}
                  hover
                  clickable
                  onClick={() => navigate(`/impact/${pkg.id}`)}
                  className="animate-scroll-reveal"
                  style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
                  header={
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-song text-lg font-bold text-ochre-800 mb-1">
                          {pkg.name}
                        </h3>
                        <span className="inline-block px-2 py-0.5 text-xs font-heiti text-ochre-600 bg-ochre-100 rounded">
                          {dimensionTextMap[pkg.dimension]}
                        </span>
                      </div>
                      <SealBadge status={pkg.status} size="md" animated />
                    </div>
                  }
                  footer={
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/impact/${pkg.id}`);
                        }}
                        className="px-3 py-2 text-xs font-heiti text-ochre-700 bg-ochre-100 hover:bg-ochre-200 rounded transition-colors"
                      >
                        查看影响
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/blockers/${pkg.id}`);
                        }}
                        className={cn(
                          'px-3 py-2 text-xs font-heiti rounded transition-colors',
                          blockerCount > 0
                            ? 'text-cinnabar-700 bg-cinnabar-100 hover:bg-cinnabar-200'
                            : 'text-ochre-600 bg-ochre-50 hover:bg-ochre-100 border border-ochre-200'
                        )}
                      >
                        阻断{blockerCount > 0 && `(${blockerCount})`}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pkg.status === ReleaseStatus.pending && blockerCount === 0) {
                            useAppStore.getState().publishPackage(pkg.id);
                          }
                        }}
                        disabled={pkg.status !== ReleaseStatus.pending || blockerCount > 0}
                        className={cn(
                          'flex items-center justify-center gap-1 px-3 py-2 text-xs font-heiti rounded transition-colors',
                          pkg.status === ReleaseStatus.pending && blockerCount === 0
                            ? 'text-bronze-700 bg-bronze-100 hover:bg-bronze-200'
                            : 'text-ink-300 bg-ink-50 border border-ink-200 cursor-not-allowed'
                        )}
                        title={
                          pkg.status !== ReleaseStatus.pending
                            ? '仅待发布状态可执行发布'
                            : blockerCount > 0
                            ? '存在未解决阻断项，无法发布'
                            : '确认发布此版本'
                        }
                      >
                        <Send size={12} />
                        发布
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rollback/${pkg.id}`);
                        }}
                        className={cn(
                          'flex items-center justify-center gap-1 px-3 py-2 text-xs font-heiti rounded transition-colors',
                          pkg.status === ReleaseStatus.published
                            ? 'text-stoneBlue-700 bg-stoneBlue-100 hover:bg-stoneBlue-200'
                            : 'text-ochre-600 bg-ochre-50 hover:bg-ochre-100 border border-ochre-200'
                        )}
                      >
                        <RotateCcw size={12} />
                        回滚
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ochre-600 font-heiti">当前版本</span>
                      <span className="font-song font-medium text-ochre-800">{pkg.currentVersion}</span>
                    </div>

                    {pkg.nextVersion !== pkg.currentVersion && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ochre-600 font-heiti">待发布版本</span>
                        <span className="font-song font-medium text-stoneBlue-600">
                          {pkg.nextVersion}
                        </span>
                      </div>
                    )}

                    <BambooDivider variant="dotted" className="my-4" />

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="font-song text-xl font-bold text-ochre-700">
                          {formatNumber(pkg.affectedSampleCount)}
                        </div>
                        <div className="text-xs text-ochre-500 font-heiti mt-1">影响样本</div>
                      </div>
                      <div className="text-center">
                        <div className={cn(
                          'font-song text-xl font-bold',
                          blockerCount > 0 ? 'text-cinnabar-600' : 'text-ochre-700'
                        )}>
                          {blockerCount}
                        </div>
                        <div className="text-xs text-ochre-500 font-heiti mt-1">阻断数</div>
                      </div>
                      <div className="text-center">
                        <div className="font-song text-xl font-bold text-stoneBlue-600">
                          {recalcCount}
                        </div>
                        <div className="text-xs text-ochre-500 font-heiti mt-1">需重算</div>
                      </div>
                    </div>
                  </div>
                </ScrollCard>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="font-song text-2xl font-bold text-ochre-800 flex items-center gap-3">
              <span className="w-1 h-6 bg-ochre-500 rounded-full" />
              版本发布记录
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {statusFilterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-heiti rounded transition-all',
                    statusFilter === option.value
                      ? 'bg-ochre-600 text-paper-50'
                      : 'bg-ochre-50 text-ochre-600 hover:bg-ochre-100 border border-ochre-200'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <ScrollCard className="animate-scroll-reveal">
            <Timeline items={timelineItems} />
          </ScrollCard>
        </div>
      </div>
    </div>
  );
}
