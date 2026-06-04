import { PrismaClient, RepairStatus, DeviceType, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const submitter = await prisma.user.upsert({
    where: { email: 'teacher@school.edu' },
    update: {},
    create: {
      name: '张老师',
      email: 'teacher@school.edu',
      role: UserRole.SUBMITTER,
    },
  })

  const technician1 = await prisma.user.upsert({
    where: { email: 'tech1@school.edu' },
    update: {},
    create: {
      name: '李师傅',
      email: 'tech1@school.edu',
      role: UserRole.TECHNICIAN,
    },
  })

  const technician2 = await prisma.user.upsert({
    where: { email: 'tech2@school.edu' },
    update: {},
    create: {
      name: '王师傅',
      email: 'tech2@school.edu',
      role: UserRole.TECHNICIAN,
    },
  })

  const inspector = await prisma.user.upsert({
    where: { email: 'inspector@school.edu' },
    update: {},
    create: {
      name: '刘验收',
      email: 'inspector@school.edu',
      role: UserRole.INSPECTOR,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      name: '管理员',
      email: 'admin@school.edu',
      role: UserRole.ADMIN,
    },
  })

  const now = new Date()

  const repair1 = await prisma.repairOrder.upsert({
    where: { orderNumber: 'REP-2024-0001' },
    update: {},
    create: {
      orderNumber: 'REP-2024-0001',
      title: '教学楼A302投影仪无法开机',
      description: '上午第一节课发现投影仪无法正常开机，电源指示灯不亮，检查过电源线连接正常。',
      deviceType: DeviceType.PROJECTOR,
      deviceLocation: '教学楼A栋 302教室',
      source: '教师在线报修',
      status: RepairStatus.PENDING_ACCEPTANCE,
      submitterId: submitter.id,
      technicianId: technician1.id,
      inspectorId: inspector.id,
      submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      assignedAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      images: [],
      logs: {
        create: [
          {
            technicianId: technician1.id,
            action: '检查故障',
            description: '到达现场检查，确认电源模块损坏',
            timeSpentMinutes: 30,
          },
          {
            technicianId: technician1.id,
            action: '更换电源模块',
            description: '更换新的电源模块，测试开机正常',
            partsUsed: '投影仪电源模块 x1',
            timeSpentMinutes: 60,
          },
          {
            technicianId: technician1.id,
            action: '调试完成',
            description: '调试投影效果，画面清晰，各项功能正常',
            timeSpentMinutes: 20,
          },
        ],
      },
    },
  })

  const repair2 = await prisma.repairOrder.upsert({
    where: { orderNumber: 'REP-2024-0002' },
    update: {},
    create: {
      orderNumber: 'REP-2024-0002',
      title: '教学楼B501投影仪灯泡告警',
      description: '投影仪显示灯泡寿命告警，画面偏暗，影响正常教学使用。',
      deviceType: DeviceType.PROJECTOR,
      deviceLocation: '教学楼B栋 501教室',
      source: '教学楼管理员上报',
      status: RepairStatus.PARTS_SHORTAGE,
      submitterId: submitter.id,
      technicianId: technician2.id,
      blockingReason: '投影仪灯泡型号缺货，供应商预计3天后到货',
      partsNeeded: '原装灯泡 PHILIPS UHP 245W',
      estimatedDelay: 3,
      submittedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      assignedAt: new Date(now.getTime() - 4.5 * 24 * 60 * 60 * 1000),
      images: [],
      logs: {
        create: [
          {
            technicianId: technician2.id,
            action: '现场检查',
            description: '确认灯泡已达到使用寿命，需要更换',
            timeSpentMinutes: 25,
          },
          {
            technicianId: technician2.id,
            action: '申请配件',
            description: '库存无此型号灯泡，已向供应商采购',
            timeSpentMinutes: 10,
          },
        ],
      },
    },
  })

  const repair3 = await prisma.repairOrder.upsert({
    where: { orderNumber: 'REP-2024-0003' },
    update: {},
    create: {
      orderNumber: 'REP-2024-0003',
      title: '教学楼A302投影仪再次故障',
      description: '上周刚维修过的投影仪今天又出现同样问题，无法开机。',
      deviceType: DeviceType.PROJECTOR,
      deviceLocation: '教学楼A栋 302教室',
      source: '教师在线报修',
      status: RepairStatus.IN_PROGRESS,
      submitterId: submitter.id,
      technicianId: technician1.id,
      reworkCount: 1,
      submittedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      assignedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      images: [],
      logs: {
        create: [
          {
            technicianId: technician1.id,
            action: '二次检查',
            description: '发现新更换的电源模块又损坏，可能存在电路问题',
            timeSpentMinutes: 45,
          },
        ],
      },
    },
  })

  const repair4 = await prisma.repairOrder.upsert({
    where: { orderNumber: 'REP-2024-0004' },
    update: {},
    create: {
      orderNumber: 'REP-2024-0004',
      title: '教学楼C201投影仪偏色',
      description: '投影画面偏红，白色显示不正常，影响PPT展示效果。',
      deviceType: DeviceType.PROJECTOR,
      deviceLocation: '教学楼C栋 201教室',
      source: '学生反馈',
      status: RepairStatus.REJECTED,
      submitterId: submitter.id,
      technicianId: technician1.id,
      inspectorId: inspector.id,
      reworkCount: 1,
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      assignedAt: new Date(now.getTime() - 6.5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      inspectedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      images: [],
      logs: {
        create: [
          {
            technicianId: technician1.id,
            action: '检查调试',
            description: '调整色彩设置，画面恢复正常',
            timeSpentMinutes: 35,
          },
        ],
      },
      inspections: {
        create: [
          {
            inspectorId: inspector.id,
            result: false,
            comments: '验收时发现偏色问题仍然存在，尤其是在显示白色背景时明显偏红。需要重新检查排线或LCD面板。',
          },
        ],
      },
    },
  })

  const repair5 = await prisma.repairOrder.upsert({
    where: { orderNumber: 'REP-2024-0005' },
    update: {},
    create: {
      orderNumber: 'REP-2024-0005',
      title: '教学楼D101电脑无法启动',
      description: '讲台电脑按下电源键无反应，检查电源插座正常。',
      deviceType: DeviceType.COMPUTER,
      deviceLocation: '教学楼D栋 101教室',
      source: '教学楼管理员上报',
      status: RepairStatus.ACCEPTED,
      submitterId: submitter.id,
      technicianId: technician2.id,
      inspectorId: inspector.id,
      submittedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      assignedAt: new Date(now.getTime() - 13.5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      inspectedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      archivedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      images: [],
      logs: {
        create: [
          {
            technicianId: technician2.id,
            action: '硬件检查',
            description: '发现电源供应器损坏',
            timeSpentMinutes: 40,
          },
          {
            technicianId: technician2.id,
            action: '更换电源',
            description: '更换ATX电源，测试正常启动',
            partsUsed: 'ATX 500W电源 x1',
            timeSpentMinutes: 50,
          },
        ],
      },
      inspections: {
        create: [
          {
            inspectorId: inspector.id,
            result: true,
            comments: '电脑启动正常，各项功能测试通过',
          },
        ],
      },
    },
  })

  const repair6 = await prisma.repairOrder.upsert({
    where: { orderNumber: 'REP-2024-0006' },
    update: {},
    create: {
      orderNumber: 'REP-2024-0006',
      title: '教学楼A201空调不制冷',
      description: '空调出风口只出风不制冷，室外机运转正常。',
      deviceType: DeviceType.AIR_CONDITIONER,
      deviceLocation: '教学楼A栋 201教室',
      source: '教师在线报修',
      status: RepairStatus.SUBMITTED,
      submitterId: submitter.id,
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      images: [],
    },
  })

  console.log('Seed data created successfully!')
  console.log('Users:', { submitter, technician1, technician2, inspector, admin })
  console.log('Repair orders created:', [repair1, repair2, repair3, repair4, repair5, repair6].map(r => r.orderNumber))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
