import { useDb } from '../../../db';
import { orders, orderLogs, photos } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  const body = await readBody(event);
  const { photos: photoUrls } = body;

  const db = useDb();

  const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (orderResult.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: '订单不存在',
    });
  }

  const order = orderResult[0];
  if (order.status !== 'assigned') {
    throw createError({
      statusCode: 400,
      statusMessage: '当前订单状态不支持提交完成',
    });
  }

  const now = new Date();
  const operatorId = order.cleanerId || 2;
  const operatorName = '保洁员';

  await db.transaction(async (tx) => {
    await tx.update(orders)
      .set({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, id));

    await tx.insert(orderLogs).values({
      orderId: id,
      action: '提交完成',
      description: '保洁员提交完成记录',
      operatorId,
      operatorName,
      fromStatus: 'in_progress',
      toStatus: 'completed',
      createdAt: now,
    });

    if (photoUrls && photoUrls.length > 0) {
      const photoRecords = photoUrls.map((url: string) => ({
        orderId: id,
        url,
        type: 'completion',
        uploadedBy: operatorId,
        createdAt: now,
      }));
      await tx.insert(photos).values(photoRecords);
    }
  });

  const updatedOrderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const photosResult = await db.select().from(photos).where(eq(photos.orderId, id));

  return {
    success: true,
    data: {
      order: updatedOrderResult[0],
      photos: photosResult,
    },
  };
});
