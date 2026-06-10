import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaSqlite } from 'prisma-adapter-sqlite';

const adapter = new PrismaSqlite({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // 清空现有数据
  await prisma.historyNode.deleteMany();
  await prisma.returnRecord.deleteMany();
  await prisma.overdueRecord.deleteMany();
  await prisma.interlibraryApplication.deleteMany();
  await prisma.book.deleteMany();
  await prisma.externalLibrary.deleteMany();
  await prisma.reader.deleteMany();

  // 创建外馆
  const library1 = await prisma.externalLibrary.create({
    data: {
      name: "清华大学图书馆",
      address: "北京市海淀区清华园",
      contact: "张馆长",
      phone: "010-62782167",
      email: "library@tsinghua.edu.cn",
    },
  });

  const library2 = await prisma.externalLibrary.create({
    data: {
      name: "北京大学图书馆",
      address: "北京市海淀区颐和园路5号",
      contact: "李馆长",
      phone: "010-62757165",
      email: "library@pku.edu.cn",
    },
  });

  const library3 = await prisma.externalLibrary.create({
    data: {
      name: "复旦大学图书馆",
      address: "上海市邯郸路220号",
      contact: "王馆长",
      phone: "021-65642211",
      email: "library@fudan.edu.cn",
    },
  });

  // 创建图书
  const book1 = await prisma.book.create({
    data: {
      title: "人工智能导论",
      author: "李明",
      isbn: "978-7-111-12345-6",
      publisher: "清华大学出版社",
      publishYear: 2020,
      libraryId: library1.id,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: "机器学习实战",
      author: "张华",
      isbn: "978-7-115-23456-7",
      publisher: "人民邮电出版社",
      publishYear: 2019,
      libraryId: library1.id,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      title: "数据结构与算法",
      author: "王强",
      isbn: "978-7-302-34567-8",
      publisher: "北京大学出版社",
      publishYear: 2018,
      libraryId: library2.id,
    },
  });

  const book4 = await prisma.book.create({
    data: {
      title: "计算机网络",
      author: "刘伟",
      isbn: "978-7-5608-45678-9",
      publisher: "同济大学出版社",
      publishYear: 2021,
      libraryId: library3.id,
    },
  });

  const book5 = await prisma.book.create({
    data: {
      title: "操作系统原理",
      author: "陈刚",
      isbn: "978-7-121-56789-0",
      publisher: "电子工业出版社",
      publishYear: 2022,
      libraryId: library2.id,
    },
  });

  // 创建读者
  const reader1 = await prisma.reader.create({
    data: {
      name: "张三",
      studentId: "2021001",
      college: "计算机学院",
      phone: "13800138001",
      email: "zhangsan@university.edu.cn",
    },
  });

  const reader2 = await prisma.reader.create({
    data: {
      name: "李四",
      studentId: "2021002",
      college: "信息学院",
      phone: "13800138002",
      email: "lisi@university.edu.cn",
    },
  });

  const reader3 = await prisma.reader.create({
    data: {
      name: "王五",
      studentId: "2021003",
      college: "电子工程学院",
      phone: "13800138003",
      email: "wangwu@university.edu.cn",
    },
  });

  const reader4 = await prisma.reader.create({
    data: {
      name: "赵六",
      studentId: "2021004",
      college: "数学学院",
      phone: "13800138004",
      email: "zhaoliu@university.edu.cn",
    },
  });

  const reader5 = await prisma.reader.create({
    data: {
      name: "孙七",
      studentId: "2021005",
      college: "机械学院",
      phone: "13800138005",
      email: "sunqi@university.edu.cn",
    },
  });

  // 创建样本申请数据

  // 1. 正常归还样本
  const app1 = await prisma.interlibraryApplication.create({
    data: {
      readerId: reader1.id,
      bookId: book1.id,
      libraryId: library1.id,
      status: "RETURNED",
      logisticsStatus: "RETURNED",
      logisticsNumber: "SF1234567890",
      borrowStartDate: new Date("2024-01-01"),
      borrowEndDate: new Date("2024-01-31"),
      actualReturnDate: new Date("2024-01-25"),
      processedByStaffId: "staff-001",
      processedByCirculationId: "circulation-001",
      processedByManagerId: "manager-001",
    },
  });

  await prisma.historyNode.createMany({
    data: [
      {
        applicationId: app1.id,
        status: "PENDING",
        operatorId: reader1.id,
        operatorRole: "读者",
        operatorName: reader1.name,
        description: "提交馆际互借申请",
        createdAt: new Date("2023-12-20"),
      },
      {
        applicationId: app1.id,
        status: "CONTACTING",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "开始联系外馆",
        createdAt: new Date("2023-12-21"),
      },
      {
        applicationId: app1.id,
        status: "APPROVED",
        operatorId: "external-001",
        operatorRole: "外馆",
        operatorName: "张馆长",
        description: "外馆同意借书",
        createdAt: new Date("2023-12-22"),
      },
      {
        applicationId: app1.id,
        status: "IN_TRANSIT",
        operatorId: "logistics-001",
        operatorRole: "物流",
        operatorName: "物流公司",
        description: "图书已发出，物流单号：SF1234567890",
        createdAt: new Date("2023-12-23"),
      },
      {
        applicationId: app1.id,
        status: "ARRIVED",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "图书已到达本馆",
        createdAt: new Date("2023-12-25"),
      },
      {
        applicationId: app1.id,
        status: "READY_FOR_PICKUP",
        operatorId: "circulation-001",
        operatorRole: "流通管理员",
        operatorName: "李流通",
        description: "已通知读者取书",
        createdAt: new Date("2023-12-26"),
      },
      {
        applicationId: app1.id,
        status: "BORROWED",
        operatorId: reader1.id,
        operatorRole: "读者",
        operatorName: reader1.name,
        description: "读者已取书",
        createdAt: new Date("2024-01-01"),
      },
      {
        applicationId: app1.id,
        status: "RETURNED",
        operatorId: "manager-001",
        operatorRole: "馆际负责人",
        operatorName: "王馆际",
        description: "图书已正常归还",
        createdAt: new Date("2024-01-25"),
      },
    ],
  });

  await prisma.returnRecord.create({
    data: {
      applicationId: app1.id,
      returnDate: new Date("2024-01-25"),
      returnedBy: reader1.name,
      receivedBy: "王馆际",
      condition: "良好",
    },
  });

  // 2. 外馆拒借样本
  const app2 = await prisma.interlibraryApplication.create({
    data: {
      readerId: reader2.id,
      bookId: book3.id,
      libraryId: library2.id,
      status: "REJECTED",
      rejectReason: "图书已借出",
      processedByStaffId: "staff-001",
    },
  });

  await prisma.historyNode.createMany({
    data: [
      {
        applicationId: app2.id,
        status: "PENDING",
        operatorId: reader2.id,
        operatorRole: "读者",
        operatorName: reader2.name,
        description: "提交馆际互借申请",
        createdAt: new Date("2024-02-01"),
      },
      {
        applicationId: app2.id,
        status: "CONTACTING",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "开始联系外馆",
        createdAt: new Date("2024-02-02"),
      },
      {
        applicationId: app2.id,
        status: "REJECTED",
        operatorId: "external-002",
        operatorRole: "外馆",
        operatorName: "李馆长",
        description: "外馆拒借：图书已借出",
        createdAt: new Date("2024-02-03"),
      },
    ],
  });

  // 3. 读者逾期样本
  const app3 = await prisma.interlibraryApplication.create({
    data: {
      readerId: reader3.id,
      bookId: book2.id,
      libraryId: library1.id,
      status: "OVERDUE",
      logisticsStatus: "RETURNED",
      logisticsNumber: "SF2345678901",
      borrowStartDate: new Date("2024-03-01"),
      borrowEndDate: new Date("2024-03-31"),
      actualReturnDate: new Date("2024-05-15"), // 逾期45天
      processedByStaffId: "staff-001",
      processedByCirculationId: "circulation-001",
      processedByManagerId: "manager-001",
    },
  });

  await prisma.historyNode.createMany({
    data: [
      {
        applicationId: app3.id,
        status: "PENDING",
        operatorId: reader3.id,
        operatorRole: "读者",
        operatorName: reader3.name,
        description: "提交馆际互借申请",
        createdAt: new Date("2024-02-15"),
      },
      {
        applicationId: app3.id,
        status: "CONTACTING",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "开始联系外馆",
        createdAt: new Date("2024-02-16"),
      },
      {
        applicationId: app3.id,
        status: "APPROVED",
        operatorId: "external-001",
        operatorRole: "外馆",
        operatorName: "张馆长",
        description: "外馆同意借书",
        createdAt: new Date("2024-02-17"),
      },
      {
        applicationId: app3.id,
        status: "IN_TRANSIT",
        operatorId: "logistics-001",
        operatorRole: "物流",
        operatorName: "物流公司",
        description: "图书已发出，物流单号：SF2345678901",
        createdAt: new Date("2024-02-18"),
      },
      {
        applicationId: app3.id,
        status: "ARRIVED",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "图书已到达本馆",
        createdAt: new Date("2024-02-20"),
      },
      {
        applicationId: app3.id,
        status: "READY_FOR_PICKUP",
        operatorId: "circulation-001",
        operatorRole: "流通管理员",
        operatorName: "李流通",
        description: "已通知读者取书",
        createdAt: new Date("2024-02-21"),
      },
      {
        applicationId: app3.id,
        status: "BORROWED",
        operatorId: reader3.id,
        operatorRole: "读者",
        operatorName: reader3.name,
        description: "读者已取书",
        createdAt: new Date("2024-03-01"),
      },
      {
        applicationId: app3.id,
        status: "OVERDUE",
        operatorId: "manager-001",
        operatorRole: "馆际负责人",
        operatorName: "王馆际",
        description: "图书已归还（逾期45天）",
        createdAt: new Date("2024-05-15"),
      },
    ],
  });

  await prisma.returnRecord.create({
    data: {
      applicationId: app3.id,
      returnDate: new Date("2024-05-15"),
      returnedBy: reader3.name,
      receivedBy: "王馆际",
      condition: "良好",
    },
  });

  await prisma.overdueRecord.create({
    data: {
      applicationId: app3.id,
      readerId: reader3.id,
      overdueDays: 45,
      fineAmount: 22.5, // 45天 * 0.5元/天
      paidStatus: false,
    },
  });

  // 4. 图书破损样本
  const app4 = await prisma.interlibraryApplication.create({
    data: {
      readerId: reader4.id,
      bookId: book4.id,
      libraryId: library3.id,
      status: "DAMAGED",
      logisticsStatus: "RETURNED",
      logisticsNumber: "SF3456789012",
      borrowStartDate: new Date("2024-04-01"),
      borrowEndDate: new Date("2024-04-30"),
      actualReturnDate: new Date("2024-04-20"),
      damageStatus: "MODERATE",
      damageDescription: "封面破损，部分页面有污渍",
      processedByStaffId: "staff-001",
      processedByCirculationId: "circulation-001",
      processedByManagerId: "manager-001",
    },
  });

  await prisma.historyNode.createMany({
    data: [
      {
        applicationId: app4.id,
        status: "PENDING",
        operatorId: reader4.id,
        operatorRole: "读者",
        operatorName: reader4.name,
        description: "提交馆际互借申请",
        createdAt: new Date("2024-03-10"),
      },
      {
        applicationId: app4.id,
        status: "CONTACTING",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "开始联系外馆",
        createdAt: new Date("2024-03-11"),
      },
      {
        applicationId: app4.id,
        status: "APPROVED",
        operatorId: "external-003",
        operatorRole: "外馆",
        operatorName: "王馆长",
        description: "外馆同意借书",
        createdAt: new Date("2024-03-12"),
      },
      {
        applicationId: app4.id,
        status: "IN_TRANSIT",
        operatorId: "logistics-001",
        operatorRole: "物流",
        operatorName: "物流公司",
        description: "图书已发出，物流单号：SF3456789012",
        createdAt: new Date("2024-03-13"),
      },
      {
        applicationId: app4.id,
        status: "ARRIVED",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "图书已到达本馆",
        createdAt: new Date("2024-03-15"),
      },
      {
        applicationId: app4.id,
        status: "READY_FOR_PICKUP",
        operatorId: "circulation-001",
        operatorRole: "流通管理员",
        operatorName: "李流通",
        description: "已通知读者取书",
        createdAt: new Date("2024-03-16"),
      },
      {
        applicationId: app4.id,
        status: "BORROWED",
        operatorId: reader4.id,
        operatorRole: "读者",
        operatorName: reader4.name,
        description: "读者已取书",
        createdAt: new Date("2024-04-01"),
      },
      {
        applicationId: app4.id,
        status: "DAMAGED",
        operatorId: "manager-001",
        operatorRole: "馆际负责人",
        operatorName: "王馆际",
        description: "图书已归还（有破损：封面破损，部分页面有污渍）",
        createdAt: new Date("2024-04-20"),
      },
    ],
  });

  await prisma.returnRecord.create({
    data: {
      applicationId: app4.id,
      returnDate: new Date("2024-04-20"),
      returnedBy: reader4.name,
      receivedBy: "王馆际",
      condition: "破损",
      notes: "封面破损，部分页面有污渍",
    },
  });

  // 5. 仍未归还的逾期读者样本（孙七）
  const app5 = await prisma.interlibraryApplication.create({
    data: {
      readerId: reader5.id,
      bookId: book5.id,
      libraryId: library2.id,
      status: "OVERDUE", // 逾期未还
      logisticsStatus: "RETURNED",
      logisticsNumber: "SF5678901234",
      borrowStartDate: new Date("2024-05-01"),
      borrowEndDate: new Date("2024-05-31"),
      // actualReturnDate 留空，表示仍未归还
      processedByStaffId: "staff-001",
      processedByCirculationId: "circulation-001",
      processedByManagerId: "manager-001",
    },
  });

  await prisma.historyNode.createMany({
    data: [
      {
        applicationId: app5.id,
        status: "PENDING",
        operatorId: reader5.id,
        operatorRole: "读者",
        operatorName: reader5.name,
        description: "提交馆际互借申请",
        createdAt: new Date("2024-04-15"),
      },
      {
        applicationId: app5.id,
        status: "CONTACTING",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "开始联系外馆",
        createdAt: new Date("2024-04-16"),
      },
      {
        applicationId: app5.id,
        status: "APPROVED",
        operatorId: "external-002",
        operatorRole: "外馆",
        operatorName: "李馆长",
        description: "外馆同意借书",
        createdAt: new Date("2024-04-17"),
      },
      {
        applicationId: app5.id,
        status: "IN_TRANSIT",
        operatorId: "logistics-001",
        operatorRole: "物流",
        operatorName: "物流公司",
        description: "图书已发出，物流单号：SF5678901234",
        createdAt: new Date("2024-04-18"),
      },
      {
        applicationId: app5.id,
        status: "ARRIVED",
        operatorId: "staff-001",
        operatorRole: "馆员",
        operatorName: "张馆员",
        description: "图书已到达本馆",
        createdAt: new Date("2024-04-20"),
      },
      {
        applicationId: app5.id,
        status: "READY_FOR_PICKUP",
        operatorId: "circulation-001",
        operatorRole: "流通管理员",
        operatorName: "李流通",
        description: "已通知读者取书",
        createdAt: new Date("2024-04-21"),
      },
      {
        applicationId: app5.id,
        status: "BORROWED",
        operatorId: reader5.id,
        operatorRole: "读者",
        operatorName: reader5.name,
        description: "读者已取书",
        createdAt: new Date("2024-05-01"),
      },
      {
        applicationId: app5.id,
        status: "OVERDUE",
        operatorId: "manager-001",
        operatorRole: "馆际负责人",
        operatorName: "王馆际",
        description: "图书已逾期（超过归还期限仍未归还）",
        createdAt: new Date("2024-06-01"),
      },
    ],
  });

  // 创建逾期记录
  await prisma.overdueRecord.create({
    data: {
      applicationId: app5.id,
      readerId: reader5.id,
      overdueDays: 10, // 假设当前已逾期10天
      fineAmount: 5.0, // 罚款金额
      paidStatus: false, // 未缴纳
    },
  });

  console.log("样本数据已成功创建！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });