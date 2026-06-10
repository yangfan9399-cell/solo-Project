import { db } from './index'
import {
  suppliers,
  partCategories,
  parts,
  defectTypes,
  batches,
  claims,
  claimEvidences,
  claimHistory,
  supplierResponses
} from './schema'

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

async function seed() {
  const supplierData = await db.insert(suppliers).values([
    { name: '上海精密机械有限公司', contact: '张伟', phone: '13812345678', email: 'zhang.wei@shprecision.com', address: '上海市浦东新区张江高科技园区' },
    { name: '广州汽车零部件有限公司', contact: '李明', phone: '13987654321', email: 'li.ming@gzauto.com', address: '广州市天河区工业园' },
    { name: '武汉金属制品有限公司', contact: '王芳', phone: '13724681357', email: 'wang.fang@whmetal.com', address: '武汉市东湖新技术开发区' },
    { name: '成都电子科技有限公司', contact: '陈强', phone: '13697538642', email: 'chen.qiang@cdtech.com', address: '成都市高新区' }
  ]).returning()

  const categoryData = await db.insert(partCategories).values([
    { name: '发动机部件' },
    { name: '底盘系统' },
    { name: '电子元件' },
    { name: '车身覆盖件' }
  ]).returning()

  const partData = await db.insert(parts).values([
    { partNumber: 'ENG-001', name: '凸轮轴', categoryId: categoryData[0].id, unitPrice: '850.00' },
    { partNumber: 'ENG-002', name: '活塞环', categoryId: categoryData[0].id, unitPrice: '120.00' },
    { partNumber: 'CHS-001', name: '减震器', categoryId: categoryData[1].id, unitPrice: '380.00' },
    { partNumber: 'CHS-002', name: '悬挂臂', categoryId: categoryData[1].id, unitPrice: '520.00' },
    { partNumber: 'ELC-001', name: '传感器', categoryId: categoryData[2].id, unitPrice: '280.00' },
    { partNumber: 'BDY-001', name: '前保险杠', categoryId: categoryData[3].id, unitPrice: '680.00' }
  ]).returning()

  const defectData = await db.insert(defectTypes).values([
    { name: '尺寸偏差', description: '零件尺寸不符合图纸要求' },
    { name: '表面缺陷', description: '表面划痕、凹陷、锈蚀等' },
    { name: '材料缺陷', description: '材料成分或性能不达标' },
    { name: '装配不良', description: '装配工艺问题导致的缺陷' },
    { name: '功能故障', description: '零件功能无法正常实现' }
  ]).returning()

  const batchRecords = [
    { batchNumber: 'B202401001', partId: partData[0].id, supplierId: supplierData[0].id, productionDate: toDateString(new Date('2024-01-15')), quantity: 500, receivedDate: toDateString(new Date('2024-01-25')), traceable: true },
    { batchNumber: 'B202402001', partId: partData[2].id, supplierId: supplierData[1].id, productionDate: toDateString(new Date('2024-02-10')), quantity: 300, receivedDate: toDateString(new Date('2024-02-20')), traceable: true },
    { batchNumber: 'B202403001', partId: partData[4].id, supplierId: supplierData[2].id, productionDate: toDateString(new Date('2024-03-05')), quantity: 1000, receivedDate: toDateString(new Date('2024-03-15')), traceable: false },
    { batchNumber: 'B202404001', partId: partData[1].id, supplierId: supplierData[3].id, productionDate: toDateString(new Date('2024-04-01')), quantity: 800, receivedDate: toDateString(new Date('2024-04-10')), traceable: true }
  ]

  const batchData = []
  for (const record of batchRecords) {
    const result = await db.insert(batches).values(record).returning()
    batchData.push(result[0])
  }

  const claimRecords = [
    {
      batchId: batchData[0].id,
      defectTypeId: defectData[0].id,
      quantityDefective: 15,
      claimAmount: '12750.00',
      description: '凸轮轴尺寸超出公差范围，影响装配精度',
      status: 'completed' as const,
      batchTraceable: true,
      repairDeadline: toDateString(new Date('2024-02-10')),
      repairCompleted: true,
      engineerName: '赵工程师'
    },
    {
      batchId: batchData[1].id,
      defectTypeId: defectData[1].id,
      quantityDefective: 8,
      claimAmount: '3040.00',
      description: '减震器表面存在明显划痕，影响产品外观',
      status: 'supplier_response' as const,
      batchTraceable: true,
      repairDeadline: toDateString(new Date('2024-03-01')),
      repairCompleted: false,
      engineerName: '孙工程师'
    },
    {
      batchId: batchData[2].id,
      defectTypeId: defectData[2].id,
      quantityDefective: 25,
      claimAmount: '7000.00',
      description: '传感器材料性能不达标，导致信号不稳定',
      status: 'under_review' as const,
      batchTraceable: false,
      engineerName: '周工程师'
    },
    {
      batchId: batchData[3].id,
      defectTypeId: defectData[4].id,
      quantityDefective: 40,
      claimAmount: '4800.00',
      description: '活塞环安装后无法正常工作，导致发动机异响',
      status: 'under_review' as const,
      batchTraceable: true,
      repairDeadline: toDateString(new Date('2024-04-20')),
      repairCompleted: false,
      engineerName: '吴工程师'
    }
  ]

  const claimData = []
  for (const record of claimRecords) {
    const result = await db.insert(claims).values(record).returning()
    claimData.push(result[0])
  }

  await db.insert(claimEvidences).values([
    { claimId: claimData[0].id, type: '检测报告', url: '/evidence/report1.pdf', description: '第三方检测机构出具的尺寸检测报告' },
    { claimId: claimData[0].id, type: '照片', url: '/evidence/photo1.jpg', description: '缺陷部位实拍照片' },
    { claimId: claimData[1].id, type: '照片', url: '/evidence/photo2.jpg', description: '减震器表面划痕照片' },
    { claimId: claimData[2].id, type: '检测报告', url: '/evidence/report2.pdf', description: '材料成分分析报告' },
    { claimId: claimData[3].id, type: '视频', url: '/evidence/video1.mp4', description: '发动机异响视频记录' }
  ])

  await db.insert(claimHistory).values([
    { claimId: claimData[0].id, status: 'pending', comment: '质量工程师登记问题', operator: '赵工程师', createdAt: new Date('2024-01-28') },
    { claimId: claimData[0].id, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: new Date('2024-01-29') },
    { claimId: claimData[0].id, status: 'supplier_response', comment: '供应商确认问题', operator: '系统', createdAt: new Date('2024-02-01') },
    { claimId: claimData[0].id, status: 'under_review', comment: '进入财务复核', operator: '财务部', createdAt: new Date('2024-02-05') },
    { claimId: claimData[0].id, status: 'approved', comment: '索赔金额已确认', operator: '财务部', createdAt: new Date('2024-02-08') },
    { claimId: claimData[0].id, status: 'payment_processing', comment: '扣款处理中', operator: '财务部', createdAt: new Date('2024-02-09') },
    { claimId: claimData[0].id, status: 'completed', comment: '扣款完成', operator: '财务部', createdAt: new Date('2024-02-10') },
    { claimId: claimData[1].id, status: 'pending', comment: '质量工程师登记问题', operator: '孙工程师', createdAt: new Date('2024-02-25') },
    { claimId: claimData[1].id, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: new Date('2024-02-26') },
    { claimId: claimData[1].id, status: 'supplier_response', comment: '供应商提出反驳', operator: '系统', createdAt: new Date('2024-02-28') },
    { claimId: claimData[2].id, status: 'pending', comment: '质量工程师登记问题', operator: '周工程师', createdAt: new Date('2024-03-20') },
    { claimId: claimData[2].id, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: new Date('2024-03-21') },
    { claimId: claimData[2].id, status: 'under_review', comment: '批次追溯失败，需补充证据', operator: '财务部', createdAt: new Date('2024-03-25') },
    { claimId: claimData[3].id, status: 'pending', comment: '质量工程师登记问题', operator: '吴工程师', createdAt: new Date('2024-04-12') },
    { claimId: claimData[3].id, status: 'supplier_notified', comment: '采购已联系供应商', operator: '采购部', createdAt: new Date('2024-04-13') },
    { claimId: claimData[3].id, status: 'supplier_response', comment: '供应商同意返修', operator: '系统', createdAt: new Date('2024-04-15') },
    { claimId: claimData[3].id, status: 'under_review', comment: '返修超期，待处理', operator: '财务部', createdAt: new Date('2024-04-21') }
  ])

  await db.insert(supplierResponses).values([
    { claimId: claimData[1].id, responseType: 'reject', comment: '划痕为运输过程中造成，非我方责任，附有物流证明', evidenceUrl: '/evidence/logistics.pdf' },
    { claimId: claimData[3].id, responseType: 'accept', comment: '同意返修方案，正在安排人员处理', evidenceUrl: null }
  ])

  console.log('Seed data inserted successfully!')
}

seed().catch(console.error)
