import type { RequestHandler } from '@builder.io/qwik-city';
import { getMainRecordBySessionAndRound, getPriceCurveByMainId } from '~/server/repositories';

export const onGet: RequestHandler = async ({ params, json }) => {
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
    
    const priceCurve = await getPriceCurveByMainId(mainRecord.id);
    
    json(200, {
      success: true,
      data: {
        mainRecordId: mainRecord.id,
        marketSuggestedPrice: mainRecord.marketSuggestedPrice,
        playerPrice: mainRecord.playerPrice,
        priceCurve,
      },
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get price curve',
    });
  }
};
