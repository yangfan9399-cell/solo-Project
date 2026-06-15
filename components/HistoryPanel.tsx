"use client";

import { SPECIES, POOL_LOCATIONS } from "@/lib/gameData";
import type { HistoricalCondition, GameSession } from "@/lib/types";

interface HistoryPanelProps {
  conditions: HistoricalCondition[];
  sessions: GameSession[];
  onLoadSession: (sessionId: string) => void;
}

export default function HistoryPanel({ conditions, sessions, onLoadSession }: HistoryPanelProps) {
  const speciesMap = new Map(SPECIES.map((s) => [s.id, s]));
  const poolMap = new Map(POOL_LOCATIONS.map((p) => [p.id, p]));

  return (
    <div className="pool-card">
      <h3 className="font-bold text-lg text-slate-800 mb-3">📚 历史观察档案</h3>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">最近观察局次</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">暂无历史记录</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onLoadSession(s.id)}
              className="w-full flex items-center justify-between p-2 text-xs bg-slate-50 hover:bg-sky-50 rounded transition-colors text-left"
            >
              <div>
                <span className="font-medium text-slate-700">
                  {new Date(s.createdAt).toLocaleString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                    s.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : s.status === "active"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {s.status === "completed" ? "已完成" : s.status === "active" ? "进行中" : "已放弃"}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sky-700 font-semibold">🏆 {s.researchPoints}</div>
                <div className="text-slate-400">🌿 {s.ecoScore}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">物种出现条件记录</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {conditions.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">暂无条件记录</p>
          )}
          {conditions.slice(0, 15).map((c) => {
            const sp = speciesMap.get(c.speciesId);
            const pool = poolMap.get(c.poolId);
            if (!sp || !pool) return null;
            return (
              <div
                key={c.id}
                className="p-2 bg-gradient-to-r from-sky-50 to-white rounded text-xs border border-sky-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {sp.emoji} {sp.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    观察 {c.observedCount} 次
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>📍 {pool.name}</span>
                  <span>🌊 {c.tidePhase} {Math.round(c.tideLevel * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
