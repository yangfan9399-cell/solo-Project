"use client";

import { useState, useEffect } from "react";
import type { Level, LeaderboardEntry } from "@/types/game";

interface LevelSelectProps {
  levels: Level[];
  onSelectLevel: (level: Level) => void;
  playerName: string;
  totalScore: number;
  onNameChange: (name: string) => void;
}

export function LevelSelect({
  levels,
  onSelectLevel,
  playerName,
  totalScore,
  onNameChange,
}: LevelSelectProps) {
  const [leaderboards, setLeaderboards] = useState<Record<number, LeaderboardEntry[]>>({});
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      const boards: Record<number, LeaderboardEntry[]> = {};
      for (const level of levels) {
        try {
          const res = await fetch(`/api/leaderboard?levelId=${level.id}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            boards[level.id] = data;
          }
        } catch (e) {
          // ignore
        }
      }
      setLeaderboards(boards);
    };
    fetchLeaderboards();
  }, [levels]);

  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "from-green-400 to-emerald-500";
      case "medium":
        return "from-amber-400 to-orange-500";
      case "hard":
        return "from-red-400 to-rose-600";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const difficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "简单";
      case "medium":
        return "中等";
      case "hard":
        return "困难";
      default:
        return difficulty;
    }
  };

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim());
    }
    setEditingName(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-900 mb-2">
          🌉 纸桥承重工程挑战
        </h1>
        <p className="text-amber-600">
          用一张纸，搭起一座桥，看看能承载多少重量！
        </p>
      </div>

      <div className="bg-white/60 backdrop-blur rounded-xl p-4 mb-6 border border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {playerName.charAt(0)}
          </div>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  className="px-2 py-1 border border-amber-300 rounded text-amber-900 w-32"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempName(playerName);
                  setEditingName(true);
                }}
                className="text-lg font-semibold text-amber-900 hover:text-amber-700"
              >
                {playerName} ✏️
              </button>
            )}
            <p className="text-sm text-amber-500">累计得分: {totalScore}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-700">{totalScore}</div>
          <div className="text-xs text-amber-500">总积分</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {levels.map((level) => (
          <div
            key={level.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            onClick={() => onSelectLevel(level)}
          >
            <div
              className={`h-24 bg-gradient-to-r ${difficultyColor(
                level.difficulty
              )} relative overflow-hidden`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="120" height="50" viewBox="0 0 120 50">
                  <line
                    x1="10"
                    y1="40"
                    x2="110"
                    y2="40"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="6,3"
                    opacity="0.8"
                  />
                  <rect x="5" y="35" width="10" height="15" fill="white" opacity="0.6" />
                  <rect x="105" y="35" width="10" height="15" fill="white" opacity="0.6" />
                </svg>
              </div>
              <div className="absolute top-2 right-2 bg-white/30 backdrop-blur text-white text-xs px-2 py-0.5 rounded-full">
                {difficultyLabel(level.difficulty)}
              </div>
              <div className="absolute bottom-2 left-2 text-white/90 text-sm font-medium">
                关卡 {level.id}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-amber-900 mb-1 group-hover:text-amber-700">
                {level.name}
              </h3>
              <p className="text-sm text-amber-600 mb-3 line-clamp-2">
                {level.description}
              </p>

              <div className="flex justify-between text-xs text-amber-500 mb-3">
                <span>跨度: {level.span}mm</span>
                <span>目标: {level.targetWeight}g</span>
              </div>

              {leaderboards[level.id] && leaderboards[level.id].length > 0 && (
                <div className="border-t border-paper-100 pt-2">
                  <div className="text-xs text-amber-500 mb-1">🏆 排行榜</div>
                  <div className="space-y-0.5">
                    {leaderboards[level.id].slice(0, 3).map((entry, idx) => (
                      <div
                        key={entry.id}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-amber-700">
                          {idx + 1}. {entry.playerName}
                        </span>
                        <span className="text-amber-600 font-medium">
                          {entry.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-amber-600 text-sm">
        <p>💡 提示：尝试不同的折法，筒状和三角截面能大大增强承重能力</p>
      </div>
    </div>
  );
}
