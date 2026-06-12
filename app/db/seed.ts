import { db, sql } from "./index";
import { users, complaints, complaintNodes, attachments } from "./schema";

async function seed() {
  console.log("🌱 开始种子数据...");

  await db.delete(attachments);
  await db.delete(complaintNodes);
  await db.delete(complaints);
  await db.delete(users);

  const userList = await db.insert(users).values([
    { name: "张伟", role: "applicant", department: "环境监测一科" },
    { name: "李娜", role: "applicant", department: "环境监测二科" },
    { name: "王强", role: "reviewer", department: "执法复核科" },
    { name: "刘芳", role: "archivist", department: "档案管理科" },
    { name: "陈明", role: "reviewer", department: "执法复核科" },
  ]).returning();

  const zhangWei = userList[0];
  const liNa = userList[1];
  const wangQiang = userList[2];
  const liuFang = userList[3];
  const chenMing = userList[4];

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

  const complaint1 = await db.insert(complaints).values({
    caseNo: "ZS202412001",
    source: "12345热线",
    title: "某建筑工地夜间施工噪声扰民",
    description: "市民反映位于城东路88号的某建筑工地，每晚22点后仍在进行施工作业，产生严重噪声，影响周边居民正常休息。",
    location: "城东路88号",
    currentStatus: "archived",
    applicantId: zhangWei.id,
    currentHandlerId: liuFang.id,
    noiseLevelBefore: "78.5",
    noiseLevelAfter: "52.3",
    fineAmount: "20000.00",
    responsibleParty: "华盛建筑工程有限公司",
    responsiblePerson: "赵建国",
    contactPhone: "13800138001",
    violationType: "夜间施工噪声污染",
    legalBasis: "《中华人民共和国环境噪声污染防治法》第三十条、第五十六条",
    conclusion: "经现场监测，该工地夜间施工噪声超标6.5分贝，已责令停止夜间施工并处罚款20000元。整改后复测达标，予以结案。",
    isArchived: true,
    hasException: false,
    receivedAt: daysAgo(15),
    assignedAt: daysAgo(14),
    processedAt: daysAgo(10),
    reviewedAt: daysAgo(7),
    archivedAt: daysAgo(3),
  }).returning();

  const c1 = complaint1[0];

  await db.insert(complaintNodes).values([
    {
      complaintId: c1.id,
      nodeType: "accept",
      status: "pending",
      operatorId: zhangWei.id,
      operatorName: zhangWei.name,
      operatorRole: zhangWei.role,
      remark: "受理12345热线转办的噪声投诉案件",
      timestamp: daysAgo(15),
      sortOrder: 1,
    },
    {
      complaintId: c1.id,
      nodeType: "assign",
      status: "processing",
      operatorId: wangQiang.id,
      operatorName: wangQiang.name,
      operatorRole: wangQiang.role,
      remark: "分派给张伟负责现场监测和处理",
      timestamp: daysAgo(14),
      sortOrder: 2,
      changes: { currentHandlerId: zhangWei.id, currentStatus: "processing" },
    },
    {
      complaintId: c1.id,
      nodeType: "process",
      status: "review",
      operatorId: zhangWei.id,
      operatorName: zhangWei.name,
      operatorRole: zhangWei.role,
      remark: "已完成现场监测和处罚，提交复核",
      timestamp: daysAgo(10),
      sortOrder: 3,
      changes: {
        noiseLevelBefore: "78.5",
        noiseLevelAfter: "52.3",
        fineAmount: "20000.00",
        responsibleParty: "华盛建筑工程有限公司",
        legalBasis: "《中华人民共和国环境噪声污染防治法》第三十条、第五十六条",
        conclusion: "经现场监测，该工地夜间施工噪声超标6.5分贝，已责令停止夜间施工并处罚款20000元。整改后复测达标，予以结案。",
        currentStatus: "review",
      },
      diffFields: ["noiseLevelBefore", "noiseLevelAfter", "fineAmount", "responsibleParty", "legalBasis", "conclusion"],
    },
    {
      complaintId: c1.id,
      nodeType: "review",
      status: "archived",
      operatorId: wangQiang.id,
      operatorName: wangQiang.name,
      operatorRole: wangQiang.role,
      remark: "复核通过，材料完整，移交归档",
      timestamp: daysAgo(7),
      sortOrder: 4,
      changes: { currentStatus: "archived" },
    },
    {
      complaintId: c1.id,
      nodeType: "archive",
      status: "archived",
      operatorId: liuFang.id,
      operatorName: liuFang.name,
      operatorRole: liuFang.role,
      remark: "档案已归档，编号：DA-ZS-2024-001",
      timestamp: daysAgo(3),
      sortOrder: 5,
      changes: { isArchived: true, archivedAt: daysAgo(3).toISOString() },
    },
  ]);

  await db.insert(attachments).values([
    { complaintId: c1.id, type: "photo", name: "现场照片1.jpg", url: "/attachments/c1_photo1.jpg", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持", description: "夜间施工全景照" },
    { complaintId: c1.id, type: "photo", name: "现场照片2.jpg", url: "/attachments/c1_photo2.jpg", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持", description: "施工机械作业照" },
    { complaintId: c1.id, type: "report", name: "噪声监测报告.pdf", url: "/attachments/c1_report.pdf", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持", description: "第一份监测报告" },
    { complaintId: c1.id, type: "report", name: "整改复测报告.pdf", url: "/attachments/c1_retest.pdf", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持", description: "整改后复测报告" },
    { complaintId: c1.id, type: "document", name: "行政处罚决定书.pdf", url: "/attachments/c1_decision.pdf", version: 1, uploadedBy: wangQiang.id, isEvidence: false, description: "正式处罚文书" },
  ]);

  const complaint2 = await db.insert(complaints).values({
    caseNo: "ZS202412002",
    source: "现场巡查",
    title: "某KTV夜间噪声超标排放",
    description: "执法人员现场巡查发现，位于人民南路156号的星光KTV，夜间边界噪声超过国家规定排放标准。",
    location: "人民南路156号",
    currentStatus: "rejected",
    applicantId: liNa.id,
    currentHandlerId: liNa.id,
    noiseLevelBefore: "72.0",
    noiseLevelAfter: null,
    fineAmount: null,
    responsibleParty: "星光娱乐有限公司",
    responsiblePerson: "孙明华",
    contactPhone: "13900139002",
    violationType: "社会生活噪声污染",
    legalBasis: "《中华人民共和国环境噪声污染防治法》第四十三条、第五十九条",
    conclusion: null,
    isArchived: false,
    hasException: true,
    exceptionType: "missing_fields",
    blockingReason: "记录漏填：整改后噪声值、罚款金额、处理结论等关键字段缺失，无法进入复核环节。",
    remedyPath: "申请人需补充：1) 整改后噪声监测数据；2) 处罚金额确认；3) 明确处理结论。补充完成后重新提交复核。",
    receivedAt: daysAgo(10),
    assignedAt: daysAgo(9),
    processedAt: daysAgo(6),
    reviewedAt: hoursAgo(4),
  }).returning();

  const c2 = complaint2[0];

  await db.insert(complaintNodes).values([
    {
      complaintId: c2.id,
      nodeType: "accept",
      status: "pending",
      operatorId: liNa.id,
      operatorName: liNa.name,
      operatorRole: liNa.role,
      remark: "现场巡查发现噪声超标，立案受理",
      timestamp: daysAgo(10),
      sortOrder: 1,
    },
    {
      complaintId: c2.id,
      nodeType: "assign",
      status: "processing",
      operatorId: chenMing.id,
      operatorName: chenMing.name,
      operatorRole: chenMing.role,
      remark: "分派给李娜负责处理",
      timestamp: daysAgo(9),
      sortOrder: 2,
      changes: { currentHandlerId: liNa.id, currentStatus: "processing" },
    },
    {
      complaintId: c2.id,
      nodeType: "process",
      status: "review",
      operatorId: liNa.id,
      operatorName: liNa.name,
      operatorRole: liNa.role,
      remark: "已完成初步监测，提交复核（注：整改复测尚未完成）",
      timestamp: daysAgo(6),
      sortOrder: 3,
      changes: {
        noiseLevelBefore: "72.0",
        responsibleParty: "星光娱乐有限公司",
        legalBasis: "《中华人民共和国环境噪声污染防治法》第四十三条、第五十九条",
        currentStatus: "review",
      },
      diffFields: ["noiseLevelBefore", "responsibleParty", "legalBasis"],
    },
    {
      complaintId: c2.id,
      nodeType: "reject",
      status: "rejected",
      operatorId: wangQiang.id,
      operatorName: wangQiang.name,
      operatorRole: wangQiang.role,
      remark: "退回补证：缺少整改后监测数据、罚款金额和处理结论",
      timestamp: hoursAgo(4),
      sortOrder: 4,
      isBlocking: true,
      blockingReason: "记录漏填：整改后噪声值、罚款金额、处理结论等关键字段缺失，无法进入复核环节。",
      remedyPath: "申请人需补充：1) 整改后噪声监测数据；2) 处罚金额确认；3) 明确处理结论。补充完成后重新提交复核。",
      diffFields: ["noiseLevelAfter", "fineAmount", "conclusion"],
      changes: { currentStatus: "rejected", hasException: true, exceptionType: "missing_fields" },
    },
  ]);

  await db.insert(attachments).values([
    { complaintId: c2.id, type: "photo", name: "KTV外观照.jpg", url: "/attachments/c2_photo1.jpg", version: 1, uploadedBy: liNa.id, isEvidence: true, evidenceConclusion: "支持" },
    { complaintId: c2.id, type: "report", name: "噪声监测报告.pdf", url: "/attachments/c2_report.pdf", version: 1, uploadedBy: liNa.id, isEvidence: true, evidenceConclusion: "支持", description: "仅含整改前数据" },
  ]);

  const complaint3 = await db.insert(complaints).values({
    caseNo: "ZS202412003",
    source: "信访",
    title: "某加工厂机器噪声扰民",
    description: "群众来信反映，位于工业大道233号的顺达五金加工厂，生产设备噪声严重，白天夜间均有噪声污染，影响周边居民正常生活。",
    location: "工业大道233号",
    currentStatus: "rejected",
    applicantId: zhangWei.id,
    currentHandlerId: zhangWei.id,
    noiseLevelBefore: "75.0",
    noiseLevelAfter: "65.0",
    fineAmount: "15000.00",
    responsibleParty: "顺达五金加工厂",
    responsiblePerson: "周大发",
    contactPhone: "13700137003",
    violationType: "工业噪声污染",
    legalBasis: "《中华人民共和国环境噪声污染防治法》第二十三条、第五十二条",
    conclusion: null,
    isArchived: false,
    hasException: true,
    exceptionType: "attachment_version_mismatch",
    blockingReason: "附件版本不一致：监测报告存在两个版本（v1、v2），数据存在差异（噪声值从75.0变为72.0），需以哪个版本为准不明确。",
    remedyPath: "请申请人确认最终采用的监测报告版本，并说明版本差异原因。确认无误后重新提交。",
    receivedAt: daysAgo(12),
    assignedAt: daysAgo(11),
    processedAt: daysAgo(5),
    reviewedAt: hoursAgo(8),
  }).returning();

  const c3 = complaint3[0];

  await db.insert(complaintNodes).values([
    {
      complaintId: c3.id,
      nodeType: "accept",
      status: "pending",
      operatorId: zhangWei.id,
      operatorName: zhangWei.name,
      operatorRole: zhangWei.role,
      remark: "受理信访转办的噪声投诉",
      timestamp: daysAgo(12),
      sortOrder: 1,
    },
    {
      complaintId: c3.id,
      nodeType: "assign",
      status: "processing",
      operatorId: wangQiang.id,
      operatorName: wangQiang.name,
      operatorRole: wangQiang.role,
      remark: "分派给张伟负责处理",
      timestamp: daysAgo(11),
      sortOrder: 2,
      changes: { currentHandlerId: zhangWei.id, currentStatus: "processing" },
    },
    {
      complaintId: c3.id,
      nodeType: "process",
      status: "review",
      operatorId: zhangWei.id,
      operatorName: zhangWei.name,
      operatorRole: zhangWei.role,
      remark: "已完成监测和整改，提交复核（已上传修订版监测报告）",
      timestamp: daysAgo(5),
      sortOrder: 3,
      changes: {
        noiseLevelBefore: "75.0",
        noiseLevelAfter: "65.0",
        fineAmount: "15000.00",
        responsibleParty: "顺达五金加工厂",
        legalBasis: "《中华人民共和国环境噪声污染防治法》第二十三条、第五十二条",
        currentStatus: "review",
      },
      diffFields: ["noiseLevelBefore", "noiseLevelAfter", "fineAmount", "responsibleParty", "legalBasis"],
    },
    {
      complaintId: c3.id,
      nodeType: "reject",
      status: "rejected",
      operatorId: chenMing.id,
      operatorName: chenMing.name,
      operatorRole: chenMing.role,
      remark: "退回补证：监测报告存在两个版本，数据不一致",
      timestamp: hoursAgo(8),
      sortOrder: 4,
      isBlocking: true,
      blockingReason: "附件版本不一致：监测报告存在两个版本（v1、v2），数据存在差异（噪声值从75.0变为72.0），需以哪个版本为准不明确。",
      remedyPath: "请申请人确认最终采用的监测报告版本，并说明版本差异原因。确认无误后重新提交。",
      diffFields: ["attachments", "noiseLevelBefore"],
      changes: { currentStatus: "rejected", hasException: true, exceptionType: "attachment_version_mismatch" },
    },
  ]);

  await db.insert(attachments).values([
    { complaintId: c3.id, type: "photo", name: "工厂外景.jpg", url: "/attachments/c3_photo1.jpg", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持" },
    { complaintId: c3.id, type: "report", name: "噪声监测报告_v1.pdf", url: "/attachments/c3_report_v1.pdf", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持", description: "初版报告，噪声值75.0dB" },
    { complaintId: c3.id, type: "report", name: "噪声监测报告_v2.pdf", url: "/attachments/c3_report_v2.pdf", version: 2, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "待核实", description: "修订版报告，噪声值72.0dB" },
    { complaintId: c3.id, type: "audio", name: "现场录音.wav", url: "/attachments/c3_audio.wav", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持" },
  ]);

  const complaint4 = await db.insert(complaints).values({
    caseNo: "ZS202412004",
    source: "12345热线",
    title: "某超市空调外机噪声扰民",
    description: "市民反映位于建设路45号的好又多超市，楼顶空调外机噪声过大，影响周边居民。该案曾于上月处理结案，但投诉人称噪声问题依旧存在。",
    location: "建设路45号",
    currentStatus: "processing",
    applicantId: liNa.id,
    currentHandlerId: liNa.id,
    noiseLevelBefore: "68.0",
    noiseLevelAfter: "55.0",
    fineAmount: "5000.00",
    responsibleParty: "好又多连锁超市有限公司",
    responsiblePerson: "吴经理",
    contactPhone: "13600136004",
    violationType: "社会生活噪声污染",
    legalBasis: "《中华人民共和国环境噪声污染防治法》第四十四条、第六十条",
    conclusion: "经复测，超市已采取降噪措施，边界噪声达标，予以结案。（注：因投诉人再次投诉，已启动重新处理程序）",
    isArchived: false,
    hasException: true,
    exceptionType: "reprocess",
    blockingReason: null,
    remedyPath: null,
    receivedAt: daysAgo(30),
    assignedAt: daysAgo(29),
    processedAt: daysAgo(22),
    reviewedAt: daysAgo(18),
    archivedAt: daysAgo(15),
  }).returning();

  const c4 = complaint4[0];

  await db.insert(complaintNodes).values([
    {
      complaintId: c4.id,
      nodeType: "accept",
      status: "pending",
      operatorId: liNa.id,
      operatorName: liNa.name,
      operatorRole: liNa.role,
      remark: "受理12345热线转办的空调外机噪声投诉",
      timestamp: daysAgo(30),
      sortOrder: 1,
    },
    {
      complaintId: c4.id,
      nodeType: "assign",
      status: "processing",
      operatorId: wangQiang.id,
      operatorName: wangQiang.name,
      operatorRole: wangQiang.role,
      remark: "分派给李娜负责处理",
      timestamp: daysAgo(29),
      sortOrder: 2,
      changes: { currentHandlerId: liNa.id, currentStatus: "processing" },
    },
    {
      complaintId: c4.id,
      nodeType: "process",
      status: "review",
      operatorId: liNa.id,
      operatorName: liNa.name,
      operatorRole: liNa.role,
      remark: "已完成监测和整改，提交复核",
      timestamp: daysAgo(22),
      sortOrder: 3,
      changes: {
        noiseLevelBefore: "68.0",
        noiseLevelAfter: "55.0",
        fineAmount: "5000.00",
        responsibleParty: "好又多连锁超市有限公司",
        legalBasis: "《中华人民共和国环境噪声污染防治法》第四十四条、第六十条",
        conclusion: "经复测，超市已采取降噪措施，边界噪声达标，予以结案。",
        currentStatus: "review",
      },
      diffFields: ["noiseLevelBefore", "noiseLevelAfter", "fineAmount", "responsibleParty", "legalBasis", "conclusion"],
    },
    {
      complaintId: c4.id,
      nodeType: "review",
      status: "archived",
      operatorId: wangQiang.id,
      operatorName: wangQiang.name,
      operatorRole: wangQiang.role,
      remark: "复核通过，材料完整，移交归档",
      timestamp: daysAgo(18),
      sortOrder: 4,
      changes: { currentStatus: "archived" },
    },
    {
      complaintId: c4.id,
      nodeType: "archive",
      status: "archived",
      operatorId: liuFang.id,
      operatorName: liuFang.name,
      operatorRole: liuFang.role,
      remark: "档案已归档，编号：DA-ZS-2024-004",
      timestamp: daysAgo(15),
      sortOrder: 5,
      changes: { isArchived: true, archivedAt: daysAgo(15).toISOString() },
    },
    {
      complaintId: c4.id,
      nodeType: "reprocess",
      status: "processing",
      operatorId: wangQiang.id,
      operatorName: wangQiang.name,
      operatorRole: wangQiang.role,
      remark: "接到投诉人再次投诉，启动重新处理程序。原档案编号：DA-ZS-2024-004，重新处理后生成新节点序列。",
      timestamp: daysAgo(2),
      sortOrder: 6,
      changes: {
        currentStatus: "processing",
        isArchived: false,
        hasException: true,
        exceptionType: "reprocess",
        conclusion: "经复测，超市已采取降噪措施，边界噪声达标，予以结案。（注：因投诉人再次投诉，已启动重新处理程序）",
      },
      diffFields: ["currentStatus", "isArchived", "conclusion"],
    },
  ]);

  await db.insert(attachments).values([
    { complaintId: c4.id, type: "photo", name: "空调外机照片.jpg", url: "/attachments/c4_photo1.jpg", version: 1, uploadedBy: liNa.id, isEvidence: true, evidenceConclusion: "支持" },
    { complaintId: c4.id, type: "report", name: "噪声监测报告.pdf", url: "/attachments/c4_report.pdf", version: 1, uploadedBy: liNa.id, isEvidence: true, evidenceConclusion: "支持" },
    { complaintId: c4.id, type: "document", name: "整改通知书.pdf", url: "/attachments/c4_notice.pdf", version: 1, uploadedBy: liNa.id, isEvidence: false },
    { complaintId: c4.id, type: "document", name: "行政处罚决定书.pdf", url: "/attachments/c4_decision.pdf", version: 1, uploadedBy: wangQiang.id, isEvidence: false },
  ]);

  const complaint5 = await db.insert(complaints).values({
    caseNo: "ZS202412005",
    source: "其他",
    title: "某餐厅排风机噪声污染",
    description: "社区转来投诉，位于文昌街78号的美味餐厅，后厨排风机噪声大，影响楼上居民休息。",
    location: "文昌街78号",
    currentStatus: "review",
    applicantId: zhangWei.id,
    currentHandlerId: wangQiang.id,
    noiseLevelBefore: "70.5",
    noiseLevelAfter: "58.0",
    fineAmount: "8000.00",
    responsibleParty: "美味餐饮管理有限公司",
    responsiblePerson: "黄大厨",
    contactPhone: "13500135005",
    violationType: "社会生活噪声污染",
    legalBasis: "《中华人民共和国环境噪声污染防治法》第四十四条、第六十条",
    conclusion: "经监测，餐厅排风机噪声超标5.5分贝，已责令整改并处罚款8000元。整改后复测达标。",
    isArchived: false,
    hasException: false,
    receivedAt: daysAgo(8),
    assignedAt: daysAgo(7),
    processedAt: daysAgo(2),
  }).returning();

  const c5 = complaint5[0];

  await db.insert(complaintNodes).values([
    {
      complaintId: c5.id,
      nodeType: "accept",
      status: "pending",
      operatorId: zhangWei.id,
      operatorName: zhangWei.name,
      operatorRole: zhangWei.role,
      remark: "受理社区转来的餐厅噪声投诉",
      timestamp: daysAgo(8),
      sortOrder: 1,
    },
    {
      complaintId: c5.id,
      nodeType: "assign",
      status: "processing",
      operatorId: chenMing.id,
      operatorName: chenMing.name,
      operatorRole: chenMing.role,
      remark: "分派给张伟负责处理",
      timestamp: daysAgo(7),
      sortOrder: 2,
      changes: { currentHandlerId: zhangWei.id, currentStatus: "processing" },
    },
    {
      complaintId: c5.id,
      nodeType: "process",
      status: "review",
      operatorId: zhangWei.id,
      operatorName: zhangWei.name,
      operatorRole: zhangWei.role,
      remark: "已完成监测和整改，提交复核",
      timestamp: daysAgo(2),
      sortOrder: 3,
      changes: {
        noiseLevelBefore: "70.5",
        noiseLevelAfter: "58.0",
        fineAmount: "8000.00",
        responsibleParty: "美味餐饮管理有限公司",
        legalBasis: "《中华人民共和国环境噪声污染防治法》第四十四条、第六十条",
        conclusion: "经监测，餐厅排风机噪声超标5.5分贝，已责令整改并处罚款8000元。整改后复测达标。",
        currentStatus: "review",
      },
      diffFields: ["noiseLevelBefore", "noiseLevelAfter", "fineAmount", "responsibleParty", "legalBasis", "conclusion"],
    },
  ]);

  await db.insert(attachments).values([
    { complaintId: c5.id, type: "photo", name: "餐厅外观.jpg", url: "/attachments/c5_photo1.jpg", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持" },
    { complaintId: c5.id, type: "report", name: "噪声监测报告.pdf", url: "/attachments/c5_report.pdf", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持" },
    { complaintId: c5.id, type: "report", name: "复测报告.pdf", url: "/attachments/c5_retest.pdf", version: 1, uploadedBy: zhangWei.id, isEvidence: true, evidenceConclusion: "支持" },
  ]);

  console.log("✅ 种子数据插入完成！");
  console.log(`  - 用户: ${userList.length} 条`);
  console.log(`  - 投诉记录: 5 条`);
  console.log(`    1. ZS202412001 - 正常核销（已归档）`);
  console.log(`    2. ZS202412002 - 记录漏填（退回补证）`);
  console.log(`    3. ZS202412003 - 附件版本不一致（退回补证）`);
  console.log(`    4. ZS202412004 - 重新处理（归档后重新开启）`);
  console.log(`    5. ZS202412005 - 正常流程（待复核）`);

  await sql.end();
}

seed().catch((e) => {
  console.error("种子数据插入失败:", e);
  process.exit(1);
});
