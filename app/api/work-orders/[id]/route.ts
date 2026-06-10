import { NextResponse } from 'next/server'
import { db, initSampleData } from '@/lib/db'

let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await initSampleData()
    initialized = true
  }
}

export async function GET(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await ensureInitialized()
  const { id } = paramContext.params
  const order = await db.workOrder.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: '工单不存在' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PUT(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await ensureInitialized()
  const body = await request.json()
  const { id } = paramContext.params
  const order = await db.workOrder.update({
    where: { id },
    data: body,
  })
  if (!order) return NextResponse.json({ error: '工单不存在' }, { status: 404 })
  return NextResponse.json(order)
}