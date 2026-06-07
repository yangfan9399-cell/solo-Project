import { useDb } from '../../../db';
import { orders, orderLogs, compensations } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { amount, reason, ruleType } = body;

  if (!amount || !reason || !ruleType) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写完整的赔付信息',
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

  const now = new Date();
  const operatorId = 4;
  const operatorName = '赵质检';

  let createdCompensation;

  await db.transaction(async (tx) => {
    await tx.update(orders)
      .set({
        status: 'compensation_pending',
        updatedAt: now,
      })
      .where(eq(orders.id, id));

    const compResult = await tx.insert(compensations).values({
      orderId: id,
      amount: amount.toString(),
      reason,
      ruleType: ruleType as any,
      status: 'pending',
      createdAt: now,
    }).returning();

    createdCompensation = compResult[0];

    await tx.insert(orderLogs).values({
      orderId: id,
      action: '创建赔付申请',
      description: `${reason}，金额：${amount}元`,
      operatorId,
      operatorName,
      fromStatus: order.status,
      toStatus: 'compensation_pending',
      createdAt: now,
    });
  });

  return {
    success: true,
    data: {
      compensation: createdCompensation,
    },
  };
});
