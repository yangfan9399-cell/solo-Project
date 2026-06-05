import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始播种数据...')

  const operator = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '张经办',
      role: 'OPERATOR'
    }
  })

  const reviewer = await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '李复核',
      role: 'REVIEWER'
    }
  })

  console.log('用户创建完成')

  const touristsData = [
    {
      name: '王明',
      passportNo: 'E12345678',
      passportExpire: new Date('2028-12-31'),
      birthDate: new Date('1990-05-15'),
      phone: '13800138001',
      materials: [
        { type: '护照', status: 'COMPLETE', fileName: 'passport_001.pdf' },
        { type: '照片', status: 'COMPLETE', fileName: 'photo_001.jpg' },
        { type: '在职证明', status: 'COMPLETE', fileName: 'employment_001.pdf' },
        { type: '银行流水', status: 'COMPLETE', fileName: 'bank_001.pdf' }
      ]
    },
    {
      name: '李华',
      passportNo: 'E87654321',
      passportExpire: new Date('2024-03-15'),
      birthDate: new Date('1985-08-20'),
      phone: '13800138002',
      materials: [
        { type: '护照', status: 'EXPIRED', fileName: 'passport_002.pdf', notes: '护照已过期，需换证' },
        { type: '照片', status: 'COMPLETE', fileName: 'photo_002.jpg' },
        { type: '在职证明', status: 'COMPLETE', fileName: 'employment_002.pdf' },
        { type: '银行流水', status: 'PENDING', notes: '待补充' }
      ]
    },
    {
      name: '张伟',
      passportNo: 'E11223344',
      passportExpire: new Date('2029-06-20'),
      birthDate: new Date('1992-11-30'),
      phone: '13800138003',
      materials: [
        { type: '护照', status: 'COMPLETE', fileName: 'passport_003.pdf' },
        { type: '照片', status: 'REJECTED', fileName: 'photo_003.jpg', notes: '照片规格不符，需重新提供2寸白底照片' },
        { type: '在职证明', status: 'COMPLETE', fileName: 'employment_003.pdf' },
        { type: '银行流水', status: 'COMPLETE', fileName: 'bank_003.pdf' }
      ]
    },
    {
      name: '陈静',
      passportNo: 'E55667788',
      passportExpire: new Date('2027-09-10'),
      birthDate: new Date('1988-02-25'),
      phone: '13800138004',
      materials: [
        { type: '护照', status: 'COMPLETE', fileName: 'passport_004.pdf' },
        { type: '照片', status: 'COMPLETE', fileName: 'photo_004.jpg' },
        { type: '在职证明', status: 'COMPLETE', fileName: 'employment_004.pdf' },
        { type: '银行流水', status: 'COMPLETE', fileName: 'bank_004.pdf' }
      ]
    },
    {
      name: '刘强',
      passportNo: 'E99001122',
      passportExpire: new Date('2026-01-05'),
      birthDate: new Date('1995-07-12'),
      phone: '13800138005',
      materials: [
        { type: '护照', status: 'EXPIRING_SOON', fileName: 'passport_005.pdf', notes: '护照半年内过期，建议换证' },
        { type: '照片', status: 'COMPLETE', fileName: 'photo_005.jpg' },
        { type: '在职证明', status: 'PENDING', notes: '待补充' },
        { type: '银行流水', status: 'COMPLETE', fileName: 'bank_005.pdf' }
      ]
    },
    {
      name: '赵芳',
      passportNo: 'E33445566',
      passportExpire: new Date('2028-04-18'),
      birthDate: new Date('1991-03-22'),
      phone: '13800138006',
      materials: [
        { type: '护照', status: 'COMPLETE', fileName: 'passport_006.pdf' },
        { type: '照片', status: 'COMPLETE', fileName: 'photo_006.jpg' },
        { type: '在职证明', status: 'COMPLETE', fileName: 'employment_006.pdf' },
        { type: '银行流水', status: 'COMPLETE', fileName: 'bank_006.pdf' }
      ]
    }
  ]

  const tourists = []
  for (const t of touristsData) {
    const tourist = await prisma.tourist.upsert({
      where: { passportNo: t.passportNo },
      update: {},
      create: {
        name: t.name,
        passportNo: t.passportNo,
        passportExpire: t.passportExpire,
        birthDate: t.birthDate,
        phone: t.phone,
        materials: {
          create: t.materials
        }
      }
    })
    tourists.push(tourist)
    console.log(`游客 ${t.name} 创建完成`)
  }

  const batch1 = await prisma.visaBatch.upsert({
    where: { batchNo: 'JP202406001' },
    update: {},
    create: {
      batchNo: 'JP202406001',
      country: '日本',
      status: 'PENDING_REVIEW',
      createdById: operator.id,
      tourists: {
        create: [
          { touristId: tourists[0].id, visaResult: null },
          { touristId: tourists[1].id, visaResult: null, notes: '护照过期需处理' },
          { touristId: tourists[2].id, visaResult: null }
        ]
      }
    }
  })

  await prisma.auditLog.createMany({
    data: [
      { batchId: batch1.id, userId: operator.id, action: 'CREATE_BATCH', notes: '创建日本签证批次' },
      { batchId: batch1.id, userId: operator.id, action: 'ADD_TOURIST', notes: '添加王明、李华、张伟' }
    ]
  })

  const batch2 = await prisma.visaBatch.upsert({
    where: { batchNo: 'KR202406002' },
    update: {},
    create: {
      batchNo: 'KR202406002',
      country: '韩国',
      status: 'SUBMITTED',
      submitDate: new Date('2024-06-01'),
      createdById: operator.id,
      reviewedById: reviewer.id,
      tourists: {
        create: [
          { touristId: tourists[3].id, visaResult: 'APPROVED' },
          { touristId: tourists[5].id, visaResult: 'PENDING', notes: '出签结果待补' }
        ]
      }
    }
  })

  await prisma.auditLog.createMany({
    data: [
      { batchId: batch2.id, userId: operator.id, action: 'CREATE_BATCH', notes: '创建韩国签证批次' },
      { batchId: batch2.id, userId: reviewer.id, action: 'SUBMIT', notes: '确认递签' }
    ]
  })

  const batch3 = await prisma.visaBatch.upsert({
    where: { batchNo: 'TH202405001' },
    update: {},
    create: {
      batchNo: 'TH202405001',
      country: '泰国',
      status: 'ARCHIVED',
      submitDate: new Date('2024-05-10'),
      createdById: operator.id,
      reviewedById: reviewer.id,
      tourists: {
        create: [
          { touristId: tourists[4].id, visaResult: 'APPROVED', notes: '已出签' }
        ]
      }
    }
  })

  await prisma.auditLog.createMany({
    data: [
      { batchId: batch3.id, userId: operator.id, action: 'CREATE_BATCH', notes: '创建泰国签证批次' },
      { batchId: batch3.id, userId: reviewer.id, action: 'SUBMIT', notes: '确认递签' },
      { batchId: batch3.id, userId: reviewer.id, action: 'ARCHIVE', notes: '归档完成' }
    ]
  })

  const batch4 = await prisma.visaBatch.upsert({
    where: { batchNo: 'SG202406003' },
    update: {},
    create: {
      batchNo: 'SG202406003',
      country: '新加坡',
      status: 'REJECTED',
      createdById: operator.id,
      reviewedById: reviewer.id,
      tourists: {
        create: [
          { touristId: tourists[1].id, visaResult: null, notes: '因护照过期被退回' }
        ]
      }
    }
  })

  await prisma.auditLog.createMany({
    data: [
      { batchId: batch4.id, userId: operator.id, action: 'CREATE_BATCH', notes: '创建新加坡签证批次' },
      { batchId: batch4.id, userId: reviewer.id, action: 'REJECT', notes: '护照过期，退回补证' }
    ]
  })

  console.log('所有批次创建完成')
  console.log('数据播种完成!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
