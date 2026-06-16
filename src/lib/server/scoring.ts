import type { Level, RoundResult } from "~/lib/types";

export interface ScoreResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  correctCount: number;
  extraCount: number;
  missedCount: number;
  similarity: number;
  timeBonus: number;
  difficultyMultiplier: number;
}

export function calculateStopCombinationScore(
  targetStops: string[],
  playerStops: string[],
  timeTaken: number,
  timeLimit: number = 60,
  difficulty: number = 1,
  hintUsed: boolean = false
): ScoreResult {
  const targetSet = new Set(targetStops);
  const playerSet = new Set(playerStops);

  let correctCount = 0;
  let missedCount = 0;
  let extraCount = 0;

  for (const stop of targetSet) {
    if (playerSet.has(stop)) {
      correctCount++;
    } else {
      missedCount++;
    }
  }

  for (const stop of playerSet) {
    if (!targetSet.has(stop)) {
      extraCount++;
    }
  }

  const baseScorePerStop = 20;
  const baseScore = correctCount * baseScorePerStop;
  const penaltyPerMiss = 8;
  const penaltyPerExtra = 10;

  let accuracyScore = baseScore - missedCount * penaltyPerMiss - extraCount * penaltyPerExtra;
  accuracyScore = Math.max(0, accuracyScore);

  const maxCorrectScore = targetStops.length * baseScorePerStop;

  const timeRatio = Math.max(0, 1 - timeTaken / timeLimit);
  const timeBonus = Math.round(accuracyScore * timeRatio * 0.3);

  const difficultyMultiplier = 1 + (difficulty - 1) * 0.15;

  let totalScore = Math.round((accuracyScore + timeBonus) * difficultyMultiplier);

  if (hintUsed) {
    totalScore = Math.round(totalScore * 0.6);
  }

  const isCorrect = missedCount === 0 && extraCount === 0;

  const union = new Set([...targetSet, ...playerSet]).size;
  const intersection = correctCount;
  const similarity = union > 0 ? intersection / union : 0;

  return {
    score: totalScore,
    maxScore: maxCorrectScore,
    isCorrect,
    correctCount,
    extraCount,
    missedCount,
    similarity,
    timeBonus,
    difficultyMultiplier,
  };
}

export function calculateSessionFinalScore(
  rounds: RoundResult[],
  level: Level
): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  stars: number;
  passed: boolean;
  correctCount: number;
  totalRounds: number;
} {
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const maxScore = rounds.reduce((sum, r) => sum + r.maxScore, 0);
  const correctCount = rounds.filter((r) => r.isCorrect).length;
  const totalRounds = rounds.length;

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let stars = 0;
  if (percentage >= level.stars.threeStar) stars = 3;
  else if (percentage >= level.stars.twoStar) stars = 2;
  else if (percentage >= level.passingScore) stars = 1;

  const passed = percentage >= level.passingScore;

  return {
    totalScore,
    maxScore,
    percentage,
    stars,
    passed,
    correctCount,
    totalRounds,
  };
}

export function generateRandomCombination(
  availableStops: string[],
  size: number
): string[] {
  const shuffled = [...availableStops].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, size);
}

export function pickLevelCombinations(level: Level, count: number): string[][] {
  const targets = [...level.targetCombinations];
  const shuffled = targets.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function calculateDailyStreakBonus(streakDays: number): number {
  if (streakDays <= 0) return 0;
  if (streakDays === 1) return 5;
  if (streakDays === 2) return 10;
  if (streakDays === 3) return 15;
  if (streakDays >= 4 && streakDays <= 6) return 20;
  if (streakDays >= 7 && streakDays <= 13) return 30;
  return 50;
}
