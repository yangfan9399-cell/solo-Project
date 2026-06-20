import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Lock, AlertTriangle, Clock, CheckCircle, 
  ChevronRight, FileText, Shield, Merge, ArrowRight, X
} from 'lucide-react';
import { ScrollCard, StatusTag, SealBadge, BambooDivider } from '../components/common';
import { useAppStore } from '../store';
import { formatDate, dimensionTextMap } from '../utils/format';
import { cn } from '../lib/utils';

type TabType = 'lock' | 'inscription' | 'review';

const severityText: Record<string, { text: string; color: string }> = {
  high: { text: '高', color: 'text-cinnabar-600 bg-cinnabar-50 border-cinnabar-300' },
  medium: { text: '中', color: 'text-ochre-600 bg-ochre-50 border-ochre-300' },
  low: { text: '低', color: 'text-stoneBlue-600 bg-stoneBlue-50 border-stoneBlue-300' },
};

const mockInscriptionConflicts = [
  {
    id: 'ins-conflict-001',
    sampleName: '西安碑林唐井铭拓片',
    sampleCode: 'XA-BL-001',
    oldText: '维大唐贞观十五年岁次辛丑月壬寅日，京兆府长安县义阳乡善政里，故人赵君墓志铭。君讳文，字士。',
    newText: '维大唐贞观十五年岁次辛丑月壬寅日，京兆府长安县义阳乡善政里，故人赵君墓志铭。君讳文远，字士弘。',
    conflictFields: ['名字', '字'],
    status: 'pending',
  },
  {
    id: 'ins-conflict-002',
    sampleName: '洛阳出土隋代井栏铭文',
    sampleCode: 'LY-CW-023',
    oldText: '大隋开皇九年，洛阳城北安乐里，井一口，深五丈，口径三尺。',
    newText: '大隋开皇九年，洛阳城北安乐里，石井一口，深五丈，口径三尺五寸。',
    conflictFields: ['井类型', '口径'],
    status: 'pending',
  },
  {
    id: 'ins-conflict-003',
    sampleName: '开封龙亭古井铭文',
    sampleCode: 'KF-LT-101',
    oldText: '宋天禧元年，造井于州署东，供民汲饮，太守李公之政也。',
    newText: '宋天禧元年，造石井于州署东偏，供民汲饮，太守李公之德政也。',
    conflictFields: ['位置', '评价'],
    status: 'resolved',
  },
];

const mockLockBlockers = [
  {
    id: 'lock-001',
    title: '西安碑林唐井铭拓片数据锁定',
    description: '该样本正在进行人工复核，暂不参与新版本计算，需等待复核完成后解锁。',
    sampleName: '西安碑林唐井铭拓片',
    sampleCode: 'XA-BL-001',
    lockedBy: '李文博',
    lockedAt: '2025-06-11T09:30:00Z',
    severity: 'high',
    status: 'open',
  },
  {
    id: 'lock-002',
    title: '拉萨布达拉宫古井特殊文物锁定',
    description: '特殊文物数据访问受限，需文物局审批后才能更新数据。',
    sampleName: '拉萨布达拉宫古井',
    sampleCode: 'LS-BD-389',
    lockedBy: '文保中心',
    lockedAt: '2025-06-07T15:00:00Z',
    severity: 'high',
    status: 'open',
  },
  {
    id: 'lock-003',
    title: '太原晋祠圣母殿井修缮锁定',
    description: '文物建筑修缮期间数据冻结，待修缮完成后恢复数据更新。',
    sampleName: '太原晋祠圣母殿井',
    sampleCode: 'TY-SM-008',
    lockedBy: '古建筑保护所',
    lockedAt: '2025-06-10T11:00:00Z',
    severity: 'medium',
    status: 'open',
  },
];

const mockReviewItems = [
  {
    id: 'review-001',
    title: '低光照样本验证待确认',
    description: '新增加的低光照增强算法在部分极端低光照样本上的表现还需要人工验证确认。',
    reporter: '李文博',
    createdAt: '2025-06-11T08:45:00Z',
    severity: 'medium',
    status: 'open',
  },
  {
    id: 'review-002',
    title: '保存建议库内容待审核',
    description: '新增的文物保存建议库内容需要文物保护专家委员会审核通过后才能发布。',
    reporter: '张秋月',
    createdAt: '2025-06-12T09:15:00Z',
    severity: 'high',
    status: 'open',
  },
  {
    id: 'review-003',
    title: '锈蚀发展预测模型数据不足',
    description: '新增加的锈蚀发展预测功能缺乏足够的长期观测数据支撑，预测结果的准确性需要更多历史数据验证。',
    reporter: '王晓燕',
    createdAt: '2025-06-10T14:20:00Z',
    severity: 'medium',
    status: 'resolved',
  },
  {
    id: 'review-004',
    title: '局部清晰度热力图性能优化',
    description: '局部清晰度热力图生成速度较慢，大尺寸拓片处理时间超过预期，需要性能优化。',
    reporter: '陈志强',
    createdAt: '2025-06-09T13:30:00Z',
    severity: 'low',
    status: 'resolved',
  },
];

export default function BlockersDetail() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { packages, blockers, fetchPackages, fetchPackageBlockers, resolveBlocker } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('lock');
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [resolveDialog, setResolveDialog] = useState<{ id: string; title: string } | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  useEffect(() => {
    if (packageId) {
      fetchPackages();
      fetchPackageBlockers(packageId);
    }
  }, [packageId, fetchPackages, fetchPackageBlockers]);

  const pkg = packages.find(p => p.id === packageId);
  const packageBlockers = blockers.filter(b => b.packageId === packageId);

  const totalBlockers = packageBlockers.length;
  const resolvedBlockers = packageBlockers.filter(b => b.status === 'resolved').length;
  const pendingBlockers = packageBlockers.filter(b => b.status === 'open').length;

  const lockBlockers = mockLockBlockers;
  const inscriptionConflicts = mockInscriptionConflicts;
  const reviewItems = mockReviewItems;

  const tabs = [
    { key: 'lock' as TabType, label: '锁定阻断', count: lockBlockers.filter(b => b.status === 'open').length, icon: Lock },
    { key: 'inscription' as TabType, label: '铭文冲突', count: inscriptionConflicts.filter(c => c.status === 'pending').length, icon: FileText },
    { key: 'review' as TabType, label: '待审核项', count: reviewItems.filter(r => r.status === 'open').length, icon: Clock },
  ];

  const handleResolve = (id: string, title: string) => {
    setResolveDialog({ id, title });
    setResolutionText('');
  };

  const confirmResolve = () => {
    if (resolveDialog && resolutionText.trim()) {
      resolveBlocker(resolveDialog.id, resolutionText);
      setResolveDialog(null);
      setResolutionText('');
    }
  };

  const handleInscriptionAction = (action: string) => {
    setSelectedConflict(null);
  };

  const renderConflictText = (oldText: string, newText: string, isOld: boolean) => {
    const oldChars = oldText.split('');
    const newChars = newText.split('');
    const maxLen = Math.max(oldChars.length, newChars.length);
    const result = [];

    for (let i = 0; i < maxLen; i++) {
      const oldChar = oldChars[i] || '';
      const newChar = newChars[i] || '';

      if (oldChar !== newChar) {
        if (isOld) {
          result.push(
            <span key={i} className="bg-cinnabar-100 text-cinnabar-700 line-through">
              {oldChar || '□'}
            </span>
          );
        } else {
          result.push(
            <span key={i} className="bg-bronze-100 text-bronze-700 font-medium">
              {newChar || '□'}
            </span>
          );
        }
      } else {
        result.push(
          <span key={i} className="text-ink-700">
            {oldChar}
          </span>
        );
      }
    }

    return result;
  };

  if (!pkg) {
    return (
      <div className="p-8 text-center font-song text-ochre-600">
        加载中...
      </div>
    );
  }

  const selectedConflictData = inscriptionConflicts.find(c => c.id === selectedConflict);

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
            <span className="text-ochre-700 font-medium">阻断原因</span>
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
                  <div className="text-2xl font-bold text-ochre-700">{totalBlockers}</div>
                  <div className="text-ochre-500 text-xs">总数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bronze-600">{resolvedBlockers}</div>
                  <div className="text-ochre-500 text-xs">已解决</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cinnabar-600">{pendingBlockers}</div>
                  <div className="text-ochre-500 text-xs">待处理</div>
                </div>
                <StatusTag status={pkg.status} size="md" />
              </div>
            </div>
          }
        >
          <BambooDivider withText text="阻断分析" />

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

          {activeTab === 'lock' && (
            <div className="space-y-4">
              {lockBlockers.map(blocker => {
                const sev = severityText[blocker.severity];
                return (
                  <div
                    key={blocker.id}
                    className="p-5 bg-white rounded-lg border border-ochre-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0">
                          <Lock size={20} className="text-ink-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-song font-medium text-ink-700 text-base">
                              {blocker.title}
                            </h4>
                            <span className={cn(
                              'px-2 py-0.5 text-xs rounded border font-song',
                              sev.color
                            )}>
                              {sev.text}
                            </span>
                          </div>
                          <p className="text-sm text-ochre-600 font-song mt-2 leading-relaxed">
                            {blocker.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-ochre-500 font-song">
                            <span>样本：{blocker.sampleName}</span>
                            <span>编号：{blocker.sampleCode}</span>
                            <span>锁定人：{blocker.lockedBy}</span>
                            <span>锁定时间：{formatDate(blocker.lockedAt, 'date')}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolve(blocker.id, blocker.title)}
                        className="flex items-center gap-1 px-4 py-2 bg-ochre-600 text-white 
                                   text-sm font-song rounded-md hover:bg-ochre-700 transition-colors"
                      >
                        <CheckCircle size={16} />
                        解决
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'inscription' && (
            <div>
              {!selectedConflict ? (
                <div className="space-y-4">
                <p className="text-sm text-ochre-600 font-song mb-4">
                  残缺铭文补读与旧释文存在冲突，需人工确认后采用正确版本
                </p>
                {inscriptionConflicts.map(conflict => (
                  <div
                    key={conflict.id}
                    onClick={() => setSelectedConflict(conflict.id)}
                    className={cn(
                      'p-5 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                      conflict.status === 'resolved'
                        ? 'bg-bronze-50 border-bronze-200'
                        : 'bg-white border-ochre-200 hover:border-ochre-300'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                          conflict.status === 'resolved'
                            ? 'bg-bronze-100'
                            : 'bg-cinnabar-100'
                        )}>
                          <FileText size={20} className={cn(
                            conflict.status === 'resolved'
                              ? 'text-bronze-600'
                              : 'text-cinnabar-600'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-song font-medium text-ink-700 text-base">
                              {conflict.sampleName}
                            </h4>
                            <span className={cn(
                              'px-2 py-0.5 text-xs rounded border font-song',
                              conflict.status === 'resolved'
                                ? 'text-bronze-600 bg-bronze-50 border-bronze-300'
                                : 'text-cinnabar-600 bg-cinnabar-50 border-cinnabar-300'
                            )}>
                              {conflict.status === 'resolved' ? '已解决' : '待处理'}
                            </span>
                          </div>
                          <p className="text-xs text-ochre-500 font-song mt-1">
                            {conflict.sampleCode}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-ochre-500 font-song">冲突字段：</span>
                            {conflict.conflictFields.map((field, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-xs bg-cinnabar-50 text-cinnabar-600 
                                           rounded border border-cinnabar-200 font-song"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-ochre-400" />
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="space-y-6">
                  <button
                  onClick={() => setSelectedConflict(null)}
                  className="flex items-center gap-2 text-ochre-600 hover:text-ochre-800 font-song text-sm"
                >
                  <ArrowLeft size={16} />
                  返回列表
                </button>

                <div className="text-center">
                  <h3 className="text-lg font-song font-bold text-ink-700">
                    {selectedConflictData?.sampleName}
                  </h3>
                  <p className="text-sm text-ochre-500 font-song mt-1">
                    {selectedConflictData?.sampleCode} · 铭文释文对比
                  </p>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1 relative">
                    <div className="bg-paper-100 rounded-lg border-2 border-ochre-300 overflow-hidden shadow-scroll relative">
                      <div
                        className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-ochre-300 to-transparent z-10"
                      />
                      <div
                        className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-ochre-300 to-transparent z-10"
                      />
                      <div className="px-4 py-3 bg-ochre-50 border-b border-ochre-200 text-center relative z-20">
                        <span className="font-song font-medium text-ochre-700">旧释文</span>
                      </div>
                      <div 
                        className="p-6 pl-8 pr-8 min-h-[300px] font-kai text-lg leading-loose text-ink-700 relative z-20"
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(
                              transparent,
                              transparent 31px,
                              rgba(139, 69, 19, 0.1) 31px,
                              rgba(139, 69, 19, 0.1) 32px
                            )
                          `,
                        }}
                      >
                        <p className="indent-8">
                          {selectedConflictData && renderConflictText(
                            selectedConflictData.oldText,
                            selectedConflictData.newText,
                            true
                          )}
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-ochre-50 border-t border-ochre-200 text-right relative z-20">
                        <span className="text-xs text-ochre-500 font-song">原版本记录</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cinnabar-100 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-cinnabar-600" />
                      </div>
                      <span className="text-xs font-song text-cinnabar-600 writing-mode-vertical">
                        冲突对比
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <div className="bg-paper-100 rounded-lg border-2 border-bronze-300 overflow-hidden shadow-scroll relative">
                      <div
                        className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-bronze-300 to-transparent z-10"
                      />
                      <div
                        className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-bronze-300 to-transparent z-10"
                      />
                      <div className="px-4 py-3 bg-bronze-50 border-b border-bronze-200 text-center relative z-20">
                        <span className="font-song font-medium text-bronze-700">新释文（补读）</span>
                      </div>
                      <div 
                        className="p-6 pl-8 pr-8 min-h-[300px] font-kai text-lg leading-loose relative z-20"
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(
                              transparent,
                              transparent 31px,
                              rgba(58, 99, 71, 0.1) 31px,
                              rgba(58, 99, 71, 0.1) 32px
                            )
                          `,
                        }}
                      >
                        <p className="indent-8">
                          {selectedConflictData && renderConflictText(
                            selectedConflictData.oldText,
                            selectedConflictData.newText,
                            false
                          )}
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-bronze-50 border-t border-bronze-200 text-right relative z-20">
                        <span className="text-xs text-bronze-500 font-song">AI补读建议</span>
                      </div>
                    </div>
                  </div>
                </div>

                <BambooDivider />

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleInscriptionAction('new')}
                    className="flex items-center gap-2 px-6 py-3 bg-bronze-600 text-white 
                               font-song rounded-lg hover:bg-bronze-700 transition-colors"
                  >
                    <CheckCircle size={18} />
                    采用新释文
                  </button>
                  <button
                    onClick={() => handleInscriptionAction('old')}
                    className="flex items-center gap-2 px-6 py-3 bg-ochre-600 text-white 
                               font-song rounded-lg hover:bg-ochre-700 transition-colors"
                  >
                    <Shield size={18} />
                    保留旧释文
                  </button>
                  <button
                    onClick={() => handleInscriptionAction('merge')}
                    className="flex items-center gap-2 px-6 py-3 bg-stoneBlue-600 text-white 
                               font-song rounded-lg hover:bg-stoneBlue-700 transition-colors"
                  >
                    <Merge size={18} />
                    合并修正
                  </button>
                </div>
              </div>
            )}
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-4">
              {reviewItems.map(item => {
                const sev = severityText[item.severity];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-5 rounded-lg border transition-shadow',
                      item.status === 'resolved'
                        ? 'bg-bronze-50 border-bronze-200'
                        : 'bg-white border-ochre-200 hover:shadow-md'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                          item.status === 'resolved'
                            ? 'bg-bronze-100'
                            : 'bg-ochre-100'
                        )}>
                          <Clock size={20} className={cn(
                            item.status === 'resolved'
                              ? 'text-bronze-600'
                              : 'text-ochre-600'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-song font-medium text-ink-700 text-base">
                              {item.title}
                            </h4>
                            <span className={cn(
                              'px-2 py-0.5 text-xs rounded border font-song',
                              sev.color
                            )}>
                              {sev.text}
                            </span>
                            {item.status === 'resolved' && (
                              <span className="px-2 py-0.5 text-xs rounded border 
                                             text-bronze-600 bg-bronze-50 border-bronze-300 font-song">
                                已解决
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-ochre-600 font-song mt-2 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-ochre-500 font-song">
                            <span>提交人：{item.reporter}</span>
                            <span>提交时间：{formatDate(item.createdAt, 'date')}</span>
                          </div>
                        </div>
                      </div>
                      {item.status === 'open' && (
                        <button
                          onClick={() => handleResolve(item.id, item.title)}
                          className="flex items-center gap-1 px-4 py-2 bg-ochre-600 text-white 
                                     text-sm font-song rounded-md hover:bg-ochre-700 transition-colors"
                        >
                          <CheckCircle size={16} />
                          审核通过
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollCard>
      </div>

      {resolveDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-paper-100 rounded-lg border border-ochre-300 shadow-scroll w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ochre-200">
              <h3 className="font-song font-medium text-ink-700 text-lg">解决阻断</h3>
              <button
                onClick={() => setResolveDialog(null)}
                className="text-ochre-400 hover:text-ochre-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-ochre-600 font-song mb-4">
                {resolveDialog.title}
              </p>
              <label className="block text-sm font-song text-ochre-700 mb-2">
                解决方案
              </label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="请输入解决方案说明..."
                className="w-full h-32 px-4 py-3 border border-ochre-300 rounded-lg 
                           bg-white font-song text-sm text-ink-700 
                           focus:outline-none focus:ring-2 focus:ring-ochre-400 
                           focus:border-ochre-400 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-ochre-200 bg-ochre-50/50">
              <button
                onClick={() => setResolveDialog(null)}
                className="px-4 py-2 text-ochre-600 bg-white border border-ochre-300 
                           rounded-md font-song text-sm hover:bg-ochre-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmResolve}
                disabled={!resolutionText.trim()}
                className={cn(
                  'px-4 py-2 text-white rounded-md font-song text-sm transition-colors',
                  resolutionText.trim()
                    ? 'bg-ochre-600 hover:bg-ochre-700'
                    : 'bg-ochre-300 cursor-not-allowed'
                )}
              >
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
