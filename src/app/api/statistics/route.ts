import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const byDepartment = await prisma.application.groupBy({
    by: ['departmentId'],
    _count: { id: true },
  })

  const bySoftware = await prisma.licenseAssignment.groupBy({
    by: ['licenseId'],
    _count: { id: true },
  })

  const byAlertType = await prisma.alert.groupBy({
    by: ['type'],
    _count: { id: true },
  })

  const softwareStats = await prisma.software.findMany({
    select: {
      id: true,
      name: true,
      totalSeats: true,
      usedSeats: true,
    },
  })

  const departmentStats = await prisma.department.findMany({
    include: {
      employees: { where: { status: 'ACTIVE' } },
      applications: { where: { status: 'ASSIGNED' } },
    },
  })

  const departments = await prisma.department.findMany()
  const licenses = await prisma.license.findMany({ include: { software: true } })

  const byDepartmentWithName = byDepartment.map(item => ({
    ...item,
    department: departments.find(d => d.id === item.departmentId),
  }))

  const bySoftwareWithDetails = bySoftware.map(item => ({
    ...item,
    license: licenses.find(l => l.id === item.licenseId),
  }))

  return NextResponse.json({
    byDepartment: byDepartmentWithName,
    bySoftware: bySoftwareWithDetails,
    byAlertType,
    softwareStats,
    departmentStats,
  })
}