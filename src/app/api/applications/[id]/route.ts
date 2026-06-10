import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      employee: true,
      software: true,
      department: true,
      approvals: {
        include: { approver: true },
        orderBy: { createdAt: 'asc' },
      },
      assignment: {
        include: { license: true },
      },
    },
  })
  if (!application) {
    return NextResponse.json({ error: '申请不存在' }, { status: 404 })
  }
  return NextResponse.json(application)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const application = await prisma.application.update({
    where: { id },
    data: body,
  })
  return NextResponse.json(application)
}