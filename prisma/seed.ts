import { PrismaClient, UserRole, RepairStatus, FacilityStatus, EnergyAbnormalStatus, SatisfactionLevel } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始播种数据...')

  await prisma.satisfactionSurvey.deleteMany()
  await prisma.energyAudit.deleteMany()
  await prisma.energyAbnormal.deleteMany()
  await prisma.energyRecord.deleteMany()
  await prisma.repairStatusLog.deleteMany()
  await prisma.repairItem.deleteMany()
  await prisma.repairOrder.deleteMany()
  await prisma.facility.deleteMany()
  await prisma.facilityCategory.deleteMany()
  await prisma.room.deleteMany()
  await prisma.building.deleteMany()
  await prisma.user.deleteMany()

  const users = await prisma.user.createManyAndReturn({
    data: [
      { email: 'admin@dorm.com', name: '张管理员', phone: '13800138001', role: UserRole.DORM_MANAGER },
      { email: 'worker1@dorm.com', name: '李师傅', phone: '13800138002', role: UserRole.MAINTENANCE_WORKER },
      { email: 'worker2@dorm.com', name: '王师傅', phone: '13800138003', role: UserRole.MAINTENANCE_WORKER },
      { email: 'energy@dorm.com', name: '刘能源', phone: '13800138004', role: UserRole.ENERGY_ADMIN },
      { email: 'student1@dorm.com', name: '学生小明', phone: '13800138005', role: UserRole.STUDENT },
      { email: 'student2@dorm.com', name: '学生小红', phone: '13800138006', role: UserRole.STUDENT },
    ],
  })
  console.log('创建用户:', users.length)

  const buildings = await prisma.building.createManyAndReturn({
    data: [
      { name: '1号楼', address: '东区', floorCount: 6, totalRooms: 24, description: '男生宿舍' },
      { name: '2号楼', address: '东区', floorCount: 6, totalRooms: 24, description: '女生宿舍' },
      { name: '3号楼', address: '西区', floorCount: 6, totalRooms: 24, description: '研究生宿舍' },
    ],
  })
  console.log('创建楼栋:', buildings.length)

  const rooms: { id: string; roomNumber: string; buildingId: string; floor: number }[] = []
  for (const building of buildings) {
    for (let floor = 1; floor <= building.floorCount; floor++) {
      for (let room = 1; room <= 4; room++) {
        const roomNumber = `${floor}0${room}`
        const createdRoom = await prisma.room.create({
          data: {
            roomNumber,
            buildingId: building.id,
            floor,
            studentIds: [],
          },
        })
        rooms.push(createdRoom)
      }
    }
  }
  console.log('创建房间:', rooms.length)

  const categories = await prisma.facilityCategory.createManyAndReturn({
    data: [
      { name: '水电设施', description: '包括水龙头、灯具、插座等' },
      { name: '家具设施', description: '包括床、桌子、椅子等' },
      { name: '空调设施', description: '空调、遥控器等' },
      { name: '卫浴设施', description: '淋浴、马桶等' },
      { name: '门窗设施', description: '门、窗、锁等' },
    ],
  })
  console.log('创建设施分类:', categories.length)

  const facilities: { id: string; categoryId: string; roomId: string }[] = []
  const facilityNames: Record<string, string[]> = {
    '水电设施': ['日光灯', '插座', '水龙头', '开关'],
    '家具设施': ['书桌', '椅子', '衣柜', '床架'],
    '空调设施': ['空调', '空调遥控器'],
    '卫浴设施': ['淋浴喷头', '马桶', '洗手池'],
    '门窗设施': ['房门', '窗户', '门锁'],
  }

  for (const category of categories) {
    for (let i = 0; i < 10; i++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)]
      const names = facilityNames[category.name] || ['设施']
      const facility = await prisma.facility.create({
        data: {
          name: names[Math.floor(Math.random() * names.length)],
          categoryId: category.id,
          roomId: room.id,
          status: Math.random() > 0.8 ? FacilityStatus.NEEDS_REPAIR : FacilityStatus.NORMAL,
          brand: ['美的', '格力', '海尔', 'TCL'][Math.floor(Math.random() * 4)],
        },
      })
      facilities.push(facility)
    }
  }
  console.log('创建设施:', facilities.length)

  const dormManager = users.find(u => u.role === UserRole.DORM_MANAGER)!
  const workers = users.filter(u => u.role === UserRole.MAINTENANCE_WORKER)
  const students = users.filter(u => u.role === UserRole.STUDENT)

  const repairOrders = []
  const repairTitles = [
    '水龙头漏水', '灯管不亮', '空调不制冷', '门锁坏了', '椅子松动',
    '窗户关不上', '马桶堵塞', '插座没电', '衣柜门掉了', '洗手池堵塞',
  ]

  for (let i = 0; i < 20; i++) {
    const room = rooms[Math.floor(Math.random() * rooms.length)]
    const category = categories[Math.floor(Math.random() * categories.length)]
    const statuses = Object.values(RepairStatus)
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const worker = status !== RepairStatus.PENDING ? workers[Math.floor(Math.random() * workers.length)] : null
    const student = students[Math.floor(Math.random() * students.length)]

    const order = await prisma.repairOrder.create({
      data: {
        title: repairTitles[Math.floor(Math.random() * repairTitles.length)],
        description: '报修内容详细描述，说明问题发生的时间、地点和具体情况。',
        roomId: room.id,
        categoryId: category.id,
        creatorId: student.id,
        assignedWorkerId: worker?.id,
        status,
        priority: Math.floor(Math.random() * 3) + 1,
        estimatedCost: status === RepairStatus.COMPLETED ? Math.random() * 200 : null,
        actualCost: status === RepairStatus.COMPLETED ? Math.random() * 200 : null,
        completedTime: status === RepairStatus.COMPLETED ? new Date() : null,
      },
    })
    repairOrders.push(order)

    await prisma.repairStatusLog.create({
      data: {
        repairOrderId: order.id,
        status: RepairStatus.PENDING,
        operatorId: student.id,
        remark: '提交报修申请',
      },
    })

    if (status !== RepairStatus.PENDING && worker) {
      await prisma.repairStatusLog.create({
        data: {
          repairOrderId: order.id,
          status: RepairStatus.ASSIGNED,
          operatorId: dormManager.id,
          remark: `已派单给 ${worker.name}`,
        },
      })
    }
  }
  console.log('创建报修单:', repairOrders.length)

  for (const order of repairOrders.filter(o => o.status === RepairStatus.COMPLETED).slice(0, 10)) {
    await prisma.satisfactionSurvey.create({
      data: {
        repairOrderId: order.id,
        satisfaction: Object.values(SatisfactionLevel)[Math.floor(Math.random() * 5)],
        responseTime: Math.floor(Math.random() * 5) + 1,
        serviceQuality: Math.floor(Math.random() * 5) + 1,
        repairQuality: Math.floor(Math.random() * 5) + 1,
        comment: Math.random() > 0.5 ? '维修师傅很专业，服务态度好！' : null,
      },
    })
  }
  console.log('创建满意度调查完成')

  const energyRecords = []
  for (const building of buildings) {
    for (let month = 1; month <= 6; month++) {
      const record = await prisma.energyRecord.create({
        data: {
          buildingId: building.id,
          recordDate: new Date(2024, month - 1, 1),
          electricityUsage: Math.random() * 5000 + 1000,
          waterUsage: Math.random() * 1000 + 200,
        },
      })
      energyRecords.push(record)
    }
  }
  console.log('创建能耗记录:', energyRecords.length)

  const energyAbnormals = []
  for (let i = 0; i < 15; i++) {
    const building = buildings[Math.floor(Math.random() * buildings.length)]
    const room = rooms[Math.floor(Math.random() * rooms.length)]
    const statuses = Object.values(EnergyAbnormalStatus)
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const abnormal = await prisma.energyAbnormal.create({
      data: {
        buildingId: building.id,
        roomId: Math.random() > 0.5 ? room.id : null,
        type: Math.random() > 0.5 ? '用电异常' : '用水异常',
        abnormalValue: Math.random() * 100 + 50,
        threshold: 30,
        status,
        detectedDate: new Date(),
        confirmedDate: status !== EnergyAbnormalStatus.DETECTED ? new Date() : null,
        resolvedDate: status === EnergyAbnormalStatus.RESOLVED ? new Date() : null,
        deductionAmount: status === EnergyAbnormalStatus.RESOLVED ? Math.random() * 100 : null,
        remark: '疑似存在能耗浪费情况，请核实。',
      },
    })
    energyAbnormals.push(abnormal)
  }
  console.log('创建能耗异常记录:', energyAbnormals.length)

  const energyAdmin = users.find(u => u.role === UserRole.ENERGY_ADMIN)!
  for (const abnormal of energyAbnormals.filter(a => a.status !== EnergyAbnormalStatus.DETECTED)) {
    await prisma.energyAudit.create({
      data: {
        abnormalId: abnormal.id,
        auditorId: energyAdmin.id,
        auditResult: abnormal.status === EnergyAbnormalStatus.DISMISSED ? '误报，已排除' : '确认异常，已处理',
        deductionApplied: abnormal.status === EnergyAbnormalStatus.RESOLVED,
        deductionAmount: abnormal.deductionAmount,
        remark: '已完成复核工作。',
      },
    })
  }
  console.log('创建能耗审核记录完成')

  console.log('数据播种完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
