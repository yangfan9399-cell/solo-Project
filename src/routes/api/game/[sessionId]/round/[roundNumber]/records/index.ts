import type { RequestHandler } from '@builder.io/qwik-city';
import { createMainRecords } from '~/server/gameService';
import { getBlindBoxById, getCustomerById } from '~/server/repositories';

export const onPost: RequestHandler = async ({ params, request, json }) => {
  try {
    const sessionId = parseInt(params.sessionId);
    const roundNumber = parseInt(params.roundNumber);
    
    if (isNaN(sessionId) || isNaN(roundNumber)) {
      json(400, { success: false, error: 'Invalid parameters' });
      return;
    }
    
    const body = await request.json();
    const { blindBoxId, customerId } = body;
    
    if (!blindBoxId || !customerId) {
      json(400, { success: false, error: 'Missing required fields' });
      return;
    }
    
    const blindBox = await getBlindBoxById(blindBoxId);
    const customer = await getCustomerById(customerId);
    
    if (!blindBox || !customer) {
      json(404, { success: false, error: 'Blind box or customer not found' });
      return;
    }
    
    const result = await createMainRecords(sessionId, roundNumber, blindBoxId, blindBox, customer);
    
    json(200, {
      success: true,
      data: result,
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create records',
    });
  }
};
