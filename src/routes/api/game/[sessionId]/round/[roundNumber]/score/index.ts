import type { RequestHandler } from '@builder.io/qwik-city';
import { calculateRoundScore, getMainRecordBySessionAndRound } from '~/server/gameService';

export const onPost: RequestHandler = async ({ params, json }) => {
  try {
    const sessionId = parseInt(params.sessionId);
    const roundNumber = parseInt(params.roundNumber);
    
    if (isNaN(sessionId) || isNaN(roundNumber)) {
      json(400, { success: false, error: 'Invalid parameters' });
      return;
    }
    
    const mainRecord = await getMainRecordBySessionAndRound(sessionId, roundNumber);
    if (!mainRecord) {
      json(404, { success: false, error: 'Round not found' });
      return;
    }
    
    const result = await calculateRoundScore(sessionId, mainRecord.id);
    
    json(200, {
      success: true,
      data: result,
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate score',
    });
  }
};
