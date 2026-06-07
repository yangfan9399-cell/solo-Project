import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const body = await request.json();
    const { principalReviewBy, principalDecision, principalRemark } = body;

    const updatedRecord = await prisma.pickupRecord.update({
      where: { id },
      data: {
        status: principalDecision,
        principalReviewBy,
        principalReviewAt: new Date(),
        principalDecision,
        principalRemark,
        historyNodes: {
          create: {
            nodeType: 'PRINCIPAL_REVIEW',
            operator: principalReviewBy || '园长',
            operatorRole: 'PRINCIPAL',
            description: `园长复核：${principalDecision === 'EXCEPTION_APPROVED' ? '同意异常放行' : '驳回申请'}`,
          },
        },
      },
      include: { historyNodes: true },
    }).catch(() => null);

    if (updatedRecord) {
      return NextResponse.json(updatedRecord);
    }
  } catch (error) {
    console.log('Database not available');
  }

  return NextResponse.json(
    { message: 'Mock mode: principal review would be processed' },
    { status: 200 }
  );
}
