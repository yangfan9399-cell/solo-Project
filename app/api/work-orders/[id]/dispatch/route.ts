import { NextResponse } from 'next/server'
import { prisma, initializeDatabase, type HistoryAction } from '@/lib/db'
import pool from '@/lib/db'

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const body = await request.json()
  const { repairTeamId, operator, comment } = body
  const { id } = paramContext.params
  
  const repairTeam = await prisma.repairTeam.findUnique({ where: { id: repairTeamId } })
  if (!repairTeam) return NextResponse.json({ error: '抢修队不存在' }, { status: 400 })
  
  await prisma.workOrder.update({
    where: { id },
    data: {
      status: 'DISPATCHED',
      dispatchTo: repairTeamId,
    },
  })
  
  await pool.query(
    'INSERT INTO work_order_history (id, work_order_id, action, operator, comment) VALUES ($1, $2, $3, $4, $5)',
    [`h${Date.now()}`, id, 'DISPATCHED', operator, comment]
  )
  
  return NextResponse.json({ success: true, status: 'DISPATCHED' })
}
