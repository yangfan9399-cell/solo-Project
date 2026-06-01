import { PrismaClient, UserRole, DonationStatus, InspectionResult, ApplicationStatus, DistributionStatus, ExceptionType, ExceptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "张管理员",
      role: UserRole.ADMIN,
      phone: "13800138001",
      email: "admin@charity.org",
    },
  });

  const worker = await prisma.user.upsert({
    where: { username: "worker" },
    update: {},
    create: {
      username: "worker",
      password: hashedPassword,
      name: "李社工",
      role: UserRole.SOCIAL_WORKER,
      phone: "13800138002",
      email: "worker@charity.org",
    },
  });

  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      username: "manager",
      password: hashedPassword,
      name: "王负责人",
      role: UserRole.MANAGER,
      phone: "13800138003",
      email: "manager@charity.org",
    },
  });

  const materialsData = [
    { name: "大米", category: "食品", unit: "袋", description: "5kg装大米", specs: "5kg/袋" },
    { name: "食用油", category: "食品", unit: "桶", description: "5L装食用油", specs: "5L/桶" },
    { name: "面粉", category: "食品", unit: "袋", description: "5kg装面粉", specs: "5kg/袋" },
    { name: "牛奶", category: "食品", unit: "箱", description: "纯牛奶", specs: "250ml*24盒" },
    { name: "棉被", category: "衣物", unit: "床", description: "冬季棉被", specs: "200*230cm" },
    { name: "羽绒服", category: "衣物", unit: "件", description: "成人羽绒服", specs: "M/L/XL" },
    { name: "口罩", category: "医疗", unit: "包", description: "一次性医用口罩", specs: "50只/包" },
    { name: "消毒液", category: "医疗", unit: "瓶", description: "75%酒精消毒液", specs: "500ml/瓶" },
    { name: "书包", category: "文具", unit: "个", description: "学生书包", specs: "标准款" },
    { name: "笔记本", category: "文具", unit: "本", description: "学生笔记本", specs: "A5 100页" },
  ];

  const materials: any[] = [];
  for (const m of materialsData) {
    const material = await prisma.material.upsert({
      where: { id: m.name },
      update: {},
      create: m,
    });
    materials.push(material);
  }

  const recipientsData = [
    { name: "陈大爷", idCard: "110101195001011234", phone: "13900139001", address: "北京市朝阳区幸福小区1号楼101室", category: "低保户", description: "独居老人，无子女", isVerified: true },
    { name: "刘阿姨", idCard: "110101195502022345", phone: "13900139002", address: "北京市朝阳区幸福小区2号楼202室", category: "低保户", description: "残疾人，行动不便", isVerified: true },
    { name: "王小明", idCard: "110101201003033456", phone: "13900139003", address: "北京市海淀区希望小学宿舍", category: "困境儿童", description: "父母双亡，由祖父母抚养", isVerified: true },
    { name: "张小花", idCard: "110101201204044567", phone: "13900139004", address: "北京市海淀区希望小学宿舍", category: "困境儿童", description: "单亲家庭，母亲患病", isVerified: false },
    { name: "赵师傅", idCard: "110101197005055678", phone: "13900139005", address: "北京市丰台区爱心家园", category: "困难职工", description: "下岗工人，打零工", isVerified: true },
  ];

  for (const r of recipientsData) {
    await prisma.recipient.upsert({
      where: { id: r.name },
      update: {},
      create: r,
    });
  }

  const batch1 = await prisma.donationBatch.create({
    data: {
      batchNo: "DON-2024-0001",
      donorName: "爱心企业A有限公司",
      donorPhone: "010-88888888",
      donorEmail: "contact@companya.com",
      description: "春节慰问物资捐赠",
      status: DonationStatus.STORED,
      totalItems: 500,
      totalValue: 25000,
      receivedAt: new Date("2024-01-15"),
      createdBy: admin.id,
      materials: {
        create: [
          { materialId: materials[0].id, quantity: 200, unitPrice: 50, remark: "东北优质大米" },
          { materialId: materials[1].id, quantity: 150, unitPrice: 80, remark: "金龙鱼食用油" },
          { materialId: materials[4].id, quantity: 150, unitPrice: 120, remark: "恒源祥棉被" },
        ],
      },
    },
    include: { materials: true },
  });

  const inspection1 = await prisma.inspection.create({
    data: {
      batchId: batch1.id,
      inspectorId: admin.id,
      result: InspectionResult.PASSED,
      remark: "全部合格，包装完好",
      inspectionDate: new Date("2024-01-16"),
      items: {
        create: batch1.materials.map((m: any) => ({
          donationMaterialId: m.id,
          quantity: m.quantity,
          qualifiedQty: m.quantity,
          result: InspectionResult.PASSED,
        })),
      },
    },
  });

  const stockEntry1 = await prisma.stockEntry.create({
    data: {
      entryNo: "IN-2024-0001",
      batchId: batch1.id,
      entryBy: admin.id,
      entryDate: new Date("2024-01-17"),
      remark: "A区仓库入库",
      items: {
        create: batch1.materials.map((m: any) => ({
          donationMaterialId: m.id,
          materialId: m.materialId,
          quantity: m.quantity,
          warehouseLocation: "A区",
        })),
      },
    },
  });

  for (const m of batch1.materials) {
    await prisma.stock.upsert({
      where: {
        materialId_warehouseLocation: {
          materialId: m.materialId,
          warehouseLocation: "A区",
        },
      },
      update: {
        quantity: { increment: m.quantity },
        availableQty: { increment: m.quantity },
      },
      create: {
        materialId: m.materialId,
        quantity: m.quantity,
        availableQty: m.quantity,
        minWarningQty: 20,
        warehouseLocation: "A区",
      },
    });
  }

  const batch2 = await prisma.donationBatch.create({
    data: {
      batchNo: "DON-2024-0002",
      donorName: "阳光公益基金会",
      donorPhone: "010-66666666",
      description: "开学季文具捐赠",
      status: DonationStatus.PENDING,
      totalItems: 600,
      totalValue: 18000,
      receivedAt: new Date("2024-02-20"),
      createdBy: admin.id,
      materials: {
        create: [
          { materialId: materials[8].id, quantity: 300, unitPrice: 40, remark: "双肩书包" },
          { materialId: materials[9].id, quantity: 300, unitPrice: 20, remark: "牛皮纸笔记本" },
        ],
      },
    },
  });

  const batch3 = await prisma.donationBatch.create({
    data: {
      batchNo: "DON-2024-0003",
      donorName: "市民张先生",
      donorPhone: "13800138888",
      description: "个人爱心捐赠",
      status: DonationStatus.INSPECTING,
      totalItems: 50,
      totalValue: 7500,
      receivedAt: new Date("2024-02-25"),
      createdBy: worker.id,
      materials: {
        create: [
          { materialId: materials[5].id, quantity: 50, unitPrice: 150, remark: "品牌羽绒服" },
        ],
      },
    },
  });

  const allRecipients = await prisma.recipient.findMany();
  
  const app1 = await prisma.application.create({
    data: {
      appNo: "APP-2024-0001",
      recipientId: allRecipients[0].id,
      applicantId: worker.id,
      title: "春节物资申请",
      description: "陈大爷春节慰问物资申请",
      status: ApplicationStatus.DISTRIBUTED,
      appliedAt: new Date("2024-01-20"),
      approvedAt: new Date("2024-01-21"),
      approvedBy: manager.id,
      approveRemark: "同意发放",
      items: {
        create: [
          { materialId: materials[0].id, requestedQty: 2, approvedQty: 2, remark: "大米" },
          { materialId: materials[1].id, requestedQty: 1, approvedQty: 1, remark: "食用油" },
          { materialId: materials[4].id, requestedQty: 1, approvedQty: 1, remark: "棉被" },
        ],
      },
    },
    include: { items: true },
  });

  const dist1 = await prisma.distribution.create({
    data: {
      distNo: "DIST-2024-0001",
      applicationId: app1.id,
      distributorId: worker.id,
      status: DistributionStatus.SIGNED,
      shippedAt: new Date("2024-01-22"),
      deliveredAt: new Date("2024-01-22"),
      signedAt: new Date("2024-01-22"),
      signedBy: "陈大爷",
      signRemark: "已收到全部物资，感谢",
      items: {
        create: app1.items.map((item: any) => ({
          materialId: item.materialId,
          quantity: item.approvedQty || 0,
          actualQty: item.approvedQty || 0,
        })),
      },
    },
  });

  const app2 = await prisma.application.create({
    data: {
      appNo: "APP-2024-0002",
      recipientId: allRecipients[1].id,
      applicantId: worker.id,
      title: "春节物资申请",
      description: "刘阿姨春节慰问物资申请",
      status: ApplicationStatus.APPROVED,
      appliedAt: new Date("2024-01-20"),
      approvedAt: new Date("2024-01-21"),
      approvedBy: manager.id,
      approveRemark: "同意发放",
      items: {
        create: [
          { materialId: materials[0].id, requestedQty: 2, approvedQty: 2, remark: "大米" },
          { materialId: materials[1].id, requestedQty: 1, approvedQty: 1, remark: "食用油" },
        ],
      },
    },
  });

  const app3 = await prisma.application.create({
    data: {
      appNo: "APP-2024-0003",
      recipientId: allRecipients[2].id,
      applicantId: worker.id,
      title: "开学文具申请",
      description: "王小明同学开学文具申请",
      status: ApplicationStatus.PENDING,
      appliedAt: new Date("2024-02-20"),
      items: {
        create: [
          { materialId: materials[8].id, requestedQty: 1, remark: "书包" },
          { materialId: materials[9].id, requestedQty: 5, remark: "笔记本" },
        ],
      },
    },
  });

  const app4 = await prisma.application.create({
    data: {
      appNo: "APP-2024-0004",
      recipientId: allRecipients[3].id,
      applicantId: worker.id,
      title: "开学文具申请",
      description: "张小花同学开学文具申请",
      status: ApplicationStatus.REJECTED,
      appliedAt: new Date("2024-02-18"),
      approvedAt: new Date("2024-02-19"),
      approvedBy: manager.id,
      approveRemark: "材料不完整，请补充家庭情况证明",
      items: {
        create: [
          { materialId: materials[8].id, requestedQty: 1, remark: "书包" },
          { materialId: materials[9].id, requestedQty: 5, remark: "笔记本" },
        ],
      },
    },
  });

  await prisma.exceptionRecord.create({
    data: {
      exceptionNo: "EXC-2024-0001",
      type: ExceptionType.QUALITY_ISSUE,
      title: "部分棉被有破损",
      description: "在质检过程中发现有3床棉被外包装破损，需要确认内部是否完好",
      status: ExceptionStatus.PROCESSING,
      relatedBatchId: batch1.id,
      reportedBy: admin.id,
      processedBy: admin.id,
      processedAt: new Date("2024-01-16"),
      resolution: "正在联系捐赠方协商退换",
    },
  });

  await prisma.exceptionRecord.create({
    data: {
      exceptionNo: "EXC-2024-0002",
      type: ExceptionType.QUANTITY_MISMATCH,
      title: "物资数量不符",
      description: "捐赠清单显示食用油150桶，实际清点只有148桶",
      status: ExceptionStatus.RESOLVED,
      relatedBatchId: batch1.id,
      reportedBy: admin.id,
      processedBy: manager.id,
      processedAt: new Date("2024-01-17"),
      resolution: "与捐赠方确认，确实少发2桶，已按148桶入库",
    },
  });

  const lowStock = await prisma.stock.findFirst({
    where: { materialId: materials[2].id },
  });
  if (!lowStock) {
    const newStock = await prisma.stock.create({
      data: {
        materialId: materials[2].id,
        quantity: 5,
        availableQty: 5,
        minWarningQty: 20,
        warehouseLocation: "A区",
      },
    });
    await prisma.stockAlert.create({
      data: {
        stockId: newStock.id,
        alertType: "LOW_STOCK",
        message: "面粉库存不足预警",
        threshold: 20,
        currentQty: 5,
      },
    });
  }

  console.log("Seed data created successfully!");
  console.log("Test accounts:");
  console.log("  Admin: admin / 123456");
  console.log("  Worker: worker / 123456");
  console.log("  Manager: manager / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
