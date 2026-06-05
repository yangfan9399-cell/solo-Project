import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, DocumentStatus, Role } from '@prisma/client';
import { getFormattedOrder } from '@/lib/formatOrder';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { handlerName = '张伟', notes } = await request.json();

    if (!notes?.trim()) {
      return NextResponse.json(
        { error: '请输入补充说明' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
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
          documentStatus: DocumentStatus.COMPLETE,
          documentHandlerId: handler?.id,
        },
      });

      await tx.document.updateMany({
        where: {
          orderId: id,
          OR: [
            { status: 'MISSING' },
            { status: 'PENDING' },
          ],
        },
        data: {
          status: 'VERIFIED',
          uploadedBy: handlerName,
          uploadedAt: new Date(),
        },
      });

      await tx.historyNode.create({
        data: {
          orderId: id,
          action: '资料补充完成',
          status: 'UNDER_REVIEW',
          notes,
          operator: handlerName,
          role: '单证经办人',
        },
      });

      return updated;
    });

    const formattedOrder = await getFormattedOrder(prisma, id);
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error supplementing documents:', error);
    return NextResponse.json(
      { error: 'Failed to supplement documents' },
      { status: 500 }
    );
  }
}
