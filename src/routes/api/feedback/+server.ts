import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, BadReviewReason } from '@prisma/client';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    const startTime = new Date(data.actualStartTime);
    const endTime = new Date(data.actualEndTime);
    const actualHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    const badReviewReason = data.customerRating && data.customerRating < 3 
      ? (data.badReviewReason as BadReviewReason) || BadReviewReason.OTHER
      : BadReviewReason.NOT_APPLICABLE;

    const feedback = await prisma.$transaction(async (tx) => {
      const newFeedback = await tx.serviceFeedback.upsert({
        where: { orderId: data.orderId },
        update: {
          actualStartTime: startTime,
          actualEndTime: endTime,
          actualHours: actualHours,
          serviceNotes: data.serviceNotes,
          photoEvidence: data.photoEvidence || [],
          customerRating: data.customerRating,
          customerComment: data.customerComment,
          badReviewReason
        },
        create: {
          orderId: data.orderId,
          actualStartTime: startTime,
          actualEndTime: endTime,
          actualHours: actualHours,
          serviceNotes: data.serviceNotes,
          photoEvidence: data.photoEvidence || [],
          customerRating: data.customerRating,
          customerComment: data.customerComment,
          badReviewReason
        }
      });

      await tx.order.update({
        where: { id: data.orderId },
        data: { status: OrderStatus.COMPLETED }
      });

      return newFeedback;
    });

    return json({ success: true, feedback });
  } catch (error) {
    console.error('提交服务反馈失败:', error);
    return json({ success: false, error: '提交服务反馈失败' }, { status: 500 });
  }
};
