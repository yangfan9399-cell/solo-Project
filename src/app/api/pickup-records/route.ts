import { NextResponse } from 'next/server';
import { mockPickupRecords, getPickupRecordWithDetails } from '@/lib/mockData';
import prisma from '@/lib/prisma';
import type { PickupStatus } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');
  const status = searchParams.get('status');

  try {
    const where: { childId?: string; status?: PickupStatus } = {};
    if (childId) where.childId = childId;
    if (status) where.status = status as PickupStatus;

    const records = await prisma.pickupRecord.findMany({
      where,
      include: {
        child: true,
        authorization: true,
        historyNodes: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    if (records) {
      return NextResponse.json(records);
    }
  } catch (error) {
    console.log('Database not available, using mock data');
  }

  let result = mockPickupRecords.map(r => getPickupRecordWithDetails(r.id)).filter(Boolean);
  
  if (childId) {
    result = result.filter(r => r?.childId === childId);
  }
  if (status) {
    result = result.filter(r => r?.status === status);
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newRecord = await prisma.pickupRecord.create({
      data: {
        ...body,
        historyNodes: {
          create: {
            nodeType: 'CREATE',
            operator: '系统',
            operatorRole: 'TEACHER',
            description: '生成接送记录',
          },
        },
      },
      include: { historyNodes: true },
    }).catch(() => null);

    if (newRecord) {
      return NextResponse.json(newRecord, { status: 201 });
    }
  } catch (error) {
    console.log('Database not available');
  }

  return NextResponse.json(
    { message: 'Mock mode: pickup record would be created' },
    { status: 201 }
  );
}
