import { NextResponse } from 'next/server'
import { db, type HistoryAction } from '@/lib/db'

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const body = await request.json()
  const { repairTeamId, operator, comment } = body
  const { id } = paramContext.params
  
  const repairTeam = await db.repairTeam.findUnique({ where: { id: repairTeamId } })
  if (!repairTeam) return NextResponse.json({ error: '抢修队不存在' }, { status: 400 })

  const order = await db.workOrder.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: '工单不存在' }, { status: 404 })

  const newHistory = {
    id: Math.random().toString(36).substr(2, 9),
    workOrderId: id,
    action: 'DISPATCHED' as HistoryAction,
    operator,
    comment,
    createdAt: new Date(),
  }

  const updatedOrder = await db.workOrder.update({
    where: { id },
    data: {
      status: 'DISPATCHED',
      dispatchTo: repairTeamId,
      repairTeam,
      history: [...order.history, newHistory],
    },
  })

  return NextResponse.json(updatedOrder)
}