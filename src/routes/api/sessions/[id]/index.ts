import type { RequestHandler } from '@builder.io/qwik-city';
import { getSessionById, getOperationsBySession, finishSession, getLevelById, updatePlayerStats } from '~/lib/repositories';
import { calculateScore } from '~/lib/scoring';
import type { GameSession } from '~/types/game';

export const onGet: RequestHandler = async ({ params, query, json }) => {
  try {
    const sessionId = Number(params.id);
    const session = await getSessionById(sessionId);
    if (!session) {
      json(404, { success: false, error: '局次不存在' });
      return;
    }

    const includeOps = query.get('includeOperations') === 'true';
    const operations = includeOps ? await getOperationsBySession(sessionId) : undefined;

    json(200, { success: true, data: { session, operations } });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};

export const onPost: RequestHandler = async ({ params, request, json }) => {
  try {
    const sessionId = Number(params.id);
    const session = await getSessionById(sessionId);
    if (!session) {
      json(404, { success: false, error: '局次不存在' });
      return;
    }

    const body = await request.json();
    const { status } = body;

    if (!['won', 'lost', 'abandoned'].includes(status)) {
      json(400, { success: false, error: '无效的状态值' });
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
    const finalScore = status === 'won' ? breakdown.total : Math.floor(breakdown.total * 0.2);

    await finishSession(sessionId, status as 'won' | 'lost' | 'abandoned', finalScore);

    const won = status === 'won';
    await updatePlayerStats(session.player_id, finalScore, won);

    json(200, {
      success: true,
      data: {
        sessionId,
        status,
        score: finalScore,
        breakdown,
      },
    });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
