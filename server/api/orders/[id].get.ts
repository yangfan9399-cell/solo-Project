import { useDb } from '../../db';
import {
  orders,
  customers,
  cleaners,
  photos,
  complaints,
  reworks,
  compensations,
  orderLogs,
} from '../../db/schema';
import { eq, asc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const db = useDb();

  const orderResult = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (orderResult.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    });
  }

  const order = orderResult[0];

  const customerResult = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1);
  const customer = customerResult[0] || null;

  let cleaner = null;
  if (order.cleanerId) {
    const cleanerResult = await db
      .select()
      .from(cleaners)
      .where(eq(cleaners.id, order.cleanerId))
      .limit(1);
    cleaner = cleanerResult[0] || null;
  }

  const photosResult = await db
    .select()
    .from(photos)
    .where(eq(photos.orderId, id))
    .orderBy(photos.id);

  const complaintResult = await db
    .select()
    .from(complaints)
    .where(eq(complaints.orderId, id))
    .limit(1);
  const complaint = complaintResult[0] || null;

  const reworkResult = await db
    .select()
    .from(reworks)
    .where(eq(reworks.orderId, id))
    .limit(1);
  const rework = reworkResult[0] || null;

  const compensationResult = await db
    .select()
    .from(compensations)
    .where(eq(compensations.orderId, id))
    .limit(1);
  const compensation = compensationResult[0] || null;

  const logsResult = await db
    .select()
    .from(orderLogs)
    .where(eq(orderLogs.orderId, id))
    .orderBy(asc(orderLogs.createdAt));

  return {
    success: true,
    data: {
      order,
      customer,
      cleaner,
      photos: photosResult,
      complaint,
      rework,
      compensation,
      logs: logsResult,
    },
  };
});
