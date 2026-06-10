import { NextResponse } from 'next/server'
import { db, type HistoryAction } from '@/lib/db'

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const body = await request.json()
  const { targetOrderId, operator, comment } = body
  const { id } = paramContext.params
  
  const sourceOrder = await db.workOrder.findUnique({ where: { id } })
  if (!sourceOrder) return NextResponse.json({ error: '源工单不存在' }, { status: 404 })

  const targetOrder = await db.workOrder.findUnique({ where: { id: targetOrderId } })
  if (!targetOrder) return NextResponse.json({ error: '目标工单不存在' }, { status: 404 })

  if (sourceOrder.id === targetOrder.id) {
    return NextResponse.json({ error: '不能合并到自己' }, { status: 400 })
  }

  const targetHistory = {
    id: Math.random().toString(36).substr(2, 9),
    workOrderId: targetOrderId,
    action: 'MERGED' as HistoryAction,
    operator,
    comment: comment || `合并工单 ${sourceOrder.serialNumber}`,
    createdAt: new Date(),
  }

  const updatedTarget = await db.workOrder.update({
    where: { id: targetOrderId },
    data: {
      mergedFrom: [...targetOrder.mergedFrom, sourceOrder.serialNumber],
      history: [...targetOrder.history, targetHistory],
    },
  })

  const sourceHistory = {
    id: Math.random().toString(36).substr(2, 9),
    workOrderId: id,
    action: 'REJECTED' as HistoryAction,
    operator,
    comment: `已合并到工单 ${targetOrder.serialNumber}`,
    createdAt: new Date(),
  }

  await db.workOrder.update({
    where: { id },
    data: {
      status: 'REJECTED',
      repairResult: 'SUSPECTED_DUPLICATE',
      history: [...sourceOrder.history, sourceHistory],
    },
  })

  return NextResponse.json(updatedTarget)
}