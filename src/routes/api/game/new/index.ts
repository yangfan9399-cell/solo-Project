import type { RequestHandler } from '@builder.io/qwik-city';
import { createNewGame } from '~/server/gameService';

export const onPost: RequestHandler = async ({ json }) => {
  try {
    const result = await createNewGame();
    json(200, {
      success: true,
      data: result,
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create game',
    });
  }
};
