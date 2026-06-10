import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const alerts = await prisma.alert.findMany({
    where: { resolved: false },
    orderBy: { severity: 'desc' },
  })
  return NextResponse.json(alerts)
}

export async function PUT(request: Request) {
  const { id, resolved } = await request.json()
  const alert = await prisma.alert.update({
    where: { id },
    data: { resolved },
  })
  return NextResponse.json(alert)
}