import { useDb } from '../../../db';
import { orders, orderLogs, photos, reworks, cleaners, compensations } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { photos: photoUrls } = body;

  if (!photoUrls || photoUrls.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '请上传至少一张返工完成照片',
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
  if (order.status !== 'rework') {
    throw createError({
      statusCode: 400,
      statusMessage: '当前订单状态不支持提交返工完成',
    });
  }

  const cleanerResult = await db.select().from(cleaners).where(eq(cleaners.id, order.cleanerId!)).limit(1);
  const cleanerName = cleanerResult[0]?.name || '保洁员';

  const now = new Date();
  const operatorId = cleanerResult[0]?.userId || 2;
  const operatorName = cleanerName;

  let isTimeout = false;
  let reworkDeadline: Date | null = null;
  const reworkResult = await db.select().from(reworks).where(and(eq(reworks.orderId, id), eq(reworks.isTimeout, false))).limit(1);
  if (reworkResult.length > 0) {
    reworkDeadline = new Date(reworkResult[0].deadline);
    isTimeout = reworkDeadline < now;
  }

  await db.transaction(async (tx) => {
    const toStatus = isTimeout ? 'compensation_pending' : 'rework_completed';

    await tx.update(orders)
      .set({
        status: toStatus as any,
        updatedAt: now,
      })
      .where(eq(orders.id, id));

    if (reworkResult.length > 0) {
      await tx.update(reworks)
        .set({
          completedAt: now,
          isTimeout,
        })
        .where(eq(reworks.id, reworkResult[0].id));
    }

    const photoValues = photoUrls.map((url: string) => ({
      orderId: id,
      url,
      type: 'rework' as const,
      uploadedBy: operatorId,
      createdAt: now,
    }));
    await tx.insert(photos).values(photoValues);

    await tx.insert(orderLogs).values({
      orderId: id,
      action: isTimeout ? '返工超时提交' : '提交返工完成',
      description: isTimeout ? '返工超时后提交完成，自动进入赔付流程' : '提交返工完成记录和照片',
      operatorId,
      operatorName,
      fromStatus: 'rework',
      toStatus: toStatus as any,
      createdAt: now,
    });

    if (isTimeout) {
      await tx.insert(compensations).values({
        orderId: id,
        amount: order.price,
        reason: '返工超时完成',
        ruleType: 'rework_timeout',
        status: 'pending',
        createdAt: now,
      });

      await tx.insert(orderLogs).values({
        orderId: id,
        action: '创建赔付申请',
        description: `返工超时，自动创建赔付申请，金额：${order.price}元`,
        operatorId,
        operatorName,
        fromStatus: 'rework',
        toStatus: 'compensation_pending' as any,
        createdAt: now,
      });
    }
  });

  const updatedOrderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

  return {
    success: true,
    data: {
      order: updatedOrderResult[0],
      isTimeout,
    },
  };
});
