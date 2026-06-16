import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameState, getLevels, saveGameResult, savePlayer, getPlayer, saveGameState } from '$lib/storage';
import { recalculateFullFromOriginalState, createGameResult, calculateScoreBreakdown } from '$lib/scoreCalculator';
import { seedLevels } from '$lib/seedData';

export const POST: RequestHandler = async ({ params }) => {
  try {
    const originalGameState = getGameState(params.id);
    
    if (!originalGameState) {
      return json({ error: '游戏不存在' }, { status: 404 });
    }

    let levels = getLevels();
    if (levels.length === 0) {
      levels = seedLevels;
    }

    const level = levels.find(l => l.id === originalGameState.levelId);
    if (!level) {
      return json({ error: '关卡不存在' }, { status: 404 });
    }

    const { replayedState, breakdown: recalculatedBreakdown } = recalculateFullFromOriginalState(originalGameState, level);
    const liveBreakdown = calculateScoreBreakdown(originalGameState, level);

    const gameResult = createGameResult(replayedState, level, recalculatedBreakdown);

    saveGameResult(gameResult);

    replayedState.isGameOver = true;
    saveGameState(replayedState);

    const player = getPlayer();
    if (player) {
      player.gamesPlayed++;
      if (gameResult.victory) {
        player.gamesWon++;
      }
      player.totalScore += gameResult.recalculatedScore;
      if (gameResult.victory && gameResult.levelId > player.bestLevel) {
        player.bestLevel = gameResult.levelId;
      }
      savePlayer(player);
    }

    return json({
      gameResult,
      recalculatedBreakdown,
      liveBreakdown,
      originalFinalScore: originalGameState.score,
      replayedDeliveries: {
        completed: replayedState.deliveriesCompleted,
        failed: replayedState.deliveriesFailed,
        target: level.targetDeliveries
      },
      scoreDifference: recalculatedBreakdown.total - originalGameState.score,
      backendVerified: true,
      usedReplayedStateForSettlement: true
    });
  } catch (e) {
    console.error('Recalculate score error:', e);
    return json({ error: '重新计算分数失败' }, { status: 500 });
  }
};
