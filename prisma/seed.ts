import { PrismaClient } from '@prisma/client'
import {
  Role,
  ShipmentStatus,
  DeviationType,
  DeviationLevel,
  DisposalAction,
  ProbeStatus,
} from '../src/lib/types'

const prisma = new PrismaClient()

function generateTemperatureReadings(
  shipmentId: string,
  probeId: string,
  baseTemp: number,
  hours: number,
  minTemp: number,
  maxTemp: number,
  hasExcursion: boolean = false,
  excursionStart: number = 2,
  excursionDuration: number = 1,
  excursionTemp: number = 10,
  hasOffline: boolean = false,
  offlineStart: number = 4,
  offlineDuration: number = 1,
) {
  const readings = []
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
      shipmentId,
      probeId,
      timestamp,
      temperature,
      isOffline,
    })
  }

  return readings
}

async function main() {
  console.log('开始创建种子数据...')

  await prisma.historyLog.deleteMany()
  await prisma.temperatureReading.deleteMany()
  await prisma.deviation.deleteMany()
  await prisma.disposal.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.probe.deleteMany()
  await prisma.carrier.deleteMany()
  await prisma.medicine.deleteMany()
  await prisma.user.deleteMany()

  const warehouseClerk = await prisma.user.create({
    data: {
      id: 'user-clerk',
      name: '张仓库',
      email: 'clerk@example.com',
      role: Role.WAREHOUSE_CLERK,
    },
  })

  const qualityManager = await prisma.user.create({
    data: {
      id: 'user-qa',
      name: '李质量',
      email: 'qa@example.com',
      role: Role.QUALITY_MANAGER,
    },
  })

  const reviewer = await prisma.user.create({
    data: {
      id: 'user-reviewer',
      name: '王复核',
      email: 'reviewer@example.com',
      role: Role.REVIEWER,
    },
  })

  console.log('用户创建完成')

  const medicine1 = await prisma.medicine.create({
    data: {
      id: 'med-insulin',
      name: '重组人胰岛素注射液',
      category: '生物制品',
      specification: '300U/3ml',
      manufacturer: '某制药有限公司',
      minTemp: 2,
      maxTemp: 8,
    },
  })

  const medicine2 = await prisma.medicine.create({
    data: {
      id: 'med-vaccine',
      name: '新冠灭活疫苗',
      category: '疫苗',
      specification: '0.5ml/支',
      manufacturer: '某生物科技公司',
      minTemp: 2,
      maxTemp: 8,
    },
  })

  const medicine3 = await prisma.medicine.create({
    data: {
      id: 'med-antibiotic',
      name: '注射用头孢曲松钠',
      category: '抗生素',
      specification: '1.0g/瓶',
      manufacturer: '某医药集团',
      minTemp: 0,
      maxTemp: 25,
    },
  })

  const medicine4 = await prisma.medicine.create({
    data: {
      id: 'med-probiotic',
      name: '双歧杆菌三联活菌散',
      category: '微生态制剂',
      specification: '1g/袋',
      manufacturer: '某生物制药',
      minTemp: 2,
      maxTemp: 8,
    },
  })

  console.log('药品创建完成')

  const carrier1 = await prisma.carrier.create({
    data: {
      id: 'carrier-sf',
      name: '顺丰冷运',
      contact: '400-811-1111',
    },
  })

  const carrier2 = await prisma.carrier.create({
    data: {
      id: 'carrier-jd',
      name: '京东冷链',
      contact: '400-000-8888',
    },
  })

  const carrier3 = await prisma.carrier.create({
    data: {
      id: 'carrier-zto',
      name: '中通冷链',
      contact: '400-827-0270',
    },
  })

  console.log('承运商创建完成')

  const probe1 = await prisma.probe.create({
    data: {
      id: 'probe-001',
      serialNumber: 'PROBE-001',
      model: 'TempTale 4',
      status: ProbeStatus.ACTIVE,
    },
  })

  const probe2 = await prisma.probe.create({
    data: {
      id: 'probe-002',
      serialNumber: 'PROBE-002',
      model: 'TempTale 4',
      status: ProbeStatus.ACTIVE,
    },
  })

  const probe3 = await prisma.probe.create({
    data: {
      id: 'probe-003',
      serialNumber: 'PROBE-003',
      model: 'LogTag TRIL-8',
      status: ProbeStatus.OFFLINE,
    },
  })

  const probe4 = await prisma.probe.create({
    data: {
      id: 'probe-004',
      serialNumber: 'PROBE-004',
      model: 'LogTag TRIL-8',
      status: ProbeStatus.ACTIVE,
    },
  })

  console.log('探头创建完成')

  const shipment1 = await prisma.shipment.create({
    data: {
      id: 'shipment-001',
      batchNumber: 'BATCH-2026-001',
      medicineId: medicine1.id,
      quantity: 500,
      carrierId: carrier1.id,
      probeId: probe1.id,
      arrivalTime: new Date(),
      warehouseClerkId: warehouseClerk.id,
      status: ShipmentStatus.DEVIATION_JUDGED,
      currentHandlerId: reviewer.id,
    },
  })

  const readings1 = generateTemperatureReadings(
    shipment1.id,
    probe1.id,
    5,
    12,
    2,
    8,
  )

  for (const reading of readings1) {
    await prisma.temperatureReading.create({ data: reading })
  }

  const deviation1 = await prisma.deviation.create({
    data: {
      shipmentId: shipment1.id,
      type: DeviationType.NONE,
      level: DeviationLevel.NONE,
      description: '全程温度正常，无偏差',
      qualityManagerId: qualityManager.id,
      judgment: '温度符合要求，建议放行',
      judgedAt: new Date(),
    },
  })

  const disposal1 = await prisma.disposal.create({
    data: {
      shipmentId: shipment1.id,
      action: DisposalAction.PENDING,
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment1.id,
      action: '到货登记',
      userId: warehouseClerk.id,
      comment: '批次 BATCH-2026-001 到货，数量 500 支',
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment1.id,
      action: '温度采集',
      userId: warehouseClerk.id,
      comment: `温度数据上传完成，共 ${readings1.length} 条记录`,
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment1.id,
      action: '偏差判定',
      userId: qualityManager.id,
      comment: '无偏差，温度符合 2-8℃ 要求',
    },
  })

  console.log('样本1（温度合格）创建完成')

  const shipment2 = await prisma.shipment.create({
    data: {
      id: 'shipment-002',
      batchNumber: 'BATCH-2026-002',
      medicineId: medicine2.id,
      quantity: 1000,
      carrierId: carrier2.id,
      probeId: probe2.id,
      arrivalTime: new Date(),
      warehouseClerkId: warehouseClerk.id,
      status: ShipmentStatus.DEVIATION_JUDGED,
      currentHandlerId: reviewer.id,
    },
  })

  const readings2 = generateTemperatureReadings(
    shipment2.id,
    probe2.id,
    5,
    12,
    2,
    8,
    true,
    3,
    0.5,
    12,
  )

  for (const reading of readings2) {
    await prisma.temperatureReading.create({ data: reading })
  }

  const deviation2 = await prisma.deviation.create({
    data: {
      shipmentId: shipment2.id,
      type: DeviationType.TEMPERATURE_EXCEEDED,
      level: DeviationLevel.MINOR,
      description: '运输途中第 3 小时出现短时超温，最高温度达 12℃，持续约 30 分钟',
      qualityManagerId: qualityManager.id,
      judgment: '轻微偏差，超温时间较短，需复核人评估后决定是否放行',
      judgedAt: new Date(),
    },
  })

  const disposal2 = await prisma.disposal.create({
    data: {
      shipmentId: shipment2.id,
      action: DisposalAction.PENDING,
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment2.id,
      action: '到货登记',
      userId: warehouseClerk.id,
      comment: '批次 BATCH-2026-002 到货，数量 1000 支',
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment2.id,
      action: '温度采集',
      userId: warehouseClerk.id,
      comment: '温度数据上传完成，发现温度异常',
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment2.id,
      action: '偏差判定',
      userId: qualityManager.id,
      comment: '判定为轻微温度超标，持续约 30 分钟',
    },
  })

  console.log('样本2（短时超温）创建完成')

  const shipment3 = await prisma.shipment.create({
    data: {
      id: 'shipment-003',
      batchNumber: 'BATCH-2026-003',
      medicineId: medicine3.id,
      quantity: 200,
      carrierId: carrier3.id,
      probeId: probe3.id,
      arrivalTime: new Date(),
      warehouseClerkId: warehouseClerk.id,
      status: ShipmentStatus.DEVIATION_JUDGED,
      currentHandlerId: reviewer.id,
    },
  })

  const readings3 = generateTemperatureReadings(
    shipment3.id,
    probe3.id,
    5,
    12,
    0,
    25,
    false,
    0,
    0,
    0,
    true,
    5,
    2,
  )

  for (const reading of readings3) {
    await prisma.temperatureReading.create({ data: reading })
  }

  const deviation3 = await prisma.deviation.create({
    data: {
      shipmentId: shipment3.id,
      type: DeviationType.PROBE_OFFLINE,
      level: DeviationLevel.MAJOR,
      description: '运输途中探头离线约 2 小时，期间无温度数据，无法确认冷链完整性',
      qualityManagerId: qualityManager.id,
      judgment: '探头离线属于严重偏差，禁止直接放行，必须要求人工复核证据，确认产品质量',
      judgedAt: new Date(),
    },
  })

  const disposal3 = await prisma.disposal.create({
    data: {
      shipmentId: shipment3.id,
      action: DisposalAction.PENDING,
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment3.id,
      action: '到货登记',
      userId: warehouseClerk.id,
      comment: '批次 BATCH-2026-003 到货，数量 200 瓶',
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment3.id,
      action: '温度采集',
      userId: warehouseClerk.id,
      comment: '温度数据上传，发现探头离线记录',
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment3.id,
      action: '偏差判定',
      userId: qualityManager.id,
      comment: '判定为探头离线严重偏差，需人工复核证据',
    },
  })

  console.log('样本3（探头离线）创建完成')

  const shipment4 = await prisma.shipment.create({
    data: {
      id: 'shipment-004',
      batchNumber: 'BATCH-2026-004',
      medicineId: medicine4.id,
      quantity: 300,
      carrierId: carrier1.id,
      probeId: probe4.id,
      arrivalTime: new Date(),
      warehouseClerkId: warehouseClerk.id,
      status: ShipmentStatus.DEVIATION_JUDGED,
      currentHandlerId: reviewer.id,
    },
  })

  const readings4 = generateTemperatureReadings(
    shipment4.id,
    probe4.id,
    5,
    12,
    2,
    8,
  )

  for (const reading of readings4) {
    await prisma.temperatureReading.create({ data: reading })
  }

  const deviation4 = await prisma.deviation.create({
    data: {
      shipmentId: shipment4.id,
      type: DeviationType.BATCH_MIXED,
      level: DeviationLevel.MAJOR,
      description: '到货验收时发现包装内混有其他批号产品，存在批号混装问题',
      qualityManagerId: qualityManager.id,
      judgment: '批号混装属于严重偏差，建议隔离并退回承运商处理',
      judgedAt: new Date(),
    },
  })

  const disposal4 = await prisma.disposal.create({
    data: {
      shipmentId: shipment4.id,
      action: DisposalAction.PENDING,
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment4.id,
      action: '到货登记',
      userId: warehouseClerk.id,
      comment: '批次 BATCH-2026-004 到货，数量 300 袋',
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment4.id,
      action: '温度采集',
      userId: warehouseClerk.id,
      comment: '温度数据正常，但发现包装异常',
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment4.id,
      action: '偏差判定',
      userId: qualityManager.id,
      comment: '判定为批号混装严重偏差，建议退回',
    },
  })

  console.log('样本4（批号混装）创建完成')

  const shipment5 = await prisma.shipment.create({
    data: {
      id: 'shipment-005',
      batchNumber: 'BATCH-2026-005',
      medicineId: medicine1.id,
      quantity: 800,
      carrierId: carrier2.id,
      probeId: probe1.id,
      arrivalTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      warehouseClerkId: warehouseClerk.id,
      status: ShipmentStatus.RELEASED,
      currentHandlerId: null,
    },
  })

  const readings5 = generateTemperatureReadings(
    shipment5.id,
    probe1.id,
    5,
    8,
    2,
    8,
  )

  for (const reading of readings5) {
    await prisma.temperatureReading.create({ data: reading })
  }

  const deviation5 = await prisma.deviation.create({
    data: {
      shipmentId: shipment5.id,
      type: DeviationType.NONE,
      level: DeviationLevel.NONE,
      description: '全程温度正常',
      qualityManagerId: qualityManager.id,
      judgment: '合格，建议放行',
      judgedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    },
  })

  const disposal5 = await prisma.disposal.create({
    data: {
      shipmentId: shipment5.id,
      action: DisposalAction.RELEASE,
      reviewerId: reviewer.id,
      comment: '审核通过，予以放行',
      handledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment5.id,
      action: '到货登记',
      userId: warehouseClerk.id,
      comment: '批次 BATCH-2026-005 到货',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment5.id,
      action: '偏差判定',
      userId: qualityManager.id,
      comment: '无偏差',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment5.id,
      action: '放行',
      userId: reviewer.id,
      comment: '审核通过，予以放行',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    },
  })

  console.log('样本5（已放行历史记录）创建完成')

  const shipment6 = await prisma.shipment.create({
    data: {
      id: 'shipment-006',
      batchNumber: 'BATCH-2026-006',
      medicineId: medicine2.id,
      quantity: 500,
      carrierId: carrier3.id,
      probeId: probe2.id,
      arrivalTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      warehouseClerkId: warehouseClerk.id,
      status: ShipmentStatus.ISOLATED,
      currentHandlerId: null,
    },
  })

  const readings6 = generateTemperatureReadings(
    shipment6.id,
    probe2.id,
    5,
    10,
    2,
    8,
    true,
    2,
    3,
    15,
  )

  for (const reading of readings6) {
    await prisma.temperatureReading.create({ data: reading })
  }

  const deviation6 = await prisma.deviation.create({
    data: {
      shipmentId: shipment6.id,
      type: DeviationType.TEMPERATURE_EXCEEDED,
      level: DeviationLevel.CRITICAL,
      description: '严重超温，最高温度 15℃，持续 3 小时',
      qualityManagerId: qualityManager.id,
      judgment: '危急偏差，建议隔离并做质量评估',
      judgedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    },
  })

  const disposal6 = await prisma.disposal.create({
    data: {
      shipmentId: shipment6.id,
      action: DisposalAction.ISOLATE,
      reviewerId: reviewer.id,
      comment: '超温严重，决定隔离等待质量评估',
      handledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment6.id,
      action: '到货登记',
      userId: warehouseClerk.id,
      comment: '批次 BATCH-2026-006 到货',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment6.id,
      action: '偏差判定',
      userId: qualityManager.id,
      comment: '危急偏差',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    },
  })

  await prisma.historyLog.create({
    data: {
      shipmentId: shipment6.id,
      action: '隔离',
      userId: reviewer.id,
      comment: '决定隔离',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    },
  })

  console.log('样本6（已隔离历史记录）创建完成')

  console.log('所有种子数据创建完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
