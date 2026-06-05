import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { getFormattedOrder } from '@/lib/formatOrder';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { operatorName = '系统' } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'APPROVED' && order.status !== 'REJECTED') {
      return NextResponse.json(
        { error: '只有已放行或已退回的订单才能归档' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: id },
        data: {
          status: OrderStatus.ARCHIVED,
        },
      });

      await tx.historyNode.create({
        data: {
          orderId: id,
          action: '归档',
          status: 'ARCHIVED',
          operator: operatorName,
          role: '系统',
        },
      });

      return updated;
    });

    const formattedOrder = await getFormattedOrder(prisma, id);
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error archiving order:', error);
    return NextResponse.json(
      { error: 'Failed to archive order' },
      { status: 500 }
    );
  }
}
