import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const orders = await db.workOrder.findMany()
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  const body = await request.json()
  const newOrder = await db.workOrder.create({
    data: {
      reporterName: body.reporterName,
      reporterPhone: body.reporterPhone,
      pipeSectionId: body.pipeSectionId,
      pipeSection: body.pipeSection,
      leakLevel: body.leakLevel,
      waterStopArea: body.waterStopArea,
      description: body.description,
      status: 'PENDING',
      repairPhotos: [],
      mergedFrom: [],
    },
  })
  return NextResponse.json(newOrder)
}