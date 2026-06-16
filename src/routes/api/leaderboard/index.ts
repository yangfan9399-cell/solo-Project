import type { RequestHandler } from '@builder.io/qwik-city';
import { getLeaderboard } from '~/lib/repositories';

export const onGet: RequestHandler = async ({ query, json }) => {
  try {
    const levelIdStr = query.get('levelId');
    const levelId = levelIdStr ? Number(levelIdStr) : undefined;
    const limit = Number(query.get('limit') || '20');

    const leaderboard = await getLeaderboard(levelId, limit);
    json(200, { success: true, data: leaderboard });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
