import { useDb } from '../../../db';
import { orders, orderLogs, photos } from '../../../db/schema';
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
  if (order.status !== 'completed') {
    throw createError({
      statusCode: 400,
      statusMessage: '当前订单状态不支持验收',
    });
  }

  const completionPhotos = await db.select()
    .from(photos)
    .where(and(eq(photos.orderId, id), eq(photos.type, 'completion')));

  const photoMissing = completionPhotos.length === 0;

  if (passed && photoMissing) {
    throw createError({
      statusCode: 400,
      statusMessage: '完成照片缺失，不能提交验收通过',
    });
  }

  const now = new Date();
  const operatorId = 4;
  const operatorName = '赵质检';

  const toStatus = passed ? 'inspection_passed' : 'inspection_failed';
  const actionText = passed ? '验收通过' : '验收不通过';
  const remarkText = remark || (photoMissing ? '完成照片缺失，不予通过' : '');

  await db.transaction(async (tx) => {
    await tx.update(orders)
      .set({
        status: toStatus,
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
      fromStatus: 'completed',
      toStatus,
      createdAt: now,
    });
  });

  const updatedOrderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

  return {
    success: true,
    data: {
      order: updatedOrderResult[0],
      photoMissing,
    },
  };
});
