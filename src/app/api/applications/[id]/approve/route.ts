import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApplicationStatus, ApprovalRole, ApprovalStatus } from '@prisma/client'

export async function POST(request: Request, params: unknown) {
  const id = (params as { params: { id: string } }).params.id
  const { approverId, role, status, comment } = await request.json()

  const application = await prisma.application.findUnique({
    where: { id },
    include: { software: true },
  })

  if (!application) {
    return NextResponse.json({ error: '申请不存在' }, { status: 404 })
  }

  if (role === ApprovalRole.DEPARTMENT_HEAD) {
    await prisma.approval.create({
      data: {
        applicationId: id,
        approverId,
        role: ApprovalRole.DEPARTMENT_HEAD,
        status,
        comment,
      },
    })

    if (status === ApprovalStatus.APPROVED) {
      await prisma.application.update({
        where: { id },
        data: { status: ApplicationStatus.DEPARTMENT_APPROVED },
      })
    } else {
      await prisma.application.update({
        where: { id },
        data: { status: ApplicationStatus.REJECTED },
      })
    }
  } else if (role === ApprovalRole.IT_ADMIN) {
    if (application.status !== ApplicationStatus.DEPARTMENT_APPROVED) {
      return NextResponse.json({ error: '需先经部门负责人审批' }, { status: 400 })
    }

    const software = await prisma.software.findUnique({
      where: { id: application.softwareId },
    })

    if (!software || software.usedSeats >= software.totalSeats) {
      const recallCandidates = await prisma.licenseAssignment.findMany({
        where: {
          license: { softwareId: application.softwareId },
          status: 'ACTIVE',
        },
        include: {
          employee: true,
        },
        orderBy: { assignedAt: 'asc' },
      })
      return NextResponse.json({
        error: '许可证不足',
        recallCandidates,
      }, { status: 400 })
    }

    await prisma.approval.create({
      data: {
        applicationId: id,
        approverId,
        role: ApprovalRole.IT_ADMIN,
        status,
        comment,
      },
    })

    if (status === ApprovalStatus.APPROVED) {
      const availableLicense = await prisma.license.findFirst({
        where: {
          softwareId: application.softwareId,
          status: 'ACTIVE',
        },
        include: { assignments: true },
      })

      if (availableLicense) {
        const assignment = await prisma.licenseAssignment.create({
          data: {
            licenseId: availableLicense.id,
            employeeId: application.employeeId,
            applicationId: id,
            expiresAt: availableLicense.endDate,
          },
        })

        await prisma.software.update({
          where: { id: application.softwareId },
          data: { usedSeats: { increment: 1 } },
        })

        await prisma.application.update({
          where: { id },
          data: { status: ApplicationStatus.ASSIGNED },
        })

        return NextResponse.json({ application, assignment })
      }
    } else {
      await prisma.application.update({
        where: { id },
        data: { status: ApplicationStatus.REJECTED },
      })
    }
  }

  return NextResponse.json(application)
}