import { NextResponse } from 'next/server';
import { mockAuthorizations, getAuthorizationsByChildId } from '@/lib/mockData';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');

  try {
    const where = childId ? { childId } : {};
    const authorizations = await prisma.authorization.findMany({
      where,
      include: { child: true },
      orderBy: { registeredAt: 'desc' },
    }).catch(() => null);

    if (authorizations) {
      return NextResponse.json(authorizations);
    }
  } catch (error) {
    console.log('Database not available, using mock data');
  }

  const result = childId 
    ? getAuthorizationsByChildId(childId)
    : mockAuthorizations;

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newAuth = await prisma.authorization.create({
      data: {
        ...body,
        historyLogs: {
          create: {
            action: 'CREATE',
            operator: body.registeredBy || '班主任',
            operatorRole: 'TEACHER',
            description: '登记新授权',
          },
        },
      },
      include: { historyLogs: true },
    }).catch(() => null);

    if (newAuth) {
      return NextResponse.json(newAuth, { status: 201 });
    }
  } catch (error) {
    console.log('Database not available');
  }

  return NextResponse.json(
    { message: 'Mock mode: authorization would be created' },
    { status: 201 }
  );
}
