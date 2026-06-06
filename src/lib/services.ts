'use server'

import { getStore, generateId, type Shipment, type Deviation, type Disposal, type HistoryLog, type TemperatureReading } from './store'
import {
  Role,
  ShipmentStatus,
  DeviationType,
  DeviationLevel,
  DisposalAction,
} from './types'

export interface ShipmentDetail extends Shipment {
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
  currentHandler: {
    id: string
    name: string
    role: string
  } | null
  deviations: Deviation[]
  disposals: Disposal[]
  historyLogs: (HistoryLog & { user: { name: string; role: string } })[]
  temperatureReadings: TemperatureReading[]
}

export interface ShipmentListItem extends Shipment {
  medicineName: string
  carrierName: string
  deviationType: string
  deviationLevel: string
  currentHandlerName: string | null
}

export async function getShipments(): Promise<ShipmentListItem[]> {
  const store = getStore()

  return store.shipments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((shipment) => {
      const medicine = store.medicines.find((m) => m.id === shipment.medicineId)
      const carrier = store.carriers.find((c) => c.id === shipment.carrierId)
      const deviation = store.deviations.find((d) => d.shipmentId === shipment.id)
      const currentHandler = shipment.currentHandlerId
        ? store.users.find((u) => u.id === shipment.currentHandlerId)
        : null

      return {
        ...shipment,
        medicineName: medicine?.name || '未知药品',
        carrierName: carrier?.name || '未知承运商',
        deviationType: deviation?.type || DeviationType.NONE,
        deviationLevel: deviation?.level || DeviationLevel.NONE,
        currentHandlerName: currentHandler?.name || null,
      }
    })
}

export async function getShipmentDetail(id: string): Promise<ShipmentDetail | null> {
  const store = getStore()

  const shipment = store.shipments.find((s) => s.id === id)
  if (!shipment) return null

  const medicine = store.medicines.find((m) => m.id === shipment.medicineId)
  const carrier = store.carriers.find((c) => c.id === shipment.carrierId)
  const probe = store.probes.find((p) => p.id === shipment.probeId)
  const warehouseClerk = store.users.find((u) => u.id === shipment.warehouseClerkId)
  const currentHandler = shipment.currentHandlerId
    ? store.users.find((u) => u.id === shipment.currentHandlerId)
    : null

  const deviations = store.deviations.filter((d) => d.shipmentId === shipment.id)
  const disposals = store.disposals.filter((d) => d.shipmentId === shipment.id)
  const temperatureReadings = store.temperatureReadings
    .filter((r) => r.shipmentId === shipment.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const historyLogs = store.historyLogs
    .filter((l) => l.shipmentId === shipment.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((log) => {
      const user = store.users.find((u) => u.id === log.userId)
      return {
        ...log,
        user: {
          name: user?.name || '未知用户',
          role: user?.role || 'UNKNOWN',
        },
      }
    })

  return {
    ...shipment,
    medicine: medicine || { id: '', name: '未知', category: '', specification: '', manufacturer: '', minTemp: 0, maxTemp: 0 },
    carrier: carrier || { id: '', name: '未知', contact: null },
    probe: probe || { id: '', serialNumber: '未知', model: '', status: 'UNKNOWN' },
    warehouseClerk: warehouseClerk || { id: '', name: '未知' },
    currentHandler: currentHandler ? { id: currentHandler.id, name: currentHandler.name, role: currentHandler.role } : null,
    deviations,
    disposals,
    historyLogs,
    temperatureReadings,
  }
}

export async function getUsersByRole(role: Role) {
  const store = getStore()
  return store.users.filter((u) => u.role === role)
}

export async function getMedicines() {
  const store = getStore()
  return store.medicines
}

export async function getCarriers() {
  const store = getStore()
  return store.carriers
}

export async function getProbes() {
  const store = getStore()
  return store.probes
}

export async function getUsers() {
  const store = getStore()
  return store.users
}

export interface RegisterShipmentInput {
  batchNumber: string
  medicineId: string
  quantity: number
  carrierId: string
  probeId: string
  warehouseClerkId: string
}

export async function registerShipment(input: RegisterShipmentInput): Promise<Shipment> {
  const store = getStore()

  const now = new Date()
  const shipment: Shipment = {
    id: generateId('shipment'),
    batchNumber: input.batchNumber,
    medicineId: input.medicineId,
    quantity: input.quantity,
    carrierId: input.carrierId,
    probeId: input.probeId,
    arrivalTime: now,
    warehouseClerkId: input.warehouseClerkId,
    status: ShipmentStatus.REGISTERED,
    currentHandlerId: input.warehouseClerkId,
    createdAt: now,
    updatedAt: now,
  }

  store.shipments.push(shipment)

  const deviation: Deviation = {
    id: generateId('deviation'),
    shipmentId: shipment.id,
    type: DeviationType.NONE,
    level: DeviationLevel.NONE,
    description: null,
    qualityManagerId: null,
    judgment: null,
    judgedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  store.deviations.push(deviation)

  const disposal: Disposal = {
    id: generateId('disposal'),
    shipmentId: shipment.id,
    action: DisposalAction.PENDING,
    reviewerId: null,
    comment: null,
    evidenceUrl: null,
    handledAt: null,
    createdAt: now,
    updatedAt: now,
  }
  store.disposals.push(disposal)

  const log: HistoryLog = {
    id: generateId('log'),
    shipmentId: shipment.id,
    action: '到货登记',
    userId: input.warehouseClerkId,
    comment: `批次 ${input.batchNumber} 到货登记，数量 ${input.quantity}`,
    timestamp: now,
  }
  store.historyLogs.push(log)

  return shipment
}

export interface CollectTemperatureInput {
  shipmentId: string
  readings: Array<{
    timestamp: Date
    temperature: number | null
    isOffline: boolean
  }>
  clerkId: string
}

export async function collectTemperatureData(input: CollectTemperatureInput): Promise<void> {
  const store = getStore()

  const shipment = store.shipments.find((s) => s.id === input.shipmentId)
  if (!shipment) throw new Error('批次不存在')

  const probe = store.probes.find((p) => p.id === shipment.probeId)
  if (!probe) throw new Error('探头不存在')

  for (const reading of input.readings) {
    store.temperatureReadings.push({
      id: generateId('reading'),
      shipmentId: input.shipmentId,
      probeId: shipment.probeId,
      timestamp: reading.timestamp,
      temperature: reading.temperature,
      isOffline: reading.isOffline,
      createdAt: new Date(),
    })
  }

  shipment.status = ShipmentStatus.TEMPERATURE_COLLECTED
  shipment.updatedAt = new Date()

  const qaUsers = store.users.filter((u) => u.role === Role.QUALITY_MANAGER)
  if (qaUsers.length > 0) {
    shipment.currentHandlerId = qaUsers[0].id
  }

  const log: HistoryLog = {
    id: generateId('log'),
    shipmentId: input.shipmentId,
    action: '温度采集',
    userId: input.clerkId,
    comment: `温度数据上传完成，共 ${input.readings.length} 条记录`,
    timestamp: new Date(),
  }
  store.historyLogs.push(log)
}

export interface JudgeDeviationInput {
  shipmentId: string
  type: DeviationType
  level: DeviationLevel
  description: string
  judgment: string
  qualityManagerId: string
}

export async function judgeDeviation(input: JudgeDeviationInput): Promise<void> {
  const store = getStore()

  const shipment = store.shipments.find((s) => s.id === input.shipmentId)
  if (!shipment) throw new Error('批次不存在')

  const deviation = store.deviations.find((d) => d.shipmentId === input.shipmentId)
  if (!deviation) throw new Error('偏差记录不存在')

  const now = new Date()
  deviation.type = input.type
  deviation.level = input.level
  deviation.description = input.description
  deviation.qualityManagerId = input.qualityManagerId
  deviation.judgment = input.judgment
  deviation.judgedAt = now
  deviation.updatedAt = now

  shipment.status = ShipmentStatus.DEVIATION_JUDGED
  shipment.updatedAt = now

  const reviewerUsers = store.users.filter((u) => u.role === Role.REVIEWER)
  if (reviewerUsers.length > 0) {
    shipment.currentHandlerId = reviewerUsers[0].id
  }

  const log: HistoryLog = {
    id: generateId('log'),
    shipmentId: input.shipmentId,
    action: '偏差判定',
    userId: input.qualityManagerId,
    comment: `偏差判定：${input.type} - ${input.level}`,
    timestamp: now,
  }
  store.historyLogs.push(log)
}

export interface ReviewDisposalInput {
  shipmentId: string
  action: DisposalAction
  comment: string
  evidenceUrl?: string
  reviewerId: string
}

export async function reviewDisposal(input: ReviewDisposalInput): Promise<void> {
  const store = getStore()

  const shipment = store.shipments.find((s) => s.id === input.shipmentId)
  if (!shipment) throw new Error('批次不存在')

  const disposal = store.disposals.find((d) => d.shipmentId === input.shipmentId)
  if (!disposal) throw new Error('处置记录不存在')

  const temperatureReadings = store.temperatureReadings.filter((r) => r.shipmentId === input.shipmentId)
  const hasOfflineReading = temperatureReadings.some((r) => r.isOffline)
  if (hasOfflineReading && input.action === DisposalAction.RELEASE) {
    if (!input.evidenceUrl || input.evidenceUrl.trim() === '') {
      throw new Error('探头离线时禁止直接放行，必须上传人工复核证据')
    }
  }

  const now = new Date()
  disposal.action = input.action
  disposal.reviewerId = input.reviewerId
  disposal.comment = input.comment
  disposal.evidenceUrl = input.evidenceUrl || null
  disposal.handledAt = now
  disposal.updatedAt = now

  if (input.action === DisposalAction.RELEASE) {
    shipment.status = ShipmentStatus.RELEASED
  } else if (input.action === DisposalAction.ISOLATE) {
    shipment.status = ShipmentStatus.ISOLATED
  } else if (input.action === DisposalAction.RETURN) {
    shipment.status = ShipmentStatus.RETURNED
  }

  shipment.currentHandlerId = null
  shipment.updatedAt = now

  let actionName = '复核处理'
  if (input.action === DisposalAction.RELEASE) actionName = '放行'
  else if (input.action === DisposalAction.ISOLATE) actionName = '隔离'
  else if (input.action === DisposalAction.RETURN) actionName = '退回'

  const log: HistoryLog = {
    id: generateId('log'),
    shipmentId: input.shipmentId,
    action: actionName,
    userId: input.reviewerId,
    comment: input.comment,
    timestamp: now,
  }
  store.historyLogs.push(log)
}

export async function hasProbeOffline(shipmentId: string): Promise<boolean> {
  const store = getStore()
  const readings = store.temperatureReadings.filter((r) => r.shipmentId === shipmentId)
  return readings.some((r) => r.isOffline)
}

export interface CarrierStat {
  id: string
  name: string
  total: number
  withDeviation: number
  deviationRate: number
  avgProcessingHours: number
  releaseRate: number
}

export interface MedicineCategoryStat {
  category: string
  total: number
  withDeviation: number
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
  byMedicineCategory: MedicineCategoryStat[]
  byCarrier: CarrierStat[]
}

export async function getReviewStats(): Promise<ReviewStats> {
  const store = getStore()

  const totalShipments = store.shipments.length
  const deviationLevels = { none: 0, minor: 0, major: 0, critical: 0 }
  const deviationTypes = { none: 0, temperatureExceeded: 0, probeOffline: 0, batchMixed: 0 }
  const disposalActions = { pending: 0, release: 0, isolate: 0, return: 0 }

  const categoryMap = new Map<string, { total: number; withDeviation: number }>()
  const carrierMap = new Map<string, {
    id: string
    name: string
    total: number
    withDeviation: number
    totalProcessingMs: number
    processedCount: number
    releasedCount: number
  }>()

  let totalProcessingMs = 0
  let processedCount = 0

  for (const shipment of store.shipments) {
    const medicine = store.medicines.find((m) => m.id === shipment.medicineId)
    const carrier = store.carriers.find((c) => c.id === shipment.carrierId)
    const deviation = store.deviations.find((d) => d.shipmentId === shipment.id)
    const disposal = store.disposals.find((d) => d.shipmentId === shipment.id)

    const category = medicine?.category || '未分类'
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { total: 0, withDeviation: 0 })
    }
    const catStat = categoryMap.get(category)!
    catStat.total++
    if (deviation && deviation.type !== DeviationType.NONE) {
      catStat.withDeviation++
    }

    const carrierId = carrier?.id || 'unknown'
    const carrierName = carrier?.name || '未知'
    if (!carrierMap.has(carrierId)) {
      carrierMap.set(carrierId, {
        id: carrierId,
        name: carrierName,
        total: 0,
        withDeviation: 0,
        totalProcessingMs: 0,
        processedCount: 0,
        releasedCount: 0,
      })
    }
    const carStat = carrierMap.get(carrierId)!
    carStat.total++
    if (deviation && deviation.type !== DeviationType.NONE) {
      carStat.withDeviation++
    }

    const level = deviation?.level || DeviationLevel.NONE
    switch (level) {
      case DeviationLevel.NONE:
        deviationLevels.none++
        break
      case DeviationLevel.MINOR:
        deviationLevels.minor++
        break
      case DeviationLevel.MAJOR:
        deviationLevels.major++
        break
      case DeviationLevel.CRITICAL:
        deviationLevels.critical++
        break
    }

    const type = deviation?.type || DeviationType.NONE
    switch (type) {
      case DeviationType.NONE:
        deviationTypes.none++
        break
      case DeviationType.TEMPERATURE_EXCEEDED:
        deviationTypes.temperatureExceeded++
        break
      case DeviationType.PROBE_OFFLINE:
        deviationTypes.probeOffline++
        break
      case DeviationType.BATCH_MIXED:
        deviationTypes.batchMixed++
        break
    }

    const action = disposal?.action || DisposalAction.PENDING
    switch (action) {
      case DisposalAction.PENDING:
        disposalActions.pending++
        break
      case DisposalAction.RELEASE:
        disposalActions.release++
        carStat.releasedCount++
        break
      case DisposalAction.ISOLATE:
        disposalActions.isolate++
        break
      case DisposalAction.RETURN:
        disposalActions.return++
        break
    }

    if (disposal?.handledAt) {
      const processingMs = new Date(disposal.handledAt).getTime() - new Date(shipment.arrivalTime).getTime()
      totalProcessingMs += processingMs
      processedCount++
      carStat.totalProcessingMs += processingMs
      carStat.processedCount++
    }
  }

  const avgProcessingHours = processedCount > 0 ? totalProcessingMs / processedCount / (1000 * 60 * 60) : 0
  const deviationRate = totalShipments > 0 ? ((totalShipments - deviationLevels.none) / totalShipments) * 100 : 0

  const byMedicineCategory: MedicineCategoryStat[] = Array.from(categoryMap.entries()).map(([category, stat]) => ({
    category,
    total: stat.total,
    withDeviation: stat.withDeviation,
  }))

  const byCarrier: CarrierStat[] = Array.from(carrierMap.values()).map((stat) => ({
    id: stat.id,
    name: stat.name,
    total: stat.total,
    withDeviation: stat.withDeviation,
    deviationRate: stat.total > 0 ? (stat.withDeviation / stat.total) * 100 : 0,
    avgProcessingHours: stat.processedCount > 0 ? stat.totalProcessingMs / stat.processedCount / (1000 * 60 * 60) : 0,
    releaseRate: stat.total > 0 ? (stat.releasedCount / stat.total) * 100 : 0,
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
