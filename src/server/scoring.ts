import type { ScoreCalculationRequest, ScoreCalculationResponse, GameHistory } from "~/types/game";
import { getLevelById } from "~/data/levels";
import { levels } from "~/data/levels";

export function calculateScore(request: ScoreCalculationRequest): ScoreCalculationResponse {
  const level = getLevelById(request.levelId);
  if (!level) {
    return {
      baseScore: 0,
      relicBonus: 0,
      efficiencyBonus: 0,
      timeBonus: 0,
      totalScore: 0,
      rank: "D"
    };
  }

  let baseScore = 0;
  for (const relicId of request.relicsFound) {
    const relic = level.relics.find((r) => r.id === relicId);
    if (relic) {
      baseScore += relic.points;
    }
  }

  const relicBonus = Math.floor(baseScore * 0.1 * request.relicsFound.length);

  const divesUsedRatio = request.divesUsed / level.maxDives;
  const efficiencyMultiplier = Math.max(0, 1 - divesUsedRatio * 0.5);
  const efficiencyBonus = Math.floor(baseScore * efficiencyMultiplier * 0.3);

  const timeInMinutes = request.timeElapsed / 60000;
  const targetTime = level.gridSize * 2;
  const timeRatio = Math.min(1, timeInMinutes / targetTime);
  const timeBonus = Math.floor(baseScore * (1 - timeRatio) * 0.2);

  const totalScore = baseScore + relicBonus + efficiencyBonus + timeBonus;

  const maxPossibleScore = level.relics.reduce((sum, r) => sum + r.points, 0) * 1.6;
  const scoreRatio = totalScore / maxPossibleScore;

  let rank: "S" | "A" | "B" | "C" | "D" = "D";
  if (scoreRatio >= 0.85) rank = "S";
  else if (scoreRatio >= 0.7) rank = "A";
  else if (scoreRatio >= 0.55) rank = "B";
  else if (scoreRatio >= 0.4) rank = "C";

  return {
    baseScore,
    relicBonus,
    efficiencyBonus,
    timeBonus,
    totalScore,
    rank
  };
}

export function getLeaderboard(levelId: string, limit: number = 10) {
  const history = getGameHistory();
  return history
    .filter((h) => h.levelId === levelId && h.won)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const STORAGE_KEY = "underwater_archaeology_history";

function getGameHistory(): GameHistory[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as GameHistory[]) : [];
  } catch {
    return [];
  }
}

export function saveGameHistory(history: GameHistory[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
