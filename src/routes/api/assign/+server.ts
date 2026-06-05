import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, AssignmentStatus } from '@prisma/client';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    const currentAssignment = await prisma.assignment.findFirst({
      where: {
        orderId: data.orderId,
        status: AssignmentStatus.ACTIVE
      }
    });

    if (currentAssignment && !data.reassign) {
      return json({ success: false, error: '该订单已有有效派工' }, { status: 400 });
    }

    const assignment = await prisma.$transaction(async (tx) => {
      if (currentAssignment && data.reassign) {
        await tx.assignment.update({
          where: { id: currentAssignment.id },
          data: {
            status: data.reassignReason === 'LEAVE' ? AssignmentStatus.CANCELLED_LEAVE : AssignmentStatus.REASSIGNED,
            reassignedAt: new Date(),
            reassignedById: data.reassignedById,
            reassignedToId: data.cleanerId,
            reassignedReason: data.reassignReason,
            notes: data.notes
          }
        });
      }

      const newAssignment = await tx.assignment.create({
        data: {
          orderId: data.orderId,
          cleanerId: data.cleanerId,
          status: AssignmentStatus.ACTIVE,
          notes: currentAssignment ? '改派订单' : '首次派工'
        },
        include: {
          cleaner: true,
          order: true
        }
      });

      await tx.order.update({
        where: { id: data.orderId },
        data: { status: OrderStatus.ASSIGNED }
      });

      return newAssignment;
    });

    return json({ success: true, assignment });
  } catch (error) {
    console.error('派工失败:', error);
    return json({ success: false, error: '派工失败' }, { status: 500 });
  }
};
