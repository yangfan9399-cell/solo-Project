import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { AssignmentStatus, ApplicationStatus } from '@prisma/client'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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

  if (assignment.applicationId) {
    await prisma.application.update({
      where: { id: assignment.applicationId },
      data: { status: ApplicationStatus.RECALLED },
    })
  }

  return NextResponse.json({ success: true })
}