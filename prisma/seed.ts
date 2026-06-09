import { PrismaClient, Role, TrademarkStatus, DocumentType, DocumentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("开始播种数据...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const consultant = await prisma.user.upsert({
    where: { email: "consultant@example.com" },
    update: {},
    create: {
      email: "consultant@example.com",
      password: hashedPassword,
      name: "张顾问",
      role: Role.CONSULTANT,
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      password: hashedPassword,
      name: "李客户",
      role: Role.CLIENT,
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: "client2@example.com" },
    update: {},
    create: {
      email: "client2@example.com",
      password: hashedPassword,
      name: "王经理",
      role: Role.CLIENT,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      email: "agent@example.com",
      password: hashedPassword,
      name: "陈代理人",
      role: Role.AGENT,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@example.com" },
    update: {},
    create: {
      email: "supervisor@example.com",
      password: hashedPassword,
      name: "刘主管",
      role: Role.SUPERVISOR,
    },
  });

  console.log("用户数据创建完成");

  const now = new Date();

  const normalTrademark = await prisma.trademark.upsert({
    where: { id: "normal-demo-001" },
    update: {},
    create: {
      id: "normal-demo-001",
      trademarkNo: "12345678",
      trademarkName: "阿里巴巴",
      category: 35,
      categoryName: "广告销售",
      registrationDate: new Date("2024-01-15"),
      expiryDate: new Date("2034-01-14"),
      status: TrademarkStatus.ARCHIVED,
      consultantId: consultant.id,
      clientId: client1.id,
      agentId: agent.id,
      supervisorId: supervisor.id,
      notes: "这是一个正常续展的示例商标，流程已完成并归档",
    },
  });

  await prisma.document.createMany({
    data: [
      {
        type: DocumentType.TRADEMARK_CERTIFICATE,
        name: "商标注册证.pdf",
        fileUrl: "https://example.com/cert-1.pdf",
        status: DocumentStatus.APPROVED,
        uploadedById: client1.id,
        trademarkId: normalTrademark.id,
      },
      {
        type: DocumentType.IDENTITY_PROOF,
        name: "营业执照.jpg",
        fileUrl: "https://example.com/id-1.jpg",
        status: DocumentStatus.APPROVED,
        uploadedById: client1.id,
        trademarkId: normalTrademark.id,
      },
      {
        type: DocumentType.POWER_OF_ATTORNEY,
        name: "授权委托书.pdf",
        fileUrl: "https://example.com/poa-1.pdf",
        status: DocumentStatus.APPROVED,
        uploadedById: client1.id,
        trademarkId: normalTrademark.id,
      },
      {
        type: DocumentType.RENEWAL_APPLICATION,
        name: "续展申请书.pdf",
        fileUrl: "https://example.com/renewal-1.pdf",
        status: DocumentStatus.APPROVED,
        uploadedById: agent.id,
        trademarkId: normalTrademark.id,
      },
    ],
  });

  await prisma.reviewHistory.createMany({
    data: [
      {
        action: "创建商标登记",
        status: TrademarkStatus.PENDING_UPLOAD,
        trademarkId: normalTrademark.id,
        userId: consultant.id,
        comment: "顾问登记商标，待客户上传材料",
      },
      {
        action: "材料上传完成",
        status: TrademarkStatus.MATERIALS_UPLOADED,
        trademarkId: normalTrademark.id,
        userId: client1.id,
        comment: "客户已上传全部所需材料",
      },
      {
        action: "代理人审核通过",
        status: TrademarkStatus.AGENT_APPROVED,
        trademarkId: normalTrademark.id,
        userId: agent.id,
        comment: "材料齐全，审核通过，准备递交",
      },
      {
        action: "已递交续展申请",
        status: TrademarkStatus.SUBMITTED,
        trademarkId: normalTrademark.id,
        userId: agent.id,
        comment: "已向商标局递交续展申请",
      },
      {
        action: "主管复核通过并归档",
        status: TrademarkStatus.ARCHIVED,
        trademarkId: normalTrademark.id,
        userId: supervisor.id,
        comment: "复核通过，流程完成",
      },
    ],
  });

  const deficientTrademark = await prisma.trademark.upsert({
    where: { id: "deficient-demo-002" },
    update: {},
    create: {
      id: "deficient-demo-002",
      trademarkNo: "23456789",
      trademarkName: "腾讯科技",
      category: 9,
      categoryName: "科学仪器",
      registrationDate: new Date("2024-03-20"),
      expiryDate: new Date("2034-03-19"),
      status: TrademarkStatus.MATERIALS_DEFICIENT,
      consultantId: consultant.id,
      clientId: client2.id,
      agentId: agent.id,
      notes: "这是一个材料缺失的示例商标，需要客户补充材料",
    },
  });

  await prisma.document.createMany({
    data: [
      {
        type: DocumentType.TRADEMARK_CERTIFICATE,
        name: "商标注册证.pdf",
        fileUrl: "https://example.com/cert-2.pdf",
        status: DocumentStatus.APPROVED,
        uploadedById: client2.id,
        trademarkId: deficientTrademark.id,
      },
      {
        type: DocumentType.IDENTITY_PROOF,
        name: "身份证明.jpg",
        fileUrl: "https://example.com/id-2.jpg",
        status: DocumentStatus.REJECTED,
        rejectionReason: "身份证明文件不清晰，需要重新提供",
        uploadedById: client2.id,
        trademarkId: deficientTrademark.id,
      },
    ],
  });

  await prisma.reviewHistory.createMany({
    data: [
      {
        action: "创建商标登记",
        status: TrademarkStatus.PENDING_UPLOAD,
        trademarkId: deficientTrademark.id,
        userId: consultant.id,
        comment: "顾问登记商标，待客户上传材料",
      },
      {
        action: "材料上传",
        status: TrademarkStatus.MATERIALS_UPLOADED,
        trademarkId: deficientTrademark.id,
        userId: client2.id,
        comment: "客户上传了部分材料",
      },
      {
        action: "代理人审核驳回",
        status: TrademarkStatus.MATERIALS_DEFICIENT,
        trademarkId: deficientTrademark.id,
        userId: agent.id,
        comment: "身份证明文件不清晰，且缺少授权委托书，请补充材料",
      },
    ],
  });

  await prisma.materialIssue.createMany({
    data: [
      {
        issueType: "文件不清晰",
        description: "身份证明文件模糊，无法辨认信息",
        documentType: DocumentType.IDENTITY_PROOF,
        trademarkId: deficientTrademark.id,
      },
      {
        issueType: "材料缺失",
        description: "缺少授权委托书",
        documentType: DocumentType.POWER_OF_ATTORNEY,
        trademarkId: deficientTrademark.id,
      },
    ],
  });

  const expeditedTrademark = await prisma.trademark.upsert({
    where: { id: "expedited-demo-003" },
    update: {},
    create: {
      id: "expedited-demo-003",
      trademarkNo: "34567890",
      trademarkName: "字节跳动",
      category: 42,
      categoryName: "设计研究",
      registrationDate: new Date("2016-08-10"),
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: TrademarkStatus.EXPEDITED,
      isExpedited: true,
      expeditedReason: "商标将于15天后到期，需紧急处理",
      consultantId: consultant.id,
      clientId: client1.id,
      agentId: agent.id,
      notes: "这是一个临期加急的示例商标，需要优先处理",
    },
  });

  await prisma.document.createMany({
    data: [
      {
        type: DocumentType.TRADEMARK_CERTIFICATE,
        name: "商标注册证.pdf",
        fileUrl: "https://example.com/cert-3.pdf",
        status: DocumentStatus.APPROVED,
        uploadedById: client1.id,
        trademarkId: expeditedTrademark.id,
      },
      {
        type: DocumentType.IDENTITY_PROOF,
        name: "营业执照.jpg",
        fileUrl: "https://example.com/id-3.jpg",
        status: DocumentStatus.APPROVED,
        uploadedById: client1.id,
        trademarkId: expeditedTrademark.id,
      },
      {
        type: DocumentType.POWER_OF_ATTORNEY,
        name: "授权委托书.pdf",
        fileUrl: "https://example.com/poa-3.pdf",
        status: DocumentStatus.UPLOADED,
        uploadedById: client1.id,
        trademarkId: expeditedTrademark.id,
      },
    ],
  });

  await prisma.reviewHistory.createMany({
    data: [
      {
        action: "创建商标登记",
        status: TrademarkStatus.PENDING_UPLOAD,
        trademarkId: expeditedTrademark.id,
        userId: consultant.id,
        comment: "顾问登记商标，待客户上传材料",
      },
      {
        action: "材料上传",
        status: TrademarkStatus.MATERIALS_UPLOADED,
        trademarkId: expeditedTrademark.id,
        userId: client1.id,
        comment: "客户已上传材料",
      },
      {
        action: "设置加急",
        status: TrademarkStatus.EXPEDITED,
        trademarkId: expeditedTrademark.id,
        userId: consultant.id,
        comment: "商标将于15天后到期，已升级为加急处理",
      },
    ],
  });

  const abandonedTrademark = await prisma.trademark.upsert({
    where: { id: "abandoned-demo-004" },
    update: {},
    create: {
      id: "abandoned-demo-004",
      trademarkNo: "45678901",
      trademarkName: "京东商城",
      category: 35,
      categoryName: "广告销售",
      registrationDate: new Date("2023-05-10"),
      expiryDate: new Date("2033-05-09"),
      status: TrademarkStatus.ABANDONED,
      consultantId: consultant.id,
      clientId: client2.id,
      notes: "这是一个客户放弃续展的示例商标",
    },
  });

  await prisma.document.createMany({
    data: [
      {
        type: DocumentType.TRADEMARK_CERTIFICATE,
        name: "商标注册证.pdf",
        fileUrl: "https://example.com/cert-4.pdf",
        status: DocumentStatus.UPLOADED,
        uploadedById: client2.id,
        trademarkId: abandonedTrademark.id,
      },
    ],
  });

  await prisma.reviewHistory.createMany({
    data: [
      {
        action: "创建商标登记",
        status: TrademarkStatus.PENDING_UPLOAD,
        trademarkId: abandonedTrademark.id,
        userId: consultant.id,
        comment: "顾问登记商标，待客户上传材料",
      },
      {
        action: "材料上传",
        status: TrademarkStatus.MATERIALS_UPLOADED,
        trademarkId: abandonedTrademark.id,
        userId: client2.id,
        comment: "客户上传了商标注册证",
      },
      {
        action: "客户放弃",
        status: TrademarkStatus.ABANDONED,
        trademarkId: abandonedTrademark.id,
        userId: client2.id,
        comment: "客户因业务调整，决定放弃该商标续展",
      },
    ],
  });

  const pendingTrademark = await prisma.trademark.upsert({
    where: { id: "pending-demo-005" },
    update: {},
    create: {
      id: "pending-demo-005",
      trademarkNo: "56789012",
      trademarkName: "美团点评",
      category: 43,
      categoryName: "餐饮住宿",
      registrationDate: new Date("2024-06-01"),
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: TrademarkStatus.PENDING_UPLOAD,
      consultantId: consultant.id,
      clientId: client1.id,
      notes: "待客户上传材料",
    },
  });

  await prisma.reviewHistory.createMany({
    data: [
      {
        action: "创建商标登记",
        status: TrademarkStatus.PENDING_UPLOAD,
        trademarkId: pendingTrademark.id,
        userId: consultant.id,
        comment: "顾问登记商标，待客户上传材料",
      },
    ],
  });

  const submittedTrademark = await prisma.trademark.upsert({
    where: { id: "submitted-demo-006" },
    update: {},
    create: {
      id: "submitted-demo-006",
      trademarkNo: "67890123",
      trademarkName: "小米科技",
      category: 9,
      categoryName: "科学仪器",
      registrationDate: new Date("2024-02-10"),
      expiryDate: new Date("2034-02-09"),
      status: TrademarkStatus.SUBMITTED,
      consultantId: consultant.id,
      clientId: client2.id,
      agentId: agent.id,
      notes: "已递交，待主管复核",
    },
  });

  await prisma.document.createMany({
    data: [
      {
        type: DocumentType.TRADEMARK_CERTIFICATE,
        name: "商标注册证.pdf",
        fileUrl: "https://example.com/cert-6.pdf",
        status: DocumentStatus.APPROVED,
        uploadedById: client2.id,
        trademarkId: submittedTrademark.id,
      },
      {
        type: DocumentType.IDENTITY_PROOF,
        name: "营业执照.jpg",
        fileUrl: "https://example.com/id-6.jpg",
        status: DocumentStatus.APPROVED,
        uploadedById: client2.id,
        trademarkId: submittedTrademark.id,
      },
      {
        type: DocumentType.RENEWAL_APPLICATION,
        name: "续展申请书.pdf",
        fileUrl: "https://example.com/renewal-6.pdf",
        status: DocumentStatus.UPLOADED,
        uploadedById: agent.id,
        trademarkId: submittedTrademark.id,
      },
    ],
  });

  await prisma.reviewHistory.createMany({
    data: [
      {
        action: "创建商标登记",
        status: TrademarkStatus.PENDING_UPLOAD,
        trademarkId: submittedTrademark.id,
        userId: consultant.id,
        comment: "顾问登记商标，待客户上传材料",
      },
      {
        action: "材料上传",
        status: TrademarkStatus.MATERIALS_UPLOADED,
        trademarkId: submittedTrademark.id,
        userId: client2.id,
        comment: "客户上传了全部材料",
      },
      {
        action: "代理人审核通过",
        status: TrademarkStatus.AGENT_APPROVED,
        trademarkId: submittedTrademark.id,
        userId: agent.id,
        comment: "材料齐全，审核通过",
      },
      {
        action: "已递交续展申请",
        status: TrademarkStatus.SUBMITTED,
        trademarkId: submittedTrademark.id,
        userId: agent.id,
        comment: "已向商标局递交续展申请",
      },
    ],
  });

  console.log("示例商标数据创建完成");
  console.log("演示账号：");
  console.log("顾问: consultant@example.com / password123");
  console.log("客户: client@example.com / password123");
  console.log("客户2: client2@example.com / password123");
  console.log("代理人: agent@example.com / password123");
  console.log("主管: supervisor@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
