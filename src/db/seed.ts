import { db } from './index'
import {
  residents,
  meters,
  inspections,
  hazards,
  rectifications,
  appointments,
  historyNodes,
} from './schema'

async function seed() {
  const resident1 = await db
    .insert(residents)
    .values({
      name: '张三',
      phone: '13800138001',
      address: '阳光小区1栋302室',
      community: '阳光小区',
      building: '1栋',
      floor: 3,
      room: '302',
    })
    .returning()

  const resident2 = await db
    .insert(residents)
    .values({
      name: '李四',
      phone: '13800138002',
      address: '阳光小区2栋501室',
      community: '阳光小区',
      building: '2栋',
      floor: 5,
      room: '501',
    })
    .returning()

  const resident3 = await db
    .insert(residents)
    .values({
      name: '王五',
      phone: '13800138003',
      address: '花园小区3栋203室',
      community: '花园小区',
      building: '3栋',
      floor: 2,
      room: '203',
    })
    .returning()

  const resident4 = await db
    .insert(residents)
    .values({
      name: '赵六',
      phone: '13800138004',
      address: '花园小区1栋802室',
      community: '花园小区',
      building: '1栋',
      floor: 8,
      room: '802',
    })
    .returning()

  const meter1 = await db
    .insert(meters)
    .values({
      residentId: resident1[0].id,
      meterNumber: 'M20240001',
      installationDate: '2020-05-15',
      location: '厨房',
    })
    .returning()

  const meter2 = await db
    .insert(meters)
    .values({
      residentId: resident2[0].id,
      meterNumber: 'M20240002',
      installationDate: '2021-03-20',
      location: '厨房',
    })
    .returning()

  const meter3 = await db
    .insert(meters)
    .values({
      residentId: resident3[0].id,
      meterNumber: 'M20240003',
      installationDate: '2019-11-10',
      location: '厨房',
    })
    .returning()

  const meter4 = await db
    .insert(meters)
    .values({
      residentId: resident4[0].id,
      meterNumber: 'M20240004',
      installationDate: '2022-01-05',
      location: '厨房',
    })
    .returning()

  const inspection1 = await db
    .insert(inspections)
    .values({
      residentId: resident1[0].id,
      meterId: meter1[0].id,
      inspectorName: '李明',
      inspectionDate: '2024-06-01',
      status: 'completed',
      notes: '安检通过，无安全隐患',
    })
    .returning()

  await db.insert(historyNodes).values({
    inspectionId: inspection1[0].id,
    type: 'inspection',
    title: '安检完成',
    description: '安检员李明完成入户安检，未发现隐患',
    operator: '李明',
  })

  const inspection2 = await db
    .insert(inspections)
    .values({
      residentId: resident2[0].id,
      meterId: meter2[0].id,
      inspectorName: '王强',
      inspectionDate: '2024-06-02',
      status: 'completed',
      notes: '发现软管老化问题',
    })
    .returning()

  await db.insert(historyNodes).values({
    inspectionId: inspection2[0].id,
    type: 'inspection',
    title: '安检发现隐患',
    description: '安检员王强发现燃气软管老化，建议更换',
    operator: '王强',
  })

  const hazard2 = await db
    .insert(hazards)
    .values({
      inspectionId: inspection2[0].id,
      type: 'hose_aging',
      level: 'medium',
      description: '燃气软管使用超过5年，出现老化龟裂现象',
    })
    .returning()

  await db.insert(appointments).values({
    inspectionId: inspection2[0].id,
    residentId: resident2[0].id,
    servicePersonName: '张丽',
    scheduledDate: '2024-06-05',
    status: 'completed',
    notes: '用户已确认预约时间',
  })

  await db.insert(historyNodes).values({
    inspectionId: inspection2[0].id,
    type: 'appointment',
    title: '预约成功',
    description: '客服张丽已与用户确认整改预约时间',
    operator: '张丽',
  })

  await db.insert(rectifications).values({
    hazardId: hazard2[0].id,
    status: 'completed',
    repairmanName: '刘师傅',
    repairDate: '2024-06-05',
    description: '已更换新的燃气软管，长度1.5米',
  })

  await db.insert(historyNodes).values({
    inspectionId: inspection2[0].id,
    type: 'rectification',
    title: '整改完成',
    description: '维修师傅刘师傅已完成软管更换',
    operator: '刘师傅',
  })

  await db.insert(historyNodes).values({
    inspectionId: inspection2[0].id,
    type: 'review',
    title: '复核通过',
    description: '复核员确认整改合格',
    operator: '赵主管',
  })

  const inspection3 = await db
    .insert(inspections)
    .values({
      residentId: resident3[0].id,
      meterId: meter3[0].id,
      inspectorName: '李明',
      inspectionDate: '2024-06-03',
      status: 'rejected',
      notes: '用户拒绝入户检查',
    })
    .returning()

  await db.insert(historyNodes).values({
    inspectionId: inspection3[0].id,
    type: 'inspection',
    title: '用户拒检',
    description: '用户王五拒绝安检员李明入户检查',
    operator: '李明',
  })

  await db.insert(appointments).values({
    inspectionId: inspection3[0].id,
    residentId: resident3[0].id,
    servicePersonName: '张丽',
    scheduledDate: '2024-06-10',
    status: 'pending',
    notes: '二次预约待确认',
    isSecondAttempt: true,
  })

  await db.insert(historyNodes).values({
    inspectionId: inspection3[0].id,
    type: 'appointment',
    title: '二次预约',
    description: '客服张丽已发起二次预约，发送风险提示通知',
    operator: '张丽',
  })

  const inspection4 = await db
    .insert(inspections)
    .values({
      residentId: resident4[0].id,
      meterId: meter4[0].id,
      inspectorName: '王强',
      inspectionDate: '2024-05-20',
      status: 'completed',
      notes: '发现泄漏隐患，整改逾期',
    })
    .returning()

  await db.insert(historyNodes).values({
    inspectionId: inspection4[0].id,
    type: 'inspection',
    title: '安检发现隐患',
    description: '安检员王强发现燃气泄漏隐患',
    operator: '王强',
  })

  const hazard4 = await db
    .insert(hazards)
    .values({
      inspectionId: inspection4[0].id,
      type: 'leak',
      level: 'critical',
      description: '燃气表接口处有明显泄漏，存在重大安全隐患',
    })
    .returning()

  await db.insert(appointments).values({
    inspectionId: inspection4[0].id,
    residentId: resident4[0].id,
    servicePersonName: '张丽',
    scheduledDate: '2024-05-25',
    status: 'completed',
    notes: '用户已确认预约',
  })

  await db.insert(historyNodes).values({
    inspectionId: inspection4[0].id,
    type: 'appointment',
    title: '预约成功',
    description: '客服张丽已与用户确认整改预约',
    operator: '张丽',
  })

  await db.insert(rectifications).values({
    hazardId: hazard4[0].id,
    status: 'overdue',
    repairmanName: '刘师傅',
    repairDate: '2024-05-25',
    description: '整改逾期，用户未开门',
  })

  await db.insert(historyNodes).values({
    inspectionId: inspection4[0].id,
    type: 'rectification',
    title: '整改逾期',
    description: '维修师傅刘师傅上门但用户未开门，整改逾期',
    operator: '刘师傅',
  })

  console.log('Seed data inserted successfully')
}

seed().catch((err) => {
  console.error('Error seeding data:', err)
  process.exit(1)
})
