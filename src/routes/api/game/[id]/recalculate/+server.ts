import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameState, getLevels, saveGameResult, savePlayer, getPlayer } from '$lib/storage';
import { recalculateScoreFromHistory, createGameResult, calculateScoreBreakdown } from '$lib/scoreCalculator';
import { seedLevels } from '$lib/seedData';

export const POST: RequestHandler = async ({ params }) => {
  try {
    const gameState = getGameState(params.id);
    
    if (!gameState) {
      return json({ error: '游戏不存在' }, { status: 404 });
    }

    let levels = getLevels();
    if (levels.length === 0) {
      levels = seedLevels;
    }

    const level = levels.find(l => l.id === gameState.levelId);
    if (!level) {
      return json({ error: '关卡不存在' }, { status: 404 });
    }

    const recalculatedBreakdown = recalculateScoreFromHistory(gameState, level);
    const liveBreakdown = calculateScoreBreakdown(gameState, level);

    const gameResult = createGameResult(gameState, level, recalculatedBreakdown);

    saveGameResult(gameResult);

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
      scoreDifference: recalculatedBreakdown.total - gameState.score,
      backendVerified: true
    });
  } catch (e) {
    console.error('Recalculate score error:', e);
    return json({ error: '重新计算分数失败' }, { status: 500 });
  }
};
