import { NextResponse } from 'next/server';
import { mockChildren } from '@/lib/mockData';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const children = await prisma.child.findMany({
      include: {
        authorizations: true,
      },
    }).catch(() => null);

    if (children) {
      return NextResponse.json(children);
    }
  } catch (error) {
    console.log('Database not available, using mock data');
  }

  return NextResponse.json(mockChildren);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newChild = await prisma.child.create({
      data: body,
    }).catch(() => null);

    if (newChild) {
      return NextResponse.json(newChild, { status: 201 });
    }
  } catch (error) {
    console.log('Database not available');
  }

  return NextResponse.json(
    { message: 'Mock mode: child would be created' },
    { status: 201 }
  );
}
