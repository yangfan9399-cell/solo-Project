import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reviewerName = '李明' } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        amountDiscrepancy: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status === 'INVOICE_MISMATCH' && !order.amountDiscrepancy?.resolved) {
      return NextResponse.json(
        { error: '金额不符的订单无法放行，请先更正金额' },
        { status: 400 }
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
          status: OrderStatus.APPROVED,
          customsReviewerId: reviewer?.id,
        },
      });

      await tx.historyNode.create({
        data: {
          orderId: params.id,
          action: '放行通过',
          status: 'APPROVED',
          notes: '单证齐全，准予放行',
          operator: reviewerName,
          role: '关务复核人',
        },
      });

      if (updated.clearanceBasisId) {
        await tx.clearanceBasis.update({
          where: { id: updated.clearanceBasisId },
          data: {
            approvedBy: reviewerName,
            approvedAt: new Date(),
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error approving order:', error);
    return NextResponse.json(
      { error: 'Failed to approve order' },
      { status: 500 }
    );
  }
}
