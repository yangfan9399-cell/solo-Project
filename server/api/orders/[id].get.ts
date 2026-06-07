import {
  getOrderById,
  getCustomerById,
  getCleanerById,
  getOrderPhotos,
  getOrderComplaint,
  getOrderRework,
  getOrderCompensation,
  getOrderLogs,
} from '../../db/mockData';

export default defineEventHandler((event) => {
  const id = parseInt(event.context.params?.id || '0');
  const order = getOrderById(id);

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    });
  }

  const customer = getCustomerById(order.customerId);
  const cleaner = order.cleanerId ? getCleanerById(order.cleanerId) : null;
  const photos = getOrderPhotos(id);
  const complaint = getOrderComplaint(id);
  const rework = getOrderRework(id);
  const compensation = getOrderCompensation(id);
  const logs = getOrderLogs(id);

  return {
    success: true,
    data: {
      order,
      customer,
      cleaner,
      photos,
      complaint,
      rework,
      compensation,
      logs,
    },
  };
});
