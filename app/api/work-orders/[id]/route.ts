import { NextResponse } from 'next/server'
import pool, { initializeDatabase } from '@/lib/db'

export async function GET(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const { id } = paramContext.params
  const result = await pool.query(`
    SELECT wo.*, 
           json_build_object('id', ps.id, 'name', ps.name, 'area', ps.area, 'diameter', ps.diameter, 'material', ps.material) as pipe_section,
           rt.id as rt_id, rt.name as rt_name, rt.leader_name, rt.leader_phone
    FROM work_orders wo
    LEFT JOIN pipe_sections ps ON wo.pipe_section_id = ps.id
    LEFT JOIN repair_teams rt ON wo.dispatch_to = rt.id
    WHERE wo.id = $1
  `, [id])
  
  if (result.rows.length === 0) {
    return NextResponse.json({ error: '工单不存在' }, { status: 404 })
  }
  
  const row = result.rows[0]
  const historyResult = await pool.query(
    'SELECT * FROM work_order_history WHERE work_order_id = $1 ORDER BY created_at ASC',
    [id]
  )
  
  const order = {
    id: row.id,
    serialNumber: row.serial_number,
    status: row.status,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone,
    pipeSectionId: row.pipe_section_id,
    pipeSection: row.pipe_section,
    leakLevel: row.leak_level,
    waterStopArea: row.water_stop_area,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dispatchTo: row.dispatch_to,
    repairTeam: row.rt_id ? {
      id: row.rt_id,
      name: row.rt_name,
      leaderName: row.leader_name,
      leaderPhone: row.leader_phone
    } : null,
    repairResult: row.repair_result,
    repairPhotos: row.repair_photos || [],
    reviewResult: row.review_result,
    reviewComment: row.review_comment,
    mergedFrom: row.merged_from || [],
    history: historyResult.rows.map((h: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      id: h.id,
      workOrderId: h.work_order_id,
      action: h.action,
      operator: h.operator,
      comment: h.comment,
      createdAt: h.created_at,
    })),
  }
  
  return NextResponse.json(order)
}

export async function PUT(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const body = await request.json()
  const { id } = paramContext.params
  
  await pool.query(
    `UPDATE work_orders SET 
     status = COALESCE($1, status),
     updated_at = NOW()
     WHERE id = $2`,
    [body.status, id]
  )
  
  return NextResponse.json({ success: true })
}
