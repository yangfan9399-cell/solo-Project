import { useDb } from '../../../db';
import { orders, orderLogs, cleaners, customers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

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

  const db = useDb();

  const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (orderResult.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    });
  }

  const order = orderResult[0];
  if (order.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage: '当前订单状态不支持派单',
    });
  }

  const now = new Date();
  const operatorId = 1;
  const operatorName = '张客服';

  await db.transaction(async (tx) => {
    await tx.update(orders)
      .set({
        cleanerId,
        status: 'assigned',
        assignedBy: operatorId,
        assignedAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, id));

    await tx.insert(orderLogs).values({
      orderId: id,
      action: '派单',
      description: '指派保洁员',
      operatorId,
      operatorName,
      fromStatus: 'pending',
      toStatus: 'assigned',
      createdAt: now,
    });
  });

  const updatedOrderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const cleanerResult = await db.select().from(cleaners).where(eq(cleaners.id, cleanerId)).limit(1);
  const customerResult = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);

  return {
    success: true,
    data: {
      order: updatedOrderResult[0],
      cleaner: cleanerResult[0],
      customer: customerResult[0],
    },
  };
});
