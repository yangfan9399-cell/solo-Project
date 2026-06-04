'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { RepairStatus, DeviceType } from '@prisma/client'

export async function getRepairOrders() {
  return prisma.repairOrder.findMany({
    include: {
      submitter: true,
      technician: true,
      inspector: true,
      logs: {
        include: { technician: true },
        orderBy: { createdAt: 'desc' },
      },
      inspections: {
        include: { inspector: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRepairOrder(id: string) {
  return prisma.repairOrder.findUnique({
    where: { id },
    include: {
      submitter: true,
      technician: true,
      inspector: true,
      logs: {
        include: { technician: true },
        orderBy: { createdAt: 'asc' },
      },
      inspections: {
        include: { inspector: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function getTechnicians() {
  return prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
  })
}

export async function getInspectors() {
  return prisma.user.findMany({
    where: { role: 'INSPECTOR' },
  })
}

export async function assignTechnician(orderId: string, technicianId: string) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      technicianId,
      status: RepairStatus.ASSIGNED,
      assignedAt: new Date(),
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function startRepair(orderId: string, technicianId: string) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      status: RepairStatus.IN_PROGRESS,
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function addRepairLog(
  orderId: string,
  technicianId: string,
  action: string,
  description: string,
  partsUsed?: string,
  timeSpent?: number
) {
  await prisma.repairLog.create({
    data: {
      repairOrderId: orderId,
      technicianId,
      action,
      description,
      partsUsed,
      timeSpentMinutes: timeSpent,
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function reportPartsShortage(
  orderId: string,
  blockingReason: string,
  partsNeeded: string,
  estimatedDelay: number
) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      status: RepairStatus.PARTS_SHORTAGE,
      blockingReason,
      partsNeeded,
      estimatedDelay,
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function resolvePartsShortage(orderId: string) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      status: RepairStatus.IN_PROGRESS,
      blockingReason: null,
      partsNeeded: null,
      estimatedDelay: null,
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function reassignTechnician(orderId: string, technicianId: string) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      technicianId,
      status: RepairStatus.IN_PROGRESS,
      blockingReason: null,
      partsNeeded: null,
      estimatedDelay: null,
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function completeRepair(orderId: string, inspectorId: string) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      status: RepairStatus.PENDING_ACCEPTANCE,
      inspectorId,
      completedAt: new Date(),
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function performInspection(
  orderId: string,
  inspectorId: string,
  result: boolean,
  comments: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.inspectionRecord.create({
      data: {
        repairOrderId: orderId,
        inspectorId,
        result,
        comments,
      },
    })

    if (result) {
      await tx.repairOrder.update({
        where: { id: orderId },
        data: {
          status: RepairStatus.ACCEPTED,
          inspectedAt: new Date(),
        },
      })
    } else {
      const order = await tx.repairOrder.findUnique({ where: { id: orderId } })
      await tx.repairOrder.update({
        where: { id: orderId },
        data: {
          status: RepairStatus.REJECTED,
          inspectedAt: new Date(),
          reworkCount: (order?.reworkCount || 0) + 1,
        },
      })
    }
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function archiveRepair(orderId: string) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      status: RepairStatus.ARCHIVED,
      archivedAt: new Date(),
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
  revalidatePath('/review')
}

export async function createRepairOrder(data: {
  title: string
  description: string
  deviceType: DeviceType
  deviceLocation: string
  source: string
  submitterId: string
}) {
  const count = await prisma.repairOrder.count()
  const orderNumber = `REP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const order = await prisma.repairOrder.create({
    data: {
      ...data,
      orderNumber,
      images: [],
    },
  })
  revalidatePath('/')
  return order
}

export async function restartRepair(orderId: string) {
  await prisma.repairOrder.update({
    where: { id: orderId },
    data: {
      status: RepairStatus.IN_PROGRESS,
    },
  })
  revalidatePath('/')
  revalidatePath(`/repair/${orderId}`)
}

export async function getReviewStats() {
  const orders = await prisma.repairOrder.findMany({
    include: {
      logs: true,
      inspections: true,
    },
  })

  const byDeviceType: Record<string, { total: number; completed: number; avgTime: number }> = {}
  const byResult: Record<string, number> = {}
  let totalRework = 0
  let totalProcessingTime = 0
  let completedCount = 0

  for (const order of orders) {
    const type = order.deviceType
    
    if (!byDeviceType[type]) {
      byDeviceType[type] = { total: 0, completed: 0, avgTime: 0 }
    }
    byDeviceType[type].total++

    if (order.status === RepairStatus.ACCEPTED || order.status === RepairStatus.ARCHIVED) {
      byDeviceType[type].completed++
      
      if (order.completedAt && order.submittedAt) {
        const time = (order.completedAt.getTime() - order.submittedAt.getTime()) / (1000 * 60 * 60)
        totalProcessingTime += time
        completedCount++
      }
    }

    totalRework += order.reworkCount || 0
  }

  for (const key of Object.keys(byDeviceType)) {
    byDeviceType[key].avgTime = completedCount > 0 ? totalProcessingTime / completedCount : 0
  }

  byResult['已验收'] = orders.filter(o => o.status === RepairStatus.ACCEPTED || o.status === RepairStatus.ARCHIVED).length
  byResult['验收不通过'] = orders.filter(o => o.status === RepairStatus.REJECTED).length
  byResult['处理中'] = orders.filter(o => 
    [RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS, RepairStatus.PARTS_SHORTAGE, RepairStatus.PENDING_ACCEPTANCE].includes(o.status)
  ).length
  byResult['待派工'] = orders.filter(o => o.status === RepairStatus.SUBMITTED).length

  return {
    byDeviceType,
    byResult,
    totalRework,
    avgProcessingTime: completedCount > 0 ? totalProcessingTime / completedCount : 0,
    totalOrders: orders.length,
  }
}
