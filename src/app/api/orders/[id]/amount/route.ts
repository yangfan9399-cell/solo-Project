import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { getFormattedOrder } from '@/lib/formatOrder';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { handlerName = '张伟', correctedAmount, notes } = await request.json();

    if (!correctedAmount || correctedAmount <= 0) {
      return NextResponse.json(
        { error: '请输入有效金额' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        amountDiscrepancy: true,
        documents: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const handler = await prisma.user.findFirst({
      where: { 
        name: handlerName,
        role: Role.DOCUMENT_HANDLER
      },
    });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: id },
        data: {
          status: OrderStatus.UNDER_REVIEW,
          declaredAmount: new Prisma.Decimal(correctedAmount),
          actualAmount: new Prisma.Decimal(correctedAmount),
          declaredValue: new Prisma.Decimal(correctedAmount),
          actualValue: new Prisma.Decimal(correctedAmount),
          documentHandlerId: handler?.id,
        },
      });

      await tx.document.updateMany({
        where: {
          orderId: id,
          status: 'MISMATCH',
        },
        data: {
          status: 'VERIFIED',
        },
      });

      if (order.amountDiscrepancy) {
        await tx.amountDiscrepancy.update({
          where: { id: order.amountDiscrepancy.id },
          data: {
            resolved: true,
            resolvedAt: new Date(),
            resolvedBy: handlerName,
          },
        });
      }

      const historyNotes = `更正后金额: ¥${correctedAmount.toFixed(2)}${notes ? ', ' + notes : ''}`;
      await tx.historyNode.create({
        data: {
          orderId: id,
          action: '金额更正完成',
          status: 'UNDER_REVIEW',
          notes: historyNotes,
          operator: handlerName,
          role: '单证经办人',
        },
      });

      return updated;
    });

    const formattedOrder = await getFormattedOrder(prisma, id);
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error resolving amount discrepancy:', error);
    return NextResponse.json(
      { error: 'Failed to resolve amount discrepancy' },
      { status: 500 }
    );
  }
}
