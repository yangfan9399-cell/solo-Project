import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Lock, RefreshCw, AlertTriangle, ChevronRight, FileText, Database, Edit3, MapPin } from 'lucide-react';
import { ScrollCard, StatusTag, SealBadge, BambooDivider } from '../components/common';
import { useAppStore } from '../store';
import { formatDate, dimensionTextMap } from '../utils/format';
import { cn } from '../lib/utils';
import type { RecalcBatch } from '../shared/types';

type TabType = 'samples' | 'locked' | 'recalc';
type FilterType = 'all' | 'recalc_needed' | 'locked' | 'conflict';

const sampleStatusText: Record<string, string> = {
  normal: '正常',
  locked: '已锁定',
  conflict: '有冲突',
  recalc_needed: '需重算',
};

const sampleStatusColor: Record<string, { text: string; bg: string; border: string }> = {
  normal: { text: 'text-bronze-600', bg: 'bg-bronze-50', border: 'border-bronze-300' },
  locked: { text: 'text-ink-600', bg: 'bg-ink-100', border: 'border-ink-300' },
  conflict: { text: 'text-cinnabar-600', bg: 'bg-cinnabar-50', border: 'border-cinnabar-300' },
  recalc_needed: { text: 'text-stoneBlue-600', bg: 'bg-stoneBlue-50', border: 'border-stoneBlue-300' },
};

const mockOldNewValues: Record<string, { old: string; new: string }> = {
  'smp-clarity-001': { old: '清晰度：85分', new: '清晰度：87分' },
  'smp-clarity-002': { old: '清晰度：72分', new: '清晰度：78分' },
  'smp-clarity-003': { old: '清晰度：90分', new: '清晰度：92分' },
  'smp-clarity-004': { old: '清晰度：88分', new: '清晰度：88分' },
  'smp-clarity-005': { old: '清晰度：76分', new: '清晰度：79分' },
  'smp-clarity-006': { old: '清晰度：65分', new: '清晰度：70分' },
  'smp-clarity-007': { old: '清晰度：82分', new: '清晰度：84分' },
  'smp-clarity-008': { old: '清晰度：78分', new: '清晰度：81分' },
  'smp-clarity-009': { old: '清晰度：91分', new: '清晰度：91分' },
  'smp-clarity-010': { old: '清晰度：58分', new: '清晰度：65分' },
  'smp-clarity-011': { old: '清晰度：83分', new: '清晰度：86分' },
  'smp-clarity-012': { old: '清晰度：89分', new: '清晰度：89分' },
  'smp-clarity-013': { old: '清晰度：75分', new: '清晰度：77分' },
  'smp-clarity-014': { old: '清晰度：70分', new: '清晰度：74分' },
  'smp-clarity-015': { old: '清晰度：68分', new: '清晰度：73分' },
  'smp-clarity-016': { old: '清晰度：86分', new: '清晰度：86分' },
  'smp-clarity-017': { old: '清晰度：74分', new: '清晰度：78分' },
  'smp-clarity-018': { old: '清晰度：87分', new: '清晰度：87分' },
  'smp-clarity-019': { old: '清晰度：71分', new: '清晰度：76分' },
  'smp-clarity-020': { old: '清晰度：93分', new: '清晰度：94分' },
  'smp-clarity-021': { old: '清晰度：79分', new: '清晰度：82分' },
  'smp-clarity-022': { old: '清晰度：84分', new: '清晰度：84分' },
  'smp-clarity-023': { old: '清晰度：62分', new: '清晰度：68分' },
  'smp-rust-001': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-rust-002': { old: '锈蚀级别：3级', new: '锈蚀级别：2级' },
  'smp-rust-003': { old: '锈蚀级别：1级', new: '锈蚀级别：1级' },
  'smp-rust-004': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-rust-005': { old: '锈蚀级别：4级', new: '锈蚀级别：3级' },
  'smp-rust-006': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-rust-007': { old: '锈蚀级别：3级', new: '锈蚀级别：3级' },
  'smp-rust-008': { old: '锈蚀级别：1级', new: '锈蚀级别：1级' },
  'smp-rust-009': { old: '锈蚀级别：2级', new: '锈蚀级别：3级' },
  'smp-rust-010': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-rust-011': { old: '锈蚀级别：1级', new: '锈蚀级别：1级' },
  'smp-rust-012': { old: '锈蚀级别：3级', new: '锈蚀级别：3级' },
  'smp-rust-013': { old: '锈蚀级别：2级', new: '锈蚀级别：3级' },
  'smp-rust-014': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-rust-015': { old: '锈蚀级别：1级', new: '锈蚀级别：1级' },
  'smp-rust-016': { old: '锈蚀级别：4级', new: '锈蚀级别：4级' },
  'smp-rust-017': { old: '锈蚀级别：3级', new: '锈蚀级别：2级' },
  'smp-rust-018': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-rust-019': { old: '锈蚀级别：1级', new: '锈蚀级别：1级' },
  'smp-rust-020': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-rust-021': { old: '锈蚀级别：2级', new: '锈蚀级别：2级' },
  'smp-ins-001': { old: '姓名：文 / 表字：士（旧释文）', new: '姓名：文远 / 表字：士弘（补读新释）' },
  'smp-ins-002': { old: '口径：三尺（实测）', new: '口径：三尺五寸（铭文补读）' },
  'smp-ins-003': { old: '位置：州署东', new: '位置：州署东偏（补读建议）' },
  'smp-ins-004': { old: '残缺3处（已释读）', new: '残缺3处（释读一致）' },
  'smp-ins-005': { old: '待二次审核（锁定）', new: '残缺6处，置信度82%' },
  'smp-ins-006': { old: '置信度评分：72/100', new: '置信度评分：85/100（算法更新）' },
  'smp-ins-007': { old: '纪年：五凤二年', new: '纪年：五凤三年（补读修正）' },
  'smp-ins-008': { old: '与《金石补正》一致', new: '与《金石补正》一致' },
  'smp-ins-009': { old: '残缺7处，北魏对照样本18', new: '残缺7处，北魏对照样本45' },
  'smp-ins-010': { old: '藏文残缺待审批（锁定）', new: '含疑似梵文题记2处' },
  'smp-ins-011': { old: '纪年：淳祐十年', new: '纪年：淳祐十一年（补读修正）' },
  'smp-ins-012': { old: '残缺4处（稳定）', new: '残缺4处（稳定）' },
  'smp-ins-013': { old: '特级文物锁定中', new: '残缺铭文15处待专家审核' },
  'smp-ins-014': { old: '置信度：68/100（旧算法）', new: '置信度：79/100（新算法）' },
  'smp-ins-015': { old: '古越文字：南海（旧释）', new: '古越文字：番禺（模型补读）' },
  'smp-ins-016': { old: '与《闽中金石志》一致', new: '与《闽中金石志》一致' },
  'smp-ins-017': { old: '纪年：上元二年', new: '纪年：上元三年（补读修正，影响王勃序考证）' },
  'smp-orient-001': { old: '方位：北偏东15°', new: '方位：北偏东20°' },
  'smp-orient-002': { old: '方位：正北', new: '方位：正北' },
  'smp-orient-003': { old: '方位：南偏西10°', new: '方位：南偏西10°' },
  'smp-orient-004': { old: '方位：东偏南5°', new: '方位：东偏南5°' },
  'smp-orient-005': { old: '方位：北偏西8°', new: '方位：北偏西12°' },
  'smp-orient-006': { old: '方位：正东', new: '方位：正东' },
  'smp-orient-007': { old: '方位：南偏东3°', new: '方位：南偏东3°' },
  'smp-orient-008': { old: '方位：北偏东5°', new: '方位：北偏东5°' },
  'smp-orient-009': { old: '方位：西偏北7°', new: '方位：西偏北10°' },
  'smp-orient-010': { old: '方位：正南', new: '方位：正南' },
  'smp-orient-011': { old: '方位：北偏东12°', new: '方位：北偏东12°' },
  'smp-orient-012': { old: '方位：东偏北6°', new: '方位：东偏北9°' },
};

const formatEstimatedTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`约${h}小时`);
  if (m > 0) parts.push(`${m}分`);
  return parts.length ? parts.join('') : '即时';
};

const batchTypeIcon = (t: RecalcBatch['batchType']) => {
  switch (t) {
    case 'report': return FileText;
    case 'heatmap': return MapPin;
    case 'dataset': return Database;
    case 'annotation': return Edit3;
    default: return RefreshCw;
  }
};

const batchTypeText: Record<string, string> = {
  report: '评估报告',
  heatmap: '热力图生成',
  dataset: '数据集导出',
  annotation: '标注更新',
};

const formatPriority = (p: RecalcBatch['priority']) => {
  switch (p) {
    case 'high': return { label: '高优', cls: 'bg-cinnabar-100 text-cinnabar-700 border-cinnabar-200' };
    case 'medium': return { label: '中优', cls: 'bg-ochre-100 text-ochre-700 border-ochre-200' };
    case 'low': return { label: '普通', cls: 'bg-stoneBlue-100 text-stoneBlue-700 border-stoneBlue-200' };
  }
};

export default function ImpactDetail() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { packages, samples, recalcBatches, fetchPackages, fetchPackageImpact } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('samples');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');

  useEffect(() => {
    if (packageId) {
      fetchPackages();
      fetchPackageImpact(packageId);
    }
  }, [packageId, fetchPackages, fetchPackageImpact]);

  const pkg = packages.find(p => p.id === packageId);
  const packageSamples = samples.filter(s => s.packageId === packageId);
  const packageBatches = recalcBatches.filter(b => b.packageId === packageId);

  const filteredSamples = packageSamples.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const lockedSamples = packageSamples.filter(s => s.status === 'locked');
  const recalcSamples = packageSamples.filter(s => s.status === 'recalc_needed');

  const tabs = [
    { key: 'samples' as TabType, label: '受影响样本', count: packageSamples.length, icon: AlertTriangle },
    { key: 'locked' as TabType, label: '锁定记录', count: lockedSamples.length, icon: Lock },
    { key: 'recalc' as TabType, label: '需重算批次', count: recalcSamples.length, icon: RefreshCw },
  ];

  const filters = [
    { key: 'all' as FilterType, label: '全部' },
    { key: 'recalc_needed' as FilterType, label: '需重算' },
    { key: 'locked' as FilterType, label: '已锁定' },
    { key: 'conflict' as FilterType, label: '有冲突' },
  ];

  const getValuePair = (sampleId: string) => {
    return mockOldNewValues[sampleId] || { old: '-', new: '-' };
  };

  if (!pkg) {
    return (
      <div className="p-8 text-center font-song text-ochre-600">
        加载中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-ochre-600 hover:text-ochre-800 
                       bg-ochre-50 hover:bg-ochre-100 rounded-lg border border-ochre-200 
                       transition-colors font-song"
          >
            <ArrowLeft size={18} />
            <span>返回</span>
          </button>

          <nav className="flex items-center gap-2 text-sm font-song text-ochre-500">
            <span className="cursor-pointer hover:text-ochre-700" onClick={() => navigate('/')}>
              首页
            </span>
            <ChevronRight size={14} />
            <span className="cursor-pointer hover:text-ochre-700">发布管理</span>
            <ChevronRight size={14} />
            <span className="text-ochre-700 font-medium">影响明细</span>
          </nav>
        </div>

        <ScrollCard
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SealBadge status={pkg.status} size="md" />
                <div>
                  <h1 className="text-2xl font-song font-bold text-ink-700">
                    {pkg.name}
                  </h1>
                  <p className="text-sm text-ochre-600 font-song mt-1">
                    {dimensionTextMap[pkg.dimension]} · 版本 {pkg.nextVersion}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm font-song">
                <div className="text-center">
                  <div className="text-2xl font-bold text-ochre-700">{pkg.sampleCount}</div>
                  <div className="text-ochre-500 text-xs">样本总数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cinnabar-600">{pkg.affectedSampleCount}</div>
                  <div className="text-ochre-500 text-xs">受影响</div>
                </div>
                <StatusTag status={pkg.status} size="md" />
              </div>
            </div>
          }
        >
          <BambooDivider withText text="影响分析" />

          <div className="flex gap-1 mb-6 border-b border-ochre-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 font-song text-sm transition-colors relative',
                    activeTab === tab.key
                      ? 'text-ochre-700 font-medium'
                      : 'text-ochre-500 hover:text-ochre-700'
                  )}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    activeTab === tab.key
                      ? 'bg-ochre-200 text-ochre-800'
                      : 'bg-ochre-100 text-ochre-600'
                  )}>
                    {tab.count}
                  </span>
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ochre-600" />
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === 'samples' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Filter size={16} className="text-ochre-500" />
                <span className="text-sm font-song text-ochre-600">筛选：</span>
                <div className="flex gap-1">
                  {filters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFilterStatus(f.key)}
                      className={cn(
                        'px-3 py-1 text-sm font-song rounded-md border transition-colors',
                        filterStatus === f.key
                          ? 'bg-ochre-600 text-white border-ochre-600'
                          : 'bg-white text-ochre-600 border-ochre-300 hover:bg-ochre-50'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-ochre-200">
                <table className="w-full font-song">
                  <thead>
                    <tr className="bg-ochre-50 text-ochre-700 text-sm">
                      <th className="px-4 py-3 text-left font-medium">井号</th>
                      <th className="px-4 py-3 text-left font-medium">样本名称</th>
                      <th className="px-4 py-3 text-left font-medium">旧值</th>
                      <th className="px-4 py-3 text-left font-medium">新值</th>
                      <th className="px-4 py-3 text-left font-medium">是否锁定</th>
                      <th className="px-4 py-3 text-left font-medium">需重算批次</th>
                      <th className="px-4 py-3 text-left font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSamples.map((sample, idx) => {
                      const values = getValuePair(sample.id);
                      const colors = sampleStatusColor[sample.status];
                      return (
                        <tr
                          key={sample.id}
                          className={cn(
                            'border-t border-ochre-100 hover:bg-ochre-50/50 transition-colors',
                            idx % 2 === 0 ? 'bg-white' : 'bg-paper-50'
                          )}
                        >
                          <td className="px-4 py-3 text-sm text-ink-600">{sample.sampleCode}</td>
                          <td className="px-4 py-3 text-sm text-ink-700 font-medium">
                            {sample.sampleName}
                          </td>
                          <td className="px-4 py-3 text-sm text-ink-500">{values.old}</td>
                          <td className="px-4 py-3 text-sm text-ochre-700 font-medium">
                            {values.new}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {sample.status === 'locked' ? (
                              <span className="inline-flex items-center gap-1 text-ink-600">
                                <Lock size={14} />
                                是
                              </span>
                            ) : (
                              <span className="text-ink-400">否</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {sample.status === 'recalc_needed' ? (
                              <span className="inline-flex items-center gap-1 text-stoneBlue-600">
                                <RefreshCw size={14} />
                                是
                              </span>
                            ) : (
                              <span className="text-ink-400">否</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center px-2 py-1 text-xs rounded border',
                              colors.text,
                              colors.bg,
                              colors.border
                            )}>
                              {sampleStatusText[sample.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredSamples.length === 0 && (
                <div className="py-12 text-center text-ochre-400 font-song">
                  暂无符合条件的样本
                </div>
              )}
            </div>
          )}

          {activeTab === 'locked' && (
            <div className="space-y-4">
              {lockedSamples.length === 0 ? (
                <div className="py-12 text-center text-ochre-400 font-song">
                  暂无锁定记录
                </div>
              ) : (
                lockedSamples.map(sample => (
                  <div
                    key={sample.id}
                    className="p-4 bg-ink-50 rounded-lg border border-ink-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-ink-200 flex items-center justify-center">
                          <Lock size={18} className="text-ink-600" />
                        </div>
                        <div>
                          <h4 className="font-song font-medium text-ink-700">
                            {sample.sampleName}
                          </h4>
                          <p className="text-xs text-ink-500 font-song mt-0.5">
                            {sample.sampleCode}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-ink-500 font-song">
                        {formatDate(sample.affectedAt, 'date')}
                      </span>
                    </div>
                    <div className="mt-3 pl-13">
                      <div className="text-sm text-ink-600 font-song">
                        <span className="text-ink-500">锁定原因：</span>
                        {sample.reason}
                      </div>
                      {sample.resolver && (
                        <div className="text-sm text-ochre-600 font-song mt-2">
                          <span className="text-ochre-500">负责人：</span>
                          {sample.resolver}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'recalc' && (
            <div className="space-y-4">
              <p className="text-sm text-ochre-600 font-song mb-4">
                以下导出批次因 {pkg?.name} 样本数据更新需要重新计算
              </p>
              {packageBatches.length === 0 ? (
                <div className="py-12 text-center text-ochre-400 font-song">
                  暂无需重算的导出批次
                </div>
              ) : (
                packageBatches.map(batch => {
                  const Icon = batchTypeIcon(batch.batchType);
                  const prio = formatPriority(batch.priority);
                  return (
                    <div
                      key={batch.id}
                      className="p-4 bg-stoneBlue-50 rounded-lg border border-stoneBlue-200
                                 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stoneBlue-100 flex items-center justify-center">
                            <Icon size={18} className="text-stoneBlue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-song font-medium text-stoneBlue-800">
                                {batch.name}
                              </h4>
                              <span className={cn(
                                'px-2 py-0.5 text-xs rounded border font-song',
                                prio.cls
                              )}>
                                {prio.label}
                              </span>
                            </div>
                            <p className="text-xs text-stoneBlue-500 font-song mt-0.5">
                              {batchTypeText[batch.batchType]} · 关联 {batch.sampleCount} 个样本 · {batch.exportFormat.toUpperCase()}
                            </p>
                            <p className="text-xs text-stoneBlue-400 font-song mt-1">
                              {batch.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-song text-stoneBlue-700">
                            {formatEstimatedTime(batch.estimatedTimeMinutes)}
                          </div>
                          <div className="text-xs text-stoneBlue-500 font-song mt-0.5">
                            预计重算时间
                          </div>
                          <div className="text-xs text-stoneBlue-400 font-song mt-1">
                            {formatDate(batch.createdAt, 'date')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </ScrollCard>
      </div>
    </div>
  );
}
