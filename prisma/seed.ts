import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.applicationHistory.deleteMany();
  await prisma.returnVerification.deleteMany();
  await prisma.equipmentHandover.deleteMany();
  await prisma.borrowApplication.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.campus.deleteMany();

  // Create Campuses
  const eastCampus = await prisma.campus.create({
    data: {
      name: "东校区",
      location: "东门内200米",
    },
  });

  const westCampus = await prisma.campus.create({
    data: {
      name: "西校区",
      location: "西门主楼",
    },
  });

  const southCampus = await prisma.campus.create({
    data: {
      name: "南校区",
      location: "南门图书馆旁",
    },
  });

  // Create Classrooms with Equipment
  const classroomA101 = await prisma.classroom.create({
    data: {
      name: "教学楼A101",
      campusId: eastCampus.id,
      type: "多媒体",
      capacity: 60,
    },
  });

  await prisma.equipment.createMany({
    data: [
      { name: "投影仪", classroomId: classroomA101.id, status: "AVAILABLE" },
      { name: "音响系统", classroomId: classroomA101.id, status: "AVAILABLE" },
      { name: "电子白板", classroomId: classroomA101.id, status: "AVAILABLE" },
    ],
  });

  const classroomA203 = await prisma.classroom.create({
    data: {
      name: "教学楼A203",
      campusId: eastCampus.id,
      type: "普通",
      capacity: 40,
    },
  });

  await prisma.equipment.create({
    data: {
      name: "电子白板",
      classroomId: classroomA203.id,
      status: "AVAILABLE",
    },
  });

  const classroomA301 = await prisma.classroom.create({
    data: {
      name: "实验室A301",
      campusId: eastCampus.id,
      type: "实验室",
      capacity: 30,
    },
  });

  await prisma.equipment.createMany({
    data: [
      { name: "实验设备", classroomId: classroomA301.id, status: "AVAILABLE" },
      { name: "台式电脑", classroomId: classroomA301.id, status: "AVAILABLE", quantity: 10 },
    ],
  });

  const classroomB205 = await prisma.classroom.create({
    data: {
      name: "教学楼B205",
      campusId: westCampus.id,
      type: "多媒体",
      capacity: 50,
    },
  });

  await prisma.equipment.createMany({
    data: [
      { name: "投影仪", classroomId: classroomB205.id, status: "AVAILABLE" },
      { name: "电子白板", classroomId: classroomB205.id, status: "AVAILABLE" },
      { name: "台式电脑", classroomId: classroomB205.id, status: "AVAILABLE", quantity: 5 },
    ],
  });

  const classroomB301 = await prisma.classroom.create({
    data: {
      name: "教学楼B301",
      campusId: westCampus.id,
      type: "普通",
      capacity: 45,
    },
  });

  await prisma.equipment.create({
    data: {
      name: "电子白板",
      classroomId: classroomB301.id,
      status: "AVAILABLE",
    },
  });

  const classroomC102 = await prisma.classroom.create({
    data: {
      name: "教学楼C102",
      campusId: southCampus.id,
      type: "多媒体",
      capacity: 55,
    },
  });

  await prisma.equipment.createMany({
    data: [
      { name: "投影仪", classroomId: classroomC102.id, status: "AVAILABLE" },
      { name: "音响系统", classroomId: classroomC102.id, status: "AVAILABLE" },
    ],
  });

  const classroomLab301 = await prisma.classroom.create({
    data: {
      name: "实验楼301",
      campusId: southCampus.id,
      type: "实验室",
      capacity: 25,
    },
  });

  await prisma.equipment.createMany({
    data: [
      { name: "实验设备", classroomId: classroomLab301.id, status: "AVAILABLE" },
      { name: "台式电脑", classroomId: classroomLab301.id, status: "AVAILABLE", quantity: 8 },
    ],
  });

  // Sample Application 1: Normal Return (Completed)
  const app1 = await prisma.borrowApplication.create({
    data: {
      classroomId: classroomA101.id,
      applicantName: "张三",
      startTime: new Date("2024-01-15T09:00:00"),
      endTime: new Date("2024-01-15T12:00:00"),
      purpose: "期末考试监考培训会议",
      status: "COMPLETED",
    },
  });

  await prisma.applicationHistory.createMany({
    data: [
      {
        applicationId: app1.id,
        action: "APPLICATION_SUBMITTED",
        actor: "张三",
        timestamp: new Date("2024-01-10T10:00:00"),
        note: "提交借用申请",
      },
      {
        applicationId: app1.id,
        action: "APPLICATION_APPROVED",
        actor: "校区管理员-李主任",
        timestamp: new Date("2024-01-10T14:00:00"),
        note: "审批通过",
      },
      {
        applicationId: app1.id,
        action: "EQUIPMENT_HANDED_OVER",
        actor: "设备管理员-王师傅",
        timestamp: new Date("2024-01-15T08:30:00"),
        note: "设备交接完成",
      },
      {
        applicationId: app1.id,
        action: "IN_USE",
        actor: "系统",
        timestamp: new Date("2024-01-15T09:00:00"),
        note: "使用中",
      },
      {
        applicationId: app1.id,
        action: "RETURN_PENDING",
        actor: "系统",
        timestamp: new Date("2024-01-15T12:00:00"),
        note: "待归还",
      },
      {
        applicationId: app1.id,
        action: "COMPLETED",
        actor: "后勤-赵复核",
        timestamp: new Date("2024-01-15T12:30:00"),
        note: "归还核验完成，清洁合格",
      },
    ],
  });

  await prisma.equipmentHandover.createMany({
    data: [
      {
        applicationId: app1.id,
        equipmentName: "投影仪",
        quantity: 1,
        handoverTime: new Date("2024-01-15T08:30:00"),
        handlerName: "王师傅",
      },
      {
        applicationId: app1.id,
        equipmentName: "音响系统",
        quantity: 1,
        handoverTime: new Date("2024-01-15T08:30:00"),
        handlerName: "王师傅",
      },
    ],
  });

  await prisma.returnVerification.create({
    data: {
      applicationId: app1.id,
      cleaningStatus: "PASSED",
      cleaningPhoto: "/uploads/cleaning_a101_0115.jpg",
      abnormalReason: null,
      verifierName: "后勤-赵复核",
      verifiedAt: new Date("2024-01-15T12:30:00"),
    },
  });

  // Sample Application 2: Equipment Lost (Completed with abnormal)
  const app2 = await prisma.borrowApplication.create({
    data: {
      classroomId: classroomB205.id,
      applicantName: "李四",
      startTime: new Date("2024-01-16T14:00:00"),
      endTime: new Date("2024-01-16T17:00:00"),
      purpose: "学术报告会议",
      status: "COMPLETED",
    },
  });

  await prisma.applicationHistory.createMany({
    data: [
      {
        applicationId: app2.id,
        action: "APPLICATION_SUBMITTED",
        actor: "李四",
        timestamp: new Date("2024-01-14T11:00:00"),
        note: "提交借用申请",
      },
      {
        applicationId: app2.id,
        action: "APPLICATION_APPROVED",
        actor: "校区管理员-张主任",
        timestamp: new Date("2024-01-14T15:00:00"),
        note: "审批通过",
      },
      {
        applicationId: app2.id,
        action: "EQUIPMENT_HANDED_OVER",
        actor: "设备管理员-王师傅",
        timestamp: new Date("2024-01-16T13:30:00"),
        note: "设备交接完成",
      },
      {
        applicationId: app2.id,
        action: "IN_USE",
        actor: "系统",
        timestamp: new Date("2024-01-16T14:00:00"),
        note: "使用中",
      },
      {
        applicationId: app2.id,
        action: "RETURN_PENDING",
        actor: "系统",
        timestamp: new Date("2024-01-16T17:00:00"),
        note: "待归还",
      },
      {
        applicationId: app2.id,
        action: "COMPLETED",
        actor: "后勤-孙复核",
        timestamp: new Date("2024-01-16T17:45:00"),
        note: "归还核验完成，发现设备遗失",
      },
    ],
  });

  await prisma.equipmentHandover.createMany({
    data: [
      {
        applicationId: app2.id,
        equipmentName: "投影仪",
        quantity: 1,
        handoverTime: new Date("2024-01-16T13:30:00"),
        handlerName: "王师傅",
      },
      {
        applicationId: app2.id,
        equipmentName: "电子白板",
        quantity: 1,
        handoverTime: new Date("2024-01-16T13:30:00"),
        handlerName: "王师傅",
      },
      {
        applicationId: app2.id,
        equipmentName: "台式电脑",
        quantity: 5,
        handoverTime: new Date("2024-01-16T13:30:00"),
        handlerName: "王师傅",
      },
    ],
  });

  await prisma.returnVerification.create({
    data: {
      applicationId: app2.id,
      cleaningStatus: "PASSED",
      cleaningPhoto: "/uploads/cleaning_b205_0116.jpg",
      abnormalReason: "EQUIPMENT_LOST",
      verifierName: "后勤-孙复核",
      verifiedAt: new Date("2024-01-16T17:45:00"),
    },
  });

  // Sample Application 3: Time Conflict (Cancelled)
  const app3 = await prisma.borrowApplication.create({
    data: {
      classroomId: classroomLab301.id,
      applicantName: "王五",
      startTime: new Date("2024-01-17T09:00:00"),
      endTime: new Date("2024-01-17T11:00:00"),
      purpose: "实验课程教学",
      status: "CANCELLED",
    },
  });

  await prisma.applicationHistory.createMany({
    data: [
      {
        applicationId: app3.id,
        action: "APPLICATION_SUBMITTED",
        actor: "王五",
        timestamp: new Date("2024-01-16T09:00:00"),
        note: "提交借用申请",
      },
      {
        applicationId: app3.id,
        action: "APPLICATION_REJECTED",
        actor: "系统",
        timestamp: new Date("2024-01-16T09:05:00"),
        note: "时间冲突，实验楼301在此时段已被借用",
      },
      {
        applicationId: app3.id,
        action: "CANCELLED",
        actor: "系统",
        timestamp: new Date("2024-01-16T09:05:00"),
        note: "申请已取消",
      },
    ],
  });

  // Sample Application 4: Cleaning Failed (Completed with abnormal)
  const app4 = await prisma.borrowApplication.create({
    data: {
      classroomId: classroomC102.id,
      applicantName: "赵六",
      startTime: new Date("2024-01-18T13:00:00"),
      endTime: new Date("2024-01-18T15:00:00"),
      purpose: "学生会会议",
      status: "COMPLETED",
    },
  });

  await prisma.applicationHistory.createMany({
    data: [
      {
        applicationId: app4.id,
        action: "APPLICATION_SUBMITTED",
        actor: "赵六",
        timestamp: new Date("2024-01-17T10:00:00"),
        note: "提交借用申请",
      },
      {
        applicationId: app4.id,
        action: "APPLICATION_APPROVED",
        actor: "校区管理员-陈主任",
        timestamp: new Date("2024-01-17T11:30:00"),
        note: "审批通过",
      },
      {
        applicationId: app4.id,
        action: "EQUIPMENT_HANDED_OVER",
        actor: "设备管理员-周师傅",
        timestamp: new Date("2024-01-18T12:30:00"),
        note: "设备交接完成",
      },
      {
        applicationId: app4.id,
        action: "IN_USE",
        actor: "系统",
        timestamp: new Date("2024-01-18T13:00:00"),
        note: "使用中",
      },
      {
        applicationId: app4.id,
        action: "RETURN_PENDING",
        actor: "系统",
        timestamp: new Date("2024-01-18T15:00:00"),
        note: "待归还",
      },
      {
        applicationId: app4.id,
        action: "COMPLETED",
        actor: "后勤-吴复核",
        timestamp: new Date("2024-01-18T15:40:00"),
        note: "归还核验完成，清洁不合格",
      },
    ],
  });

  await prisma.equipmentHandover.createMany({
    data: [
      {
        applicationId: app4.id,
        equipmentName: "投影仪",
        quantity: 1,
        handoverTime: new Date("2024-01-18T12:30:00"),
        handlerName: "周师傅",
      },
      {
        applicationId: app4.id,
        equipmentName: "音响系统",
        quantity: 1,
        handoverTime: new Date("2024-01-18T12:30:00"),
        handlerName: "周师傅",
      },
    ],
  });

  await prisma.returnVerification.create({
    data: {
      applicationId: app4.id,
      cleaningStatus: "FAILED",
      cleaningPhoto: "/uploads/cleaning_c102_0118.jpg",
      abnormalReason: "CLEANING_FAILED",
      verifierName: "后勤-吴复核",
      verifiedAt: new Date("2024-01-18T15:40:00"),
    },
  });

  // Sample Application 5: In Use (Multi-campus)
  const app5 = await prisma.borrowApplication.create({
    data: {
      classroomId: classroomA203.id,
      applicantName: "钱七",
      startTime: new Date("2024-01-19T10:00:00"),
      endTime: new Date("2024-01-19T12:00:00"),
      purpose: "跨校区教研交流活动",
      status: "IN_USE",
    },
  });

  await prisma.applicationHistory.createMany({
    data: [
      {
        applicationId: app5.id,
        action: "APPLICATION_SUBMITTED",
        actor: "钱七",
        timestamp: new Date("2024-01-18T14:00:00"),
        note: "提交借用申请",
      },
      {
        applicationId: app5.id,
        action: "APPLICATION_APPROVED",
        actor: "校区管理员-李主任",
        timestamp: new Date("2024-01-18T16:00:00"),
        note: "审批通过",
      },
      {
        applicationId: app5.id,
        action: "EQUIPMENT_HANDED_OVER",
        actor: "设备管理员-王师傅",
        timestamp: new Date("2024-01-19T09:30:00"),
        note: "设备交接完成",
      },
      {
        applicationId: app5.id,
        action: "IN_USE",
        actor: "系统",
        timestamp: new Date("2024-01-19T10:00:00"),
        note: "使用中",
      },
    ],
  });

  await prisma.equipmentHandover.create({
    data: {
      applicationId: app5.id,
      equipmentName: "电子白板",
      quantity: 1,
      handoverTime: new Date("2024-01-19T09:30:00"),
      handlerName: "王师傅",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
