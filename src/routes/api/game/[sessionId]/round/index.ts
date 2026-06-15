import type { RequestHandler } from '@builder.io/qwik-city';
import { startNewRound } from '~/server/gameService';

export const onPost: RequestHandler = async ({ params, json }) => {
  try {
    const sessionId = parseInt(params.sessionId);
    if (isNaN(sessionId)) {
      json(400, { success: false, error: 'Invalid session ID' });
      return;
    }
    
    const result = await startNewRound(sessionId);
    json(200, {
      success: true,
      data: result,
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start round',
    });
  }
};
