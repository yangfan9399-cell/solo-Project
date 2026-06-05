import { db } from "./index";
import { users, constructionTeams, workers, constructionAreas, permits, permitHistories, permitWorkers } from "./schema";

async function seed() {
  console.log("🌱 开始种子数据...");

  await db.delete(permitHistories);
  await db.delete(permitWorkers);
  await db.delete(permits);
  await db.delete(workers);
  await db.delete(constructionTeams);
  await db.delete(constructionAreas);
  await db.delete(users);

  const [securityOfficer, engineeringManager, safetyReviewer] = await db
    .insert(users)
    .values([
      { name: "张安保", role: "SECURITY_OFFICER" },
      { name: "李工程", role: "ENGINEERING_MANAGER" },
      { name: "王安全", role: "SAFETY_REVIEWER" },
    ])
    .returning();

  const [areaA, areaB, areaC, areaD, areaE] = await db
    .insert(constructionAreas)
    .values([
      { name: "A栋3楼东侧", code: "A-3F-E", building: "A栋", floor: "3楼", description: "办公区域东侧走廊改造", capacity: 8 },
      { name: "B栋地下车库", code: "B-B1", building: "B栋", floor: "B1", description: "地下停车场消防系统升级", capacity: 15 },
      { name: "C栋屋顶", code: "C-RF", building: "C栋", floor: "屋顶", description: "屋顶设备维修作业", capacity: 5 },
      { name: "D栋2楼会议室", code: "D-2F-M", building: "D栋", floor: "2楼", description: "会议室装修改造", capacity: 6 },
      { name: "园区主广场", code: "PLAZA", building: "公共区域", floor: "1楼", description: "广场景观改造", capacity: 20 },
    ])
    .returning();

  const [team1, team2, team3, team4] = await db
    .insert(constructionTeams)
    .values([
      { name: "顺达电气施工队", company: "顺达建筑工程有限公司", leaderName: "刘顺达", leaderPhone: "13800138001", licenseNumber: "JD-2024-001" },
      { name: "永安消防工程队", company: "永安消防设备有限公司", leaderName: "陈永安", leaderPhone: "13800138002", licenseNumber: "XF-2024-002" },
      { name: "精诚装饰施工队", company: "精诚装饰设计工程有限公司", leaderName: "赵精诚", leaderPhone: "13800138003", licenseNumber: "ZS-2024-003" },
      { name: "通达机电安装队", company: "通达机电工程有限公司", leaderName: "孙通达", leaderPhone: "13800138004", licenseNumber: "JD-2024-004" },
    ])
    .returning();

  const [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12] = await db
    .insert(workers)
    .values([
      { teamId: team1.id, name: "张电工", idCard: "110101199001010001", phone: "13900139001", hasSafetyCert: true, certNumber: "AQ-2023-001", certExpireDate: "2025-12-31" },
      { teamId: team1.id, name: "李电工", idCard: "110101199002020002", phone: "13900139002", hasSafetyCert: true, certNumber: "AQ-2023-002", certExpireDate: "2025-06-30" },
      { teamId: team1.id, name: "王电工", idCard: "110101199003030003", phone: "13900139003", hasSafetyCert: false },
      { teamId: team2.id, name: "赵消防", idCard: "110101199004040004", phone: "13900139004", hasSafetyCert: true, certNumber: "XF-2023-001", certExpireDate: "2025-12-31" },
      { teamId: team2.id, name: "钱消防", idCard: "110101199005050005", phone: "13900139005", hasSafetyCert: true, certNumber: "XF-2023-002", certExpireDate: "2025-09-30" },
      { teamId: team2.id, name: "孙消防", idCard: "110101199006060006", phone: "13900139006", hasSafetyCert: false },
      { teamId: team3.id, name: "周装饰", idCard: "110101199007070007", phone: "13900139007", hasSafetyCert: true, certNumber: "ZS-2023-001", certExpireDate: "2025-12-31" },
      { teamId: team3.id, name: "吴装饰", idCard: "110101199008080008", phone: "13900139008", hasSafetyCert: true, certNumber: "ZS-2023-002", certExpireDate: "2025-03-31" },
      { teamId: team3.id, name: "郑装饰", idCard: "110101199009090009", phone: "13900139009", hasSafetyCert: false },
      { teamId: team4.id, name: "冯机电", idCard: "110101199010100010", phone: "13900139010", hasSafetyCert: true, certNumber: "JD-2023-001", certExpireDate: "2025-12-31" },
      { teamId: team4.id, name: "陈机电", idCard: "110101199011110011", phone: "13900139011", hasSafetyCert: true, certNumber: "JD-2023-002", certExpireDate: "2025-08-31" },
      { teamId: team4.id, name: "褚机电", idCard: "110101199012120012", phone: "13900139012", hasSafetyCert: false },
    ])
    .returning();

  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [permit1, permit2, permit3, permit4, permit5] = await db
    .insert(permits)
    .values([
      {
        permitNumber: "SG-20240601-0001",
        teamId: team1.id,
        areaId: areaA.id,
        constructionType: "ELECTRICAL",
        startDate: formatDate(dayAfterTomorrow),
        endDate: formatDate(nextWeek),
        startTime: "08:00:00",
        endTime: "18:00:00",
        workContent: "A栋3楼东侧走廊电路改造，更换老化电线和配电箱",
        status: "APPROVED",
        securityOfficerId: securityOfficer.id,
        engineeringManagerId: engineeringManager.id,
        safetyReviewerId: safetyReviewer.id,
        hasDocuments: true,
        hasAreaConflict: false,
        safetyBriefingStatus: "COMPLETED",
        safetyBriefingEvidence: [
          { type: "photo", url: "/evidence/briefing-1.jpg", description: "安全交底现场照片" },
          { type: "document", url: "/evidence/briefing-doc.pdf", description: "安全交底签到表" },
        ],
        checkInTime: null,
        checkOutTime: null,
        anomalyType: null,
        stayDurationHours: null,
      },
      {
        permitNumber: "SG-20240602-0002",
        teamId: team2.id,
        areaId: areaB.id,
        constructionType: "FIRE_SAFETY",
        startDate: formatDate(today),
        endDate: formatDate(dayAfterTomorrow),
        startTime: "09:00:00",
        endTime: "17:00:00",
        workContent: "B栋地下车库消防系统升级改造",
        status: "PENDING_DOCUMENT",
        securityOfficerId: securityOfficer.id,
        engineeringManagerId: null,
        safetyReviewerId: null,
        hasDocuments: false,
        documentMissingReason: "施工单位营业执照副本未提供，特种作业操作证缺失2份",
        hasAreaConflict: false,
        safetyBriefingStatus: "PENDING",
        checkInTime: null,
        checkOutTime: null,
        anomalyType: "DOCUMENT_MISSING",
        anomalyReason: "证件缺失",
        stayDurationHours: null,
      },
      {
        permitNumber: "SG-20240603-0003",
        teamId: team3.id,
        areaId: areaD.id,
        constructionType: "DECORATION",
        startDate: formatDate(dayAfterTomorrow),
        endDate: formatDate(nextWeek),
        startTime: "08:30:00",
        endTime: "17:30:00",
        workContent: "D栋2楼会议室装修改造工程",
        status: "AREA_CONFLICT",
        securityOfficerId: securityOfficer.id,
        engineeringManagerId: engineeringManager.id,
        safetyReviewerId: null,
        hasDocuments: true,
        hasAreaConflict: true,
        areaConflictDetail: "与另一支施工队「宏达机电」在同一时间段申请了D栋2楼区域，对方施工时间为6月5日至6月8日",
        safetyBriefingStatus: "PENDING",
        checkInTime: null,
        checkOutTime: null,
        anomalyType: "AREA_CONFLICT",
        anomalyReason: "施工区域冲突",
        stayDurationHours: null,
      },
      {
        permitNumber: "SG-20240604-0004",
        teamId: team4.id,
        areaId: areaC.id,
        constructionType: "HVAC",
        startDate: formatDate(yesterday),
        endDate: formatDate(today),
        startTime: "07:00:00",
        endTime: "19:00:00",
        workContent: "C栋屋顶空调机组检修保养",
        status: "SAFETY_BRIEFING_REJECTED",
        securityOfficerId: securityOfficer.id,
        engineeringManagerId: engineeringManager.id,
        safetyReviewerId: safetyReviewer.id,
        hasDocuments: true,
        hasAreaConflict: false,
        safetyBriefingStatus: "REJECTED",
        safetyRejectReason: "高空作业安全措施不到位，未提供完整的吊篮作业安全方案，施工人员安全带规格不符合要求",
        checkInTime: null,
        checkOutTime: null,
        anomalyType: "SAFETY_BRIEFING_FAILED",
        anomalyReason: "安全交底未通过",
        stayDurationHours: null,
      },
      {
        permitNumber: "SG-20240528-0005",
        teamId: team1.id,
        areaId: areaE.id,
        constructionType: "OTHER",
        startDate: formatDate(threeDaysAgo),
        endDate: formatDate(twoDaysAgo),
        startTime: "08:00:00",
        endTime: "18:00:00",
        workContent: "园区主广场景观照明线路检修",
        status: "COMPLETED",
        securityOfficerId: securityOfficer.id,
        engineeringManagerId: engineeringManager.id,
        safetyReviewerId: safetyReviewer.id,
        hasDocuments: true,
        hasAreaConflict: false,
        safetyBriefingStatus: "COMPLETED",
        safetyBriefingEvidence: [
          { type: "photo", url: "/evidence/briefing-2.jpg", description: "安全交底现场" },
        ],
        actualCheckIn: new Date(threeDaysAgo.getTime() + 8 * 60 * 60 * 1000),
        actualCheckOut: new Date(twoDaysAgo.getTime() + 20 * 60 * 60 * 1000),
        checkInTime: new Date(threeDaysAgo.getTime() + 8 * 60 * 60 * 1000),
        checkOutTime: new Date(twoDaysAgo.getTime() + 18 * 60 * 60 * 1000),
        anomalyType: "OVERSTAY",
        anomalyReason: "超时滞留2小时",
        stayDurationHours: 36,
      },
    ])
    .returning();

  await db.insert(permitWorkers).values([
    { permitId: permit1.id, workerId: w1.id },
    { permitId: permit1.id, workerId: w2.id },
    { permitId: permit1.id, workerId: w3.id },
    { permitId: permit2.id, workerId: w4.id },
    { permitId: permit2.id, workerId: w5.id },
    { permitId: permit2.id, workerId: w6.id },
    { permitId: permit3.id, workerId: w7.id },
    { permitId: permit3.id, workerId: w8.id },
    { permitId: permit3.id, workerId: w9.id },
    { permitId: permit4.id, workerId: w10.id },
    { permitId: permit4.id, workerId: w11.id },
    { permitId: permit4.id, workerId: w12.id },
    { permitId: permit5.id, workerId: w1.id },
    { permitId: permit5.id, workerId: w2.id },
  ]);

  await db.insert(permitHistories).values([
    {
      permitId: permit1.id,
      action: "CREATE",
      statusFrom: null,
      statusTo: "DRAFT",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "创建施工许可申请",
    },
    {
      permitId: permit1.id,
      action: "SUBMIT",
      statusFrom: "DRAFT",
      statusTo: "PENDING_AREA_CONFIRM",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "提交审核，等待工程负责人确认施工区域",
    },
    {
      permitId: permit1.id,
      action: "CONFIRM_AREA",
      statusFrom: "PENDING_AREA_CONFIRM",
      statusTo: "PENDING_SAFETY_BRIEFING",
      operatorId: engineeringManager.id,
      operatorName: engineeringManager.name,
      operatorRole: engineeringManager.role,
      remark: "施工区域确认无误",
    },
    {
      permitId: permit1.id,
      action: "CONFIRM_SAFETY",
      statusFrom: "PENDING_SAFETY_BRIEFING",
      statusTo: "APPROVED",
      operatorId: safetyReviewer.id,
      operatorName: safetyReviewer.name,
      operatorRole: safetyReviewer.role,
      remark: "安全交底完成，施工许可已批准",
    },
    {
      permitId: permit2.id,
      action: "CREATE",
      statusFrom: null,
      statusTo: "DRAFT",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "创建施工许可申请",
    },
    {
      permitId: permit2.id,
      action: "REJECT_DOCUMENT",
      statusFrom: "DRAFT",
      statusTo: "PENDING_DOCUMENT",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "证件不全，需补充施工单位营业执照副本及特种作业操作证",
    },
    {
      permitId: permit3.id,
      action: "CREATE",
      statusFrom: null,
      statusTo: "DRAFT",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "创建施工许可申请",
    },
    {
      permitId: permit3.id,
      action: "SUBMIT",
      statusFrom: "DRAFT",
      statusTo: "PENDING_AREA_CONFIRM",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "提交审核",
    },
    {
      permitId: permit3.id,
      action: "AREA_CONFLICT",
      statusFrom: "PENDING_AREA_CONFIRM",
      statusTo: "AREA_CONFLICT",
      operatorId: engineeringManager.id,
      operatorName: engineeringManager.name,
      operatorRole: engineeringManager.role,
      remark: "检测到区域冲突：与宏达机电施工队时间重叠",
    },
    {
      permitId: permit4.id,
      action: "CREATE",
      statusFrom: null,
      statusTo: "DRAFT",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "创建施工许可申请",
    },
    {
      permitId: permit4.id,
      action: "SUBMIT",
      statusFrom: "DRAFT",
      statusTo: "PENDING_AREA_CONFIRM",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "提交审核",
    },
    {
      permitId: permit4.id,
      action: "CONFIRM_AREA",
      statusFrom: "PENDING_AREA_CONFIRM",
      statusTo: "PENDING_SAFETY_BRIEFING",
      operatorId: engineeringManager.id,
      operatorName: engineeringManager.name,
      operatorRole: engineeringManager.role,
      remark: "施工区域确认无误",
    },
    {
      permitId: permit4.id,
      action: "REJECT_SAFETY",
      statusFrom: "PENDING_SAFETY_BRIEFING",
      statusTo: "SAFETY_BRIEFING_REJECTED",
      operatorId: safetyReviewer.id,
      operatorName: safetyReviewer.name,
      operatorRole: safetyReviewer.role,
      remark: "高空作业安全措施不到位，需重新提交安全方案",
    },
    {
      permitId: permit5.id,
      action: "CREATE",
      statusFrom: null,
      statusTo: "DRAFT",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "创建施工许可申请",
    },
    {
      permitId: permit5.id,
      action: "SUBMIT",
      statusFrom: "DRAFT",
      statusTo: "PENDING_AREA_CONFIRM",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "提交审核",
    },
    {
      permitId: permit5.id,
      action: "CONFIRM_AREA",
      statusFrom: "PENDING_AREA_CONFIRM",
      statusTo: "PENDING_SAFETY_BRIEFING",
      operatorId: engineeringManager.id,
      operatorName: engineeringManager.name,
      operatorRole: engineeringManager.role,
      remark: "区域确认无误",
    },
    {
      permitId: permit5.id,
      action: "CONFIRM_SAFETY",
      statusFrom: "PENDING_SAFETY_BRIEFING",
      statusTo: "APPROVED",
      operatorId: safetyReviewer.id,
      operatorName: safetyReviewer.name,
      operatorRole: safetyReviewer.role,
      remark: "安全交底完成",
    },
    {
      permitId: permit5.id,
      action: "CHECK_IN",
      statusFrom: "APPROVED",
      statusTo: "IN_PROGRESS",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "施工队入园，开始施工",
    },
    {
      permitId: permit5.id,
      action: "CHECK_OUT",
      statusFrom: "IN_PROGRESS",
      statusTo: "COMPLETED",
      operatorId: securityOfficer.id,
      operatorName: securityOfficer.name,
      operatorRole: securityOfficer.role,
      remark: "施工完成离场，实际滞留超出许可时间2小时",
    },
  ]);

  console.log("✅ 种子数据创建完成！");
}

seed().catch((e) => {
  console.error("❌ 种子数据创建失败:", e);
  process.exit(1);
});
