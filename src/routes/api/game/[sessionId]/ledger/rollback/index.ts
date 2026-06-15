import type { RequestHandler } from '@builder.io/qwik-city';
import { rollbackRound, getFullSessionData } from '~/server/gameService';

export const onPost: RequestHandler = async ({ params, request, json }) => {
  try {
    const sessionId = parseInt(params.sessionId);
    if (isNaN(sessionId)) {
      json(400, { success: false, error: 'Invalid session ID' });
      return;
    }
    
    const body = await request.json();
    const { roundNumber, entryId } = body;
    
    if (!roundNumber || !entryId) {
      json(400, { success: false, error: 'Missing required fields' });
      return;
    }
    
    const rollbackResult = await rollbackRound(sessionId, roundNumber, entryId);
    const sessionData = await getFullSessionData(sessionId);
    
    json(200, {
      success: true,
      data: {
        rollbackEntryId: rollbackResult,
        ledgerEntries: sessionData.ledgerEntries,
        currentMoney: sessionData.session.currentMoney,
      },
      message: 'Ledger entry rolled back successfully',
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rollback ledger entry',
    });
  }
};
