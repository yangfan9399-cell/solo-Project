import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Clock, Users, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2, FileText, Sparkles } from 'lucide-react';
import ScrollCard from '../components/common/ScrollCard';
import SealBadge from '../components/common/SealBadge';
import StatusTag from '../components/common/StatusTag';
import BambooDivider from '../components/common/BambooDivider';
import { useAppStore } from '../store';
import { formatDate, formatNumber } from '../utils/format';
import { ReleaseStatus, RollbackDraft as RollbackDraftType } from '../shared/types';
import api from '../services/api';
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
  const { packages, rollbackDrafts, auditLogs, fetchPackages, fetchPackageRollbackDrafts, rollbackPackage, fetchPackageAuditLogs } = useAppStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<RollbackDraftType | null>(null);
  const [generateReason, setGenerateReason] = useState('');
  const [generateSuccess, setGenerateSuccess] = useState(false);

  useEffect(() => {
    if (packageId) {
      fetchPackages();
      fetchPackageRollbackDrafts(packageId);
      fetchPackageAuditLogs(packageId);
    }
  }, [packageId, fetchPackages, fetchPackageRollbackDrafts, fetchPackageAuditLogs]);

  const handleRollbackExecute = async () => {
    if (!packageId) return;
    setIsRollingBack(true);
    try {
      const ok = await rollbackPackage(packageId);
      setIsRollingBack(false);
      if (ok) {
        setRollbackSuccess(true);
        setTimeout(() => {
          navigate(-1);
        }, 1800);
      } else {
        alert('回滚执行失败，请重试');
      }
    } catch (e) {
      setIsRollingBack(false);
      alert('回滚执行失败');
    }
  };

  const handleGenerateDraft = async () => {
    if (!packageId) return;
    setIsGenerating(true);
    setGenerateSuccess(false);
    setGeneratedDraft(null);
    try {
      const result = await api.rollbackDrafts.generate(packageId, { reason: generateReason || undefined });
      setIsGenerating(false);
      if (result) {
        setGeneratedDraft(result);
        setGenerateSuccess(true);
        await fetchPackageRollbackDrafts(packageId);
        await fetchPackageAuditLogs(packageId);
      } else {
        alert('回滚草案生成失败');
      }
    } catch (e) {
      setIsGenerating(false);
      alert('回滚草案生成失败');
    }
  };

  const pkg = packages.find(p => p.id === packageId);
  const effectiveDraft = generatedDraft || rollbackDrafts.find(d => d.packageId === packageId && d.status === 'draft');
  const recentAuditLogs = auditLogs.filter(a => a.packageId === packageId).slice(0, 5);

  if (!pkg) {
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

  const getRiskLevel = (steps: RollbackDraftType['steps']) => {
    const totalDuration = steps.reduce((sum, s) => sum + s.estimatedDuration, 0);
    if (totalDuration > 100) return 'high';
    if (totalDuration > 50) return 'medium';
    return 'low';
  };

  const getAffectedCount = () => pkg?.affectedSampleCount || 0;
  const getTotalDuration = (steps?: RollbackDraftType['steps']) => steps?.reduce((sum, s) => sum + s.estimatedDuration, 0) || 0;

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

  const displayDraft = generatedDraft || effectiveDraft;

  if (!displayDraft) {
    return (
      <div className="min-h-screen bg-paper-100 p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-ochre-600 hover:text-ochre-800 transition-colors mb-6 font-song"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <ScrollCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ochre-50 border-2 border-ochre-300 flex items-center justify-center">
                <FileText size={18} className="text-ochre-600" />
              </div>
              <div>
                <h2 className="font-song font-bold text-xl text-ochre-800">生成回滚草案</h2>
                <p className="text-xs text-ochre-500 font-song">发布包：{pkg.name}（{pkg.currentVersion} → {pkg.nextVersion}）</p>
              </div>
            </div>
            <BambooDivider variant="default" withText={true} text="系统自动推演" />
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm text-ochre-700 font-song mb-2 block">回滚原因（可选）</span>
                <textarea
                  value={generateReason}
                  onChange={e => setGenerateReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded border border-ochre-300 bg-paper-100 text-ochre-800 font-song text-sm focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:border-transparent resize-none"
                  placeholder="例如：发现部分铭文识别准确率下降、存在阻断项无法解决、需临时回滚至稳定版……"
                />
              </label>
              <div className="p-4 bg-ochre-50 rounded-lg border border-ochre-200">
                <h4 className="font-song font-medium text-ochre-800 text-sm mb-2 flex items-center gap-2">
                  <Sparkles size={14} />
                  自动推演内容
                </h4>
                <ul className="space-y-1 text-xs text-ochre-600 font-song">
                  <li>• 将自动定位回滚目标版本（上一稳定版：{pkg.currentVersion}）</li>
                  <li>• 生成 6 步标准回滚流程（备份/暂停/切换/重算/校验/通知）</li>
                  <li>• 预计影响 {pkg.affectedSampleCount} 个样本</li>
                  <li>• 生成完成后立即写入审计日志</li>
                </ul>
              </div>
              {generateSuccess && generatedDraft && (
                <div className="p-4 bg-bronze-50 rounded-lg border border-bronze-200 animate-pulse">
                  <div className="flex items-center gap-2 text-bronze-700 font-song text-sm">
                    <CheckCircle2 size={16} />
                    <span>
                      草案已生成：<b>{generatedDraft.id}</b>（{generatedDraft.steps.length} 步，
                      预计 {getTotalDuration(generatedDraft.steps)} 分钟），审计日志已记录
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-5 py-2 rounded border border-ochre-300 text-ochre-700 font-song hover:bg-ochre-50 transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={handleGenerateDraft}
                  disabled={isGenerating}
                  className={cn(
                    'px-5 py-2 rounded font-song border flex items-center gap-2 transition-colors',
                    generateSuccess
                      ? 'bg-bronze-500 text-white border-bronze-600'
                      : 'bg-ochre-500 text-white hover:bg-ochre-400 border-ochre-600'
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      生成中...
                    </>
                  ) : generateSuccess ? (
                    <>
                      <CheckCircle2 size={14} />
                      已生成
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      调用后端生成
                    </>
                  )}
                </button>
              </div>
            </div>
            {recentAuditLogs.length > 0 && (
              <>
                <BambooDivider variant="default" withText={true} text="审计记录" className="my-6" />
                <div className="space-y-2">
                  {recentAuditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-2 border-l-2 border-ochre-300">
                      <div className="text-xs text-ochre-400 font-song whitespace-nowrap">
                        {formatDate(log.timestamp, 'full')}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-ochre-700 font-song font-medium">
                          {log.action}
                        </div>
                        <div className="text-xs text-ochre-500 font-song">{log.description}</div>
                      </div>
                      <div className="text-xs text-ochre-400 font-song">{log.operator}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ScrollCard>
        </div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(displayDraft.steps);
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
                  {displayDraft.targetVersion} → {displayDraft.rollbackVersion}
                </span>
              </div>
              {generateSuccess && generatedDraft && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bronze-50 border border-bronze-200 text-xs text-bronze-700 font-song animate-pulse">
                  <CheckCircle2 size={12} />
                  刚刚生成 · 审计日志已记录
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateDraft}
                disabled={isGenerating}
                className={cn(
                  'px-4 py-2 rounded font-song text-sm border flex items-center gap-2 transition-colors',
                  generateSuccess
                    ? 'bg-bronze-50 text-bronze-700 border-bronze-300'
                    : 'bg-ochre-50 text-ochre-700 border-ochre-300 hover:bg-ochre-100'
                )}
                title="调用后端 POST /rollback/:id/generate-rollback-draft"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generateSuccess ? '重新生成草案' : isGenerating ? '生成中...' : '生成新草案'}
              </button>
              <SealBadge status={ReleaseStatus.draft} size="md" />
            </div>
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
                预计耗时约 {Math.floor(getTotalDuration(displayDraft.steps) / 60)}小时{getTotalDuration(displayDraft.steps) % 60}分钟。
                回滚过程中服务将短暂不可用，请选择业务低峰期执行。
              </p>
            </div>
          </ScrollCard>
        </div>

        <BambooDivider withText={true} text="回滚步骤" />

        <div className="space-y-4 mb-8">
          {displayDraft.steps.map((step, index) => {
            const statusConfig = stepStatusMap[step.status as keyof typeof stepStatusMap];
            const isExpanded = expandedStep === step.id;
            const isLast = index === displayDraft.steps.length - 1;

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
                  回滚操作将把 {pkg.name} 从 {displayDraft.targetVersion} 回退至 {displayDraft.rollbackVersion}。
                  <br />
                  此操作不可撤销，确定要继续吗？
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isRollingBack}
                    className="px-5 py-2 rounded border border-ochre-300 text-ochre-700 font-song hover:bg-ochre-50 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRollbackExecute}
                    disabled={isRollingBack || rollbackSuccess}
                    className={cn(
                      'px-5 py-2 rounded text-white font-song transition-colors border flex items-center gap-2',
                      rollbackSuccess
                        ? 'bg-bronze-500 border-bronze-600'
                        : 'bg-cinnabar-500 hover:bg-cinnabar-400 border-cinnabar-600'
                    )}
                  >
                    {isRollingBack && <Loader2 size={16} className="animate-spin" />}
                    {rollbackSuccess ? '回滚成功' : isRollingBack ? '回滚执行中...' : '确认执行'}
                  </button>
                </div>
                {rollbackSuccess && (
                  <div className="mt-4 p-3 bg-bronze-50 rounded border border-bronze-200 text-sm text-bronze-700 font-song">
                    ✅ 回滚操作已记录至审计日志，正在返回...
                  </div>
                )}
              </div>
            </ScrollCard>
          </div>
        )}

        <BambooDivider withText={true} text="操作审计记录" />
        <div className="space-y-2 mt-6">
          {recentAuditLogs.length === 0 ? (
            <div className="text-center py-8 text-ochre-400 font-song">暂无审计记录</div>
          ) : (
            recentAuditLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-paper-100 rounded border border-ochre-200 hover:bg-ochre-50 transition-colors">
                <div className="text-xs text-ochre-400 font-song whitespace-nowrap w-40">
                  {formatDate(log.timestamp, 'full')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ochre-800 font-song font-medium flex items-center gap-2">
                    {log.action}
                    {(log.action === '回滚草案生成' || log.action.includes('草案')) && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-ochre-100 text-ochre-700 border border-ochre-200">
                        生成
                      </span>
                    )}
                    {log.action === '版本回滚' && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-cinnabar-100 text-cinnabar-700 border border-cinnabar-200">
                        回滚
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ochre-500 font-song mt-0.5 truncate">{log.description}</div>
                  {log.details && (
                    <div className="mt-1 p-2 bg-ochre-50 rounded text-xs text-ochre-600 font-song font-mono break-all">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-ochre-400 font-song whitespace-nowrap w-20 text-right">
                  {log.operator}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RollbackDraft;
