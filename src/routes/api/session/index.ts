import type { RequestHandler } from "@builder.io/qwik-city";
import type { GameSession, RoundResult } from "~/lib/types";
import {
  createSession,
  getSession,
  updateSession,
  addWrongAnswer,
  updatePlayer,
  updateDailyStreak,
  addActionHistory,
  getStreakDays,
  readGameData,
} from "~/lib/server/db";
import {
  calculateStopCombinationScore,
  calculateSessionFinalScore,
  pickLevelCombinations,
  calculateDailyStreakBonus,
} from "~/lib/server/scoring";

export const onGet: RequestHandler = async ({ query, json }) => {
  const sessionId = query.get("id") || "";
  const session = getSession(sessionId);
  if (!session) {
    json(404, { success: false, error: "Session not found" });
    return;
  }
  const gameData = readGameData();
  const level = gameData.levels.find((l) => l.id === session.levelId);
  json(200, { success: true, session, level });
};

export const onPost: RequestHandler = async ({ request, json }) => {
  const body = await request.json();
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  const levelId = typeof body.levelId === "string" ? parseInt(body.levelId) : typeof body.levelId === "number" ? body.levelId : 1;

  const gameData = readGameData();
  const level = gameData.levels.find((l) => l.id === levelId);
  if (!level) {
    json(404, { success: false, error: "Level not found" });
    return;
  }

  const roundsPerGame = 5;
  const combinations = pickLevelCombinations(level, roundsPerGame);

  const session: GameSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    playerId,
    levelId,
    startTime: Date.now(),
    score: 0,
    maxScore: 0,
    correctCount: 0,
    totalRounds: combinations.length,
    status: "playing",
    currentRound: 0,
    rounds: [],
  };

  const created = createSession(session);

  json(200, {
    success: true,
    session: created,
    level,
    targetCombinations: combinations,
    availableStops: level.availableStops,
  });
};

export const onPatch: RequestHandler = async ({ request, json }) => {
  const body = await request.json();
  const action = body.action;

  if (action === "submitRound") {
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const roundNumber = typeof body.roundNumber === "string" ? parseInt(body.roundNumber) : typeof body.roundNumber === "number" ? body.roundNumber : 0;
    const targetStops = Array.isArray(body.targetStops) ? (body.targetStops as string[]) : [];
    const playerStops = Array.isArray(body.playerStops) ? (body.playerStops as string[]) : [];
    const timeTaken = typeof body.timeTaken === "string" ? parseFloat(body.timeTaken) : typeof body.timeTaken === "number" ? body.timeTaken : 30;
    const hintUsed = body.hintUsed === "true" || body.hintUsed === true;

    const session = getSession(sessionId);
    if (!session) {
      json(404, { success: false, error: "Session not found" });
      return;
    }

    const gameData = readGameData();
    const level = gameData.levels.find((l) => l.id === session.levelId);
    if (!level) {
      json(404, { success: false, error: "Level not found" });
      return;
    }

    const timeLimit = level.timeLimit || 60;

    const scoreResult = calculateStopCombinationScore(
      targetStops,
      playerStops,
      timeTaken,
      timeLimit,
      level.difficulty,
      hintUsed
    );

    const roundResult: RoundResult = {
      roundNumber,
      targetStops,
      playerStops,
      isCorrect: scoreResult.isCorrect,
      score: scoreResult.score,
      maxScore: scoreResult.maxScore,
      timeTaken,
      hintUsed,
    };

    const updatedRounds = [...session.rounds, roundResult];
    const newScore = updatedRounds.reduce((sum, r) => sum + r.score, 0);
    const newMaxScore = updatedRounds.reduce((sum, r) => sum + r.maxScore, 0);
    const correctCount = updatedRounds.filter((r) => r.isCorrect).length;

    const isLastRound = roundNumber >= session.totalRounds;
    let finalResult = null;
    let status: GameSession["status"] = session.status;

    if (isLastRound) {
      const finalCalc = calculateSessionFinalScore(updatedRounds, level);
      status = finalCalc.passed ? "completed" : "failed";

      const streakInfo = getStreakDays(session.playerId);
      const streakBonus = calculateDailyStreakBonus(streakInfo.current);

      const today = new Date().toISOString().split("T")[0];
      updateDailyStreak(session.playerId, today, finalCalc.totalScore + streakBonus);

      const player = readGameData().players.find((p) => p.id === session.playerId);
      if (player) {
        const newTotalScore = player.totalScore + finalCalc.totalScore + streakBonus;
        const newHighestLevel = finalCalc.passed ? Math.max(player.highestLevel, level.id + 1) : player.highestLevel;

        const lastDate = player.lastPlayDate;
        const todayStr = today;
        let newCurrentStreak = player.currentStreak;

        if (!lastDate) {
          newCurrentStreak = 1;
        } else {
          const diffDays = Math.round(
            (new Date(todayStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays === 1) {
            newCurrentStreak = player.currentStreak + 1;
          } else if (diffDays > 1) {
            newCurrentStreak = 1;
          }
        }

        const newBestStreak = Math.max(player.bestStreak, newCurrentStreak);

        updatePlayer(session.playerId, {
          totalScore: newTotalScore,
          highestLevel: Math.min(newHighestLevel, gameData.levels.length),
          lastPlayDate: todayStr,
          currentStreak: newCurrentStreak,
          bestStreak: newBestStreak,
          totalPlays: player.totalPlays + 1,
        });
      }

      finalResult = { ...finalCalc, streakBonus };
    }

    if (!scoreResult.isCorrect) {
      addWrongAnswer({
        playerId: session.playerId,
        levelId: level.id,
        targetStops,
        playerStops,
        timestamp: Date.now(),
        score: scoreResult.score,
        maxScore: scoreResult.maxScore,
        reviewed: false,
      });
    }

    const updated = updateSession(sessionId, {
      rounds: updatedRounds,
      score: newScore,
      maxScore: newMaxScore,
      correctCount,
      currentRound: roundNumber,
      status,
      endTime: isLastRound ? Date.now() : undefined,
      stars: finalResult?.stars,
    });

    json(200, {
      success: true,
      roundResult: scoreResult,
      session: updated,
      finalResult,
      isLastRound,
    });
    return;
  }

  json(400, { success: false, error: "Invalid action" });
};
