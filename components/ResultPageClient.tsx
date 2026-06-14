'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WaveformView from './WaveformView';

interface ResultRecordData {
  id: string;
  tapeLabel: string;
  cleaningMethod: string;
  cleaningCost: number;
  intelligibility: number;
  fidelity: number;
  materialCost: number;
  repairTimeMs: number;
  hasExcessiveNoiseReduction: boolean;
  hasBadSplice: boolean;
  voiceDetailLoss: number;
  jumpArtifacts: number;
  finalWaveform: number[];
  originalWaveform: number[];
}

interface SessionData {
  id: string;
  label: string;
  batchDescription: string;
  tapeCount: number;
  totalIntelligibility: number;
  totalFidelity: number;
  totalMaterialCost: number;
  totalRepairTimeMs: number;
  finalScore: number;
  grade: string;
  startedAt: number;
  completedAt: number;
}

const CLEANING_NAMES: Record<string, string> = {
  alcohol_swab: '酒精棉擦拭',
  compressed_air: '压缩空气吹扫',
  baking_method: '烘箱烘烤法',
  rewind_cycle: '正反复卷循环',
};

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-300',
  A: 'text-tape-success',
  B: 'text-tape-accent',
  C: 'text-blue-400',
  D: 'text-orange-400',
  F: 'text-tape-danger',
};

const GRADE_BG: Record<string, string> = {
  S: 'from-yellow-600/30 to-yellow-900/30 border-yellow-500',
  A: 'from-green-600/30 to-green-900/30 border-green-500',
  B: 'from-yellow-600/20 to-yellow-900/20 border-yellow-600',
  C: 'from-blue-600/20 to-blue-900/20 border-blue-500',
  D: 'from-orange-600/20 to-orange-900/20 border-orange-500',
  F: 'from-red-600/30 to-red-900/30 border-red-500',
};

export default function ResultPageClient({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [results, setResults] = useState<ResultRecordData[]>([]);
  const [activeTapeIdx, setActiveTapeIdx] = useState(0);
  const [showComparison, setShowComparison] = useState(true);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  async function loadData() {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data.session);

      const records: ResultRecordData[] = data.results.map((r: any, i: number) => ({
        ...r,
        tapeLabel: data.tapes[i]?.label || `磁带 ${i + 1}`,
        originalWaveform: data.tapes[i]?.originalWaveform || [],
      }));
      setResults(records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-tape-muted">
        加载结算数据中...
      </div>
    );
  }

  const activeResult = results[activeTapeIdx];
  const totalDuration = session.totalRepairTimeMs;
  const minutes = Math.floor(totalDuration / 60000);
  const seconds = Math.floor((totalDuration % 60000) / 1000);

  function scoreColor(score: number) {
    if (score >= 85) return 'text-tape-success';
    if (score >= 70) return 'text-tape-accent';
    if (score >= 50) return 'text-orange-400';
    return 'text-tape-danger';
  }

  function Bar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-tape-muted">{label}</span>
          <span className={`font-bold font-mono ${color}`}>{value.toFixed(1)}{max === 100 ? '/100' : ''}</span>
        </div>
        <div className="h-3 bg-tape-bg rounded-full overflow-hidden border border-tape-border">
          <div
            className={`h-full transition-all ${
              color.includes('success') ? 'bg-tape-success' :
              color.includes('danger') ? 'bg-tape-danger' :
              color.includes('accent') ? 'bg-tape-accent' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <Link href="/" className="text-tape-muted hover:text-tape-accent text-sm inline-block mb-4">
          ← 返回首页
        </Link>
        <div className={`border-2 rounded-xl p-8 bg-gradient-to-br ${GRADE_BG[session.grade] || GRADE_BG.F}`}>
          <div className="text-tape-muted text-sm mb-2">修复作业结算报告</div>
          <h1 className="text-3xl md:text-4xl font-bold text-tape-text mb-2">
            {session.label}
          </h1>
          <p className="text-tape-muted mb-6">{session.batchDescription}</p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-end">
            <div className="text-center">
              <div className={`text-7xl md:text-8xl font-black ${GRADE_COLORS[session.grade]}`}>
                {session.grade}
              </div>
              <div className="text-tape-muted text-sm mt-1">综合评级</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-tape-accent">
                {session.finalScore.toFixed(1)}
              </div>
              <div className="text-tape-muted text-sm mt-1">最终得分 / 100</div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-tape-panel border border-tape-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-tape-accent mb-6">📊 总体指标分解</h2>
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
          <Bar
            label="可懂度 (Intelligibility) - 权重40%"
            value={session.totalIntelligibility}
            color={scoreColor(session.totalIntelligibility)}
          />
          <Bar
            label="保真度 (Fidelity) - 权重30%"
            value={session.totalFidelity}
            color={scoreColor(session.totalFidelity)}
          />
          <Bar
            label={`时间效率 (${minutes}:${String(seconds).padStart(2, '0')}) - 权重15%`}
            value={Math.max(0, 100 - totalDuration / 1000)}
            color={scoreColor(Math.max(0, 100 - totalDuration / 1000))}
          />
          <Bar
            label={`成本控制 (¥${session.totalMaterialCost.toFixed(1)}) - 权重15%`}
            value={Math.max(0, 100 - session.totalMaterialCost * 2)}
            color={scoreColor(Math.max(0, 100 - session.totalMaterialCost * 2))}
          />
        </div>

        <div className="mt-8 p-4 bg-tape-bg rounded-lg border border-tape-border">
          <h3 className="text-tape-text font-bold mb-3">🧮 分数计算公式</h3>
          <div className="text-tape-muted text-sm space-y-1 font-mono">
            <p>最终分数 = 可懂度 × 40% + 保真度 × 30% + 时间效率 × 15% + 成本控制 × 15%</p>
            <p className="text-tape-accent mt-2">
              = {session.totalIntelligibility.toFixed(1)} × 0.4 + {session.totalFidelity.toFixed(1)} × 0.3 +
              {' '}{Math.max(0, 100 - totalDuration / 1000).toFixed(1)} × 0.15 +{' '}
              {Math.max(0, 100 - session.totalMaterialCost * 2).toFixed(1)} × 0.15
            </p>
            <p className="text-tape-accent">
              = {(session.totalIntelligibility * 0.4).toFixed(2)} + {(session.totalFidelity * 0.3).toFixed(2)} +{' '}
              {(Math.max(0, 100 - totalDuration / 1000) * 0.15).toFixed(2)} +{' '}
              {(Math.max(0, 100 - session.totalMaterialCost * 2) * 0.15).toFixed(2)}
            </p>
            <p className="text-tape-accent font-bold text-lg mt-2">
              = {session.finalScore.toFixed(2)} 分 → 评级 {session.grade}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-tape-panel border border-tape-border rounded-xl p-6 mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-tape-accent">📼 逐磁带明细分析</h2>
          <div className="flex gap-2 flex-wrap">
            {results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setActiveTapeIdx(i)}
                className={`px-4 py-2 rounded text-sm transition-all ${
                  activeTapeIdx === i
                    ? 'bg-tape-accent text-black font-bold'
                    : 'bg-tape-bg text-tape-muted border border-tape-border hover:border-tape-muted'
                }`}
              >
                {r.tapeLabel}
              </button>
            ))}
          </div>
        </div>

        {activeResult && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="accent-tape-accent"
                />
                <span className="text-tape-muted">显示原始波形对比</span>
              </label>
            </div>

            {showComparison && activeResult.originalWaveform.length > 0 && (
              <div>
                <WaveformView
                  waveform={activeResult.originalWaveform}
                  width={900}
                  height={120}
                  label="🟡 原始无缺陷波形（参照基准）"
                />
              </div>
            )}

            <div>
              <WaveformView
                waveform={activeResult.finalWaveform}
                width={900}
                height={160}
                label="🟢 修复后最终波形（实际输出）"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 bg-tape-bg rounded-lg border border-tape-border">
                <h3 className="font-bold text-tape-text mb-2">🎯 质量指标</h3>
                <Bar
                  label="可懂度"
                  value={activeResult.intelligibility}
                  color={scoreColor(activeResult.intelligibility)}
                />
                <Bar
                  label="保真度"
                  value={activeResult.fidelity}
                  color={scoreColor(activeResult.fidelity)}
                />
              </div>

              <div className="space-y-4 p-4 bg-tape-bg rounded-lg border border-tape-border">
                <h3 className="font-bold text-tape-text mb-2">📦 耗材与耗时</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-tape-muted">清洁方案</span>
                  <span className="text-tape-text">{CLEANING_NAMES[activeResult.cleaningMethod] || activeResult.cleaningMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-tape-muted">耗材总成本</span>
                  <span className="text-tape-accent font-bold">¥{activeResult.materialCost.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-tape-muted">修复耗时</span>
                  <span className="text-tape-text font-mono">
                    {Math.floor(activeResult.repairTimeMs / 1000)}秒
                  </span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                activeResult.hasExcessiveNoiseReduction
                  ? 'bg-tape-danger/10 border-tape-danger/50'
                  : 'bg-tape-success/10 border-tape-success/40'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={activeResult.hasExcessiveNoiseReduction ? 'text-tape-danger' : 'text-tape-success'}>
                    {activeResult.hasExcessiveNoiseReduction ? '⚠' : '✓'}
                  </span>
                  <span className={`font-bold ${
                    activeResult.hasExcessiveNoiseReduction ? 'text-tape-danger' : 'text-tape-success'
                  }`}>
                    降噪检查
                  </span>
                </div>
                <p className="text-sm text-tape-muted">
                  {activeResult.hasExcessiveNoiseReduction
                    ? `检测到过度降噪！人声细节损失 ${(activeResult.voiceDetailLoss * 100).toFixed(1)}%，` +
                      `这直接降低了可懂度评分。建议降噪强度控制在 60% 以下以保留人声特征。`
                    : activeResult.voiceDetailLoss > 0
                    ? `降噪正常，细节损失仅 ${(activeResult.voiceDetailLoss * 100).toFixed(1)}%，在可接受范围内`
                    : '未应用降噪或降噪强度极低，人声完全保留'}
                </p>
                {activeResult.hasExcessiveNoiseReduction && (
                  <div className="mt-3 p-3 bg-tape-bg rounded border border-tape-danger/30 text-xs">
                    <div className="text-tape-danger font-bold mb-1">📉 对可懂度的影响：</div>
                    <div className="text-tape-muted">
                      可懂度被扣减 {(activeResult.voiceDetailLoss * 30).toFixed(1)} 分
                      （细节损失 × 30 权重）
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-lg border ${
                activeResult.hasBadSplice
                  ? 'bg-orange-900/20 border-orange-500/50'
                  : 'bg-tape-success/10 border-tape-success/40'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={activeResult.hasBadSplice ? 'text-orange-400' : 'text-tape-success'}>
                    {activeResult.hasBadSplice ? '⚠' : '✓'}
                  </span>
                  <span className={`font-bold ${
                    activeResult.hasBadSplice ? 'text-orange-400' : 'text-tape-success'
                  }`}>
                    拼接检查
                  </span>
                </div>
                <p className="text-sm text-tape-muted">
                  {activeResult.hasBadSplice
                    ? `检测到 ${activeResult.jumpArtifacts} 处跳音伪影！` +
                      `拼接位置偏离正确断点超过5个采样点，波形产生不连续跳变，` +
                      `播放时将出现明显的"咔哒"跳音。`
                    : activeResult.jumpArtifacts === 0
                    ? '所有断点拼接位置准确，波形过渡平滑，无跳音伪影'
                    : `部分拼接存在轻微偏差，但未检测到明显跳音`}
                </p>
                {activeResult.hasBadSplice && (
                  <div className="mt-3 p-3 bg-tape-bg rounded border border-orange-500/30 text-xs">
                    <div className="text-orange-400 font-bold mb-1">📉 对保真度和可懂度的影响：</div>
                    <div className="text-tape-muted">
                      保真度被扣减约 {(activeResult.jumpArtifacts * 3).toFixed(1)} 分，
                      可懂度被扣减约 {(activeResult.jumpArtifacts * 2.25).toFixed(1)} 分
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-tape-bg rounded-lg border border-tape-border">
              <h3 className="font-bold text-tape-text mb-3">🔍 可懂度深度分析</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tape-muted">基线相关系数</span>
                  <span className="text-tape-text font-mono">
                    ~{(Math.min(100, activeResult.intelligibility / 0.7 + activeResult.jumpArtifacts * 2 + activeResult.voiceDetailLoss * 30) / 100).toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tape-muted">过度降噪惩罚 (-细节损失×30)</span>
                  <span className="text-tape-danger font-mono">
                    -{(activeResult.voiceDetailLoss * 30).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tape-muted">错位拼接惩罚 (-跳音数×15)</span>
                  <span className="text-orange-400 font-mono">
                    -{(activeResult.jumpArtifacts * 15 * 0.15).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-tape-border font-bold">
                  <span className="text-tape-text">最终可懂度得分</span>
                  <span className={scoreColor(activeResult.intelligibility)}>
                    {activeResult.intelligibility.toFixed(2)} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-tape-panel border border-tape-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-tape-accent mb-6">📋 全批次磁带对比</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-tape-bg text-tape-muted text-xs">
                <th className="text-left p-3 rounded-tl">磁带</th>
                <th className="text-left p-3">清洁方案</th>
                <th className="text-left p-3">可懂度</th>
                <th className="text-left p-3">保真度</th>
                <th className="text-left p-3">耗材</th>
                <th className="text-left p-3">耗时</th>
                <th className="text-left p-3">过度降噪</th>
                <th className="text-left p-3 rounded-tr">跳音</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} className={`border-t border-tape-border ${
                  i === activeTapeIdx ? 'bg-tape-accent/5' : ''
                }`}>
                  <td className="p-3 font-mono text-tape-text">{r.tapeLabel}</td>
                  <td className="p-3 text-tape-muted">
                    {CLEANING_NAMES[r.cleaningMethod] || r.cleaningMethod}
                  </td>
                  <td className={`p-3 font-bold ${scoreColor(r.intelligibility)}`}>
                    {r.intelligibility.toFixed(1)}
                  </td>
                  <td className={`p-3 font-bold ${scoreColor(r.fidelity)}`}>
                    {r.fidelity.toFixed(1)}
                  </td>
                  <td className="p-3 text-tape-accent">¥{r.materialCost.toFixed(1)}</td>
                  <td className="p-3 text-tape-muted font-mono">
                    {Math.floor(r.repairTimeMs / 1000)}s
                  </td>
                  <td className="p-3">
                    {r.hasExcessiveNoiseReduction
                      ? <span className="text-tape-danger">⚠ 是</span>
                      : <span className="text-tape-success">✓ 否</span>}
                  </td>
                  <td className="p-3">
                    {r.jumpArtifacts > 0
                      ? <span className="text-orange-400">{r.jumpArtifacts}处</span>
                      : <span className="text-tape-success">无</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-center py-6 text-tape-muted text-xs">
        <p>本结算报告由后端根据局次明细重新计算生成 | 数据来源：SQLite result_records 表</p>
        <div className="mt-4 flex justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2 bg-tape-panel border border-tape-border text-tape-muted rounded hover:border-tape-muted hover:text-tape-text transition-all"
          >
            开始新局次
          </Link>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-tape-accent text-black font-bold rounded hover:bg-yellow-400 transition-all"
          >
            🖨 导出结算报告
          </button>
        </div>
      </footer>
    </div>
  );
}
