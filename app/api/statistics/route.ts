import { NextResponse } from 'next/server'
import { db, type WorkOrder } from '@/lib/db'

export async function GET() {
  const orders = await db.workOrder.findMany()

  const stats = {
    byArea: orders.reduce((acc, order) => {
      const area = order.pipeSection.area
      acc[area] = (acc[area] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byLeakLevel: orders.reduce((acc, order) => {
      const level = order.leakLevel
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byRepairTeam: orders.reduce((acc, order) => {
      const team = order.repairTeam?.name || '未派单'
      acc[team] = (acc[team] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byRepairResult: orders.reduce((acc, order) => {
      const result = order.repairResult || '未处理'
      acc[result] = (acc[result] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byStatus: orders.reduce((acc, order) => {
      const status = order.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    avgRepairTime: calculateAvgRepairTime(orders),
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
  }

  return NextResponse.json(stats)
}

function calculateAvgRepairTime(orders: WorkOrder[]): number {
  const completedOrders = orders.filter(o => o.status === 'COMPLETED' && o.history.length >= 3)
  if (completedOrders.length === 0) return 0

  let totalHours = 0
  completedOrders.forEach(order => {
    const reported = order.history.find(h => h.action === 'REPORTED')?.createdAt
    const reviewed = order.history.find(h => h.action === 'REVIEWED')?.createdAt
    if (reported && reviewed) {
      totalHours += (reviewed.getTime() - reported.getTime()) / (1000 * 60 * 60)
    }
  })

  return Math.round(totalHours / completedOrders.length * 10) / 10
}