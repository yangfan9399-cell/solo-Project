'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { GameSession, ScoreRecord, RepairReport } from '@/lib/types';

interface CompleteResult {
  scoreRecord: ScoreRecord;
  repairReport: RepairReport;
}

const rankConfig: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  S: { color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-100 to-amber-200', border: 'border-amber-400', glow: 'shadow-amber-300/50' },
  A: { color: 'text-jade-600', bg: 'bg-gradient-to-br from-jade-50 to-jade-100', border: 'border-jade-400', glow: 'shadow-jade-300/50' },
  B: { color: 'text-ancient-500', bg: 'bg-gradient-to-br from-ancient-100 to-ancient-200', border: 'border-ancient-300', glow: 'shadow-ancient-300/50' },
  C: { color: 'text-cinnabar-500', bg: 'bg-gradient-to-br from-cinnabar-50 to-cinnabar-100', border: 'border-cinnabar-300', glow: 'shadow-cinnabar-300/50' },
  D: { color: 'text-cinnabar-900', bg: 'bg-gradient-to-br from-cinnabar-100 to-cinnabar-200', border: 'border-cinnabar-400', glow: 'shadow-cinnabar-400/50' },
};

function ProgressBar({ value, max = 100, colorClass = 'bg-jade-500' }: { value: number; max?: number; colorClass?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-2.5 bg-ancient-200 rounded-full overflow-hidden border border-ancient-300">
      <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<GameSession | null>(null);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sessionRes = await fetch(`/api/sessions/${sessionId}`);
        if (!sessionRes.ok) throw new Error('会话不存在');
        const sessionData: GameSession = await sessionRes.json();
        setSession(sessionData);

        const completeRes = await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
        if (!completeRes.ok) throw new Error('获取修复结果失败');
        const completeData: CompleteResult = await completeRes.json();
        setResult(completeData);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-ancient-500 text-xl tracking-widest">加载中...</div>
      </main>
    );
  }

  if (error || !session || !result) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-cinnabar-600 text-xl">{error ?? '加载失败'}</div>
      </main>
    );
  }

  const { scoreRecord, repairReport } = result;
  const rank = rankConfig[scoreRecord.rank] ?? rankConfig.D;
  const baseScore = scoreRecord.finalScore - scoreRecord.accuracyBonus - scoreRecord.speedBonus - scoreRecord.stabilityBonus - scoreRecord.layerBonus + scoreRecord.deduction;

  return (
    <main className="flex-1 flex flex-col px-4 py-6 sm:py-10 max-w-2xl mx-auto w-full">
      <header className="text-center mb-8">
        <div className="inline-block border-4 ornate-border px-8 sm:px-14 py-5 sm:py-7 bg-ancient-100/60 scroll-shadow">
          <h1 className="text-3xl sm:text-4xl font-black text-ancient-900 tracking-widest">
            修复报告
          </h1>
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <span className="block w-12 h-0.5 bg-ancient-300" />
          <span className="block w-3 h-3 rounded-full border-2 border-ancient-400 bg-ancient-100" />
          <span className="block w-12 h-0.5 bg-ancient-300" />
        </div>
      </header>

      <section className="mb-8">
        <div className={`flex items-center justify-center gap-6 p-6 rounded-lg border-2 ${rank.bg} ${rank.border} shadow-lg ${rank.glow}`}>
          <div className={`text-7xl sm:text-8xl font-black ${rank.color} drop-shadow-md`}>
            {scoreRecord.rank}
          </div>
          <div className="text-left">
            <div className="text-4xl sm:text-5xl font-black text-ancient-900 tracking-wide">
              {scoreRecord.finalScore}
            </div>
            <div className="text-sm text-ancient-600 mt-1 tracking-wider">最终得分</div>
          </div>
        </div>

        <div className="mt-5 space-y-2 bg-ancient-100/60 border border-ancient-300 rounded-lg p-4 scroll-shadow">
          <div className="flex justify-between items-center py-1.5 border-b border-ancient-200">
            <span className="text-ancient-600 font-semibold">基础分</span>
            <span className="text-ancient-900 font-bold">{baseScore}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-ancient-200">
            <span className="text-ancient-600 font-semibold">精准加成</span>
            <span className="text-jade-700 font-bold">+{scoreRecord.accuracyBonus}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-ancient-200">
            <span className="text-ancient-600 font-semibold">速度加成</span>
            <span className="text-jade-700 font-bold">+{scoreRecord.speedBonus}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-ancient-200">
            <span className="text-ancient-600 font-semibold">稳定加成</span>
            <span className="text-jade-700 font-bold">+{scoreRecord.stabilityBonus}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-ancient-200">
            <span className="text-ancient-600 font-semibold">层叠加成</span>
            <span className="text-jade-700 font-bold">+{scoreRecord.layerBonus}</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-ancient-600 font-semibold">扣分</span>
            <span className="text-cinnabar-600 font-bold">-{scoreRecord.deduction}</span>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-ancient-900 tracking-wider mb-4 flex items-center gap-2">
          <span className="text-ancient-400">◆</span>
          修复详情
        </h2>

        <div className="bg-ancient-100/60 border border-ancient-300 rounded-lg p-5 scroll-shadow space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-ancient-700 font-semibold">整体状况</span>
              <span className="text-ancient-900 font-bold">{Math.round(repairReport.overallCondition)}%</span>
            </div>
            <ProgressBar value={repairReport.overallCondition} colorClass="bg-gradient-to-r from-jade-400 to-jade-600" />
          </div>

          <div className="flex justify-between items-center py-2 border-t border-ancient-200">
            <span className="text-ancient-700 font-semibold">裂缝修复</span>
            <span className="text-ancient-900 font-bold">
              修复 <span className="text-jade-700">{repairReport.cracksRepaired}</span> / 共 <span className="text-ancient-600">{repairReport.cracksRepaired + repairReport.cracksRemaining}</span> 条
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-ancient-700 font-semibold">碎片完整度</span>
              <span className="text-ancient-900 font-bold">{Math.round(repairReport.pieceIntegrity)}%</span>
            </div>
            <ProgressBar value={repairReport.pieceIntegrity} colorClass="bg-gradient-to-r from-ancient-400 to-ancient-600" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-ancient-700 font-semibold">对齐精度</span>
              <span className="text-ancient-900 font-bold">{Math.round(repairReport.alignmentAccuracy)}%</span>
            </div>
            <ProgressBar value={repairReport.alignmentAccuracy} colorClass="bg-gradient-to-r from-ancient-400 to-ancient-600" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-ancient-700 font-semibold">稳定指数</span>
              <span className="text-ancient-900 font-bold">{Math.round(repairReport.stabilityIndex)}%</span>
            </div>
            <ProgressBar value={repairReport.stabilityIndex} colorClass="bg-gradient-to-r from-ancient-400 to-ancient-600" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-ancient-700 font-semibold">历史价值</span>
              <span className="text-ancient-900 font-bold">{Math.round(repairReport.historicalValue)}%</span>
            </div>
            <ProgressBar value={repairReport.historicalValue} colorClass="bg-gradient-to-r from-jade-400 to-jade-600" />
          </div>

          <div className="mt-4 pt-4 border-t-2 border-ancient-300">
            <div className="flex items-start gap-2 mb-1">
              <span className="text-ancient-400 mt-1">◆</span>
              <span className="text-ancient-800 font-semibold">专家评语</span>
            </div>
            <p className="text-ancient-700 leading-relaxed pl-5">
              {repairReport.comment}
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => router.push('/levels')}
          className="btn-ancient tracking-widest"
        >
          返回关卡
        </button>
        <button
          onClick={() => router.push(`/game/${session.levelId}`)}
          className="btn-primary tracking-widest"
        >
          重新挑战
        </button>
      </div>

      <footer className="mt-auto pt-6 text-center text-ancient-400 text-sm tracking-wider">
        <div className="flex justify-center items-center gap-3 mb-2">
          <span className="w-8 h-px bg-ancient-300" />
          <span className="text-ancient-400">◆</span>
          <span className="w-8 h-px bg-ancient-300" />
        </div>
        <p>古城影壁 · 匠心修复</p>
      </footer>
    </main>
  );
}
