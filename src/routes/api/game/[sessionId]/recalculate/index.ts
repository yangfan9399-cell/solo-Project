import type { RequestHandler } from '@builder.io/qwik-city';
import { recalculateSessionScore, getFullSessionData } from '~/server/gameService';

export const onPost: RequestHandler = async ({ params, json }) => {
  try {
    const sessionId = parseInt(params.sessionId);
    if (isNaN(sessionId)) {
      json(400, { success: false, error: 'Invalid session ID' });
      return;
    }
    
    const newScore = await recalculateSessionScore(sessionId);
    const sessionData = await getFullSessionData(sessionId);
    
    json(200, {
      success: true,
      data: {
        newScore,
        session: sessionData.session,
      },
      message: 'Score recalculated successfully from round details',
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recalculate score',
    });
  }
};
