import { db } from './config'
import {
  departments,
  assetCategories,
  assets,
  discrepancyTypes,
  inventoryRecords,
  disposalProcess,
  transferRecords,
  accountabilityRecords,
} from './schema'

async function seed() {
  await db.delete(transferRecords)
  await db.delete(accountabilityRecords)
  await db.delete(disposalProcess)
  await db.delete(inventoryRecords)
  await db.delete(assets)
  await db.delete(discrepancyTypes)
  await db.delete(assetCategories)
  await db.delete(departments)

  await db.insert(departments).values({ name: '研发部', code: 'RD' })
  await db.insert(departments).values({ name: '财务部', code: 'FIN' })
  await db.insert(departments).values({ name: '行政部', code: 'ADM' })
  await db.insert(departments).values({ name: '销售部', code: 'SAL' })
  await db.insert(departments).values({ name: '生产部', code: 'PRO' })

  await db.insert(assetCategories).values({ name: '电脑设备', code: 'PC' })
  await db.insert(assetCategories).values({ name: '办公家具', code: 'FURN' })
  await db.insert(assetCategories).values({ name: '车辆', code: 'VEH' })
  await db.insert(assetCategories).values({ name: '仪器设备', code: 'INST' })
  await db.insert(assetCategories).values({ name: '其他', code: 'OTHER' })

  await db.insert(discrepancyTypes).values({ name: '账实一致', code: 'MATCH', description: '账面记录与实际情况一致' })
  await db.insert(discrepancyTypes).values({ name: '资产丢失', code: 'LOST', description: '资产实际不存在，已丢失' })
  await db.insert(discrepancyTypes).values({ name: '跨部门调拨', code: 'TRANSFER', description: '资产在部门间转移' })
  await db.insert(discrepancyTypes).values({ name: '标签损坏', code: 'TAG_DAMAGED', description: '资产标签损坏或丢失' })
  await db.insert(discrepancyTypes).values({ name: '位置不符', code: 'LOCATION_MISMATCH', description: '实际位置与账面不符' })
  await db.insert(discrepancyTypes).values({ name: '使用人不符', code: 'USER_MISMATCH', description: '实际使用人与账面不符' })

  await db.insert(assets).values({
    assetNo: 'AST-2024-001',
    name: '戴尔OptiPlex 7090台式机',
    categoryId: 1,
    departmentId: 1,
    location: '研发楼3层301室',
    userId: 'U001',
    userName: '张三',
    purchaseDate: '2024-01-15',
    purchasePrice: 8500,
    bookValue: 7650,
    tagNumber: 'TAG-001',
    status: 'in_use',
  })
  await db.insert(assets).values({
    assetNo: 'AST-2024-002',
    name: '惠普笔记本ProBook 450',
    categoryId: 1,
    departmentId: 2,
    location: '财务楼1层102室',
    userId: 'U002',
    userName: '李四',
    purchaseDate: '2024-02-20',
    purchasePrice: 6800,
    bookValue: 6120,
    tagNumber: 'TAG-002',
    status: 'in_use',
  })
  await db.insert(assets).values({
    assetNo: 'AST-2023-003',
    name: '办公桌（木质）',
    categoryId: 2,
    departmentId: 3,
    location: '行政楼2层201室',
    userId: 'U003',
    userName: '王五',
    purchaseDate: '2023-06-10',
    purchasePrice: 1200,
    bookValue: 960,
    tagNumber: 'TAG-003',
    status: 'in_use',
  })
  await db.insert(assets).values({
    assetNo: 'AST-2023-004',
    name: '丰田凯美瑞轿车',
    categoryId: 3,
    departmentId: 3,
    location: '停车场A区',
    userId: 'U004',
    userName: '赵六',
    purchaseDate: '2023-03-15',
    purchasePrice: 220000,
    bookValue: 198000,
    tagNumber: 'TAG-004',
    status: 'in_use',
  })
  await db.insert(assets).values({
    assetNo: 'AST-2022-005',
    name: '电子显微镜',
    categoryId: 4,
    departmentId: 5,
    location: '生产车间B区',
    userId: 'U005',
    userName: '钱七',
    purchaseDate: '2022-08-20',
    purchasePrice: 150000,
    bookValue: 105000,
    tagNumber: 'TAG-005',
    status: 'in_use',
  })
  await db.insert(assets).values({
    assetNo: 'AST-2024-006',
    name: '联想ThinkPad X1',
    categoryId: 1,
    departmentId: 1,
    location: '研发楼3层302室',
    userId: 'U006',
    userName: '孙八',
    purchaseDate: '2024-03-10',
    purchasePrice: 12000,
    bookValue: 10800,
    tagNumber: 'TAG-006',
    status: 'lost',
  })
  await db.insert(assets).values({
    assetNo: 'AST-2023-007',
    name: '会议桌',
    categoryId: 2,
    departmentId: 1,
    location: '研发楼3层会议室',
    userId: 'U007',
    userName: '周九',
    purchaseDate: '2023-09-01',
    purchasePrice: 5000,
    bookValue: 4250,
    tagNumber: 'TAG-007',
    status: 'in_use',
  })
  await db.insert(assets).values({
    assetNo: 'AST-2024-008',
    name: '打印机HP LaserJet',
    categoryId: 5,
    departmentId: 2,
    location: '财务楼1层打印室',
    userId: 'U008',
    userName: '吴十',
    purchaseDate: '2024-04-05',
    purchasePrice: 2500,
    bookValue: 2250,
    tagNumber: '',
    status: 'in_use',
  })

  await db.insert(inventoryRecords).values({
    assetId: 1,
    inventoryDate: '2024-12-01',
    discrepancyTypeId: 1,
    actualStatus: 'in_use',
    actualLocation: '研发楼3层301室',
    actualUser: '张三',
    photoUrl: '',
    remarks: '账实一致，资产状态良好',
    recorderId: 'REC001',
    recorderName: '盘点员甲',
  })
  await db.insert(inventoryRecords).values({
    assetId: 6,
    inventoryDate: '2024-12-01',
    discrepancyTypeId: 2,
    actualStatus: 'lost',
    actualLocation: '',
    actualUser: '',
    photoUrl: '',
    remarks: '资产丢失，已报警处理',
    recorderId: 'REC001',
    recorderName: '盘点员甲',
  })
  await db.insert(inventoryRecords).values({
    assetId: 3,
    inventoryDate: '2024-12-02',
    discrepancyTypeId: 3,
    actualStatus: 'in_use',
    actualLocation: '研发楼3层303室',
    actualUser: '孙八',
    photoUrl: '',
    remarks: '已转移至研发部使用',
    recorderId: 'REC002',
    recorderName: '盘点员乙',
  })
  await db.insert(inventoryRecords).values({
    assetId: 8,
    inventoryDate: '2024-12-02',
    discrepancyTypeId: 4,
    actualStatus: 'in_use',
    actualLocation: '财务楼1层打印室',
    actualUser: '吴十',
    photoUrl: '',
    remarks: '资产标签丢失，需要重新打印',
    recorderId: 'REC002',
    recorderName: '盘点员乙',
  })
  await db.insert(inventoryRecords).values({
    assetId: 2,
    inventoryDate: '2024-12-03',
    discrepancyTypeId: 1,
    actualStatus: 'in_use',
    actualLocation: '财务楼1层102室',
    actualUser: '李四',
    photoUrl: '',
    remarks: '账实一致',
    recorderId: 'REC003',
    recorderName: '盘点员丙',
  })
  await db.insert(inventoryRecords).values({
    assetId: 4,
    inventoryDate: '2024-12-03',
    discrepancyTypeId: 5,
    actualStatus: 'in_use',
    actualLocation: '停车场B区',
    actualUser: '赵六',
    photoUrl: '',
    remarks: '车辆停放位置变更',
    recorderId: 'REC003',
    recorderName: '盘点员丙',
  })
  await db.insert(inventoryRecords).values({
    assetId: 5,
    inventoryDate: '2024-12-04',
    discrepancyTypeId: 6,
    actualStatus: 'in_use',
    actualLocation: '生产车间B区',
    actualUser: '郑十一',
    photoUrl: '',
    remarks: '使用人变更未登记',
    recorderId: 'REC001',
    recorderName: '盘点员甲',
  })
  await db.insert(inventoryRecords).values({
    assetId: 7,
    inventoryDate: '2024-12-04',
    discrepancyTypeId: 1,
    actualStatus: 'in_use',
    actualLocation: '研发楼3层会议室',
    actualUser: '周九',
    photoUrl: '',
    remarks: '账实一致',
    recorderId: 'REC002',
    recorderName: '盘点员乙',
  })

  await db.insert(disposalProcess).values({
    inventoryRecordId: 2,
    processType: 'scrap',
    departmentRemark: '资产丢失，建议启动追责流程',
    departmentApprovedAt: new Date('2024-12-05'),
    departmentApproverId: 'APP001',
    departmentApproverName: '部门经理',
    financeRemark: '已核实账面价值，同意报废处理',
    financeApprovedAt: new Date('2024-12-06'),
    financeApproverId: 'APP002',
    financeApproverName: '财务主管',
    supervisorRemark: '同意报废，同步启动追责',
    supervisorApprovedAt: new Date('2024-12-07'),
    supervisorApproverId: 'APP003',
    supervisorApproverName: '总经理',
    status: 'approved',
  })
  await db.insert(disposalProcess).values({
    inventoryRecordId: 3,
    processType: 'transfer',
    departmentRemark: '同意调拨至研发部',
    departmentApprovedAt: new Date('2024-12-05'),
    departmentApproverId: 'APP004',
    departmentApproverName: '行政经理',
    financeRemark: '账务已处理完毕',
    financeApprovedAt: new Date('2024-12-08'),
    financeApproverId: 'APP002',
    financeApproverName: '财务主管',
    supervisorRemark: '同意调拨',
    supervisorApprovedAt: new Date('2024-12-09'),
    supervisorApproverId: 'APP003',
    supervisorApproverName: '总经理',
    status: 'approved',
  })
  await db.insert(disposalProcess).values({
    inventoryRecordId: 4,
    processType: 'maintain',
    departmentRemark: '同意重新打印标签',
    departmentApprovedAt: new Date('2024-12-06'),
    departmentApproverId: 'APP002',
    departmentApproverName: '财务主管',
    status: 'pending',
  })
  await db.insert(disposalProcess).values({
    inventoryRecordId: 6,
    processType: 'update',
    departmentRemark: '位置信息已更新',
    departmentApprovedAt: new Date('2024-12-07'),
    departmentApproverId: 'APP005',
    departmentApproverName: '行政专员',
    status: 'pending',
  })
  await db.insert(disposalProcess).values({
    inventoryRecordId: 7,
    processType: 'update',
    departmentRemark: '使用人信息待更新',
    status: 'pending',
  })

  await db.insert(transferRecords).values({
    fromDepartmentId: 3,
    toDepartmentId: 1,
    transferDate: '2024-12-10',
    remarks: '办公桌椅调拨至研发部',
  })

  await db.insert(accountabilityRecords).values({
    inventoryRecordId: 2,
    responsibleUserId: 'U006',
    responsibleUserName: '孙八',
    investigationResult: '资产因保管不善丢失，责任人已确认',
    compensationAmount: '5000',
    status: 'pending',
  })

  console.log('Seeding completed successfully')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})