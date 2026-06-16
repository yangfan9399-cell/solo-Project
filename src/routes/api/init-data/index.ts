import type { RequestHandler } from '@builder.io/qwik-city';
import { INITIAL_LEVELS, DEFAULT_PLAYER } from '~/game/levels';

export const onGet: RequestHandler = async ({ json }) => {
  json(200, {
    levels: INITIAL_LEVELS,
    defaultPlayer: {
      ...DEFAULT_PLAYER,
      createdAt: Date.now(),
    },
    timestamp: Date.now(),
  });
};
