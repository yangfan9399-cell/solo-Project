'use server'

import { PrismaClient } from '@prisma/client'
import {
  Role,
  ShipmentStatus,
  DeviationType,
  DeviationLevel,
  DisposalAction,
  ProbeStatus,
} from './types'

const prisma = new PrismaClient()

export interface ShipmentListItem {
  id: string
  batchNumber: string
  status: string
  medicineName: string
  carrierName: string
  deviationType: string
  deviationLevel: string
  currentHandlerName: string | null
}

export interface ShipmentDetail {
  id: string
  batchNumber: string
  quantity: number
  arrivalTime: Date
  status: string
  currentHandlerId: string | null
  createdAt: Date
  updatedAt: Date
  medicine: {
    id: string
    name: string
    category: string
    specification: string
    manufacturer: string
    minTemp: number
    maxTemp: number
  }
  carrier: {
    id: string
    name: string
    contact: string | null
  }
  probe: {
    id: string
    serialNumber: string
    model: string
    status: string
  }
  warehouseClerk: {
    id: string
    name: string
  }
  temperatureReadings: Array<{
    id: string
    timestamp: Date
    temperature: number | null
    isOffline: boolean
  }>
  deviations: Array<{
    id: string
    type: string
    level: string
    description: string | null
    judgment: string | null
    judgedAt: Date | null
    qualityManager?: {
      name: string
    } | null
  }>
  disposals: Array<{
    id: string
    action: string
    comment: string | null
    evidenceUrl: string | null
    handledAt: Date | null
    reviewer?: {
      name: string
    } | null
  }>
  historyLogs: Array<{
    id: string
    action: string
    comment: string | null
    timestamp: Date
    user: {
      name: string
      role: string
    }
  }>
}

export interface RegisterShipmentInput {
  batchNumber: string
  medicineId: string
  quantity: number
  carrierId: string
  probeId: string
  warehouseClerkId: string
}

export interface TemperatureReadingInput {
  timestamp: Date
  temperature: number | null
  isOffline: boolean
}

export interface CollectTemperatureDataInput {
  shipmentId: string
  readings: TemperatureReadingInput[]
  clerkId: string
}

export interface JudgeDeviationInput {
  shipmentId: string
  type: DeviationType
  level: DeviationLevel
  description: string
  judgment: string
  qualityManagerId: string
}

export interface ReviewDisposalInput {
  shipmentId: string
  action: DisposalAction
  comment: string
  evidenceUrl?: string
  reviewerId: string
}

export interface ReviewStats {
  totalShipments: number
  deviationRate: number
  avgProcessingHours: number
  deviationLevels: {
    none: number
    minor: number
    major: number
    critical: number
  }
  deviationTypes: {
    none: number
    temperatureExceeded: number
    probeOffline: number
    batchMixed: number
  }
  disposalActions: {
    pending: number
    release: number
    isolate: number
    return: number
  }
  byMedicineCategory: Array<{
    category: string
    total: number
    withDeviation: number
  }>
  byCarrier: Array<{
    id: string
    name: string
    total: number
    withDeviation: number
    deviationRate: number
    avgProcessingHours: number
    releaseRate: number
  }>
}

export async function getShipments(): Promise<ShipmentListItem[]> {
  const shipments = await prisma.shipment.findMany({
    include: {
      medicine: true,
      carrier: true,
      deviations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      currentHandler: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return shipments.map((s) => ({
    id: s.id,
    batchNumber: s.batchNumber,
    status: s.status,
    medicineName: s.medicine.name,
    carrierName: s.carrier.name,
    deviationType: s.deviations[0]?.type || DeviationType.NONE,
    deviationLevel: s.deviations[0]?.level || DeviationLevel.NONE,
    currentHandlerName: s.currentHandler?.name || null,
  }))
}

export async function getShipmentDetail(id: string): Promise<ShipmentDetail | null> {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      medicine: true,
      carrier: true,
      probe: true,
      warehouseClerk: true,
      temperatureReadings: {
        orderBy: { timestamp: 'asc' },
      },
      deviations: {
        orderBy: { createdAt: 'asc' },
        include: {
          qualityManager: {
            select: { name: true },
          },
        },
      },
      disposals: {
        orderBy: { createdAt: 'asc' },
        include: {
          reviewer: {
            select: { name: true },
          },
        },
      },
      historyLogs: {
        orderBy: { timestamp: 'asc' },
        include: {
          user: {
            select: { name: true, role: true },
          },
        },
      },
    },
  })

  if (!shipment) return null

  return {
    id: shipment.id,
    batchNumber: shipment.batchNumber,
    quantity: shipment.quantity,
    arrivalTime: shipment.arrivalTime,
    status: shipment.status,
    currentHandlerId: shipment.currentHandlerId,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    medicine: shipment.medicine,
    carrier: shipment.carrier,
    probe: shipment.probe,
    warehouseClerk: shipment.warehouseClerk,
    temperatureReadings: shipment.temperatureReadings.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      temperature: r.temperature,
      isOffline: r.isOffline,
    })),
    deviations: shipment.deviations.map((d) => ({
      id: d.id,
      type: d.type,
      level: d.level,
      description: d.description,
      judgment: d.judgment,
      judgedAt: d.judgedAt,
      qualityManager: d.qualityManager,
    })),
    disposals: shipment.disposals.map((d) => ({
      id: d.id,
      action: d.action,
      comment: d.comment,
      evidenceUrl: d.evidenceUrl,
      handledAt: d.handledAt,
      reviewer: d.reviewer,
    })),
    historyLogs: shipment.historyLogs.map((l) => ({
      id: l.id,
      action: l.action,
      comment: l.comment,
      timestamp: l.timestamp,
      user: l.user,
    })),
  }
}

export async function getMedicines() {
  const meds = await prisma.medicine.findMany({
    orderBy: { name: 'asc' },
  })
  return meds.map((m) => ({
    id: m.id,
    name: m.name,
    minTemp: m.minTemp,
    maxTemp: m.maxTemp,
  }))
}

export async function getCarriers() {
  return prisma.carrier.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getProbes() {
  return prisma.probe.findMany({
    orderBy: { serialNumber: 'asc' },
  })
}

export async function registerShipment(input: RegisterShipmentInput) {
  const result = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        batchNumber: input.batchNumber,
        medicineId: input.medicineId,
        quantity: input.quantity,
        carrierId: input.carrierId,
        probeId: input.probeId,
        arrivalTime: new Date(),
        warehouseClerkId: input.warehouseClerkId,
        status: ShipmentStatus.REGISTERED,
        currentHandlerId: input.warehouseClerkId,
      },
    })

    await tx.deviation.create({
      data: {
        shipmentId: shipment.id,
        type: DeviationType.NONE,
        level: DeviationLevel.NONE,
      },
    })

    await tx.disposal.create({
      data: {
        shipmentId: shipment.id,
        action: DisposalAction.PENDING,
      },
    })

    await tx.historyLog.create({
      data: {
        shipmentId: shipment.id,
        action: '到货登记',
        userId: input.warehouseClerkId,
        comment: `批次 ${input.batchNumber} 到货，数量 ${input.quantity} 单位`,
      },
    })

    return shipment
  })

  return result
}

export async function collectTemperatureData(input: CollectTemperatureDataInput) {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: input.shipmentId },
      include: { medicine: true },
    })
    if (!shipment) throw new Error('批次不存在')

    if (shipment.status !== ShipmentStatus.REGISTERED) {
      throw new Error('批次状态不允许采集温度')
    }

    for (const reading of input.readings) {
      await tx.temperatureReading.create({
        data: {
          shipmentId: input.shipmentId,
          probeId: shipment.probeId,
          timestamp: reading.timestamp,
          temperature: reading.temperature,
          isOffline: reading.isOffline,
        },
      })
    }

    const hasOffline = input.readings.some((r) => r.isOffline)
    const comment = hasOffline
      ? '温度数据上传，发现探头离线记录'
      : '温度数据上传，全部正常'

    await tx.shipment.update({
      where: { id: input.shipmentId },
      data: {
        status: ShipmentStatus.TEMPERATURE_COLLECTED,
        currentHandlerId: null,
      },
    })

    const qualityManager = await tx.user.findFirst({
      where: { role: Role.QUALITY_MANAGER },
      orderBy: { createdAt: 'asc' },
    })

    if (qualityManager) {
      await tx.shipment.update({
        where: { id: input.shipmentId },
        data: { currentHandlerId: qualityManager.id },
      })
    }

    await tx.historyLog.create({
      data: {
        shipmentId: input.shipmentId,
        action: '温度采集',
        userId: input.clerkId,
        comment,
      },
    })
  })
}

export async function judgeDeviation(input: JudgeDeviationInput) {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: input.shipmentId },
    })
    if (!shipment) throw new Error('批次不存在')

    if (shipment.status !== ShipmentStatus.TEMPERATURE_COLLECTED) {
      throw new Error('批次状态不允许判定偏差')
    }

    const latestDeviation = await tx.deviation.findFirst({
      where: { shipmentId: input.shipmentId },
      orderBy: { createdAt: 'desc' },
    })

    if (latestDeviation) {
      await tx.deviation.update({
        where: { id: latestDeviation.id },
        data: {
          type: input.type,
          level: input.level,
          description: input.description,
          qualityManagerId: input.qualityManagerId,
          judgment: input.judgment,
          judgedAt: new Date(),
        },
      })
    } else {
      await tx.deviation.create({
        data: {
          shipmentId: input.shipmentId,
          type: input.type,
          level: input.level,
          description: input.description,
          qualityManagerId: input.qualityManagerId,
          judgment: input.judgment,
          judgedAt: new Date(),
        },
      })
    }

    await tx.shipment.update({
      where: { id: input.shipmentId },
      data: {
        status: ShipmentStatus.DEVIATION_JUDGED,
      },
    })

    const reviewer = await tx.user.findFirst({
      where: { role: Role.REVIEWER },
      orderBy: { createdAt: 'asc' },
    })

    if (reviewer) {
      await tx.shipment.update({
        where: { id: input.shipmentId },
        data: { currentHandlerId: reviewer.id },
      })
    }

    await tx.historyLog.create({
      data: {
        shipmentId: input.shipmentId,
        action: '偏差判定',
        userId: input.qualityManagerId,
        comment: input.judgment,
      },
    })
  })
}

export async function reviewDisposal(input: ReviewDisposalInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: input.shipmentId },
      include: { probe: true },
    })
    if (!shipment) throw new Error('批次不存在')

    const disposal = await tx.disposal.findFirst({
      where: { shipmentId: input.shipmentId },
      orderBy: { createdAt: 'desc' },
    })
    if (!disposal) throw new Error('处置记录不存在')

    const isProbeOffline = shipment.probe.status === ProbeStatus.OFFLINE

    const temperatureReadings = await tx.temperatureReading.findMany({
      where: { shipmentId: input.shipmentId },
    })
    const hasOfflineReading = temperatureReadings.some((r) => r.isOffline)

    if ((isProbeOffline || hasOfflineReading) && input.action === DisposalAction.RELEASE) {
      if (!input.evidenceUrl || input.evidenceUrl.trim() === '') {
        throw new Error('探头离线时禁止直接放行，必须上传人工复核证据')
      }
    }

    const now = new Date()

    await tx.disposal.update({
      where: { id: disposal.id },
      data: {
        action: input.action,
        reviewerId: input.reviewerId,
        comment: input.comment,
        evidenceUrl: input.evidenceUrl || null,
        handledAt: now,
      },
    })

    let newStatus: string
    if (input.action === DisposalAction.RELEASE) {
      newStatus = ShipmentStatus.RELEASED
    } else if (input.action === DisposalAction.ISOLATE) {
      newStatus = ShipmentStatus.ISOLATED
    } else {
      newStatus = ShipmentStatus.RETURNED
    }

    await tx.shipment.update({
      where: { id: input.shipmentId },
      data: {
        status: newStatus,
        currentHandlerId: null,
      },
    })

    let actionName = '复核处理'
    if (input.action === DisposalAction.RELEASE) actionName = '放行'
    else if (input.action === DisposalAction.ISOLATE) actionName = '隔离'
    else if (input.action === DisposalAction.RETURN) actionName = '退回'

    await tx.historyLog.create({
      data: {
        shipmentId: input.shipmentId,
        action: actionName,
        userId: input.reviewerId,
        comment: input.comment,
      },
    })
  })
}

export async function hasProbeOffline(shipmentId: string): Promise<boolean> {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      probe: true,
      temperatureReadings: true,
    },
  })
  if (!shipment) return false

  const isProbeOffline = shipment.probe.status === ProbeStatus.OFFLINE
  const hasOfflineReading = shipment.temperatureReadings.some((r) => r.isOffline)

  return isProbeOffline || hasOfflineReading
}

export async function getReviewStats(): Promise<ReviewStats> {
  const shipments = await prisma.shipment.findMany({
    include: {
      medicine: true,
      carrier: true,
      deviations: { orderBy: { createdAt: 'desc' }, take: 1 },
      disposals: { orderBy: { createdAt: 'desc' }, take: 1 },
      historyLogs: { orderBy: { timestamp: 'asc' } },
    },
  })

  const totalShipments = shipments.length
  const deviationShipments = shipments.filter(
    (s) => s.deviations[0]?.type && s.deviations[0].type !== DeviationType.NONE
  )
  const deviationRate = totalShipments > 0 ? (deviationShipments.length / totalShipments) * 100 : 0

  const completedShipments = shipments.filter(
    (s) =>
      s.status === ShipmentStatus.RELEASED ||
      s.status === ShipmentStatus.ISOLATED ||
      s.status === ShipmentStatus.RETURNED
  )

  let totalProcessingHours = 0
  for (const s of completedShipments) {
    if (s.historyLogs.length >= 2) {
      const firstLog = s.historyLogs[0]
      const lastLog = s.historyLogs[s.historyLogs.length - 1]
      const diffMs = lastLog.timestamp.getTime() - firstLog.timestamp.getTime()
      totalProcessingHours += diffMs / (1000 * 60 * 60)
    }
  }
  const avgProcessingHours = completedShipments.length > 0
    ? totalProcessingHours / completedShipments.length
    : 0

  const deviationLevels = {
    none: 0,
    minor: 0,
    major: 0,
    critical: 0,
  }
  const deviationTypes = {
    none: 0,
    temperatureExceeded: 0,
    probeOffline: 0,
    batchMixed: 0,
  }
  for (const s of shipments) {
    if (s.deviations[0]) {
      const level = s.deviations[0].level || DeviationLevel.NONE
      const type = s.deviations[0].type || DeviationType.NONE
      if (level === DeviationLevel.NONE) deviationLevels.none++
      else if (level === DeviationLevel.MINOR) deviationLevels.minor++
      else if (level === DeviationLevel.MAJOR) deviationLevels.major++
      else if (level === DeviationLevel.CRITICAL) deviationLevels.critical++

      if (type === DeviationType.NONE) deviationTypes.none++
      else if (type === DeviationType.TEMPERATURE_EXCEEDED) deviationTypes.temperatureExceeded++
      else if (type === DeviationType.PROBE_OFFLINE) deviationTypes.probeOffline++
      else if (type === DeviationType.BATCH_MIXED) deviationTypes.batchMixed++
    } else {
      deviationLevels.none++
      deviationTypes.none++
    }
  }

  const disposalActions = {
    pending: 0,
    release: 0,
    isolate: 0,
    return: 0,
  }
  for (const s of shipments) {
    if (s.disposals[0]?.action) {
      const action = s.disposals[0].action
      if (action === DisposalAction.PENDING) disposalActions.pending++
      else if (action === DisposalAction.RELEASE) disposalActions.release++
      else if (action === DisposalAction.ISOLATE) disposalActions.isolate++
      else if (action === DisposalAction.RETURN) disposalActions.return++
    } else {
      disposalActions.pending++
    }
  }

  const byMedicineMap = new Map<string, { total: number; withDeviation: number }>()
  for (const s of shipments) {
    const category = s.medicine.category
    if (!byMedicineMap.has(category)) {
      byMedicineMap.set(category, { total: 0, withDeviation: 0 })
    }
    const entry = byMedicineMap.get(category)!
    entry.total++
    if (s.deviations[0]?.type && s.deviations[0].type !== DeviationType.NONE) {
      entry.withDeviation++
    }
  }
  const byMedicineCategory = Array.from(byMedicineMap.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    withDeviation: data.withDeviation,
  }))

  const byCarrierMap = new Map<
    string,
    {
      id: string
      name: string
      total: number
      withDeviation: number
      processingHours: number
      released: number
    }
  >()
  for (const s of shipments) {
    const key = s.carrierId
    if (!byCarrierMap.has(key)) {
      byCarrierMap.set(key, {
        id: s.carrierId,
        name: s.carrier.name,
        total: 0,
        withDeviation: 0,
        processingHours: 0,
        released: 0,
      })
    }
    const entry = byCarrierMap.get(key)!
    entry.total++

    if (s.deviations[0]?.type && s.deviations[0].type !== DeviationType.NONE) {
      entry.withDeviation++
    }

    if (s.status === ShipmentStatus.RELEASED) {
      entry.released++
    }

    if (
      s.status === ShipmentStatus.RELEASED ||
      s.status === ShipmentStatus.ISOLATED ||
      s.status === ShipmentStatus.RETURNED
    ) {
      if (s.historyLogs.length >= 2) {
        const firstLog = s.historyLogs[0]
        const lastLog = s.historyLogs[s.historyLogs.length - 1]
        const diffMs = lastLog.timestamp.getTime() - firstLog.timestamp.getTime()
        entry.processingHours += diffMs / (1000 * 60 * 60)
      }
    }
  }
  const byCarrier = Array.from(byCarrierMap.values()).map((c) => ({
    id: c.id,
    name: c.name,
    total: c.total,
    withDeviation: c.withDeviation,
    deviationRate: c.total > 0 ? (c.withDeviation / c.total) * 100 : 0,
    avgProcessingHours: c.total > 0 ? c.processingHours / c.total : 0,
    releaseRate: c.total > 0 ? (c.released / c.total) * 100 : 0,
  }))

  return {
    totalShipments,
    deviationRate,
    avgProcessingHours,
    deviationLevels,
    deviationTypes,
    disposalActions,
    byMedicineCategory,
    byCarrier,
  }
}
