import { NextResponse } from 'next/server';
import { getPickupRecordWithDetails } from '@/lib/mockData';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const record = await prisma.pickupRecord.findUnique({
      where: { id },
      include: {
        child: true,
        authorization: true,
        historyNodes: {
          orderBy: { timestamp: 'asc' },
        },
      },
    }).catch(() => null);

    if (record) {
      return NextResponse.json(record);
    }
  } catch (error) {
    console.log('Database not available, using mock data');
  }

  const record = getPickupRecordWithDetails(id);
  
  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    
    const updatedRecord = await prisma.pickupRecord.update({
      where: { id },
      data: body,
      include: {
        child: true,
        authorization: true,
        historyNodes: true,
      },
    }).catch(() => null);

    if (updatedRecord) {
      return NextResponse.json(updatedRecord);
    }
  } catch (error) {
    console.log('Database not available');
  }

  return NextResponse.json(
    { message: 'Mock mode: record would be updated' },
    { status: 200 }
  );
}
