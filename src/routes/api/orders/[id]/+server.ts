import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async ({ params }) => {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      creator: true,
      assignments: {
        include: {
          cleaner: true,
          reassignedBy: true,
          reassignedTo: true
        },
        orderBy: {
          assignedAt: 'asc'
        }
      },
      serviceFeedback: true,
      qualityChecks: {
        include: {
          inspector: true
        },
        orderBy: {
          checkedAt: 'desc'
        }
      }
    }
  });

  if (!order) {
    return json({ error: '订单不存在' }, { status: 404 });
  }

  return json(order);
};
