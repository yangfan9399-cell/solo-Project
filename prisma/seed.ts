import { PrismaClient, Role, InspectionSource, IssueType, Severity, InspectionStatus, EvidenceType, ReviewActionType, HistoryActionType, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("开始清理现有数据...");
  await prisma.notification.deleteMany();
  await prisma.historyNode.deleteMany();
  await prisma.reviewAction.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.rectification.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();

  console.log("创建用户...");
  const inspector1 = await prisma.user.create({
    data: {
      username: "inspector1",
      name: "张巡查",
      role: Role.INSPECTOR,
    },
  });

  const inspector2 = await prisma.user.create({
    data: {
      username: "inspector2",
      name: "李巡查",
      role: Role.INSPECTOR,
    },
  });

  const reviewer1 = await prisma.user.create({
    data: {
      username: "reviewer1",
      name: "王复核",
      role: Role.REVIEWER,
    },
  });

  const reviewer2 = await prisma.user.create({
    data: {
      username: "reviewer2",
      name: "赵复核",
      role: Role.REVIEWER,
    },
  });

  console.log("创建楼栋...");
  const building1 = await prisma.building.create({
    data: {
      name: "1号楼",
      code: "BLD-001",
      address: "阳光小区1栋",
      responsible: "张物业",
      phone: "13800138001",
    },
  });

  const building2 = await prisma.building.create({
    data: {
      name: "2号楼",
      code: "BLD-002",
      address: "阳光小区2栋",
      responsible: "李物业",
      phone: "13800138002",
    },
  });

  const building3 = await prisma.building.create({
    data: {
      name: "3号楼",
      code: "BLD-003",
      address: "阳光小区3栋",
      responsible: "王物业",
      phone: "13800138003",
    },
  });

  const building4 = await prisma.building.create({
    data: {
      name: "4号楼",
      code: "BLD-004",
      address: "阳光小区4栋",
      responsible: "赵物业",
      phone: "13800138004",
    },
  });

  const now = new Date();

  console.log("创建样本1: 合格销项样本");
  const inspection1 = await prisma.inspection.create({
    data: {
      inspectionNo: "INSP-2025-0001",
      source: InspectionSource.PATROL,
      buildingId: building1.id,
      issueType: IssueType.WASTE_SORTING,
      description: "1号楼南侧垃圾桶未按分类投放，厨余垃圾混入其他垃圾桶",
      severity: Severity.MEDIUM,
      status: InspectionStatus.CLOSED,
      deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      rectificationDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      assignedToId: inspector1.id,
      createdById: inspector1.id,
      isOverdue: false,
    },
  });

  const history1_1 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection1.id,
      actionType: HistoryActionType.CREATE,
      fromStatus: null,
      toStatus: InspectionStatus.PENDING_RECTIFICATION,
      description: "巡查员张巡查发现垃圾分类问题，创建巡查记录",
      operatorId: inspector1.id,
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evidence.create({
    data: {
      type: EvidenceType.BEFORE_PHOTO,
      url: "https://picsum.photos/seed/before1/600/400",
      thumbnailUrl: "https://picsum.photos/seed/before1/200/150",
      description: "整改前照片：垃圾分类混乱",
      uploadedById: inspector1.id,
      inspectionId: inspection1.id,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evidence.create({
    data: {
      type: EvidenceType.LOCATION_PHOTO,
      url: "https://picsum.photos/seed/location1/600/400",
      thumbnailUrl: "https://picsum.photos/seed/location1/200/150",
      description: "位置照片：1号楼南侧垃圾桶",
      uploadedById: inspector1.id,
      inspectionId: inspection1.id,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  const rectification1 = await prisma.rectification.create({
    data: {
      inspectionId: inspection1.id,
      description: "已对保洁人员进行垃圾分类培训，重新整理了垃圾桶分类标识，并按要求完成了分类投放整改",
      submittedById: inspector1.id,
      submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      isPhotoMissing: false,
      missingTypes: [],
      buildingMatch: true,
      isOverdue: false,
      isQualified: true,
    },
  });

  const afterEvidence1 = await prisma.evidence.create({
    data: {
      type: EvidenceType.AFTER_PHOTO,
      url: "https://picsum.photos/seed/after1/600/400",
      thumbnailUrl: "https://picsum.photos/seed/after1/200/150",
      description: "整改后照片：垃圾分类规范",
      uploadedById: inspector1.id,
      inspectionId: inspection1.id,
      rectificationId: rectification1.id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evidence.create({
    data: {
      type: EvidenceType.PROCESS_PHOTO,
      url: "https://picsum.photos/seed/process1/600/400",
      thumbnailUrl: "https://picsum.photos/seed/process1/200/150",
      description: "过程照片：分类标识更新",
      uploadedById: inspector1.id,
      inspectionId: inspection1.id,
      rectificationId: rectification1.id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const history1_2 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection1.id,
      actionType: HistoryActionType.SUBMIT_RECTIFICATION,
      fromStatus: InspectionStatus.PENDING_RECTIFICATION,
      toStatus: InspectionStatus.PENDING_REVIEW,
      description: "巡查员张巡查提交整改申请，附整改后照片和过程照片",
      operatorId: inspector1.id,
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      rectificationId: rectification1.id,
      metadata: {
        evidences: [afterEvidence1.id],
      },
    },
  });

  const review1 = await prisma.reviewAction.create({
    data: {
      inspectionId: inspection1.id,
      rectificationId: rectification1.id,
      actionType: ReviewActionType.APPROVE,
      comment: "整改到位，垃圾分类规范，证据完整，同意销项",
      reviewedById: reviewer1.id,
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      missingTypes: [],
    },
  });

  const history1_3 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection1.id,
      actionType: HistoryActionType.REVIEW_APPROVE,
      fromStatus: InspectionStatus.PENDING_REVIEW,
      toStatus: InspectionStatus.CLOSED,
      description: "复核员王复核审核通过，完成销项",
      operatorId: reviewer1.id,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      reviewActionId: review1.id,
      metadata: {
        comment: "整改到位，垃圾分类规范，证据完整，同意销项",
      },
    },
  });

  await prisma.inspection.update({
    where: { id: inspection1.id },
    data: { lastChangeId: history1_3.id },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.REVIEW_APPROVED,
      title: "整改已销项",
      content: "您提交的整改申请（INSP-2025-0001）已通过复核，完成销项。",
      inspectionId: inspection1.id,
      userId: inspector1.id,
      sentById: reviewer1.id,
      isRead: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 3600000),
    },
  });

  console.log("创建样本2: 照片缺失样本");
  const inspection2 = await prisma.inspection.create({
    data: {
      inspectionNo: "INSP-2025-0002",
      source: InspectionSource.COMPLAINT,
      buildingId: building2.id,
      issueType: IssueType.OVERFLOW,
      description: "2号楼东侧垃圾桶满溢，垃圾散落地面",
      severity: Severity.HIGH,
      status: InspectionStatus.PENDING_REVIEW,
      deadline: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      rectificationDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      assignedToId: inspector2.id,
      createdById: inspector1.id,
      isOverdue: false,
    },
  });

  const history2_1 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection2.id,
      actionType: HistoryActionType.CREATE,
      fromStatus: null,
      toStatus: InspectionStatus.PENDING_RECTIFICATION,
      description: "居民投诉2号楼垃圾桶满溢，巡查员张巡查核实后创建记录",
      operatorId: inspector1.id,
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evidence.create({
    data: {
      type: EvidenceType.BEFORE_PHOTO,
      url: "https://picsum.photos/seed/before2/600/400",
      thumbnailUrl: "https://picsum.photos/seed/before2/200/150",
      description: "整改前照片：垃圾桶满溢，垃圾散落",
      uploadedById: inspector1.id,
      inspectionId: inspection2.id,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const rectification2 = await prisma.rectification.create({
    data: {
      inspectionId: inspection2.id,
      description: "已联系清运公司清理，已清理完毕",
      submittedById: inspector2.id,
      submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      isPhotoMissing: true,
      missingTypes: ["AFTER_PHOTO", "PROCESS_PHOTO"],
      buildingMatch: true,
      isOverdue: false,
      isQualified: null,
    },
  });

  const history2_2 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection2.id,
      actionType: HistoryActionType.SUBMIT_RECTIFICATION,
      fromStatus: InspectionStatus.PENDING_RECTIFICATION,
      toStatus: InspectionStatus.PENDING_REVIEW,
      description: "巡查员李巡查提交整改申请，但缺少整改后照片和过程照片",
      operatorId: inspector2.id,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      rectificationId: rectification2.id,
    },
  });

  const history2_3 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection2.id,
      actionType: HistoryActionType.PHOTO_MISSING,
      fromStatus: InspectionStatus.PENDING_REVIEW,
      toStatus: InspectionStatus.PENDING_REVIEW,
      description: "系统检测缺少证据类型：AFTER_PHOTO（整改后照片）、PROCESS_PHOTO（过程照片）",
      operatorId: reviewer1.id,
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.inspection.update({
    where: { id: inspection2.id },
    data: { lastChangeId: history2_3.id },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.PHOTO_MISSING,
      title: "证据缺失提醒",
      content: "您提交的整改申请（INSP-2025-0002）缺少整改后照片和过程照片，请补充上传后再次提交。",
      inspectionId: inspection2.id,
      userId: inspector2.id,
      sentById: reviewer1.id,
      isRead: false,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  });

  console.log("创建样本3: 责任楼栋不匹配样本");
  const inspection3 = await prisma.inspection.create({
    data: {
      inspectionNo: "INSP-2025-0003",
      source: InspectionSource.MONITORING,
      buildingId: building3.id,
      issueType: IssueType.CONTAMINATION,
      description: "3号楼厨余垃圾桶被发现混入大量塑料包装",
      severity: Severity.HIGH,
      status: InspectionStatus.RETURNED,
      deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      rectificationDeadline: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      assignedToId: inspector1.id,
      createdById: inspector2.id,
      isOverdue: false,
    },
  });

  const history3_1 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection3.id,
      actionType: HistoryActionType.CREATE,
      fromStatus: null,
      toStatus: InspectionStatus.PENDING_RECTIFICATION,
      description: "监控发现3号楼厨余垃圾桶污染问题，指派给张巡查处理",
      operatorId: inspector2.id,
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evidence.create({
    data: {
      type: EvidenceType.BEFORE_PHOTO,
      url: "https://picsum.photos/seed/before3/600/400",
      thumbnailUrl: "https://picsum.photos/seed/before3/200/150",
      description: "整改前照片：厨余垃圾混有塑料包装",
      uploadedById: inspector2.id,
      inspectionId: inspection3.id,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const rectification3 = await prisma.rectification.create({
    data: {
      inspectionId: inspection3.id,
      description: "已清理垃圾桶并对投放居民进行教育",
      submittedById: inspector1.id,
      submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      isPhotoMissing: false,
      missingTypes: [],
      buildingMatch: false,
      isOverdue: false,
      isQualified: false,
    },
  });

  await prisma.evidence.create({
    data: {
      type: EvidenceType.AFTER_PHOTO,
      url: "https://picsum.photos/seed/after3/600/400",
      thumbnailUrl: "https://picsum.photos/seed/after3/200/150",
      description: "整改后照片（实际为4号楼，非3号楼）",
      uploadedById: inspector1.id,
      inspectionId: inspection3.id,
      rectificationId: rectification3.id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const history3_2 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection3.id,
      actionType: HistoryActionType.SUBMIT_RECTIFICATION,
      fromStatus: InspectionStatus.PENDING_RECTIFICATION,
      toStatus: InspectionStatus.PENDING_REVIEW,
      description: "巡查员张巡查提交整改申请",
      operatorId: inspector1.id,
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      rectificationId: rectification3.id,
    },
  });

  const review3 = await prisma.reviewAction.create({
    data: {
      inspectionId: inspection3.id,
      rectificationId: rectification3.id,
      actionType: ReviewActionType.RETURN,
      comment: "经核实，整改照片显示地点为4号楼，与问题发生地3号楼不匹配，请重新确认整改位置并提交正确的证据。",
      reviewedById: reviewer2.id,
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      missingTypes: [],
      remediationPath: "请重新前往3号楼进行整改，并拍摄包含3号楼标识的整改后照片",
    },
  });

  const history3_3 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection3.id,
      actionType: HistoryActionType.BUILDING_MISMATCH,
      fromStatus: InspectionStatus.PENDING_REVIEW,
      toStatus: InspectionStatus.RETURNED,
      description: "复核员赵复核退回整改：责任楼栋不匹配（整改地点为4号楼，问题发生在3号楼）",
      operatorId: reviewer2.id,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      reviewActionId: review3.id,
    },
  });

  await prisma.inspection.update({
    where: { id: inspection3.id },
    data: { lastChangeId: history3_3.id },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.BUILDING_MISMATCH,
      title: "责任楼栋不匹配",
      content: "您提交的整改申请（INSP-2025-0003）被退回，原因：整改地点与问题发生楼栋不匹配。请重新前往3号楼整改。",
      inspectionId: inspection3.id,
      userId: inspector1.id,
      sentById: reviewer2.id,
      isRead: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 7200000),
    },
  });

  console.log("创建样本4: 整改超期样本");
  const inspection4 = await prisma.inspection.create({
    data: {
      inspectionNo: "INSP-2025-0004",
      source: InspectionSource.PATROL,
      buildingId: building4.id,
      issueType: IssueType.ODOR,
      description: "4号楼垃圾站异味严重，未及时清运",
      severity: Severity.MEDIUM,
      status: InspectionStatus.PENDING_RECTIFICATION,
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      rectificationDeadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      assignedToId: inspector2.id,
      createdById: inspector2.id,
      isOverdue: true,
    },
  });

  const history4_1 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection4.id,
      actionType: HistoryActionType.CREATE,
      fromStatus: null,
      toStatus: InspectionStatus.PENDING_RECTIFICATION,
      description: "巡查员李巡查发现4号楼垃圾站异味问题，创建记录",
      operatorId: inspector2.id,
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.evidence.create({
    data: {
      type: EvidenceType.BEFORE_PHOTO,
      url: "https://picsum.photos/seed/before4/600/400",
      thumbnailUrl: "https://picsum.photos/seed/before4/200/150",
      description: "问题照片：垃圾站异味严重，清运不及时",
      uploadedById: inspector2.id,
      inspectionId: inspection4.id,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const history4_2 = await prisma.historyNode.create({
    data: {
      inspectionId: inspection4.id,
      actionType: HistoryActionType.OVERDUE,
      fromStatus: InspectionStatus.PENDING_RECTIFICATION,
      toStatus: InspectionStatus.PENDING_RECTIFICATION,
      description: "整改已超期48小时，请立即处理",
      operatorId: reviewer1.id,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.inspection.update({
    where: { id: inspection4.id },
    data: { lastChangeId: history4_2.id },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.RECTIFICATION_OVERDUE,
      title: "整改超期提醒",
      content: "您负责的巡查记录（INSP-2025-0004）整改已超期48小时，请立即处理并提交整改申请。",
      inspectionId: inspection4.id,
      userId: inspector2.id,
      sentById: reviewer1.id,
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.REVIEW_REQUIRED,
      title: "待复核提醒",
      content: "有新的整改申请（INSP-2025-0002）需要您进行复核。",
      inspectionId: inspection2.id,
      userId: reviewer1.id,
      sentById: inspector2.id,
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("样本数据创建完成！");
  console.log("用户账号：");
  console.log("  巡查员张巡查: inspector1");
  console.log("  巡查员李巡查: inspector2");
  console.log("  复核员王复核: reviewer1");
  console.log("  复核员赵复核: reviewer2");
  console.log("\n四类样本：");
  console.log("  1. INSP-2025-0001: 合格销项样本（已完成销项）");
  console.log("  2. INSP-2025-0002: 照片缺失样本（缺少整改后和过程照片）");
  console.log("  3. INSP-2025-0003: 责任楼栋不匹配样本（已退回）");
  console.log("  4. INSP-2025-0004: 整改超期样本（超期未整改）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
