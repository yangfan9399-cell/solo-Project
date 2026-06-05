import { PrismaClient, Role, RequisitionStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始清理数据...')
  await prisma.requisitionHistory.deleteMany()
  await prisma.requisition.deleteMany()
  await prisma.supplyBatch.deleteMany()
  await prisma.supply.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()

  console.log('创建科室...')
  const deptInternal = await prisma.department.create({
    data: { name: '内科' }
  })
  const deptSurgery = await prisma.department.create({
    data: { name: '外科' }
  })
  const deptWarehouse = await prisma.department.create({
    data: { name: '库房' }
  })

  console.log('创建用户...')
  const nurse1 = await prisma.user.create({
    data: {
      name: '张护士',
      role: Role.NURSE,
      departmentId: deptInternal.id
    }
  })

  const nurse2 = await prisma.user.create({
    data: {
      name: '李护士',
      role: Role.NURSE,
      departmentId: deptSurgery.id
    }
  })

  const warehouseAdmin = await prisma.user.create({
    data: {
      name: '王管理员',
      role: Role.WAREHOUSE_ADMIN,
      departmentId: deptWarehouse.id
    }
  })

  const reviewer1 = await prisma.user.create({
    data: {
      name: '刘复核',
      role: Role.DEPARTMENT_REVIEWER,
      departmentId: deptInternal.id
    }
  })

  const reviewer2 = await prisma.user.create({
    data: {
      name: '陈复核',
      role: Role.DEPARTMENT_REVIEWER,
      departmentId: deptSurgery.id
    }
  })

  console.log('创建耗材...')
  const syringe = await prisma.supply.create({
    data: {
      name: '一次性注射器',
      code: 'HC-001',
      spec: '5ml',
      unit: '支'
    }
  })

  const glove = await prisma.supply.create({
    data: {
      name: '医用手套',
      code: 'HC-002',
      spec: 'M号',
      unit: '副'
    }
  })

  const gauze = await prisma.supply.create({
    data: {
      name: '无菌纱布',
      code: 'HC-003',
      spec: '10x10cm',
      unit: '块'
    }
  })

  const catheter = await prisma.supply.create({
    data: {
      name: '导尿管',
      code: 'HC-004',
      spec: '16Fr',
      unit: '根'
    }
  })

  const futureDate = new Date()
  futureDate.setFullYear(futureDate.getFullYear() + 1)
  const pastDate = new Date()
  pastDate.setMonth(pastDate.getMonth() - 1)

  console.log('创建批次...')
  const batch1 = await prisma.supplyBatch.create({
    data: {
      supplyId: syringe.id,
      batchNumber: 'SYR-2024-001',
      quantity: 500,
      expiredAt: futureDate
    }
  })

  const batch2 = await prisma.supplyBatch.create({
    data: {
      supplyId: glove.id,
      batchNumber: 'GLO-2024-001',
      quantity: 5,
      expiredAt: futureDate
    }
  })

  const batch3 = await prisma.supplyBatch.create({
    data: {
      supplyId: gauze.id,
      batchNumber: 'GAU-2024-001',
      quantity: 200,
      expiredAt: pastDate
    }
  })

  const batch4 = await prisma.supplyBatch.create({
    data: {
      supplyId: catheter.id,
      batchNumber: 'CAT-2024-001',
      quantity: 100,
      expiredAt: futureDate
    }
  })

  console.log('创建领用记录 - 场景1: 正常核销流程...')
  const req1 = await prisma.requisition.create({
    data: {
      requisitionNo: 'REQ-2024-0001',
      supplyId: syringe.id,
      supplyBatchId: batch1.id,
      departmentId: deptInternal.id,
      nurseId: nurse1.id,
      warehouseAdminId: warehouseAdmin.id,
      reviewerId: reviewer1.id,
      applyQuantity: 10,
      actualQuantity: 10,
      status: RequisitionStatus.VERIFIED,
      usageDescription: '常规输液使用',
      outboundBasis: '库存充足，正常出库',
      reviewOpinion: '使用合理，同意核销'
    }
  })

  await prisma.requisitionHistory.createMany({
    data: [
      {
        requisitionId: req1.id,
        status: RequisitionStatus.PENDING,
        operatorId: nurse1.id,
        remark: '提交领用申请'
      },
      {
        requisitionId: req1.id,
        status: RequisitionStatus.OUTBOUND,
        operatorId: warehouseAdmin.id,
        remark: '确认出库'
      },
      {
        requisitionId: req1.id,
        status: RequisitionStatus.VERIFIED,
        operatorId: reviewer1.id,
        remark: '完成核销'
      }
    ]
  })

  console.log('创建领用记录 - 场景2: 库存不足...')
  const req2 = await prisma.requisition.create({
    data: {
      requisitionNo: 'REQ-2024-0002',
      supplyId: glove.id,
      supplyBatchId: batch2.id,
      departmentId: deptInternal.id,
      nurseId: nurse1.id,
      applyQuantity: 10,
      status: RequisitionStatus.PENDING,
      usageDescription: '手术准备使用'
    }
  })

  await prisma.requisitionHistory.create({
    data: {
      requisitionId: req2.id,
      status: RequisitionStatus.PENDING,
      operatorId: nurse1.id,
      remark: '提交领用申请'
    }
  })

  console.log('创建领用记录 - 场景3: 科室权限不符...')
  const req3 = await prisma.requisition.create({
    data: {
      requisitionNo: 'REQ-2024-0003',
      supplyId: catheter.id,
      supplyBatchId: batch4.id,
      departmentId: deptInternal.id,
      nurseId: nurse2.id,
      applyQuantity: 5,
      status: RequisitionStatus.REJECTED,
      usageDescription: '导尿术使用'
    }
  })

  await prisma.requisitionHistory.createMany({
    data: [
      {
        requisitionId: req3.id,
        status: RequisitionStatus.PENDING,
        operatorId: nurse2.id,
        remark: '提交领用申请'
      },
      {
        requisitionId: req3.id,
        status: RequisitionStatus.REJECTED,
        operatorId: warehouseAdmin.id,
        remark: '申请人科室与申请科室不符，拒绝申请'
      }
    ]
  })

  console.log('创建领用记录 - 场景4: 批次过期...')
  const req4 = await prisma.requisition.create({
    data: {
      requisitionNo: 'REQ-2024-0004',
      supplyId: gauze.id,
      supplyBatchId: batch3.id,
      departmentId: deptSurgery.id,
      nurseId: nurse2.id,
      applyQuantity: 20,
      status: RequisitionStatus.PENDING,
      usageDescription: '伤口换药使用'
    }
  })

  await prisma.requisitionHistory.create({
    data: {
      requisitionId: req4.id,
      status: RequisitionStatus.PENDING,
      operatorId: nurse2.id,
      remark: '提交领用申请'
    }
  })

  console.log('种子数据创建完成！')
  console.log('====================================')
  console.log('场景说明:')
  console.log('1. REQ-2024-0001: 正常核销 - 已完成全流程')
  console.log('2. REQ-2024-0002: 库存不足 - 申请10副，库存仅5副')
  console.log('3. REQ-2024-0003: 科室权限不符 - 外科护士申请内科领用')
  console.log('4. REQ-2024-0004: 批次过期 - 所选批次已过期')
  console.log('====================================')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
