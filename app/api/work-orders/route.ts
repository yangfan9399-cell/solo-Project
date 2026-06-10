import { NextResponse } from 'next/server'
import { prisma, initializeDatabase } from '@/lib/db'

export async function GET() {
  await initializeDatabase()
  const orders = await prisma.workOrder.findMany()
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  await initializeDatabase()
  const body = await request.json()
  const newOrder = await prisma.workOrder.create({
    data: {
      reporterName: body.reporterName,
      reporterPhone: body.reporterPhone,
      pipeSectionId: body.pipeSectionId,
      leakLevel: body.leakLevel,
      waterStopArea: body.waterStopArea,
      description: body.description,
    },
  })
  return NextResponse.json(newOrder)
}
