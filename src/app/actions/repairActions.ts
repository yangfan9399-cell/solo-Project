'use server'

import prisma from '@/lib/prisma'
import { RepairStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createRepairOrder(data: {
  title: string
  description: string
  roomId: string
  categoryId: string
  creatorId: string
  priority?: number
}) {
  try {
    const order = await prisma.repairOrder.create({
      data: {
        ...data,
        status: RepairStatus.PENDING,
        priority: data.priority || 1,
      },
      include: {
        room: { include: { building: true } },
        category: true,
        creator: true,
      },
    })

    await prisma.repairStatusLog.create({
      data: {
        repairOrderId: order.id,
        status: RepairStatus.PENDING,
        operatorId: data.creatorId,
        remark: '提交报修申请',
      },
    })

    revalidatePath('/repairs')
    return { success: true, data: order }
  } catch (error) {
    console.error('创建报修单失败:', error)
    return { success: false, error: '创建报修单失败' }
  }
}

export async function assignRepairOrder(orderId: string, workerId: string, operatorId: string) {
  try {
    const order = await prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        assignedWorkerId: workerId,
        status: RepairStatus.ASSIGNED,
      },
      include: {
        assignedWorker: true,
      },
    })

    await prisma.repairStatusLog.create({
      data: {
        repairOrderId: orderId,
        status: RepairStatus.ASSIGNED,
        operatorId,
        remark: `已派单给 ${order.assignedWorker?.name}`,
      },
    })

    revalidatePath('/repairs')
    return { success: true, data: order }
  } catch (error) {
    console.error('派单失败:', error)
    return { success: false, error: '派单失败' }
  }
}

export async function startRepairOrder(orderId: string, operatorId: string) {
  try {
    const order = await prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status: RepairStatus.IN_PROGRESS,
        startTime: new Date(),
      },
    })

    await prisma.repairStatusLog.create({
      data: {
        repairOrderId: orderId,
        status: RepairStatus.IN_PROGRESS,
        operatorId,
        remark: '开始维修',
      },
    })

    revalidatePath('/repairs')
    return { success: true, data: order }
  } catch (error) {
    console.error('开始维修失败:', error)
    return { success: false, error: '开始维修失败' }
  }
}

export async function completeRepairOrder(
  orderId: string,
  operatorId: string,
  actualCost?: number,
  remark?: string
) {
  try {
    const order = await prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status: RepairStatus.COMPLETED,
        completedTime: new Date(),
        actualCost: actualCost || null,
      },
    })

    await prisma.repairStatusLog.create({
      data: {
        repairOrderId: orderId,
        status: RepairStatus.COMPLETED,
        operatorId,
        remark: remark || '维修完成',
      },
    })

    revalidatePath('/repairs')
    return { success: true, data: order }
  } catch (error) {
    console.error('完成维修失败:', error)
    return { success: false, error: '完成维修失败' }
  }
}

export async function cancelRepairOrder(orderId: string, operatorId: string, remark?: string) {
  try {
    const order = await prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status: RepairStatus.CANCELLED,
      },
    })

    await prisma.repairStatusLog.create({
      data: {
        repairOrderId: orderId,
        status: RepairStatus.CANCELLED,
        operatorId,
        remark: remark || '取消报修',
      },
    })

    revalidatePath('/repairs')
    return { success: true, data: order }
  } catch (error) {
    console.error('取消报修失败:', error)
    return { success: false, error: '取消报修失败' }
  }
}

export async function getRepairOrders(filters?: {
  status?: RepairStatus
  roomId?: string
  buildingId?: string
  assignedWorkerId?: string
  creatorId?: string
}) {
  try {
    const where: any = {}
    if (filters?.status) where.status = filters.status
    if (filters?.roomId) where.roomId = filters.roomId
    if (filters?.buildingId) where.room = { buildingId: filters.buildingId }
    if (filters?.assignedWorkerId) where.assignedWorkerId = filters.assignedWorkerId
    if (filters?.creatorId) where.creatorId = filters.creatorId

    const orders = await prisma.repairOrder.findMany({
      where,
      include: {
        room: { include: { building: true } },
        category: true,
        creator: true,
        assignedWorker: true,
        statusLogs: { include: { operator: true }, orderBy: { createdAt: 'desc' } },
        satisfactionSurvey: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: orders }
  } catch (error) {
    console.error('获取报修单失败:', error)
    return { success: false, error: '获取报修单失败' }
  }
}

export async function getRepairOrderDetail(id: string) {
  try {
    const order = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        room: { include: { building: true } },
        category: true,
        creator: true,
        assignedWorker: true,
        repairItems: true,
        statusLogs: { include: { operator: true }, orderBy: { createdAt: 'asc' } },
        satisfactionSurvey: true,
      },
    })
    return { success: true, data: order }
  } catch (error) {
    console.error('获取报修单详情失败:', error)
    return { success: false, error: '获取报修单详情失败' }
  }
}
