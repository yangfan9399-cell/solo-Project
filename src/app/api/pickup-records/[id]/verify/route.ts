import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const body = await request.json();
    const { status, guardVerifiedBy, exceptionReason, exceptionRemark } = body;

    const updatedRecord = await prisma.pickupRecord.update({
      where: { id },
      data: {
        status,
        guardVerifiedBy,
        verifiedAt: new Date(),
        exceptionReason,
        exceptionRemark,
        historyNodes: {
          create: {
            nodeType: status === 'VERIFIED' ? 'VERIFY' : 'BLOCK',
            operator: guardVerifiedBy || '门岗',
            operatorRole: 'GUARD',
            description: status === 'VERIFIED' 
              ? '门岗核验通过' 
              : `门岗核验异常：${exceptionReason || '未知原因'}`,
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
    { message: 'Mock mode: verification would be processed' },
    { status: 200 }
  );
}
