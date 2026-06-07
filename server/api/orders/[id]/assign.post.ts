import { assignOrder, getOrderById, getCleanerById, getCustomerById } from '../../../db/mockData';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { cleanerId } = body;

  if (!cleanerId) {
    throw createError({
      statusCode: 400,
      statusMessage: '请选择保洁员',
    });
  }

  const order = getOrderById(id);
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    });
  }

  if (order.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage: '当前订单状态不支持派单',
    });
  }

  const result = assignOrder(id, cleanerId, 1, '张客服');

  return {
    success: true,
    data: {
      order: result,
      cleaner: getCleanerById(cleanerId),
      customer: getCustomerById(result?.customerId || 0),
    },
  };
});
