import type { RequestHandler } from '@builder.io/qwik-city';
import { getSessionById, getLevelById, getOperationsBySession, finishSession, updatePlayerStats } from '~/lib/repositories';
import { calculateScore } from '~/lib/scoring';
import type { GameSession } from '~/types/game';

export const onPost: RequestHandler = async ({ params, json }) => {
  try {
    const sessionId = Number(params.id);
    const session = await getSessionById(sessionId);
    if (!session) {
      json(404, { success: false, error: '局次不存在' });
      return;
    }

    const level = await getLevelById(session.level_id);
    if (!level) {
      json(500, { success: false, error: '关联关卡不存在' });
      return;
    }

    const operations = await getOperationsBySession(sessionId);

    const scoreInput = {
      session: session as GameSession,
      level,
      operations,
    };
    const breakdown = calculateScore(scoreInput);

    const won = session.current_floor >= level.target_floor;
    const status = won ? 'won' : (session.status === 'playing' ? 'lost' : session.status);
    const finalScore = won ? breakdown.total : Math.floor(breakdown.total * 0.2);

    if (session.status === 'playing') {
      await finishSession(sessionId, status as 'won' | 'lost', finalScore);
      await updatePlayerStats(session.player_id, finalScore, won);
    }

    json(200, {
      success: true,
      data: {
        sessionId,
        recalculated: true,
        status,
        score: finalScore,
        breakdown,
        operationCount: operations.length,
      },
    });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
