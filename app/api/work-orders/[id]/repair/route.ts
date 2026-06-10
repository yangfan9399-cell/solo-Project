import { NextResponse } from 'next/server'
import pool, { initializeDatabase } from '@/lib/db'

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const body = await request.json()
  const { repairResult, operator, comment, repairPhotos } = body
  const { id } = paramContext.params
  
  await pool.query(
    `UPDATE work_orders SET status = 'REPAIRED', repair_result = $1, repair_photos = $2, updated_at = NOW() WHERE id = $3`,
    [repairResult, JSON.stringify(repairPhotos || []), id]
  )
  
  await pool.query(
    'INSERT INTO work_order_history (id, work_order_id, action, operator, comment) VALUES ($1, $2, $3, $4, $5)',
    [`h${Date.now()}`, id, 'REPAIRED', operator, comment]
  )
  
  return NextResponse.json({ success: true, status: 'REPAIRED' })
}
