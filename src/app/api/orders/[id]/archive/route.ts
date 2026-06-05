import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { operatorName = '系统' } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
        where: { id: params.id },
        data: {
          status: OrderStatus.ARCHIVED,
        },
      });

      await tx.historyNode.create({
        data: {
          orderId: params.id,
          action: '归档',
          status: 'ARCHIVED',
          operator: operatorName,
          role: '系统',
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error archiving order:', error);
    return NextResponse.json(
      { error: 'Failed to archive order' },
      { status: 500 }
    );
  }
}
