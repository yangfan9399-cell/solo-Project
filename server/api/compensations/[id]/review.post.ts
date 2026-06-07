import { useDb } from '../../../db';
import { compensations, orders, orderLogs } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { approved, remark } = body;

  if (typeof approved !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: '请选择审批结果',
    });
  }

  const db = useDb();

  const compResult = await db.select().from(compensations).where(eq(compensations.id, id)).limit(1);
  if (compResult.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: '赔付记录不存在',
    });
  }

  const compensation = compResult[0];
  if (compensation.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage: '当前赔付状态不支持审批',
    });
  }

  const now = new Date();
  const operatorId = 5;
  const operatorName = '刘主管';

  const toStatus = approved ? 'approved' : 'rejected';
  const orderToStatus = approved ? 'compensation_approved' : 'closed';
  const actionText = approved ? '赔付批准' : '赔付拒绝';

  let updatedCompensation;

  await db.transaction(async (tx) => {
    const result = await tx.update(compensations)
      .set({
        status: toStatus,
        reviewedBy: operatorId,
        reviewedAt: now,
        reviewRemark: remark || '',
      })
      .where(eq(compensations.id, id))
      .returning();

    updatedCompensation = result[0];

    await tx.update(orders)
      .set({
        status: orderToStatus,
        updatedAt: now,
      })
      .where(eq(orders.id, compensation.orderId));

    await tx.insert(orderLogs).values({
      orderId: compensation.orderId,
      action: actionText,
      description: remark || '',
      operatorId,
      operatorName,
      fromStatus: 'compensation_pending',
      toStatus: orderToStatus,
      createdAt: now,
    });
  });

  return {
    success: true,
    data: {
      compensation: updatedCompensation,
    },
  };
});
