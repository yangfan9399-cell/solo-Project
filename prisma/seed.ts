import { PrismaClient, OrderStatus, NodeType, DifferenceType, SampleCategory, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

function d(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("开始清理旧数据...");
  await prisma.orderAttachment.deleteMany();
  await prisma.fieldDifference.deleteMany();
  await prisma.reviewRecord.deleteMany();
  await prisma.orderNode.deleteMany();
  await prisma.dispatchOrder.deleteMany();
  await prisma.user.deleteMany();

  console.log("创建用户...");
  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: "user-op-001" },
      update: {},
      create: { id: "user-op-001", name: "张经办", role: UserRole.OPERATOR },
    }),
    prisma.user.upsert({
      where: { id: "user-op-002" },
      update: {},
      create: { id: "user-op-002", name: "李经办", role: UserRole.OPERATOR },
    }),
    prisma.user.upsert({
      where: { id: "user-rv-001" },
      update: {},
      create: { id: "user-rv-001", name: "王复核", role: UserRole.REVIEWER },
    }),
    prisma.user.upsert({
      where: { id: "user-rv-002" },
      update: {},
      create: { id: "user-rv-002", name: "赵复核", role: UserRole.REVIEWER },
    }),
    prisma.user.upsert({
      where: { id: "user-admin-001" },
      update: {},
      create: { id: "user-admin-001", name: "系统管理员", role: UserRole.ADMIN },
    }),
  ]);

  console.log("创建样本1：正常闭环...");
  const order1 = await prisma.dispatchOrder.create({
    data: {
      orderNo: "SLUICE-20260601-0001",
      title: "主汛期1号闸门调度执行",
      content: "根据汛情预报，开启1号闸门开度调整至3.5米，下泄流量控制在800m³/s。",
      source: "防洪调度中心",
      sourceDept: "调度科",
      sampleCategory: SampleCategory.NORMAL_CLOSE,
      gateNo: "G-001",
      reservoirName: "青山水库",
      targetOpening: 3.5,
      actualOpening: 3.5,
      targetFlow: 800,
      actualFlow: 800,
      amount: 125000,
      planExecuteTime: d(10),
      actualExecuteTime: d(9),
      reviewTime: d(7),
      responsibleUnit: "闸门运维一班",
      responsiblePerson: "张班长",
      operatorId: "user-op-001",
      status: OrderStatus.ARCHIVED,
      isArchived: true,
      summary: "青山水库 G-001 - 主汛期1号闸门调度执行",
      conclusion: "复核通过，流程正常闭环",
      createdAt: d(12),
      updatedAt: d(7),
    },
  });

  await Promise.all([
    prisma.orderNode.create({
      data: {
        orderId: order1.id,
        nodeType: NodeType.ACCEPT,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "已受理，分配张经办处理",
        snapshotData: { status: "PROCESSING" },
        createdAt: d(11),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order1.id,
        nodeType: NodeType.PROCESS,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "现场执行完成，开度3.5米，流量800m³/s",
        snapshotData: { actualOpening: 3.5, actualFlow: 800 },
        createdAt: d(9),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order1.id,
        nodeType: NodeType.SUBMIT_REVIEW,
        status: OrderStatus.PENDING_REVIEW,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "执行完成，提交复核。依据：现场照片、流量记录、监控录像",
        snapshotData: { status: "PENDING_REVIEW" },
        createdAt: d(8),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order1.id,
        nodeType: NodeType.APPROVE,
        status: OrderStatus.REVIEW_APPROVED,
        operatorId: "user-rv-001",
        operatorName: "王复核",
        remark: "复核通过，数据一致",
        snapshotData: { status: "REVIEW_APPROVED" },
        createdAt: d(7),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order1.id,
        nodeType: NodeType.ARCHIVE,
        status: OrderStatus.ARCHIVED,
        operatorId: "user-rv-001",
        operatorName: "王复核",
        remark: "完成归档",
        snapshotData: { status: "ARCHIVED" },
        createdAt: d(7),
      },
    }),
    prisma.reviewRecord.create({
      data: {
        orderId: order1.id,
        reviewerId: "user-rv-001",
        reviewerName: "王复核",
        conclusion: "复核通过，流程正常闭环",
        opinion: "执行数据准确，证据充分",
        isApproved: true,
        reviewedAt: d(7),
      },
    }),
    prisma.orderAttachment.create({
      data: {
        orderId: order1.id,
        name: "现场执行照片.jpg",
        type: "image/jpeg",
        size: 2048000,
        url: "/attachments/sample1-1.jpg",
        uploadedBy: "user-op-001",
        description: "1号闸门开度照片",
        uploadedAt: d(9),
      },
    }),
    prisma.orderAttachment.create({
      data: {
        orderId: order1.id,
        name: "流量记录单.pdf",
        type: "application/pdf",
        size: 512000,
        url: "/attachments/sample1-2.pdf",
        uploadedBy: "user-op-001",
        description: "下泄流量实时记录",
        uploadedAt: d(9),
      },
    }),
  ]);

  console.log("创建样本2：关键材料缺失...");
  const order2 = await prisma.dispatchOrder.create({
    data: {
      orderNo: "SLUICE-20260605-0002",
      title: "2号闸门检修后试运行",
      content: "2号闸门检修完成，试运行开度2.0米。",
      source: "工程管理科",
      sourceDept: "运维科",
      sampleCategory: SampleCategory.MISSING_MATERIAL,
      gateNo: "G-002",
      reservoirName: "青山水库",
      targetOpening: 2.0,
      actualOpening: 2.0,
      targetFlow: 400,
      actualFlow: 400,
      amount: 85000,
      planExecuteTime: d(5),
      actualExecuteTime: d(4),
      responsibleUnit: "闸门运维二班",
      responsiblePerson: "李班长",
      operatorId: "user-op-002",
      status: OrderStatus.PROCESSING,
      isArchived: false,
      blockReason: "缺少检修合格证明文件，试运行记录不完整",
      summary: "青山水库 G-002 - 2号闸门检修后试运行",
      conclusion: "异常：缺少检修合格证明文件，试运行记录不完整",
      createdAt: d(6),
      updatedAt: d(3),
    },
  });

  await Promise.all([
    prisma.orderNode.create({
      data: {
        orderId: order2.id,
        nodeType: NodeType.ACCEPT,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-002",
        operatorName: "李经办",
        remark: "已受理",
        snapshotData: { status: "PROCESSING" },
        createdAt: d(6),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order2.id,
        nodeType: NodeType.PROCESS,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-002",
        operatorName: "李经办",
        remark: "已完成试运行",
        snapshotData: { actualOpening: 2.0 },
        createdAt: d(4),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order2.id,
        nodeType: NodeType.SUBMIT_REVIEW,
        status: OrderStatus.PENDING_REVIEW,
        operatorId: "user-op-002",
        operatorName: "李经办",
        remark: "提交复核",
        snapshotData: { status: "PENDING_REVIEW" },
        createdAt: d(4),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order2.id,
        nodeType: NodeType.REJECT,
        status: OrderStatus.REVIEW_REJECTED,
        operatorId: "user-rv-002",
        operatorName: "赵复核",
        remark: "退回补证：缺少检修合格证明",
        snapshotData: { status: "REVIEW_REJECTED" },
        createdAt: d(3),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order2.id,
        nodeType: NodeType.SUPPLEMENT,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-002",
        operatorName: "李经办",
        remark: "已收到退回意见，正在补充材料",
        snapshotData: { status: "PROCESSING" },
        createdAt: d(3),
      },
    }),
    prisma.reviewRecord.create({
      data: {
        orderId: order2.id,
        reviewerId: "user-rv-002",
        reviewerName: "赵复核",
        conclusion: "复核退回",
        opinion: "材料不完整",
        blockReason: "缺少检修合格证明文件，试运行记录不完整",
        remedyPath: "1. 补充检修单位出具的合格证明；2. 补充试运行全过程记录；3. 补充监理单位确认签字",
        isApproved: false,
        reviewedAt: d(3),
      },
    }),
    prisma.fieldDifference.create({
      data: {
        orderId: order2.id,
        fieldName: "actualOpening",
        fieldLabel: "实际开度",
        oldValue: "1.5",
        newValue: "2.0",
        differenceType: DifferenceType.AMOUNT,
        changedBy: "user-op-002",
        changedAt: d(4),
      },
    }),
  ]);

  console.log("创建样本3：责任对象不一致...");
  const order3 = await prisma.dispatchOrder.create({
    data: {
      orderNo: "SLUICE-20260608-0003",
      title: "3号闸门应急调度",
      content: "应对上游洪水，紧急开启3号闸门。",
      source: "应急指挥中心",
      sourceDept: "应急科",
      sampleCategory: SampleCategory.INCONSISTENT_PARTY,
      gateNo: "G-003",
      reservoirName: "绿湖水库",
      targetOpening: 4.0,
      actualOpening: 4.0,
      targetFlow: 1200,
      actualFlow: 1200,
      amount: 200000,
      planExecuteTime: d(2),
      actualExecuteTime: d(1),
      responsibleUnit: "应急抢险队",
      responsiblePerson: "王队长",
      operatorId: "user-op-001",
      status: OrderStatus.PENDING_REVIEW,
      isArchived: false,
      blockReason: "责任单位与调度指令不一致：指令为运维一班，实际执行为应急抢险队",
      summary: "绿湖水库 G-003 - 3号闸门应急调度",
      conclusion: "异常：责任单位与调度指令不一致：指令为运维一班，实际执行为应急抢险队",
      createdAt: d(3),
      updatedAt: d(1),
    },
  });

  await Promise.all([
    prisma.orderNode.create({
      data: {
        orderId: order3.id,
        nodeType: NodeType.ACCEPT,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "已受理",
        createdAt: d(3),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order3.id,
        nodeType: NodeType.PROCESS,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "应急调度执行完成",
        createdAt: d(1),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order3.id,
        nodeType: NodeType.SUBMIT_REVIEW,
        status: OrderStatus.PENDING_REVIEW,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "提交复核",
        createdAt: d(1),
      },
    }),
    prisma.fieldDifference.create({
      data: {
        orderId: order3.id,
        fieldName: "responsibleUnit",
        fieldLabel: "责任单位",
        oldValue: "闸门运维一班",
        newValue: "应急抢险队",
        differenceType: DifferenceType.RESPONSIBLE_PARTY,
        changedBy: "user-op-001",
        changedAt: d(1),
      },
    }),
    prisma.fieldDifference.create({
      data: {
        orderId: order3.id,
        fieldName: "responsiblePerson",
        fieldLabel: "责任人",
        oldValue: "张班长",
        newValue: "王队长",
        differenceType: DifferenceType.RESPONSIBLE_PARTY,
        changedBy: "user-op-001",
        changedAt: d(1),
      },
    }),
    prisma.fieldDifference.create({
      data: {
        orderId: order3.id,
        fieldName: "actualExecuteTime",
        fieldLabel: "实际执行时间",
        oldValue: d(2).toISOString(),
        newValue: d(1).toISOString(),
        differenceType: DifferenceType.KEY_TIME,
        changedBy: "user-op-001",
        changedAt: d(1),
      },
    }),
  ]);

  console.log("创建样本4：复核退回...");
  const order4 = await prisma.dispatchOrder.create({
    data: {
      orderNo: "SLUICE-20260610-0004",
      title: "4号闸门日常调度",
      content: "日常调度，调整4号闸门开度1.5米。",
      source: "水资源调度科",
      sourceDept: "调度科",
      sampleCategory: SampleCategory.REVIEW_REJECTED,
      gateNo: "G-004",
      reservoirName: "青山水库",
      targetOpening: 1.5,
      actualOpening: 1.8,
      targetFlow: 300,
      actualFlow: 380,
      amount: 45000,
      planExecuteTime: d(1),
      actualExecuteTime: new Date(),
      responsibleUnit: "闸门运维一班",
      responsiblePerson: "张班长",
      operatorId: "user-op-001",
      status: OrderStatus.REVIEW_REJECTED,
      isArchived: false,
      blockReason: "实际开度与目标开度偏差超过允许范围",
      remedyPath: "1. 查明开度偏差原因；2. 重新校准闸门；3. 提交偏差分析报告",
      summary: "青山水库 G-004 - 4号闸门日常调度",
      conclusion: "异常：实际开度与目标开度偏差超过允许范围",
      createdAt: d(1),
      updatedAt: new Date(),
    },
  });

  await Promise.all([
    prisma.orderNode.create({
      data: {
        orderId: order4.id,
        nodeType: NodeType.ACCEPT,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "已受理",
        createdAt: d(1),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order4.id,
        nodeType: NodeType.PROCESS,
        status: OrderStatus.PROCESSING,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "执行完成",
        createdAt: new Date(),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order4.id,
        nodeType: NodeType.SUBMIT_REVIEW,
        status: OrderStatus.PENDING_REVIEW,
        operatorId: "user-op-001",
        operatorName: "张经办",
        remark: "提交复核",
        createdAt: new Date(),
      },
    }),
    prisma.orderNode.create({
      data: {
        orderId: order4.id,
        nodeType: NodeType.REJECT,
        status: OrderStatus.REVIEW_REJECTED,
        operatorId: "user-rv-001",
        operatorName: "王复核",
        remark: "退回补证：开度偏差超标",
        createdAt: new Date(),
      },
    }),
    prisma.reviewRecord.create({
      data: {
        orderId: order4.id,
        reviewerId: "user-rv-001",
        reviewerName: "王复核",
        conclusion: "复核退回",
        opinion: "执行数据偏差超标",
        blockReason: "实际开度1.8米与目标1.5米偏差超过±16.7%，超过±5%允许范围",
        remedyPath: "1. 查明开度偏差原因，提交偏差分析报告；2. 重新校准闸门机械装置；3. 监理单位确认",
        isApproved: false,
        reviewedAt: new Date(),
      },
    }),
    prisma.fieldDifference.create({
      data: {
        orderId: order4.id,
        fieldName: "actualOpening",
        fieldLabel: "实际开度",
        oldValue: "1.5",
        newValue: "1.8",
        differenceType: DifferenceType.AMOUNT,
        changedBy: "user-op-001",
        changedAt: new Date(),
      },
    }),
    prisma.fieldDifference.create({
      data: {
        orderId: order4.id,
        fieldName: "actualFlow",
        fieldLabel: "实际流量",
        oldValue: "300",
        newValue: "380",
        differenceType: DifferenceType.AMOUNT,
        changedBy: "user-op-001",
        changedAt: new Date(),
      },
    }),
    prisma.fieldDifference.create({
      data: {
        orderId: order4.id,
        fieldName: "conclusion",
        fieldLabel: "结论",
        oldValue: "执行完成",
        newValue: "执行偏差待整改",
        differenceType: DifferenceType.EVIDENCE_CONCLUSION,
        changedBy: "user-rv-001",
        changedAt: new Date(),
      },
    }),
  ]);

  console.log("创建样本5：待受理...");
  const order5 = await prisma.dispatchOrder.create({
    data: {
      orderNo: "SLUICE-20260612-0005",
      title: "5号闸门汛前检修调度",
      content: "汛前检修，调整5号闸门开度至2.5米，下泄流量控制在600m³/s。",
      source: "防洪调度中心",
      sourceDept: "调度科",
      sampleCategory: SampleCategory.NORMAL_CLOSE,
      gateNo: "G-005",
      reservoirName: "碧溪水库",
      targetOpening: 2.5,
      targetFlow: 600,
      amount: 95000,
      planExecuteTime: d(0),
      responsibleUnit: "闸门运维三班",
      responsiblePerson: "周班长",
      status: OrderStatus.PENDING_ACCEPT,
      isArchived: false,
      summary: "碧溪水库 G-005 - 5号闸门汛前检修调度",
      createdAt: d(0),
      updatedAt: d(0),
    },
  });

  console.log("样本数据创建完成！");
  console.log("  正常闭环: ", order1.orderNo);
  console.log("  关键材料缺失: ", order2.orderNo);
  console.log("  责任对象不一致: ", order3.orderNo);
  console.log("  复核退回: ", order4.orderNo);
  console.log("  待受理: ", order5.orderNo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
