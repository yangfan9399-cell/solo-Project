import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { AssignmentStatus } from '@prisma/client'

export async function POST(request: Request, params: unknown) {
  const id = (params as { params: { id: string } }).params.id

  const assignment = await prisma.licenseAssignment.findUnique({
    where: { id },
    include: { license: true },
  })

  if (!assignment) {
    return NextResponse.json({ error: '分配记录不存在' }, { status: 404 })
  }

  await prisma.licenseAssignment.update({
    where: { id },
    data: { status: AssignmentStatus.RECALLED },
  })

  await prisma.software.update({
    where: { id: assignment.license.softwareId },
    data: { usedSeats: { decrement: 1 } },
  })

  const application = await prisma.application.findFirst({
    where: { assignment: { id: id } },
  })

  if (application) {
    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'RECALLED' },
    })
  }

  return NextResponse.json({ success: true })
}