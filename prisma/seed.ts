import { PrismaClient, UserRole, RecallStatus, StoreRecallStatus, Region, DrugCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.recallHistory.deleteMany()
  await prisma.recallRecovery.deleteMany()
  await prisma.storeRecall.deleteMany()
  await prisma.recallBatch.deleteMany()
  await prisma.recall.deleteMany()
  await prisma.drugBatch.deleteMany()
  await prisma.drug.deleteMany()
  await prisma.user.deleteMany()
  await prisma.store.deleteMany()

  // Create stores
  const stores = await Promise.all([
    prisma.store.create({ data: { name: '华东药店-上海浦东店', code: 'HD-SH-001', region: Region.EAST, address: '上海市浦东新区陆家嘴环路100号' } }),
    prisma.store.create({ data: { name: '华东药店-杭州西湖店', code: 'HD-HZ-002', region: Region.EAST, address: '杭州市西湖区文三路200号' } }),
    prisma.store.create({ data: { name: '华南药店-广州天河店', code: 'HN-GZ-001', region: Region.SOUTH, address: '广州市天河区珠江新城300号' } }),
    prisma.store.create({ data: { name: '华南药店-深圳南山店', code: 'HN-SZ-002', region: Region.SOUTH, address: '深圳市南山区科技园400号' } }),
    prisma.store.create({ data: { name: '华北药店-北京朝阳店', code: 'HB-BJ-001', region: Region.NORTH, address: '北京市朝阳区建国路500号' } }),
    prisma.store.create({ data: { name: '西部药店-成都锦江店', code: 'XB-CD-001', region: Region.WEST, address: '成都市锦江区春熙路600号' } }),
    prisma.store.create({ data: { name: '中部药店-武汉江汉店', code: 'ZB-WH-001', region: Region.CENTRAL, address: '武汉市江汉区解放大道700号' } }),
    prisma.store.create({ data: { name: '中部药店-长沙芙蓉店', code: 'ZB-CS-002', region: Region.CENTRAL, address: '长沙市芙蓉区五一大道800号' } }),
  ])

  // Create users
  const qualityManager = await prisma.user.create({
    data: { name: '张质量', role: UserRole.QUALITY_MANAGER }
  })

  const reviewer = await prisma.user.create({
    data: { name: '李复核', role: UserRole.REVIEWER }
  })

  const logisticsStaff = await prisma.user.create({
    data: { name: '王物流', role: UserRole.LOGISTICS_STAFF }
  })

  const pharmacists = await Promise.all([
    prisma.user.create({ data: { name: '陈药师-浦东', role: UserRole.STORE_PHARMACIST, storeId: stores[0].id } }),
    prisma.user.create({ data: { name: '刘药师-西湖', role: UserRole.STORE_PHARMACIST, storeId: stores[1].id } }),
    prisma.user.create({ data: { name: '赵药师-天河', role: UserRole.STORE_PHARMACIST, storeId: stores[2].id } }),
    prisma.user.create({ data: { name: '孙药师-南山', role: UserRole.STORE_PHARMACIST, storeId: stores[3].id } }),
    prisma.user.create({ data: { name: '周药师-朝阳', role: UserRole.STORE_PHARMACIST, storeId: stores[4].id } }),
    prisma.user.create({ data: { name: '吴药师-锦江', role: UserRole.STORE_PHARMACIST, storeId: stores[5].id } }),
    prisma.user.create({ data: { name: '郑药师-江汉', role: UserRole.STORE_PHARMACIST, storeId: stores[6].id } }),
    prisma.user.create({ data: { name: '冯药师-芙蓉', role: UserRole.STORE_PHARMACIST, storeId: stores[7].id } }),
  ])

  // Create drugs and batches
  const drug1 = await prisma.drug.create({
    data: {
      name: '阿莫西林胶囊',
      genericName: 'Amoxicillin',
      category: DrugCategory.ANTIBIOTIC,
      manufacturer: '华北制药',
      batches: {
        create: [
          { batchNumber: 'AMX-2024-001', productionDate: new Date('2024-01-15'), expiryDate: new Date('2026-01-14') },
          { batchNumber: 'AMX-2024-002', productionDate: new Date('2024-03-20'), expiryDate: new Date('2026-03-19') },
        ]
      }
    },
    include: { batches: true }
  })

  const drug2 = await prisma.drug.create({
    data: {
      name: '硝苯地平缓释片',
      genericName: 'Nifedipine',
      category: DrugCategory.CARDIOVASCULAR,
      manufacturer: '辉瑞制药',
      batches: {
        create: [
          { batchNumber: 'NIF-2024-001', productionDate: new Date('2024-02-10'), expiryDate: new Date('2026-02-09') },
          { batchNumber: 'NIF-2024-003', productionDate: new Date('2024-05-05'), expiryDate: new Date('2026-05-04') },
        ]
      }
    },
    include: { batches: true }
  })

  const drug3 = await prisma.drug.create({
    data: {
      name: '奥美拉唑肠溶胶囊',
      genericName: 'Omeprazole',
      category: DrugCategory.GASTROINTESTINAL,
      manufacturer: '阿斯利康',
      batches: {
        create: [
          { batchNumber: 'OME-2024-001', productionDate: new Date('2024-01-20'), expiryDate: new Date('2026-01-19') },
        ]
      }
    },
    include: { batches: true }
  })

  const drug4 = await prisma.drug.create({
    data: {
      name: '布洛芬缓释胶囊',
      genericName: 'Ibuprofen',
      category: DrugCategory.ANALGESIC,
      manufacturer: '中美史克',
      batches: {
        create: [
          { batchNumber: 'IBU-2024-002', productionDate: new Date('2024-04-10'), expiryDate: new Date('2026-04-09') },
        ]
      }
    },
    include: { batches: true }
  })

  // ====== Scenario 1: 全部下架（已完成关闭） ======
  const recall1 = await prisma.recall.create({
    data: {
      title: '阿莫西林胶囊 AMX-2024-001 批次召回',
      description: '因质量稳定性问题，对该批次产品实施三级召回',
      reason: '产品溶出度不符合标准规定',
      level: '三级召回',
      status: RecallStatus.CLOSED,
      publisherId: qualityManager.id,
      closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      closerId: reviewer.id,
      closeNote: '全部门店已完成下架回收，无异常',
      batches: {
        create: {
          drugBatchId: drug1.batches[0].id,
          expectedQuantity: 500,
        }
      },
      stores: {
        create: stores.slice(0, 5).map((store, idx) => ({
          storeId: store.id,
          status: StoreRecallStatus.RECOVERED,
          readAt: new Date(Date.now() - (5 + idx) * 60 * 60 * 1000),
          offShelfAt: new Date(Date.now() - (4 + idx) * 60 * 60 * 1000),
          confirmedById: pharmacists[idx].id,
          offShelfPhoto: `off_shelf_${store.id}.jpg`,
        }))
      },
      history: {
        create: [
          { action: '发布召回', detail: '质量经办人发布召回通知', actorId: qualityManager.id },
          { action: '关闭召回', detail: '复核人确认关闭召回', actorId: reviewer.id },
        ]
      }
    },
    include: { stores: true, batches: true }
  })

  // Create recovery records for recall 1 (正常数量)
  for (let i = 0; i < 5; i++) {
    await prisma.recallRecovery.create({
      data: {
        recallId: recall1.id,
        storeId: stores[i].id,
        batchId: drug1.batches[0].id,
        expectedQty: 100,
        actualQty: 100,
        difference: 0,
        notedById: logisticsStaff.id,
      }
    })
  }

  // ====== Scenario 2: 门店未读（进行中，有门店未读） ======
  const recall2 = await prisma.recall.create({
    data: {
      title: '硝苯地平缓释片 NIF-2024-001 批次召回',
      description: '因杂质超标问题，对该批次产品实施二级召回',
      reason: '有关物质含量超过标准限度',
      level: '二级召回',
      status: RecallStatus.IN_PROGRESS,
      publisherId: qualityManager.id,
      batches: {
        create: {
          drugBatchId: drug2.batches[0].id,
          expectedQuantity: 300,
        }
      },
      stores: {
        create: [
          { storeId: stores[0].id, status: StoreRecallStatus.OFF_SHELF, readAt: new Date(Date.now() - 12 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 8 * 60 * 60 * 1000), confirmedById: pharmacists[0].id, offShelfPhoto: 'off_shelf_2_0.jpg' },
          { storeId: stores[1].id, status: StoreRecallStatus.READ, readAt: new Date(Date.now() - 6 * 60 * 60 * 1000), confirmedById: pharmacists[1].id },
          { storeId: stores[2].id, status: StoreRecallStatus.UNREAD }, // 未读
          { storeId: stores[3].id, status: StoreRecallStatus.OFF_SHELF, readAt: new Date(Date.now() - 20 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 15 * 60 * 60 * 1000), confirmedById: pharmacists[3].id, offShelfPhoto: 'off_shelf_2_3.jpg' },
          { storeId: stores[4].id, status: StoreRecallStatus.UNREAD }, // 未读
          { storeId: stores[5].id, status: StoreRecallStatus.READ, readAt: new Date(Date.now() - 3 * 60 * 60 * 1000), confirmedById: pharmacists[5].id },
        ]
      },
      history: {
        create: [
          { action: '发布召回', detail: '质量经办人发布召回通知', actorId: qualityManager.id },
        ]
      }
    },
    include: { stores: true }
  })

  // ====== Scenario 3: 批号不匹配 ======
  const recall3 = await prisma.recall.create({
    data: {
      title: '奥美拉唑肠溶胶囊 OME-2024-001 批次召回',
      description: '因包装印刷错误，对该批次产品实施三级召回',
      reason: '说明书印刷错误',
      level: '三级召回',
      status: RecallStatus.IN_PROGRESS,
      publisherId: qualityManager.id,
      batches: {
        create: {
          drugBatchId: drug3.batches[0].id,
          expectedQuantity: 200,
        }
      },
      stores: {
        create: [
          { storeId: stores[0].id, status: StoreRecallStatus.OFF_SHELF, readAt: new Date(Date.now() - 24 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 20 * 60 * 60 * 1000), confirmedById: pharmacists[0].id, offShelfPhoto: 'off_shelf_3_0.jpg' },
          { storeId: stores[1].id, status: StoreRecallStatus.BATCH_MISMATCH, readAt: new Date(Date.now() - 18 * 60 * 60 * 1000), confirmedById: pharmacists[1].id, mismatchNote: '门店实际库存批次为OME-2023-005，非召回批次' }, // 批号不匹配
          { storeId: stores[6].id, status: StoreRecallStatus.OFF_SHELF, readAt: new Date(Date.now() - 10 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 6 * 60 * 60 * 1000), confirmedById: pharmacists[6].id, offShelfPhoto: 'off_shelf_3_6.jpg' },
          { storeId: stores[7].id, status: StoreRecallStatus.BATCH_MISMATCH, readAt: new Date(Date.now() - 8 * 60 * 60 * 1000), confirmedById: pharmacists[7].id, mismatchNote: '该批次已售罄，无库存' }, // 批号不匹配
        ]
      },
      history: {
        create: [
          { action: '发布召回', detail: '质量经办人发布召回通知', actorId: qualityManager.id },
          { action: '批号异常', detail: '杭州西湖店反馈批号不匹配', actorId: pharmacists[1].id },
        ]
      }
    },
    include: { stores: true }
  })

  // ====== Scenario 4: 回收数量差异 ======
  const recall4 = await prisma.recall.create({
    data: {
      title: '布洛芬缓释胶囊 IBU-2024-002 批次召回',
      description: '因含量均匀度问题，对该批次产品实施二级召回',
      reason: '含量均匀度不符合规定',
      level: '二级召回',
      status: RecallStatus.RECOVERING,
      publisherId: qualityManager.id,
      batches: {
        create: {
          drugBatchId: drug4.batches[0].id,
          expectedQuantity: 400,
        }
      },
      stores: {
        create: [
          { storeId: stores[2].id, status: StoreRecallStatus.RECOVERED, readAt: new Date(Date.now() - 48 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 40 * 60 * 60 * 1000), confirmedById: pharmacists[2].id, offShelfPhoto: 'off_shelf_4_2.jpg' },
          { storeId: stores[3].id, status: StoreRecallStatus.RECOVERED, readAt: new Date(Date.now() - 50 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 42 * 60 * 60 * 1000), confirmedById: pharmacists[3].id, offShelfPhoto: 'off_shelf_4_3.jpg' },
          { storeId: stores[4].id, status: StoreRecallStatus.OFF_SHELF, readAt: new Date(Date.now() - 36 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 30 * 60 * 60 * 1000), confirmedById: pharmacists[4].id, offShelfPhoto: 'off_shelf_4_4.jpg' },
          { storeId: stores[5].id, status: StoreRecallStatus.OFF_SHELF, readAt: new Date(Date.now() - 30 * 60 * 60 * 1000), offShelfAt: new Date(Date.now() - 25 * 60 * 60 * 1000), confirmedById: pharmacists[5].id, offShelfPhoto: 'off_shelf_4_5.jpg' },
        ]
      },
      history: {
        create: [
          { action: '发布召回', detail: '质量经办人发布召回通知', actorId: qualityManager.id },
          { action: '开始回收', detail: '物流人员开始回收工作', actorId: logisticsStaff.id },
        ]
      }
    },
    include: { stores: true }
  })

  // Create recovery records with differences for recall 4
  await prisma.recallRecovery.create({
    data: {
      recallId: recall4.id,
      storeId: stores[2].id,
      batchId: drug4.batches[0].id,
      expectedQty: 100,
      actualQty: 95,
      difference: -5,
      notedById: logisticsStaff.id,
      note: '5盒已售出，已登记销售流向',
    }
  })

  await prisma.recallRecovery.create({
    data: {
      recallId: recall4.id,
      storeId: stores[3].id,
      batchId: drug4.batches[0].id,
      expectedQty: 100,
      actualQty: 100,
      difference: 0,
      notedById: logisticsStaff.id,
    }
  })

  console.log('Database seeded successfully!')
  console.log('4 sample scenarios created:')
  console.log('  1. 全部下架（已关闭）- 阿莫西林胶囊')
  console.log('  2. 门店未读 - 硝苯地平缓释片')
  console.log('  3. 批号不匹配 - 奥美拉唑肠溶胶囊')
  console.log('  4. 回收数量差异 - 布洛芬缓释胶囊')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
