import {
  Role,
  ShipmentStatus,
  DeviationType,
  DeviationLevel,
  DisposalAction,
  ProbeStatus,
} from './types'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}

export interface Medicine {
  id: string
  name: string
  category: string
  specification: string
  manufacturer: string
  minTemp: number
  maxTemp: number
  createdAt: Date
}

export interface Carrier {
  id: string
  name: string
  contact: string | null
  createdAt: Date
}

export interface Probe {
  id: string
  serialNumber: string
  model: string
  status: ProbeStatus
  createdAt: Date
}

export interface Shipment {
  id: string
  batchNumber: string
  medicineId: string
  quantity: number
  carrierId: string
  probeId: string
  arrivalTime: Date
  warehouseClerkId: string
  status: ShipmentStatus
  currentHandlerId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TemperatureReading {
  id: string
  shipmentId: string
  probeId: string
  timestamp: Date
  temperature: number | null
  isOffline: boolean
  createdAt: Date
}

export interface Deviation {
  id: string
  shipmentId: string
  type: DeviationType
  level: DeviationLevel
  description: string | null
  qualityManagerId: string | null
  judgment: string | null
  judgedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Disposal {
  id: string
  shipmentId: string
  action: DisposalAction
  reviewerId: string | null
  comment: string | null
  evidenceUrl: string | null
  handledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface HistoryLog {
  id: string
  shipmentId: string
  action: string
  userId: string
  comment: string | null
  timestamp: Date
}

interface DataStore {
  users: User[]
  medicines: Medicine[]
  carriers: Carrier[]
  probes: Probe[]
  shipments: Shipment[]
  temperatureReadings: TemperatureReading[]
  deviations: Deviation[]
  disposals: Disposal[]
  historyLogs: HistoryLog[]
}

let store: DataStore
let idCounter = 0

function generateId(prefix: string): string {
  idCounter++
  return `${prefix}-${Date.now()}-${idCounter}`
}

function generateTemperatureReadings(
  shipmentId: string,
  probeId: string,
  baseTemp: number,
  hours: number,
  hasExcursion: boolean = false,
  excursionStart: number = 2,
  excursionDuration: number = 1,
  excursionTemp: number = 10,
  hasOffline: boolean = false,
  offlineStart: number = 4,
  offlineDuration: number = 1,
): TemperatureReading[] {
  const readings: TemperatureReading[] = []
  const now = new Date()
  const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

  for (let i = 0; i <= hours * 6; i++) {
    const timestamp = new Date(startTime.getTime() + i * 10 * 60 * 1000)
    const hourOfTrip = i / 6

    let temperature: number | null = baseTemp + Math.sin(i * 0.3) * 0.5 + (Math.random() - 0.5) * 0.3
    let isOffline = false

    if (hasOffline && hourOfTrip >= offlineStart && hourOfTrip < offlineStart + offlineDuration) {
      isOffline = true
      temperature = null
    } else if (hasExcursion && hourOfTrip >= excursionStart && hourOfTrip < excursionStart + excursionDuration) {
      temperature = excursionTemp + (Math.random() - 0.5) * 0.5
    }

    readings.push({
      id: generateId('reading'),
      shipmentId,
      probeId,
      timestamp,
      temperature,
      isOffline,
      createdAt: timestamp,
    })
  }

  return readings
}

function initializeStore(): DataStore {
  const now = new Date()

  const users: User[] = [
    {
      id: 'user-clerk',
      name: '张仓库',
      email: 'clerk@example.com',
      role: Role.WAREHOUSE_CLERK,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'user-qa',
      name: '李质量',
      email: 'qa@example.com',
      role: Role.QUALITY_MANAGER,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'user-reviewer',
      name: '王复核',
      email: 'reviewer@example.com',
      role: Role.REVIEWER,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  ]

  const medicines: Medicine[] = [
    {
      id: 'med-insulin',
      name: '重组人胰岛素注射液',
      category: '生物制品',
      specification: '300U/3ml',
      manufacturer: '某制药有限公司',
      minTemp: 2,
      maxTemp: 8,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'med-vaccine',
      name: '新冠灭活疫苗',
      category: '疫苗',
      specification: '0.5ml/支',
      manufacturer: '某生物科技公司',
      minTemp: 2,
      maxTemp: 8,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'med-antibiotic',
      name: '注射用头孢曲松钠',
      category: '抗生素',
      specification: '1.0g/瓶',
      manufacturer: '某医药集团',
      minTemp: 0,
      maxTemp: 25,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'med-probiotic',
      name: '双歧杆菌三联活菌散',
      category: '微生态制剂',
      specification: '1g/袋',
      manufacturer: '某生物制药',
      minTemp: 2,
      maxTemp: 8,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
  ]

  const carriers: Carrier[] = [
    {
      id: 'carrier-sf',
      name: '顺丰冷运',
      contact: '400-811-1111',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'carrier-jd',
      name: '京东冷链',
      contact: '400-000-8888',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'carrier-zto',
      name: '中通冷链',
      contact: '400-827-0270',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
  ]

  const probes: Probe[] = [
    {
      id: 'probe-001',
      serialNumber: 'PROBE-001',
      model: 'TempTale 4',
      status: ProbeStatus.ACTIVE,
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'probe-002',
      serialNumber: 'PROBE-002',
      model: 'TempTale 4',
      status: ProbeStatus.ACTIVE,
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'probe-003',
      serialNumber: 'PROBE-003',
      model: 'LogTag TRIL-8',
      status: ProbeStatus.OFFLINE,
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'probe-004',
      serialNumber: 'PROBE-004',
      model: 'LogTag TRIL-8',
      status: ProbeStatus.ACTIVE,
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    },
  ]

  const shipments: Shipment[] = []
  const temperatureReadings: TemperatureReading[] = []
  const deviations: Deviation[] = []
  const disposals: Disposal[] = []
  const historyLogs: HistoryLog[] = []

  const shipment1: Shipment = {
    id: 'shipment-001',
    batchNumber: 'BATCH-2026-001',
    medicineId: 'med-insulin',
    quantity: 500,
    carrierId: 'carrier-sf',
    probeId: 'probe-001',
    arrivalTime: new Date(),
    warehouseClerkId: 'user-clerk',
    status: ShipmentStatus.DEVIATION_JUDGED,
    currentHandlerId: 'user-reviewer',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  shipments.push(shipment1)

  const readings1 = generateTemperatureReadings(shipment1.id, 'probe-001', 5, 12)
  temperatureReadings.push(...readings1)

  deviations.push({
    id: 'deviation-001',
    shipmentId: shipment1.id,
    type: DeviationType.NONE,
    level: DeviationLevel.NONE,
    description: '全程温度正常，无偏差',
    qualityManagerId: 'user-qa',
    judgment: '温度符合要求，建议放行',
    judgedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  disposals.push({
    id: 'disposal-001',
    shipmentId: shipment1.id,
    action: DisposalAction.PENDING,
    reviewerId: null,
    comment: null,
    evidenceUrl: null,
    handledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  historyLogs.push(
    {
      id: 'log-001',
      shipmentId: shipment1.id,
      action: '到货登记',
      userId: 'user-clerk',
      comment: '批次 BATCH-2026-001 到货，数量 500 支',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'log-002',
      shipmentId: shipment1.id,
      action: '温度采集',
      userId: 'user-clerk',
      comment: `温度数据上传完成，共 ${readings1.length} 条记录`,
      timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
    },
    {
      id: 'log-003',
      shipmentId: shipment1.id,
      action: '偏差判定',
      userId: 'user-qa',
      comment: '无偏差，温度符合 2-8℃ 要求',
      timestamp: new Date(now.getTime() - 0.5 * 60 * 60 * 1000),
    },
  )

  const shipment2: Shipment = {
    id: 'shipment-002',
    batchNumber: 'BATCH-2026-002',
    medicineId: 'med-vaccine',
    quantity: 1000,
    carrierId: 'carrier-jd',
    probeId: 'probe-002',
    arrivalTime: new Date(),
    warehouseClerkId: 'user-clerk',
    status: ShipmentStatus.DEVIATION_JUDGED,
    currentHandlerId: 'user-reviewer',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  shipments.push(shipment2)

  const readings2 = generateTemperatureReadings(
    shipment2.id,
    'probe-002',
    5,
    12,
    true,
    3,
    0.5,
    12,
  )
  temperatureReadings.push(...readings2)

  deviations.push({
    id: 'deviation-002',
    shipmentId: shipment2.id,
    type: DeviationType.TEMPERATURE_EXCEEDED,
    level: DeviationLevel.MINOR,
    description: '运输途中第 3 小时出现短时超温，最高温度达 12℃，持续约 30 分钟',
    qualityManagerId: 'user-qa',
    judgment: '轻微偏差，超温时间较短，需复核人评估后决定是否放行',
    judgedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  disposals.push({
    id: 'disposal-002',
    shipmentId: shipment2.id,
    action: DisposalAction.PENDING,
    reviewerId: null,
    comment: null,
    evidenceUrl: null,
    handledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  historyLogs.push(
    {
      id: 'log-004',
      shipmentId: shipment2.id,
      action: '到货登记',
      userId: 'user-clerk',
      comment: '批次 BATCH-2026-002 到货，数量 1000 支',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      id: 'log-005',
      shipmentId: shipment2.id,
      action: '温度采集',
      userId: 'user-clerk',
      comment: '温度数据上传完成，发现温度异常',
      timestamp: new Date(now.getTime() - 2.5 * 60 * 60 * 1000),
    },
    {
      id: 'log-006',
      shipmentId: shipment2.id,
      action: '偏差判定',
      userId: 'user-qa',
      comment: '判定为轻微温度超标，持续约 30 分钟',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
  )

  const shipment3: Shipment = {
    id: 'shipment-003',
    batchNumber: 'BATCH-2026-003',
    medicineId: 'med-antibiotic',
    quantity: 200,
    carrierId: 'carrier-zto',
    probeId: 'probe-003',
    arrivalTime: new Date(),
    warehouseClerkId: 'user-clerk',
    status: ShipmentStatus.DEVIATION_JUDGED,
    currentHandlerId: 'user-reviewer',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  shipments.push(shipment3)

  const readings3 = generateTemperatureReadings(
    shipment3.id,
    'probe-003',
    5,
    12,
    false,
    0,
    0,
    0,
    true,
    5,
    2,
  )
  temperatureReadings.push(...readings3)

  deviations.push({
    id: 'deviation-003',
    shipmentId: shipment3.id,
    type: DeviationType.PROBE_OFFLINE,
    level: DeviationLevel.MAJOR,
    description: '运输途中探头离线约 2 小时，期间无温度数据，无法确认冷链完整性',
    qualityManagerId: 'user-qa',
    judgment: '探头离线属于严重偏差，禁止直接放行，必须要求人工复核证据，确认产品质量',
    judgedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  disposals.push({
    id: 'disposal-003',
    shipmentId: shipment3.id,
    action: DisposalAction.PENDING,
    reviewerId: null,
    comment: null,
    evidenceUrl: null,
    handledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  historyLogs.push(
    {
      id: 'log-007',
      shipmentId: shipment3.id,
      action: '到货登记',
      userId: 'user-clerk',
      comment: '批次 BATCH-2026-003 到货，数量 200 瓶',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'log-008',
      shipmentId: shipment3.id,
      action: '温度采集',
      userId: 'user-clerk',
      comment: '温度数据上传，发现探头离线记录',
      timestamp: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
    },
    {
      id: 'log-009',
      shipmentId: shipment3.id,
      action: '偏差判定',
      userId: 'user-qa',
      comment: '判定为探头离线严重偏差，需人工复核证据',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  )

  const shipment4: Shipment = {
    id: 'shipment-004',
    batchNumber: 'BATCH-2026-004',
    medicineId: 'med-probiotic',
    quantity: 300,
    carrierId: 'carrier-sf',
    probeId: 'probe-004',
    arrivalTime: new Date(),
    warehouseClerkId: 'user-clerk',
    status: ShipmentStatus.DEVIATION_JUDGED,
    currentHandlerId: 'user-reviewer',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  shipments.push(shipment4)

  const readings4 = generateTemperatureReadings(shipment4.id, 'probe-004', 5, 12)
  temperatureReadings.push(...readings4)

  deviations.push({
    id: 'deviation-004',
    shipmentId: shipment4.id,
    type: DeviationType.BATCH_MIXED,
    level: DeviationLevel.MAJOR,
    description: '到货验收时发现包装内混有其他批号产品，存在批号混装问题',
    qualityManagerId: 'user-qa',
    judgment: '批号混装属于严重偏差，建议隔离并退回承运商处理',
    judgedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  disposals.push({
    id: 'disposal-004',
    shipmentId: shipment4.id,
    action: DisposalAction.PENDING,
    reviewerId: null,
    comment: null,
    evidenceUrl: null,
    handledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  historyLogs.push(
    {
      id: 'log-010',
      shipmentId: shipment4.id,
      action: '到货登记',
      userId: 'user-clerk',
      comment: '批次 BATCH-2026-004 到货，数量 300 袋',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'log-011',
      shipmentId: shipment4.id,
      action: '温度采集',
      userId: 'user-clerk',
      comment: '温度数据正常，但发现包装异常',
      timestamp: new Date(now.getTime() - 4.5 * 60 * 60 * 1000),
    },
    {
      id: 'log-012',
      shipmentId: shipment4.id,
      action: '偏差判定',
      userId: 'user-qa',
      comment: '判定为批号混装严重偏差，建议退回',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
  )

  const shipment5: Shipment = {
    id: 'shipment-005',
    batchNumber: 'BATCH-2026-005',
    medicineId: 'med-insulin',
    quantity: 800,
    carrierId: 'carrier-jd',
    probeId: 'probe-001',
    arrivalTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    warehouseClerkId: 'user-clerk',
    status: ShipmentStatus.RELEASED,
    currentHandlerId: null,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
  }
  shipments.push(shipment5)

  const readings5 = generateTemperatureReadings(shipment5.id, 'probe-001', 5, 8)
  temperatureReadings.push(...readings5)

  deviations.push({
    id: 'deviation-005',
    shipmentId: shipment5.id,
    type: DeviationType.NONE,
    level: DeviationLevel.NONE,
    description: '全程温度正常',
    qualityManagerId: 'user-qa',
    judgment: '合格，建议放行',
    judgedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
  })

  disposals.push({
    id: 'disposal-005',
    shipmentId: shipment5.id,
    action: DisposalAction.RELEASE,
    reviewerId: 'user-reviewer',
    comment: '审核通过，予以放行',
    evidenceUrl: null,
    handledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
  })

  historyLogs.push(
    {
      id: 'log-013',
      shipmentId: shipment5.id,
      action: '到货登记',
      userId: 'user-clerk',
      comment: '批次 BATCH-2026-005 到货',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'log-014',
      shipmentId: shipment5.id,
      action: '偏差判定',
      userId: 'user-qa',
      comment: '无偏差',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    },
    {
      id: 'log-015',
      shipmentId: shipment5.id,
      action: '放行',
      userId: 'user-reviewer',
      comment: '审核通过，予以放行',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    },
  )

  const shipment6: Shipment = {
    id: 'shipment-006',
    batchNumber: 'BATCH-2026-006',
    medicineId: 'med-vaccine',
    quantity: 500,
    carrierId: 'carrier-zto',
    probeId: 'probe-002',
    arrivalTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    warehouseClerkId: 'user-clerk',
    status: ShipmentStatus.ISOLATED,
    currentHandlerId: null,
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
  }
  shipments.push(shipment6)

  const readings6 = generateTemperatureReadings(
    shipment6.id,
    'probe-002',
    5,
    10,
    true,
    2,
    3,
    15,
  )
  temperatureReadings.push(...readings6)

  deviations.push({
    id: 'deviation-006',
    shipmentId: shipment6.id,
    type: DeviationType.TEMPERATURE_EXCEEDED,
    level: DeviationLevel.CRITICAL,
    description: '严重超温，最高温度 15℃，持续 3 小时',
    qualityManagerId: 'user-qa',
    judgment: '危急偏差，建议隔离并做质量评估',
    judgedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
  })

  disposals.push({
    id: 'disposal-006',
    shipmentId: shipment6.id,
    action: DisposalAction.ISOLATE,
    reviewerId: 'user-reviewer',
    comment: '超温严重，决定隔离等待质量评估',
    evidenceUrl: null,
    handledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
  })

  historyLogs.push(
    {
      id: 'log-016',
      shipmentId: shipment6.id,
      action: '到货登记',
      userId: 'user-clerk',
      comment: '批次 BATCH-2026-006 到货',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'log-017',
      shipmentId: shipment6.id,
      action: '偏差判定',
      userId: 'user-qa',
      comment: '危急偏差',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    },
    {
      id: 'log-018',
      shipmentId: shipment6.id,
      action: '隔离',
      userId: 'user-reviewer',
      comment: '决定隔离',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    },
  )

  return {
    users,
    medicines,
    carriers,
    probes,
    shipments,
    temperatureReadings,
    deviations,
    disposals,
    historyLogs,
  }
}

export function getStore(): DataStore {
  if (!store) {
    store = initializeStore()
  }
  return store
}

export function resetStore(): void {
  store = initializeStore()
  idCounter = 0
}

export { generateId }
