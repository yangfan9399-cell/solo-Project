import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reviewerName = '李明', reason } = await request.json();

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: '请输入退回原因' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const reviewer = await prisma.user.findFirst({
      where: { 
        name: reviewerName,
        role: Role.CUSTOMS_REVIEWER
      },
    });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: params.id },
        data: {
          status: OrderStatus.REJECTED,
          customsReviewerId: reviewer?.id,
        },
      });

      await tx.historyNode.create({
        data: {
          orderId: params.id,
          action: '退回',
          status: 'REJECTED',
          notes: reason,
          operator: reviewerName,
          role: '关务复核人',
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error rejecting order:', error);
    return NextResponse.json(
      { error: 'Failed to reject order' },
      { status: 500 }
    );
  }
}
