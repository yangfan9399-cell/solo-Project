"use client";

import { useState } from "react";
import type { PoolLocation, GameSession, Species } from "@/lib/types";
import { getVisibleSpeciesAtPool, SPECIES } from "@/lib/gameData";

interface PoolSelectorProps {
  pools: PoolLocation[];
  session: GameSession;
  onObserve: (poolId: string, trampled: boolean, note?: string) => Promise<void>;
}

export default function PoolSelector({ pools, session, onObserve }: PoolSelectorProps) {
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [trample, setTrample] = useState(false);
  const [loading, setLoading] = useState(false);

  const pool = selectedPool ? pools.find((p) => p.id === selectedPool) : null;
  const visibleIds = pool
    ? getVisibleSpeciesAtPool(pool.id, session.currentTideLevel, session.currentTidePhase)
    : [];
  const visibleSpecies = visibleIds
    .map((id) => SPECIES.find((s) => s.id === id))
    .filter(Boolean) as Species[];

  const canObserve = session.status === "active" && session.timeStep < session.totalSteps;

  const handleObserve = async () => {
    if (!pool || !canObserve) return;
    setLoading(true);
    await onObserve(pool.id, trample, note.trim() || undefined);
    setSelectedPool(null);
    setNote("");
    setTrample(false);
    setLoading(false);
  };

  const tidePercent = Math.round(session.currentTideLevel * 100);

  return (
    <div className="pool-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-slate-800">🏝️ 选择观察地点</h3>
        <div className="text-right">
          <div className="text-xs text-slate-500">当前潮位</div>
          <div className="text-sm font-bold text-sky-700">{tidePercent}% · {session.currentTidePhase}</div>
        </div>
      </div>

      {!canObserve && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            ⚠️ 本轮观察已结束，请前往结算页面查看结果
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {pools.map((p) => {
          const isSelected = selectedPool === p.id;
          const visitedCount = session.visitedPools.filter((v) => v === p.id).length;
          const poolVisible = getVisibleSpeciesAtPool(p.id, session.currentTideLevel, session.currentTidePhase);
          return (
            <button
              key={p.id}
              onClick={() => canObserve && setSelectedPool(p.id)}
              disabled={!canObserve}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? "border-sky-500 bg-sky-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-sky-300 disabled:opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{p.emoji}</span>
                <span className="font-semibold text-sm text-slate-800">{p.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-600">
                  🌊 {poolVisible.length}种可见
                </span>
                <span className="text-[10px] text-slate-400">
                  访问 {visitedCount}次
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {pool && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{pool.emoji}</span>
            <div>
              <div className="font-semibold">{pool.name}</div>
              <div className="text-xs text-slate-500">生态敏感度: {"⭐".repeat(pool.ecoSensitivity)}</div>
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-slate-600 mb-1">当前可观察物种：</div>
            {visibleSpecies.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {visibleSpecies.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full"
                  >
                    {s.emoji} {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-600">⚠️ 当前潮位没有可观察的物种</p>
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="添加观察笔记（可选）..."
            rows={2}
            className="w-full mb-2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
          />

          <label className="flex items-center gap-2 mb-3 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={trample}
              onChange={(e) => setTrample(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span>⚠️ 快速穿越（可能踩踏生物，降低生态评分）</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPool(null)}
              className="flex-1 py-2 px-4 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleObserve}
              disabled={loading}
              className={`flex-1 text-sm font-semibold py-2 px-4 rounded-lg transition-colors ${
                visibleSpecies.length === 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-sky-600 hover:bg-sky-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading
                ? "记录中..."
                : visibleSpecies.length === 0
                ? "🚶 错过潮位（推进时间）"
                : "开始观察"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
