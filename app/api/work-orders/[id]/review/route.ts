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
  const { reviewResult, operator, comment } = body
  const { id } = paramContext.params

  const order = await db.workOrder.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: '工单不存在' }, { status: 404 })

  const action: HistoryAction = reviewResult === 'APPROVED' ? 'REVIEWED' : 'REJECTED'

  const newHistory = {
    id: Math.random().toString(36).substr(2, 9),
    workOrderId: id,
    action,
    operator,
    comment,
    createdAt: new Date(),
  }

  const status = reviewResult === 'APPROVED' ? 'COMPLETED' : 'REJECTED'

  const updatedOrder = await db.workOrder.update({
    where: { id },
    data: {
      status,
      reviewResult,
      reviewComment: comment,
      history: [...order.history, newHistory],
    },
  })

  return NextResponse.json(updatedOrder)
}