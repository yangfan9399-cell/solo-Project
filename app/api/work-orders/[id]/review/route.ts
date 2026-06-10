import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db'
import pool from '@/lib/db'

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const body = await request.json()
  const { reviewResult, operator, comment } = body
  const { id } = paramContext.params
  
  const newStatus = reviewResult === 'APPROVED' ? 'COMPLETED' : 'REJECTED'
  const action = reviewResult === 'APPROVED' ? 'REVIEWED' : 'REJECTED'
  
  await pool.query(
    `UPDATE work_orders SET status = $1, review_result = $2, review_comment = $3, updated_at = NOW() WHERE id = $4`,
    [newStatus, reviewResult, comment, id]
  )
  
  await pool.query(
    'INSERT INTO work_order_history (id, work_order_id, action, operator, comment) VALUES ($1, $2, $3, $4, $5)',
    [`h${Date.now()}`, id, action, operator, comment]
  )
  
  return NextResponse.json({ success: true, status: newStatus })
}
