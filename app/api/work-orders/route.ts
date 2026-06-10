import { NextResponse } from 'next/server'
import pool, { initializeDatabase } from '@/lib/db'

export async function GET() {
  await initializeDatabase()
  const result = await pool.query(`
    SELECT wo.*, 
           json_build_object('id', ps.id, 'name', ps.name, 'area', ps.area, 'diameter', ps.diameter, 'material', ps.material) as pipe_section,
           rt.id as rt_id, rt.name as rt_name, rt.leader_name, rt.leader_phone
    FROM work_orders wo
    LEFT JOIN pipe_sections ps ON wo.pipe_section_id = ps.id
    LEFT JOIN repair_teams rt ON wo.dispatch_to = rt.id
    ORDER BY wo.created_at DESC
  `)
  
  const orders = result.rows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
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
  }))
  
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  await initializeDatabase()
  const body = await request.json()
  const nextSeq = await pool.query('SELECT COUNT(*) FROM work_orders')
  const seq = parseInt(nextSeq.rows[0].count) + 1
  const date = new Date()
  const year = date.getFullYear().toString().slice(2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const serialNumber = `LS${year}${month}${day}${String(seq).padStart(4, '0')}`
  const id = `wo${Date.now()}`
  
  const result = await pool.query(
    `INSERT INTO work_orders (id, serial_number, status, reporter_name, reporter_phone, pipe_section_id, leak_level, water_stop_area, description, repair_photos, merged_from)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [id, serialNumber, 'PENDING', body.reporterName, body.reporterPhone, body.pipeSectionId, body.leakLevel, body.waterStopArea, body.description, '[]', '[]']
  )
  
  await pool.query(
    'INSERT INTO work_order_history (id, work_order_id, action, operator) VALUES ($1, $2, $3, $4)',
    [`h${Date.now()}`, id, 'REPORTED', body.reporterName]
  )
  
  return NextResponse.json({ id, serialNumber, status: 'PENDING' })
}
