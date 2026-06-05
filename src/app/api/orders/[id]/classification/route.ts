import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus, Role } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { handlerName = '张伟', finalHsCode, notes } = await request.json();

    if (!finalHsCode?.trim()) {
      return NextResponse.json(
        { error: '请输入最终HS编码' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        classificationNote: true,
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
        where: { id: params.id },
        data: {
          status: OrderStatus.UNDER_REVIEW,
          documentHandlerId: handler?.id,
        },
      });

      await tx.orderItem.updateMany({
        where: { orderId: params.id },
        data: {
          hsCode: finalHsCode,
          declaredHsCode: finalHsCode,
          classificationNote: null,
        },
      });

      if (order.classificationNote) {
        await tx.classificationNote.update({
          where: { id: order.classificationNote.id },
          data: {
            status: 'RESOLVED',
            resolved: true,
            resolvedAt: new Date(),
            resolvedBy: handlerName,
          },
        });
      }

      const historyNotes = `最终HS编码: ${finalHsCode}${notes ? ', ' + notes : ''}`;
      await tx.historyNode.create({
        data: {
          orderId: params.id,
          action: '归类说明确认',
          status: 'UNDER_REVIEW',
          notes: historyNotes,
          operator: handlerName,
          role: '单证经办人',
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error resolving classification:', error);
    return NextResponse.json(
      { error: 'Failed to resolve classification' },
      { status: 500 }
    );
  }
}
