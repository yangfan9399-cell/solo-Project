import type { RequestHandler } from '@builder.io/qwik-city';
import { getFullSessionData } from '~/server/gameService';

export const onGet: RequestHandler = async ({ params, json }) => {
  try {
    const sessionId = parseInt(params.sessionId);
    if (isNaN(sessionId)) {
      json(400, { success: false, error: 'Invalid session ID' });
      return;
    }
    
    const result = await getFullSessionData(sessionId);
    
    json(200, {
      success: true,
      data: result,
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session data',
    });
  }
};
