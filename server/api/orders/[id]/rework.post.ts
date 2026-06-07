import { useDb } from '../../../db';
import { orders, orderLogs, reworks } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { reason, description, deadlineHours, cleanerId } = body;

  if (!reason || !description || !deadlineHours || !cleanerId) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写完整的返工信息',
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
  if (order.status !== 'inspection_failed' && order.status !== 'rework_timeout') {
    throw createError({
      statusCode: 400,
      statusMessage: '当前订单状态不支持创建返工',
    });
  }

  const now = new Date();
  const deadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);
  const operatorId = 4;
  const operatorName = '赵质检';

  let createdRework;

  await db.transaction(async (tx) => {
    await tx.update(orders)
      .set({
        status: 'rework',
        updatedAt: now,
      })
      .where(eq(orders.id, id));

    const reworkResult = await tx.insert(reworks).values({
      orderId: id,
      reason: reason as any,
      description,
      deadline,
      assignedCleanerId: cleanerId,
      isTimeout: false,
      createdBy: operatorId,
      createdAt: now,
    }).returning();

    createdRework = reworkResult[0];

    await tx.insert(orderLogs).values({
      orderId: id,
      action: '创建返工',
      description,
      operatorId,
      operatorName,
      fromStatus: order.status,
      toStatus: 'rework',
      createdAt: now,
    });
  });

  return {
    success: true,
    data: {
      rework: createdRework,
    },
  };
});
