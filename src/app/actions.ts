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

export async function getSubmitters() {
  return prisma.user.findMany({
    where: { role: 'SUBMITTER' },
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

  type DeviceStats = {
    total: number
    completed: number
    totalProcessingHours: number
    completedWithTime: number
    avgTime: number
    reworkCount: number
    results: {
      accepted: number
      rejected: number
      inProgress: number
      submitted: number
    }
    orderIds: string[]
  }

  const byDeviceType: Record<string, DeviceStats> = {}
  let globalRework = 0
  let globalProcessingHours = 0
  let globalCompletedWithTime = 0

  const isCompleted = (status: RepairStatus) =>
    status === RepairStatus.ACCEPTED || status === RepairStatus.ARCHIVED
  const isInProgress = (status: RepairStatus) =>
    [RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS, RepairStatus.PARTS_SHORTAGE, RepairStatus.PENDING_ACCEPTANCE].includes(status)

  for (const order of orders) {
    const type = order.deviceType

    if (!byDeviceType[type]) {
      byDeviceType[type] = {
        total: 0,
        completed: 0,
        totalProcessingHours: 0,
        completedWithTime: 0,
        avgTime: 0,
        reworkCount: 0,
        results: { accepted: 0, rejected: 0, inProgress: 0, submitted: 0 },
        orderIds: [],
      }
    }

    const ds = byDeviceType[type]
    ds.total++
    ds.orderIds.push(order.id)

    if (isCompleted(order.status)) {
      ds.completed++
      ds.results.accepted++

      if (order.completedAt && order.submittedAt) {
        const hours = (order.completedAt.getTime() - order.submittedAt.getTime()) / (1000 * 60 * 60)
        ds.totalProcessingHours += hours
        ds.completedWithTime++
        globalProcessingHours += hours
        globalCompletedWithTime++
      }
    } else if (order.status === RepairStatus.REJECTED) {
      ds.results.rejected++
    } else if (isInProgress(order.status)) {
      ds.results.inProgress++
    } else if (order.status === RepairStatus.SUBMITTED) {
      ds.results.submitted++
    }

    ds.reworkCount += order.reworkCount || 0
    globalRework += order.reworkCount || 0
  }

  for (const key of Object.keys(byDeviceType)) {
    const ds = byDeviceType[key]
    ds.avgTime = ds.completedWithTime > 0 ? ds.totalProcessingHours / ds.completedWithTime : 0
  }

  const byResult = {
    accepted: orders.filter(o => isCompleted(o.status)).length,
    rejected: orders.filter(o => o.status === RepairStatus.REJECTED).length,
    inProgress: orders.filter(o => isInProgress(o.status)).length,
    submitted: orders.filter(o => o.status === RepairStatus.SUBMITTED).length,
  }

  return {
    byDeviceType,
    byResult,
    totalRework: globalRework,
    avgProcessingTime: globalCompletedWithTime > 0 ? globalProcessingHours / globalCompletedWithTime : 0,
    totalOrders: orders.length,
  }
}
