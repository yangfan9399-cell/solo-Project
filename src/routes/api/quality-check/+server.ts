import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, QualityResult } from '@prisma/client';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { serviceFeedback: true }
    });

    if (!order) {
      return json({ success: false, error: '订单不存在' }, { status: 404 });
    }

    const scheduledHours = order.scheduledHours;
    const actualHours = order.serviceFeedback?.actualHours?.toNumber() || 0;
    const hoursDeficit = Math.max(0, scheduledHours - actualHours);

    const MIN_HOURS_RATIO = 0.9;
    const isHoursInsufficient = actualHours < scheduledHours * MIN_HOURS_RATIO;

    if (isHoursInsufficient && data.result === QualityResult.PASSED) {
      return json({
        success: false,
        error: '服务时长不足，无法直接通过',
        hoursDeficit,
        scheduledHours,
        actualHours,
        options: ['安排补服务', '申请补偿', '退回返工']
      }, { status: 400 });
    }

    const checkResult = await prisma.$transaction(async (tx) => {
      const qualityCheck = await tx.qualityCheck.create({
        data: {
          orderId: data.orderId,
          inspectorId: data.inspectorId,
          result: data.result as QualityResult,
          actualHours: actualHours,
          hoursDeficit: hoursDeficit,
          notes: data.notes,
          compensation: data.compensation || null,
          needsRework: data.needsRework || false,
          reworkReason: data.reworkReason || null
        },
        include: {
          inspector: true
        }
      });

      let newStatus = order.status;
      if (data.result === QualityResult.PASSED && !isHoursInsufficient) {
        newStatus = OrderStatus.ARCHIVED;
      } else if (data.result === QualityResult.REJECTED || data.needsRework) {
        newStatus = OrderStatus.NEEDS_REWORK;
        await tx.order.update({
          where: { id: data.orderId },
          data: { reworkCount: { increment: 1 } }
        });
      } else if (data.result === QualityResult.COMPENSATION) {
        newStatus = OrderStatus.ARCHIVED;
      }

      await tx.order.update({
        where: { id: data.orderId },
        data: { status: newStatus }
      });

      return qualityCheck;
    });

    return json({ 
      success: true, 
      checkResult,
      hoursInfo: {
        scheduled: scheduledHours,
        actual: actualHours,
        deficit: hoursDeficit
      }
    });
  } catch (error) {
    console.error('质检处理失败:', error);
    return json({ success: false, error: '质检处理失败' }, { status: 500 });
  }
};
