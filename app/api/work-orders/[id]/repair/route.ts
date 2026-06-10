import { NextResponse } from 'next/server'
import { db, type HistoryAction } from '@/lib/db'

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const updatedOrder = await db.workOrder.update({
    where: { id },
    data: {
      status: 'REPAIRED',
      repairResult,
      repairPhotos: repairPhotos || [],
      history: [...order.history, newHistory],
    },
  })

  return NextResponse.json(updatedOrder)
}