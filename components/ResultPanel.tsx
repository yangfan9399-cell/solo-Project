"use client";

import type { SessionResult, GameSession } from "@/lib/types";

interface ResultPanelProps {
  result: SessionResult;
  session: GameSession;
  onRecalculate: () => Promise<void>;
  onNewGame: () => void;
}

export default function ResultPanel({
  result,
  session,
  onRecalculate,
  onNewGame,
}: ResultPanelProps) {
  const hasRecoveryDiff =
    result.preRecoveryFinal !== result.finalScore ||
    result.preRecoveryResearch !== result.researchPoints ||
    result.preRecoveryEco !== result.ecoScore;

  const ecoLevel = result.ecoScore >= 80 ? "good" : result.ecoScore >= 50 ? "warn" : "bad";
  const ecoColor = ecoLevel === "good" ? "text-emerald-600" : ecoLevel === "warn" ? "text-amber-600" : "text-red-600";
  const ecoBg = ecoLevel === "good" ? "bg-emerald-100" : ecoLevel === "warn" ? "bg-amber-100" : "bg-red-100";

  return (
    <div className="pool-card">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-slate-800 mb-1">🏆 本局结算</h3>
        <p className="text-sm text-slate-500">海岛潮池生态观察报告</p>
      </div>

      {hasRecoveryDiff && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg">
          <p className="text-sm font-semibold text-emerald-700 mb-2">✨ 恢复任务完成后变化（持久化）</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-500">研究积分</div>
              <div className="font-bold text-emerald-600">
                {result.preRecoveryResearch} → {result.researchPoints}
                <span className="ml-1">+{result.researchPoints - result.preRecoveryResearch}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-500">生态评分</div>
              <div className="font-bold text-emerald-600">
                {result.preRecoveryEco} → {result.ecoScore}
                <span className="ml-1">+{result.ecoScore - result.preRecoveryEco}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-500">总分</div>
              <div className="font-bold text-emerald-600">
                {result.preRecoveryFinal} → {result.finalScore}
                <span className="ml-1">+{result.finalScore - result.preRecoveryFinal}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-4 py-4 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-lg">
        <div className="text-xs text-slate-500 mb-1">最终综合得分</div>
        <div className="text-5xl font-black text-sky-700">{result.finalScore}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="text-xs text-slate-500">研究积分</div>
          <div className="text-2xl font-bold text-sky-700">{result.researchPoints}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            基础 {result.uniqueSpecies * 20 + (result.totalObservations - result.missedSpecies) * 5}
            {result.missedTidePenalty > 0 && (
              <span className="text-red-500"> - 错过潮位{result.missedTidePenalty}</span>
            )}
          </div>
        </div>
        <div className={`p-3 ${ecoBg} rounded-lg text-center`}>
          <div className="text-xs text-slate-500">生态评分</div>
          <div className={`text-2xl font-bold ${ecoColor}`}>{result.ecoScore}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            基础 100
            {result.tramplingPenalty > 0 && (
              <span className="text-red-500"> - 踩踏{result.tramplingPenalty}</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">📊 总观察记录</span>
          <span className="font-semibold">{result.totalObservations} 条</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">🎯 发现物种</span>
          <span className="font-semibold text-emerald-600">{result.uniqueSpecies} 种</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">❓ 错过物种</span>
          <span className="font-semibold text-amber-600">{result.missedSpecies} 种</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">⚠️ 踩踏惩罚</span>
          <span className="font-semibold text-red-600">-{result.tramplingPenalty} 分</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">⏰ 错过潮位惩罚</span>
          <span className="font-semibold text-amber-600">-{result.missedTidePenalty} 分</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">🛤️ 观察路线</span>
          <span className="font-semibold text-xs">{session.route.length} 站</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onRecalculate} className="flex-1 btn-warn text-sm">
          🔄 重新结算
        </button>
        <button onClick={onNewGame} className="flex-1 btn-primary text-sm">
          🎮 新一局
        </button>
      </div>
    </div>
  );
}
