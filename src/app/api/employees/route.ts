import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const employees = await prisma.employee.findMany({
    include: { department: true },
    orderBy: { departmentId: 'asc' },
  })
  return NextResponse.json(employees)
}