import { NextResponse } from 'next/server'
import pool, { initializeDatabase } from '@/lib/db'

export async function GET() {
  await initializeDatabase()
  const result = await pool.query(`
    SELECT wo.*, ps.area, rt.name as team_name
    FROM work_orders wo
    LEFT JOIN pipe_sections ps ON wo.pipe_section_id = ps.id
    LEFT JOIN repair_teams rt ON wo.dispatch_to = rt.id
  `)
  
  const orders = result.rows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    area: row.area,
    leakLevel: row.leak_level,
    teamName: row.team_name,
    repairResult: row.repair_result,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  const stats = {
    byArea: orders.reduce((acc: Record<string, number>, order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const area = order.area || '未知'
      acc[area] = (acc[area] || 0) + 1
      return acc
    }, {}),
    byLeakLevel: orders.reduce((acc: Record<string, number>, order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const level = order.leakLevel
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {}),
    byRepairTeam: orders.reduce((acc: Record<string, number>, order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const team = order.teamName || '未派单'
      acc[team] = (acc[team] || 0) + 1
      return acc
    }, {}),
    byRepairResult: orders.reduce((acc: Record<string, number>, order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = order.repairResult || '未处理'
      acc[result] = (acc[result] || 0) + 1
      return acc
    }, {}),
    byStatus: orders.reduce((acc: Record<string, number>, order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const status = order.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}),
    avgRepairTime: calculateAvgRepairTime(orders),
    totalOrders: orders.length,
    completedOrders: orders.filter((o: any) => o.status === 'COMPLETED').length, // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return NextResponse.json(stats)
}

function calculateAvgRepairTime(orders: any[]): number { // eslint-disable-line @typescript-eslint/no-explicit-any
  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  if (completedOrders.length === 0) return 0

  let totalHours = 0
  completedOrders.forEach((order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (order.createdAt && order.updatedAt) {
      totalHours += (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)
    }
  })

  return Math.round(totalHours / completedOrders.length * 10) / 10
}
