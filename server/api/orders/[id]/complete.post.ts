import { completeOrder, getOrderPhotos } from '../../../db/mockData';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { photos } = body;

  const result = completeOrder(id, 2, '李保洁', photos || []);

  if (!result) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    });
  }

  return {
    success: true,
    data: {
      order: result,
      photos: getOrderPhotos(id),
    },
  };
});
