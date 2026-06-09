import { PrismaClient, UserRole, SampleStatus, SealStatus, TestResultStatus, DisposalType, AbnormalType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("开始播种数据...");

  const hashedPassword = await hash("123456", 10);

  const inspector = await prisma.user.upsert({
    where: { username: "inspector" },
    update: {},
    create: {
      username: "inspector",
      password: hashedPassword,
      name: "张查验",
      role: UserRole.INSPECTION_OFFICER,
      department: "查验一科",
      employeeId: "INS001",
    },
  });

  const labTech = await prisma.user.upsert({
    where: { username: "labtech" },
    update: {},
    create: {
      username: "labtech",
      password: hashedPassword,
      name: "李实验",
      role: UserRole.LAB_TECHNICIAN,
      department: "检测中心",
      employeeId: "LAB001",
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { username: "reviewer" },
    update: {},
    create: {
      username: "reviewer",
      password: hashedPassword,
      name: "王复核",
      role: UserRole.DISPOSAL_REVIEWER,
      department: "处置科",
      employeeId: "REV001",
    },
  });

  console.log("用户数据创建完成");

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

  const sample1 = await prisma.sample.create({
    data: {
      sampleNo: "YP202406010001",
      customsDeclarationNo: "223120241000001",
      goodsName: "进口婴幼儿配方奶粉",
      goodsCategory: "食品",
      hsCode: "0402210000",
      quantity: 500,
      unit: "箱",
      originCountry: "新西兰",
      port: "上海港",
      consignee: "上海母婴用品有限公司",
      consignor: "New Zealand Dairy Co.",
      status: SampleStatus.ARCHIVED,
      sealStatus: SealStatus.INTACT,
      abnormalType: AbnormalType.NONE,
      samplerId: inspector.id,
      samplingTime: fourDaysAgo,
      samplingLocation: "外高桥保税区3号仓库",
      samplingNotes: "包装完好，标签清晰",
      currentHandlerId: reviewer.id,
      sentToLabTime: new Date(fourDaysAgo.getTime() + 2 * 60 * 60 * 1000),
      labReceivedTime: new Date(fourDaysAgo.getTime() + 4 * 60 * 60 * 1000),
      testCompletedTime: new Date(threeDaysAgo.getTime() + 6 * 60 * 60 * 1000),
      disposalTime: twoDaysAgo,
      testItems: {
        create: [
          { name: "蛋白质含量", isRequired: true, sortOrder: 0, unit: "g/100g", minValue: 15, maxValue: 25 },
          { name: "脂肪含量", isRequired: true, sortOrder: 1, unit: "g/100g", minValue: 20, maxValue: 30 },
          { name: "菌落总数", isRequired: true, sortOrder: 2, unit: "CFU/g", maxValue: 10000 },
          { name: "大肠菌群", isRequired: true, sortOrder: 3, unit: "MPN/100g", maxValue: 10 },
          { name: "重金属铅", isRequired: true, sortOrder: 4, unit: "mg/kg", maxValue: 0.5 },
        ],
      },
      seals: {
        create: {
          sealNo: "FQ123456",
          status: SealStatus.INTACT,
          sealType: "一次性铅封",
          sealedAt: fourDaysAgo,
        },
      },
    },
    include: { testItems: true, seals: true },
  });

  await prisma.testResult.createMany({
    data: [
      {
        sampleId: sample1.id,
        testItemId: sample1.testItems[0].id,
        resultValue: "18.5",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(fourDaysAgo.getTime() + 6 * 60 * 60 * 1000),
        instrument: "凯氏定氮仪",
      },
      {
        sampleId: sample1.id,
        testItemId: sample1.testItems[1].id,
        resultValue: "25.3",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(fourDaysAgo.getTime() + 7 * 60 * 60 * 1000),
        instrument: "脂肪测定仪",
      },
      {
        sampleId: sample1.id,
        testItemId: sample1.testItems[2].id,
        resultValue: "2000",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(threeDaysAgo.getTime() + 2 * 60 * 60 * 1000),
        instrument: "微生物培养箱",
      },
      {
        sampleId: sample1.id,
        testItemId: sample1.testItems[3].id,
        resultValue: "<3",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(threeDaysAgo.getTime() + 3 * 60 * 60 * 1000),
        instrument: "多管发酵法",
      },
      {
        sampleId: sample1.id,
        testItemId: sample1.testItems[4].id,
        resultValue: "0.12",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(threeDaysAgo.getTime() + 5 * 60 * 60 * 1000),
        instrument: "原子吸收分光光度计",
      },
    ],
  });

  await prisma.disposal.create({
    data: {
      sampleId: sample1.id,
      disposalType: DisposalType.RELEASE,
      disposalBasis:
        "根据GB 10765-2021《婴儿配方食品》标准检测，所有项目均合格，准予放行。",
      remarks: "符合进口婴幼儿配方食品标准要求",
      reviewedBy: reviewer.id,
      reviewedAt: twoDaysAgo,
      isFinal: true,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      { sampleId: sample1.id, action: "取样登记", description: "查验关员张查验完成样品取样登记，封签号: FQ123456", operatorId: inspector.id, newStatus: SampleStatus.SAMPLED, timestamp: fourDaysAgo },
      { sampleId: sample1.id, action: "送检", description: "样品已送检至实验室", operatorId: inspector.id, oldStatus: SampleStatus.SAMPLED, newStatus: SampleStatus.SENT_TO_LAB, timestamp: new Date(fourDaysAgo.getTime() + 2 * 60 * 60 * 1000) },
      { sampleId: sample1.id, action: "实验室收样", description: "实验室已接收样品，开始检测", operatorId: labTech.id, oldStatus: SampleStatus.SENT_TO_LAB, newStatus: SampleStatus.TESTING, timestamp: new Date(fourDaysAgo.getTime() + 4 * 60 * 60 * 1000) },
      { sampleId: sample1.id, action: "检测完成", description: "实验室检测完成，所有项目已检测", operatorId: labTech.id, oldStatus: SampleStatus.TESTING, newStatus: SampleStatus.PENDING_DISPOSAL, timestamp: new Date(threeDaysAgo.getTime() + 6 * 60 * 60 * 1000) },
      { sampleId: sample1.id, action: "处置复核", description: "处置结论: 合格放行", operatorId: reviewer.id, oldStatus: SampleStatus.PENDING_DISPOSAL, newStatus: SampleStatus.DISPOSED, timestamp: twoDaysAgo },
    ],
  });

  console.log("样本1（合格放行）创建完成");

  const sample2 = await prisma.sample.create({
    data: {
      sampleNo: "YP202406020002",
      customsDeclarationNo: "530120241000002",
      goodsName: "进口女士连衣裙",
      goodsCategory: "服装",
      hsCode: "6204420000",
      quantity: 1000,
      unit: "件",
      originCountry: "法国",
      port: "深圳港",
      consignee: "深圳时尚贸易有限公司",
      consignor: "Paris Fashion House",
      status: SampleStatus.PENDING_DISPOSAL,
      sealStatus: SealStatus.INTACT,
      abnormalType: AbnormalType.MISSING_TEST_ITEMS,
      abnormalDescription: "漏检项目: 色牢度、纤维成分",
      samplerId: inspector.id,
      samplingTime: threeDaysAgo,
      samplingLocation: "盐田港码头2号堆场",
      samplingNotes: "共100箱，随机取样3件",
      currentHandlerId: reviewer.id,
      sentToLabTime: new Date(threeDaysAgo.getTime() + 3 * 60 * 60 * 1000),
      labReceivedTime: new Date(threeDaysAgo.getTime() + 5 * 60 * 60 * 1000),
      testCompletedTime: new Date(twoDaysAgo.getTime() + 8 * 60 * 60 * 1000),
      testItems: {
        create: [
          { name: "甲醛含量", isRequired: true, sortOrder: 0, unit: "mg/kg", maxValue: 75 },
          { name: "pH值", isRequired: true, sortOrder: 1, unit: "", minValue: 4.0, maxValue: 8.5 },
          { name: "色牢度", isRequired: true, sortOrder: 2, unit: "级", minValue: 3 },
          { name: "纤维成分", isRequired: true, sortOrder: 3, unit: "%" },
          { name: "标签审核", isRequired: true, sortOrder: 4 },
        ],
      },
      seals: {
        create: {
          sealNo: "FQ234567",
          status: SealStatus.INTACT,
          sealType: "一次性塑料封条",
          sealedAt: threeDaysAgo,
        },
      },
    },
    include: { testItems: true, seals: true },
  });

  await prisma.testResult.createMany({
    data: [
      {
        sampleId: sample2.id,
        testItemId: sample2.testItems[0].id,
        resultValue: "35",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(twoDaysAgo.getTime() + 2 * 60 * 60 * 1000),
        instrument: "紫外分光光度计",
      },
      {
        sampleId: sample2.id,
        testItemId: sample2.testItems[1].id,
        resultValue: "5.8",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(twoDaysAgo.getTime() + 3 * 60 * 60 * 1000),
        instrument: "pH计",
      },
      {
        sampleId: sample2.id,
        testItemId: sample2.testItems[4].id,
        resultValue: "标签完整，信息齐全",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000),
        instrument: "目视检查",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { sampleId: sample2.id, action: "取样登记", description: "查验关员张查验完成样品取样登记，封签号: FQ234567", operatorId: inspector.id, newStatus: SampleStatus.SAMPLED, timestamp: threeDaysAgo },
      { sampleId: sample2.id, action: "送检", description: "样品已送检至实验室", operatorId: inspector.id, oldStatus: SampleStatus.SAMPLED, newStatus: SampleStatus.SENT_TO_LAB, timestamp: new Date(threeDaysAgo.getTime() + 3 * 60 * 60 * 1000) },
      { sampleId: sample2.id, action: "实验室收样", description: "实验室已接收样品，开始检测", operatorId: labTech.id, oldStatus: SampleStatus.SENT_TO_LAB, newStatus: SampleStatus.TESTING, timestamp: new Date(threeDaysAgo.getTime() + 5 * 60 * 60 * 1000) },
      { sampleId: sample2.id, action: "检测完成", description: "实验室检测完成，存在 2 个漏检项目", operatorId: labTech.id, oldStatus: SampleStatus.TESTING, newStatus: SampleStatus.PENDING_DISPOSAL, timestamp: new Date(twoDaysAgo.getTime() + 8 * 60 * 60 * 1000) },
    ],
  });

  console.log("样本2（检测项目漏选）创建完成");

  const sample3 = await prisma.sample.create({
    data: {
      sampleNo: "YP202406030003",
      customsDeclarationNo: "310120241000003",
      goodsName: "进口电子血压计",
      goodsCategory: "电子产品",
      hsCode: "9018193000",
      quantity: 200,
      unit: "台",
      originCountry: "日本",
      port: "宁波港",
      consignee: "宁波医疗器械有限公司",
      consignor: "Tokyo Medical Co.",
      status: SampleStatus.RE_SAMPLING,
      sealStatus: SealStatus.DAMAGED,
      abnormalType: AbnormalType.SEAL_DAMAGED,
      abnormalDescription: "封签破损: 运输途中封条断裂，疑似包装被打开过",
      samplerId: inspector.id,
      samplingTime: twoDaysAgo,
      samplingLocation: "北仑港区查验场",
      samplingNotes: "原厂包装，封签完好",
      currentHandlerId: inspector.id,
      sentToLabTime: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000),
      labReceivedTime: new Date(oneDayAgo.getTime() + 2 * 60 * 60 * 1000),
      testItems: {
        create: [
          { name: "外观检查", isRequired: true, sortOrder: 0 },
          { name: "功能测试", isRequired: true, sortOrder: 1 },
          { name: "精度检测", isRequired: true, sortOrder: 2, unit: "mmHg" },
          { name: "电气安全", isRequired: true, sortOrder: 3 },
          { name: "EMC测试", isRequired: true, sortOrder: 4 },
        ],
      },
      seals: {
        create: {
          sealNo: "FQ345678",
          status: SealStatus.DAMAGED,
          sealType: "防伪封签",
          sealedAt: twoDaysAgo,
          notes: "封条在运输过程中断裂",
        },
      },
    },
    include: { testItems: true, seals: true },
  });

  await prisma.auditLog.createMany({
    data: [
      { sampleId: sample3.id, action: "取样登记", description: "查验关员张查验完成样品取样登记，封签号: FQ345678", operatorId: inspector.id, newStatus: SampleStatus.SAMPLED, timestamp: twoDaysAgo },
      { sampleId: sample3.id, action: "送检", description: "样品已送检至实验室", operatorId: inspector.id, oldStatus: SampleStatus.SAMPLED, newStatus: SampleStatus.SENT_TO_LAB, timestamp: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000) },
      { sampleId: sample3.id, action: "封签破损报告", description: "实验室报告封签破损: 运输途中封条断裂，疑似包装被打开过", operatorId: labTech.id, oldStatus: SampleStatus.SENT_TO_LAB, newStatus: SampleStatus.RE_SAMPLING, timestamp: new Date(oneDayAgo.getTime() + 3 * 60 * 60 * 1000) },
    ],
  });

  console.log("样本3（样品封签破损）创建完成");

  const sample4 = await prisma.sample.create({
    data: {
      sampleNo: "YP202406040004",
      customsDeclarationNo: "420120241000004",
      goodsName: "进口护肤精华液",
      goodsCategory: "化妆品",
      hsCode: "3304990099",
      quantity: 500,
      unit: "瓶",
      originCountry: "韩国",
      port: "广州港",
      consignee: "广州美妆贸易有限公司",
      consignor: "Seoul Cosmetics Co.",
      status: SampleStatus.PENDING_DISPOSAL,
      sealStatus: SealStatus.INTACT,
      abnormalType: AbnormalType.CONCLUSION_APPEAL,
      abnormalDescription: "结论复议: 企业申请重新评估检测标准适用条款",
      samplerId: inspector.id,
      samplingTime: fourDaysAgo,
      samplingLocation: "白云机场货站",
      samplingNotes: "冷藏运输，包装完好",
      currentHandlerId: reviewer.id,
      sentToLabTime: new Date(fourDaysAgo.getTime() + 2 * 60 * 60 * 1000),
      labReceivedTime: new Date(fourDaysAgo.getTime() + 5 * 60 * 60 * 1000),
      testCompletedTime: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000),
      disposalTime: oneDayAgo,
      testItems: {
        create: [
          { name: "微生物指标", isRequired: true, sortOrder: 0 },
          { name: "重金属检测", isRequired: true, sortOrder: 1 },
          { name: "防腐剂检测", isRequired: true, sortOrder: 2 },
          { name: "pH值", isRequired: true, sortOrder: 3 },
          { name: "感官检验", isRequired: true, sortOrder: 4 },
        ],
      },
      seals: {
        create: {
          sealNo: "FQ456789",
          status: SealStatus.INTACT,
          sealType: "防伪封签",
          sealedAt: fourDaysAgo,
        },
      },
    },
    include: { testItems: true, seals: true },
  });

  await prisma.testResult.createMany({
    data: [
      {
        sampleId: sample4.id,
        testItemId: sample4.testItems[0].id,
        resultValue: "符合标准",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(threeDaysAgo.getTime() + 3 * 60 * 60 * 1000),
        instrument: "微生物检测系统",
      },
      {
        sampleId: sample4.id,
        testItemId: sample4.testItems[1].id,
        resultValue: "铅:0.1mg/kg,砷:0.05mg/kg",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(threeDaysAgo.getTime() + 5 * 60 * 60 * 1000),
        instrument: "ICP-MS",
      },
      {
        sampleId: sample4.id,
        testItemId: sample4.testItems[2].id,
        resultValue: "苯氧乙醇:0.5%",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(twoDaysAgo.getTime() + 2 * 60 * 60 * 1000),
        instrument: "高效液相色谱仪",
      },
      {
        sampleId: sample4.id,
        testItemId: sample4.testItems[3].id,
        resultValue: "5.6",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(twoDaysAgo.getTime() + 5 * 60 * 60 * 1000),
        instrument: "pH计",
      },
      {
        sampleId: sample4.id,
        testItemId: sample4.testItems[4].id,
        resultValue: "外观、气味正常",
        resultStatus: TestResultStatus.PASSED,
        testedBy: labTech.id,
        testedAt: new Date(twoDaysAgo.getTime() + 8 * 60 * 60 * 1000),
        instrument: "感官评价",
      },
    ],
  });

  const initialDisposal = await prisma.disposal.create({
    data: {
      sampleId: sample4.id,
      disposalType: DisposalType.DETAIN,
      disposalBasis:
        "根据《化妆品安全技术规范》2022年版，该产品标签标注不符合进口化妆品备案要求，予以扣留。",
      remarks: "产品成分标注不完整，缺少部分限用物质的含量标注",
      reviewedBy: reviewer.id,
      reviewedAt: oneDayAgo,
      isFinal: false,
      appealCount: 1,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      { sampleId: sample4.id, action: "取样登记", description: "查验关员张查验完成样品取样登记，封签号: FQ456789", operatorId: inspector.id, newStatus: SampleStatus.SAMPLED, timestamp: fourDaysAgo },
      { sampleId: sample4.id, action: "送检", description: "样品已送检至实验室", operatorId: inspector.id, oldStatus: SampleStatus.SAMPLED, newStatus: SampleStatus.SENT_TO_LAB, timestamp: new Date(fourDaysAgo.getTime() + 2 * 60 * 60 * 1000) },
      { sampleId: sample4.id, action: "实验室收样", description: "实验室已接收样品，开始检测", operatorId: labTech.id, oldStatus: SampleStatus.SENT_TO_LAB, newStatus: SampleStatus.TESTING, timestamp: new Date(fourDaysAgo.getTime() + 5 * 60 * 60 * 1000) },
      { sampleId: sample4.id, action: "检测完成", description: "实验室检测完成，所有项目已检测", operatorId: labTech.id, oldStatus: SampleStatus.TESTING, newStatus: SampleStatus.PENDING_DISPOSAL, timestamp: new Date(twoDaysAgo.getTime() + 10 * 60 * 60 * 1000) },
      { sampleId: sample4.id, action: "处置复核", description: "处置结论: 扣留", operatorId: reviewer.id, oldStatus: SampleStatus.PENDING_DISPOSAL, newStatus: SampleStatus.DISPOSED, timestamp: oneDayAgo },
      { sampleId: sample4.id, action: "结论复议", description: "申请结论复议，原因: 企业申请重新评估检测标准适用条款", operatorId: inspector.id, oldStatus: SampleStatus.DISPOSED, newStatus: SampleStatus.PENDING_DISPOSAL, timestamp: new Date(oneDayAgo.getTime() + 6 * 60 * 60 * 1000) },
    ],
  });

  console.log("样本4（结论复议）创建完成");

  const sample5 = await prisma.sample.create({
    data: {
      sampleNo: "YP202406050005",
      customsDeclarationNo: "420220241000005",
      goodsName: "进口鲜蓝莓",
      goodsCategory: "农产品",
      hsCode: "0810400000",
      quantity: 100,
      unit: "箱",
      originCountry: "智利",
      port: "深圳港",
      consignee: "深圳水果进口有限公司",
      consignor: "Chile Berry Farms",
      status: SampleStatus.TESTING,
      sealStatus: SealStatus.INTACT,
      abnormalType: AbnormalType.NONE,
      samplerId: inspector.id,
      samplingTime: oneDayAgo,
      samplingLocation: "蛇口港冷链查验中心",
      samplingNotes: "冷链运输，温度记录正常",
      currentHandlerId: labTech.id,
      sentToLabTime: new Date(oneDayAgo.getTime() + 3 * 60 * 60 * 1000),
      labReceivedTime: new Date(oneDayAgo.getTime() + 5 * 60 * 60 * 1000),
      testItems: {
        create: [
          { name: "农药残留检测", isRequired: true, sortOrder: 0 },
          { name: "重金属检测", isRequired: true, sortOrder: 1 },
          { name: "微生物检测", isRequired: true, sortOrder: 2 },
          { name: "感官检验", isRequired: true, sortOrder: 3 },
        ],
      },
      seals: {
        create: {
          sealNo: "FQ567890",
          status: SealStatus.INTACT,
          sealType: "一次性铅封",
          sealedAt: oneDayAgo,
        },
      },
    },
    include: { testItems: true },
  });

  await prisma.auditLog.createMany({
    data: [
      { sampleId: sample5.id, action: "取样登记", description: "查验关员张查验完成样品取样登记，封签号: FQ567890", operatorId: inspector.id, newStatus: SampleStatus.SAMPLED, timestamp: oneDayAgo },
      { sampleId: sample5.id, action: "送检", description: "样品已送检至实验室", operatorId: inspector.id, oldStatus: SampleStatus.SAMPLED, newStatus: SampleStatus.SENT_TO_LAB, timestamp: new Date(oneDayAgo.getTime() + 3 * 60 * 60 * 1000) },
      { sampleId: sample5.id, action: "实验室收样", description: "实验室已接收样品，开始检测", operatorId: labTech.id, oldStatus: SampleStatus.SENT_TO_LAB, newStatus: SampleStatus.TESTING, timestamp: new Date(oneDayAgo.getTime() + 5 * 60 * 60 * 1000) },
    ],
  });

  console.log("样本5（检测中）创建完成");

  console.log("所有样本数据播种完成！");
  console.log("演示账号：");
  console.log("  查验关员: inspector / 123456");
  console.log("  实验室人员: labtech / 123456");
  console.log("  处置复核人: reviewer / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
