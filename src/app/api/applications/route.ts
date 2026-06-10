import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const applications = await prisma.application.findMany({
    include: {
      employee: true,
      software: true,
      department: true,
      approvals: true,
      assignment: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(applications)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { employeeId, softwareId, departmentId, reason, requestedSeats, useScope } = body

  const software = await prisma.software.findUnique({ where: { id: softwareId } })
  if (!software) {
    return NextResponse.json({ error: '软件不存在' }, { status: 404 })
  }

  if (software.usedSeats >= software.totalSeats) {
    return NextResponse.json({ error: '许可证不足', availableRecallCandidates: [] }, { status: 400 })
  }

  const application = await prisma.application.create({
    data: {
      employeeId,
      softwareId,
      departmentId,
      reason,
      requestedSeats,
      useScope,
    },
  })

  return NextResponse.json(application, { status: 201 })
}