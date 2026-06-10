import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.historyNode.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.maintenancePlan.deleteMany();
  await prisma.fault.deleteMany();
  await prisma.elevator.deleteMany();
  await prisma.building.deleteMany();
  await prisma.community.deleteMany();
  await prisma.maintenanceUnit.deleteMany();

  // Create communities
  const community1 = await prisma.community.create({
    data: {
      name: "阳光花园",
      address: "上海市浦东新区张江镇科苑路88号",
    },
  });

  const community2 = await prisma.community.create({
    data: {
      name: "幸福里",
      address: "上海市静安区南京西路1266号",
    },
  });

  const community3 = await prisma.community.create({
    data: {
      name: "锦绣城",
      address: "上海市徐汇区漕河泾开发区桂平路100号",
    },
  });

  // Create buildings
  const building1 = await prisma.building.create({
    data: {
      name: "1号楼",
      communityId: community1.id,
    },
  });

  const building2 = await prisma.building.create({
    data: {
      name: "2号楼",
      communityId: community2.id,
    },
  });

  const building3 = await prisma.building.create({
    data: {
      name: "3号楼",
      communityId: community3.id,
    },
  });

  const building4 = await prisma.building.create({
    data: {
      name: "5号楼",
      communityId: community1.id,
    },
  });

  const building5 = await prisma.building.create({
    data: {
      name: "6号楼",
      communityId: community2.id,
    },
  });

  const building6 = await prisma.building.create({
    data: {
      name: "8号楼",
      communityId: community3.id,
    },
  });

  // Create maintenance units
  const unit1 = await prisma.maintenanceUnit.create({
    data: {
      name: "东方电梯维保公司",
      contact: "021-58881234",
    },
  });

  const unit2 = await prisma.maintenanceUnit.create({
    data: {
      name: "中电梯业服务",
      contact: "021-58882345",
    },
  });

  const unit3 = await prisma.maintenanceUnit.create({
    data: {
      name: "安达电梯维护",
      contact: "021-58883456",
    },
  });

  const unit4 = await prisma.maintenanceUnit.create({
    data: {
      name: "顺发电梯保养",
      contact: "021-58884567",
    },
  });

  // Create elevators
  const elevator1 = await prisma.elevator.create({
    data: {
      code: "YG-1A",
      model: "日立HGS-1000",
      buildingId: building1.id,
      installDate: new Date("2020-06-15"),
      status: "维保中",
    },
  });

  const elevator2 = await prisma.elevator.create({
    data: {
      code: "YG-5B",
      model: "三菱GPS-III",
      buildingId: building4.id,
      installDate: new Date("2019-03-20"),
      status: "正常",
    },
  });

  const elevator3 = await prisma.elevator.create({
    data: {
      code: "XFL-2A",
      model: "奥的斯Gen2",
      buildingId: building2.id,
      installDate: new Date("2021-08-10"),
      status: "故障",
    },
  });

  const elevator4 = await prisma.elevator.create({
    data: {
      code: "XFL-6B",
      model: "蒂森克虏伯TAC32",
      buildingId: building5.id,
      installDate: new Date("2018-11-25"),
      status: "正常",
    },
  });

  const elevator5 = await prisma.elevator.create({
    data: {
      code: "JC-3A",
      model: "通力MonoSpace500",
      buildingId: building3.id,
      installDate: new Date("2022-01-05"),
      status: "正常",
    },
  });

  const elevator6 = await prisma.elevator.create({
    data: {
      code: "JC-8B",
      model: "富士达FLAIR",
      buildingId: building6.id,
      installDate: new Date("2020-09-30"),
      status: "正常",
    },
  });

  // Create maintenance plans
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Normal maintenance - in progress
  const plan1 = await prisma.maintenancePlan.create({
    data: {
      elevatorId: elevator1.id,
      maintenanceUnitId: unit1.id,
      planDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      dueDate: twoDaysLater,
      status: "执行中",
      riskLevel: "正常",
    },
  });

  // Overdue maintenance - 5 days overdue
  const plan2 = await prisma.maintenancePlan.create({
    data: {
      elevatorId: elevator2.id,
      maintenanceUnitId: unit2.id,
      planDate: tenDaysAgo,
      dueDate: fiveDaysAgo,
      status: "待执行",
      riskLevel: "危险",
    },
  });

  // Plan pending review
  const plan3 = await prisma.maintenancePlan.create({
    data: {
      elevatorId: elevator4.id,
      maintenanceUnitId: unit3.id,
      planDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: "待复查",
      riskLevel: "正常",
    },
  });

  // Archived plan
  const plan4 = await prisma.maintenancePlan.create({
    data: {
      elevatorId: elevator5.id,
      maintenanceUnitId: unit4.id,
      planDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: "已归档",
      riskLevel: "正常",
    },
  });

  // Returned plan
  const plan5 = await prisma.maintenancePlan.create({
    data: {
      elevatorId: elevator6.id,
      maintenanceUnitId: unit1.id,
      planDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: "退回修改",
      riskLevel: "警告",
    },
  });

  // Create maintenance records for plan1 and plan3
  await prisma.maintenanceRecord.create({
    data: {
      planId: plan1.id,
      maintenanceUnitId: unit1.id,
      items: JSON.stringify([
        { item: "曳引机检查", result: "正常" },
        { item: "制动器检查", result: "正常" },
        { item: "门机系统检查", result: "正常" },
        { item: "安全钳检查", result: "正常" },
      ]),
      submitDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      attachmentUrl: "/uploads/maintenance-1.jpg",
    },
  });

  await prisma.maintenanceRecord.create({
    data: {
      planId: plan3.id,
      maintenanceUnitId: unit3.id,
      items: JSON.stringify([
        { item: "曳引机检查", result: "正常" },
        { item: "制动器检查", result: "需调整" },
        { item: "门机系统检查", result: "正常" },
        { item: "导轨检查", result: "正常" },
      ]),
      submitDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      attachmentUrl: "/uploads/maintenance-3.jpg",
    },
  });

  // Create faults
  // Fault 1: Elevator trapped people - overdue over 24 hours
  const fault1ReportDate = new Date(now.getTime() - 30 * 60 * 60 * 1000); // 30 hours ago
  await prisma.fault.create({
    data: {
      elevatorId: elevator3.id,
      faultType: "电梯困人",
      description: "2号楼电梯A在下午3点出现困人故障，1名业主被困在10层。维保人员已到场但尚未完成救援。",
      emergencyLevel: "非常紧急",
      status: "处理中",
      reporter: "业主张先生",
      reportDate: fault1ReportDate,
      isOverdue: true,
      hasComplaint: false,
    },
  });

  // Fault 2: Door fault with complaint
  await prisma.fault.create({
    data: {
      elevatorId: elevator5.id,
      faultType: "门故障",
      description: "电梯门关闭异常，存在夹人风险。业主多次反映电梯有异响。",
      emergencyLevel: "紧急",
      status: "待处理",
      reporter: "业主李女士",
      reportDate: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      isOverdue: false,
      hasComplaint: true,
    },
  });

  // Fault 3: Communication fault - resolved
  await prisma.fault.create({
    data: {
      elevatorId: elevator1.id,
      faultType: "通讯故障",
      description: "电梯监控系统通讯中断，无法远程监控。",
      emergencyLevel: "一般",
      status: "已解决",
      reporter: "物业管理员王强",
      reportDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      resolvedDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      isOverdue: false,
      hasComplaint: false,
    },
  });

  // Fault 4: Other fault
  await prisma.fault.create({
    data: {
      elevatorId: elevator4.id,
      faultType: "其他",
      description: "电梯轿厢照明灯不亮，影响业主使用。",
      emergencyLevel: "一般",
      status: "待复查",
      reporter: "物业管理员赵红",
      reportDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      isOverdue: false,
      hasComplaint: false,
    },
  });

  // Create history nodes
  // For elevator 1 (normal maintenance)
  await prisma.historyNode.createMany({
    data: [
      {
        elevatorId: elevator1.id,
        planId: plan1.id,
        type: "计划创建",
        title: "维保计划创建",
        description: "物业管理员创建了月度维保计划",
        operator: "王强",
        operatorRole: "物业管理员",
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        elevatorId: elevator1.id,
        planId: plan1.id,
        type: "执行",
        title: "维保执行中",
        description: "维保单位已开始执行维保任务",
        operator: "李师傅",
        operatorRole: "维保单位",
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // For elevator 2 (overdue maintenance)
  await prisma.historyNode.createMany({
    data: [
      {
        elevatorId: elevator2.id,
        planId: plan2.id,
        type: "计划创建",
        title: "维保计划创建",
        description: "物业管理员创建了月度维保计划",
        operator: "王强",
        operatorRole: "物业管理员",
        createdAt: tenDaysAgo,
      },
      {
        elevatorId: elevator2.id,
        planId: plan2.id,
        type: "退回",
        title: "维保超期",
        description: "维保计划已超期5天，尚未执行",
        operator: "系统",
        operatorRole: "系统",
        createdAt: fiveDaysAgo,
      },
    ],
  });

  // For elevator 3 (fault - trapped people)
  const fault1 = await prisma.fault.findFirst({
    where: { elevatorId: elevator3.id, faultType: "电梯困人" },
  });

  await prisma.historyNode.createMany({
    data: [
      {
        elevatorId: elevator3.id,
        faultId: fault1?.id,
        type: "故障登记",
        title: "故障登记",
        description: "电梯困人故障登记，紧急程度：非常紧急",
        operator: "张先生",
        operatorRole: "业主",
        createdAt: fault1ReportDate,
      },
      {
        elevatorId: elevator3.id,
        faultId: fault1?.id,
        type: "故障处理",
        title: "故障处理中",
        description: "维保单位正在处理困人故障",
        operator: "李师傅",
        operatorRole: "维保单位",
        createdAt: new Date(fault1ReportDate.getTime() + 30 * 60 * 1000),
      },
    ],
  });

  // For elevator 5 (complaint)
  const fault2 = await prisma.fault.findFirst({
    where: { elevatorId: elevator5.id, hasComplaint: true },
  });

  await prisma.historyNode.createMany({
    data: [
      {
        elevatorId: elevator5.id,
        faultId: fault2?.id,
        type: "故障登记",
        title: "业主投诉-故障登记",
        description: "业主投诉电梯门故障，存在安全隐患",
        operator: "李女士",
        operatorRole: "业主",
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("Seed data created successfully!");
  console.log({
    communities: 3,
    buildings: 6,
    elevators: 6,
    maintenanceUnits: 4,
    maintenancePlans: 5,
    maintenanceRecords: 2,
    faults: 4,
    historyNodes: await prisma.historyNode.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
