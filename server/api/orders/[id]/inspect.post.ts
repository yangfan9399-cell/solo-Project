import { useDb } from '../../../db';
import { orders, orderLogs, photos, compensations } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { passed, remark } = body;

  const db = useDb();

  const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (orderResult.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    });
  }

  const order = orderResult[0];
  const isReworkInspection = order.status === 'rework_completed';

  if (order.status !== 'completed' && !isReworkInspection) {
    throw createError({
      statusCode: 400,
      statusMessage: '当前订单状态不支持验收',
    });
  }

  const completionPhotos = await db.select()
    .from(photos)
    .where(and(eq(photos.orderId, id), eq(photos.type, isReworkInspection ? 'rework' : 'completion')));

  const photoMissing = completionPhotos.length === 0;

  if (passed && photoMissing) {
    throw createError({
      statusCode: 400,
      statusMessage: isReworkInspection ? '返工照片缺失，不能提交验收通过' : '完成照片缺失，不能提交验收通过',
    });
  }

  const now = new Date();
  const operatorId = 4;
  const operatorName = '赵质检';

  let toStatus: string;
  let actionText: string;
  let remarkText: string;
  let fromStatus: string;

  if (isReworkInspection) {
    fromStatus = 'rework_completed';
    if (passed) {
      toStatus = 'closed';
      actionText = '返工验收通过';
      remarkText = remark || '返工验收通过，订单关闭';
    } else {
      toStatus = 'compensation_pending';
      actionText = '返工验收不通过';
      remarkText = remark || '返工验收不通过，进入赔付流程';
    }
  } else {
    fromStatus = 'completed';
    toStatus = passed ? 'inspection_passed' : 'inspection_failed';
    actionText = passed ? '验收通过' : '验收不通过';
    remarkText = remark || (photoMissing ? '完成照片缺失，不予通过' : '');
  }

  await db.transaction(async (tx) => {
    await tx.update(orders)
      .set({
        status: toStatus as any,
        inspectedBy: operatorId,
        inspectedAt: now,
        inspectionRemark: remarkText,
        updatedAt: now,
      })
      .where(eq(orders.id, id));

    await tx.insert(orderLogs).values({
      orderId: id,
      action: actionText,
      description: remarkText,
      operatorId,
      operatorName,
      fromStatus: fromStatus as any,
      toStatus: toStatus as any,
      createdAt: now,
    });

    if (isReworkInspection && !passed) {
      await tx.insert(compensations).values({
        orderId: id,
        amount: order.price,
        reason: remarkText,
        ruleType: 'rework_timeout',
        status: 'pending',
        createdAt: now,
      });

      await tx.insert(orderLogs).values({
        orderId: id,
        action: '创建赔付申请',
        description: `返工验收不通过，自动创建赔付申请，金额：${order.price}元`,
        operatorId,
        operatorName,
        fromStatus: 'rework_completed',
        toStatus: 'compensation_pending',
        createdAt: now,
      });
    }
  });

  const updatedOrderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

  return {
    success: true,
    data: {
      order: updatedOrderResult[0],
      photoMissing,
      isReworkInspection,
    },
  };
});
