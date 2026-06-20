import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, Users, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import ScrollCard from '../components/common/ScrollCard';
import SealBadge from '../components/common/SealBadge';
import StatusTag from '../components/common/StatusTag';
import BambooDivider from '../components/common/BambooDivider';
import { useAppStore } from '../store';
import { formatDate, formatNumber } from '../utils/format';
import { ReleaseStatus } from '../shared/types';
import { cn } from '../lib/utils';

const riskLevelMap = {
  high: { label: '高风险', color: '#C23B22', bg: 'bg-cinnabar-50', text: 'text-cinnabar-700', border: 'border-cinnabar-300' },
  medium: { label: '中风险', color: '#B56D32', bg: 'bg-ochre-50', text: 'text-ochre-700', border: 'border-ochre-300' },
  low: { label: '低风险', color: '#4A7C59', bg: 'bg-bronze-50', text: 'text-bronze-700', border: 'border-bronze-300' },
};

const stepStatusMap = {
  pending: { label: '待执行', icon: null, color: 'text-ochre-400', bgDot: 'bg-paper-100', borderDot: 'border-ochre-300' },
  in_progress: { label: '执行中', icon: Loader2, color: 'text-ochre-600', bgDot: 'bg-ochre-500', borderDot: 'border-ochre-600' },
  completed: { label: '已完成', icon: CheckCircle2, color: 'text-bronze-600', bgDot: 'bg-bronze-500', borderDot: 'border-bronze-600' },
  failed: { label: '失败', icon: XCircle, color: 'text-cinnabar-600', bgDot: 'bg-cinnabar-500', borderDot: 'border-cinnabar-600' },
};

const RollbackDraft: React.FC = () => {
  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId: string }>();
  const { packages, rollbackDrafts, fetchPackages, fetchPackageRollbackDrafts } = useAppStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    if (packageId) {
      fetchPackages();
      fetchPackageRollbackDrafts(packageId);
    }
  }, [packageId, fetchPackages, fetchPackageRollbackDrafts]);

  const pkg = packages.find(p => p.id === packageId);
  const draft = rollbackDrafts.find(d => d.packageId === packageId && d.status === 'draft');

  const getRiskLevel = (steps: typeof draft['steps']) => {
    const totalDuration = steps.reduce((sum, s) => sum + s.estimatedDuration, 0);
    if (totalDuration > 100) return 'high';
    if (totalDuration > 50) return 'medium';
    return 'low';
  };

  const getAffectedCount = () => pkg?.affectedSampleCount || 0;
  const getTotalDuration = () => draft?.steps.reduce((sum, s) => sum + s.estimatedDuration, 0) || 0;

  const StepSeal: React.FC<{ num: number; status: string }> = ({ num, status }) => {
    const statusConfig = stepStatusMap[status as keyof typeof stepStatusMap];
    const isCompleted = status === 'completed';
    const isFailed = status === 'failed';
    const isInProgress = status === 'in_progress';

    return (
      <div
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center font-song font-bold text-lg border-2 transition-all duration-300',
          isCompleted && 'bg-bronze-500 text-white border-bronze-600',
          isFailed && 'bg-cinnabar-500 text-white border-cinnabar-600',
          isInProgress && 'bg-ochre-500 text-white border-ochre-600 animate-pulse',
          status === 'pending' && 'bg-paper-100 text-ochre-400 border-ochre-300'
        )}
        style={{
          boxShadow: isCompleted || isFailed || isInProgress
            ? `0 2px 8px ${isCompleted ? '#4A7C59' : isFailed ? '#C23B22' : '#B56D32'}40`
            : 'none',
          transform: 'rotate(-3deg)',
        }}
      >
        <div className="absolute inset-1 rounded-full border opacity-30 border-current" />
        <span className="relative z-10">{num}</span>
      </div>
    );
  };

  if (!pkg || !draft) {
    return (
      <div className="min-h-screen bg-paper-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-ochre-600 hover:text-ochre-800 transition-colors mb-6 font-song"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <div className="text-center py-16 text-ochre-500 font-song">加载中...</div>
        </div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(draft.steps);
  const riskConfig = riskLevelMap[riskLevel as keyof typeof riskLevelMap];

  return (
    <div className="min-h-screen bg-paper-100 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ochre-600 hover:text-ochre-800 transition-colors mb-6 font-song"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-song font-bold text-ochre-800 mb-2">
                回滚草案
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-ochre-600 font-song text-lg">{pkg.name}</span>
                <span className="text-ochre-400">|</span>
                <span className="text-ochre-500 text-sm">
                  {draft.targetVersion} → {draft.rollbackVersion}
                </span>
              </div>
            </div>
            <SealBadge status={ReleaseStatus.draft} size="md" />
          </div>
        </div>

        <BambooDivider withText={true} text="风险评估" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <ScrollCard className="md:col-span-1">
            <div className="text-center">
              <div
                className={cn(
                  'inline-flex items-center justify-center w-16 h-16 rounded-full mb-3',
                  riskConfig.bg,
                  riskConfig.border,
                  'border-2'
                )}
              >
                <AlertTriangle className="w-8 h-8" style={{ color: riskConfig.color }} />
              </div>
              <div className={cn('font-song font-bold text-lg', riskConfig.text)}>
                {riskConfig.label}
              </div>
            </div>
          </ScrollCard>

          <ScrollCard>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ochre-50 border-2 border-ochre-200 mb-3">
                <Users className="w-7 h-7 text-ochre-600" />
              </div>
              <div className="font-song font-bold text-2xl text-ochre-800">
                {formatNumber(getAffectedCount())}
              </div>
              <div className="text-ochre-500 text-sm mt-1">受影响样本数</div>
            </div>
          </ScrollCard>

          <ScrollCard>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ochre-50 border-2 border-ochre-200 mb-3">
                <Clock className="w-7 h-7 text-ochre-600" />
              </div>
              <div className="font-song font-bold text-2xl text-ochre-800">
                {getTotalDuration()}分钟
              </div>
              <div className="text-ochre-500 text-sm mt-1">预计耗时</div>
            </div>
          </ScrollCard>

          <ScrollCard className="md:col-span-1">
            <div className="text-sm">
              <div className="font-song font-medium text-ochre-700 mb-2">评估说明</div>
              <p className="text-ochre-500 text-xs leading-relaxed">
                回滚操作将影响 {formatNumber(getAffectedCount())} 个已处理样本，
                预计耗时约 {Math.floor(getTotalDuration() / 60)}小时{getTotalDuration() % 60}分钟。
                回滚过程中服务将短暂不可用，请选择业务低峰期执行。
              </p>
            </div>
          </ScrollCard>
        </div>

        <BambooDivider withText={true} text="回滚步骤" />

        <div className="space-y-4 mb-8">
          {draft.steps.map((step, index) => {
            const statusConfig = stepStatusMap[step.status as keyof typeof stepStatusMap];
            const isExpanded = expandedStep === step.id;
            const isLast = index === draft.steps.length - 1;

            return (
              <div key={step.id} className="relative">
                <ScrollCard
                  hover
                  clickable
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className={cn(
                    'transition-all duration-300',
                    step.status === 'in_progress' && 'ring-2 ring-ochre-400 ring-opacity-50'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <StepSeal num={step.order} status={step.status} />
                      {!isLast && (
                        <div
                          className={cn(
                            'absolute left-1/2 -translate-x-1/2 top-14 w-0.5 h-8',
                            step.status === 'completed' ? 'bg-bronze-300' : 'bg-ochre-200'
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-song font-semibold text-ochre-800 text-lg">
                            {step.title}
                          </h3>
                          <p className="text-ochre-500 text-sm mt-1 line-clamp-1">
                            {step.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={cn('text-sm font-medium', statusConfig.color)}>
                            {statusConfig.label}
                          </span>
                          <span className="text-ochre-400 text-sm">
                            约{step.estimatedDuration}分钟
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-ochre-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-ochre-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-ochre-100">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-ochre-50/50 rounded-lg p-3">
                              <div className="text-xs text-ochre-500 mb-1">步骤描述</div>
                              <div className="text-sm text-ochre-700">{step.description}</div>
                            </div>
                            <div className="bg-ochre-50/50 rounded-lg p-3">
                              <div className="text-xs text-ochre-500 mb-1">预计时间</div>
                              <div className="text-sm text-ochre-700 font-medium">
                                {step.estimatedDuration} 分钟
                              </div>
                            </div>
                            <div className="bg-ochre-50/50 rounded-lg p-3">
                              <div className="text-xs text-ochre-500 mb-1">影响数量</div>
                              <div className="text-sm text-ochre-700 font-medium">
                                {step.order === 4 ? formatNumber(getAffectedCount()) : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollCard>
              </div>
            );
          })}
        </div>

        <BambooDivider />

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded border border-ochre-300 text-ochre-700 font-song hover:bg-ochre-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-6 py-2.5 rounded bg-cinnabar-500 text-white font-song hover:bg-cinnabar-400 transition-colors border border-cinnabar-600 shadow-seal"
            style={{ transform: 'rotate(-0.5deg)' }}
          >
            执行回滚
          </button>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <ScrollCard className="max-w-md w-full">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cinnabar-50 border-2 border-cinnabar-300 mb-4">
                  <AlertTriangle className="w-8 h-8 text-cinnabar-500" />
                </div>
                <h3 className="font-song font-bold text-xl text-ochre-800 mb-2">
                  确认执行回滚？
                </h3>
                <p className="text-ochre-500 text-sm mb-6 leading-relaxed">
                  回滚操作将把 {pkg.name} 从 {draft.targetVersion} 回退至 {draft.rollbackVersion}。
                  <br />
                  此操作不可撤销，确定要继续吗？
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-5 py-2 rounded border border-ochre-300 text-ochre-700 font-song hover:bg-ochre-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      navigate(-1);
                    }}
                    className="px-5 py-2 rounded bg-cinnabar-500 text-white font-song hover:bg-cinnabar-400 transition-colors border border-cinnabar-600"
                  >
                    确认执行
                  </button>
                </div>
              </div>
            </ScrollCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default RollbackDraft;
