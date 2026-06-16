import type { RequestHandler } from '@builder.io/qwik-city';
import { getAllLevels } from '~/lib/repositories';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    const levels = await getAllLevels();
    json(200, { success: true, data: levels });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
