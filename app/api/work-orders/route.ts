import { NextResponse } from 'next/server'
import { db, initSampleData } from '@/lib/db'

let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await initSampleData()
    initialized = true
  }
}

export async function GET() {
  await ensureInitialized()
  const orders = await db.workOrder.findMany()
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  await ensureInitialized()
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