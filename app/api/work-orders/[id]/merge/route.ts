import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db'
import pool from '@/lib/db'

export async function POST(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const body = await request.json()
  const { targetOrderId, operator, comment } = body
  const { id } = paramContext.params
  
  const sourceResult = await pool.query('SELECT * FROM work_orders WHERE id = $1', [id])
  if (sourceResult.rows.length === 0) {
    return NextResponse.json({ error: '源工单不存在' }, { status: 404 })
  }
  
  const targetResult = await pool.query('SELECT * FROM work_orders WHERE id = $1', [targetOrderId])
  if (targetResult.rows.length === 0) {
    return NextResponse.json({ error: '目标工单不存在' }, { status: 404 })
  }
  
  if (id === targetOrderId) {
    return NextResponse.json({ error: '不能合并到自己' }, { status: 400 })
  }
  
  const sourceOrder = sourceResult.rows[0]
  const targetOrder = targetResult.rows[0]
  
  await pool.query(
    `UPDATE work_orders SET merged_from = array_cat(merged_from, $1) WHERE id = $2`,
    [JSON.stringify([sourceOrder.serial_number]), targetOrderId]
  )
  
  await pool.query(
    'INSERT INTO work_order_history (id, work_order_id, action, operator, comment) VALUES ($1, $2, $3, $4, $5)',
    [`h${Date.now()}`, targetOrderId, 'MERGED', operator, comment || `合并工单 ${sourceOrder.serial_number}`]
  )
  
  await pool.query(
    `UPDATE work_orders SET status = 'REJECTED', repair_result = 'SUSPECTED_DUPLICATE', updated_at = NOW() WHERE id = $1`,
    [id]
  )
  
  await pool.query(
    'INSERT INTO work_order_history (id, work_order_id, action, operator, comment) VALUES ($1, $2, $3, $4, $5)',
    [`h${Date.now()}`, id, 'REJECTED', operator, `已合并到工单 ${targetOrder.serial_number}`]
  )
  
  return NextResponse.json({ success: true, mergedTo: targetOrder.serial_number })
}
