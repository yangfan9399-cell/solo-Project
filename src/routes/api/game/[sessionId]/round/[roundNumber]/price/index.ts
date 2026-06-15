import type { RequestHandler } from '@builder.io/qwik-city';
import {
  submitPrice,
  recordInventoryCost,
  recordSale,
  recordReturn,
} from '~/server/gameService';
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
    const { mainRecordId, playerPrice, blindBoxId, customerId } = body;
    
    if (!mainRecordId || playerPrice === undefined || !blindBoxId || !customerId) {
      json(400, { success: false, error: 'Missing required fields' });
      return;
    }
    
    const blindBox = await getBlindBoxById(blindBoxId);
    const customer = await getCustomerById(customerId);
    
    if (!blindBox || !customer) {
      json(404, { success: false, error: 'Blind box or customer not found' });
      return;
    }
    
    const inventoryEntry = await recordInventoryCost(sessionId, roundNumber, blindBox);
    
    const result = await submitPrice(sessionId, mainRecordId, playerPrice, customer, blindBox);
    
    const saleEntry = await recordSale(sessionId, roundNumber, mainRecordId, playerPrice, result.feedback.purchased);
    
    let returnEntries = null;
    if (result.isReturnTriggered && result.returnEvent) {
      returnEntries = await recordReturn(sessionId, roundNumber, mainRecordId, result.returnEvent);
    }
    
    json(200, {
      success: true,
      data: {
        ...result,
        inventoryEntry,
        saleEntry,
        returnEntries,
      },
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit price',
    });
  }
};
