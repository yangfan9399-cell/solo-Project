import { NextResponse } from 'next/server'
import { db, initSampleData, type HistoryAction } from '@/lib/db'

let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await initSampleData()
    initialized = true
  }
}

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await ensureInitialized()
  const body = await request.json()
  const { repairResult, operator, comment, repairPhotos } = body
  const { id } = paramContext.params

  const order = await db.workOrder.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: '工单不存在' }, { status: 404 })

  const newHistory = {
    id: Math.random().toString(36).substr(2, 9),
    workOrderId: id,
    action: 'REPAIRED' as HistoryAction,
    operator,
    comment,
    createdAt: new Date(),
  }

  const status = repairResult === 'SUSPECTED_DUPLICATE' ? 'REJECTED' : 'REPAIRED'

  const updatedOrder = await db.workOrder.update({
    where: { id },
    data: {
      status,
      repairResult,
      repairPhotos: repairPhotos || order.repairPhotos,
      history: [...order.history, newHistory],
    },
  })

  return NextResponse.json(updatedOrder)
}