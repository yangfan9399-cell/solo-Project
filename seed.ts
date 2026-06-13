import "dotenv/config";
import { db } from "./app/db";
import { outagePlans, workflowNodes, attachments } from "./app/db/schema";

async function seed() {
  console.log("Seeding database...");

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const [plan1] = await db
    .insert(outagePlans)
    .values({
      planCode: "OP-2026-001",
      title: "10kV滨江线计划停电检修",
      region: "滨江区",
      lineName: "10kV滨江线",
      outageType: "计划停电",
      plannedStartTime: new Date(now.getTime() + 2 * day),
      plannedEndTime: new Date(now.getTime() + 2 * day + 8 * 60 * 60 * 1000),
      actualStartTime: new Date(now.getTime() + 2 * day + 10 * 60 * 1000),
      actualEndTime: new Date(now.getTime() + 2 * day + 8 * 60 * 60 * 1000 + 15 * 60 * 1000),
      affectedUsers: 320,
      responsiblePerson: "王工",
      responsiblePersonId: "resp_001",
      applicantId: "applicant_001",
      applicantName: "张申请人",
      reviewerId: "reviewer_001",
      reviewerName: "李复核员",
      status: "archived",
      abnormalType: "none",
      businessRecord: "10kV滨江线分段开关检修，更换老化绝缘子3组，检查线夹连接情况",
      onsiteDescription: "现场确认停电范围正确，安全措施到位，检修工作按计划完成",
      evidenceConclusion: "检修完成，设备状态正常，可恢复送电",
      basisReference: "《配网检修规程》第5.3条",
      conclusionSummary: "检修完成，设备状态正常，可恢复送电",
      isArchived: true,
    })
    .returning();

  await db.insert(workflowNodes).values([
    {
      planId: plan1.id,
      action: "create",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: null,
      toStatus: "accepted",
      comment: "创建停电计划",
    },
    {
      planId: plan1.id,
      action: "supplement",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "accepted",
      toStatus: "processing",
      comment: "补充业务记录与说明",
      changedFields: [
        { field: "businessRecord", oldValue: "", newValue: "10kV滨江线分段开关检修，更换老化绝缘子3组" },
        { field: "onsiteDescription", oldValue: "", newValue: "现场确认停电范围正确" },
      ],
    },
    {
      planId: plan1.id,
      action: "submit_review",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "processing",
      toStatus: "reviewing",
      comment: "提交复核",
    },
    {
      planId: plan1.id,
      action: "archive",
      operatorId: "reviewer_001",
      operatorName: "李复核员",
      operatorRole: "reviewer",
      fromStatus: "reviewing",
      toStatus: "archived",
      comment: "审核通过并归档",
    },
  ]);

  await db.insert(attachments).values([
    {
      planId: plan1.id,
      fileName: "停电通知单_v1.pdf",
      fileUrl: "/files/notice_v1.pdf",
      fileType: "pdf",
      version: 1,
      uploadedBy: "张申请人",
    },
    {
      planId: plan1.id,
      fileName: "现场照片_v1.jpg",
      fileUrl: "/files/onsite_v1.jpg",
      fileType: "image",
      version: 1,
      uploadedBy: "张申请人",
    },
  ]);

  const [plan2] = await db
    .insert(outagePlans)
    .values({
      planCode: "OP-2026-002",
      title: "10kV西湖线故障抢修停电",
      region: "西湖区",
      lineName: "10kV西湖线",
      outageType: "故障停电",
      plannedStartTime: new Date(now.getTime() + 1 * day),
      plannedEndTime: new Date(now.getTime() + 1 * day + 4 * 60 * 60 * 1000),
      affectedUsers: 180,
      responsiblePerson: "赵工",
      responsiblePersonId: "resp_002",
      applicantId: "applicant_001",
      applicantName: "张申请人",
      status: "accepted",
      abnormalType: "none",
    })
    .returning();

  await db.insert(workflowNodes).values({
    planId: plan2.id,
    action: "create",
    operatorId: "applicant_001",
    operatorName: "张申请人",
    operatorRole: "applicant",
    fromStatus: null,
    toStatus: "accepted",
    comment: "创建停电计划",
  });

  const [plan3] = await db
    .insert(outagePlans)
    .values({
      planCode: "OP-2026-003",
      title: "10kV江干线计划停电施工",
      region: "江干区",
      lineName: "10kV江干线",
      outageType: "计划停电",
      plannedStartTime: new Date(now.getTime() + 3 * day),
      plannedEndTime: new Date(now.getTime() + 3 * day + 6 * 60 * 60 * 1000),
      affectedUsers: 450,
      responsiblePerson: "陈工",
      responsiblePersonId: "resp_003",
      applicantId: "applicant_001",
      applicantName: "张申请人",
      status: "reviewing",
      abnormalType: "missing_record",
      businessRecord: "",
      onsiteDescription: "现场确认停电范围正确，安全措施到位",
      blockingReason: "业务记录或现场说明未填写",
      diffFields: [
        { field: "businessRecord", expected: "必填", actual: "未填" },
        { field: "onsiteDescription", expected: "必填", actual: "已填" },
      ],
      remediationPath: "请返回补充业务记录和现场说明后重新提交",
    })
    .returning();

  await db.insert(workflowNodes).values([
    {
      planId: plan3.id,
      action: "create",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: null,
      toStatus: "accepted",
      comment: "创建停电计划",
    },
    {
      planId: plan3.id,
      action: "supplement",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "accepted",
      toStatus: "processing",
      comment: "补充业务记录与说明（未填写业务记录）",
      changedFields: [
        { field: "onsiteDescription", oldValue: "", newValue: "现场确认停电范围正确" },
      ],
    },
    {
      planId: plan3.id,
      action: "submit_review",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "processing",
      toStatus: "reviewing",
      comment: "提交复核（异常: 业务记录或现场说明未填写）",
    },
  ]);

  await db.insert(attachments).values({
    planId: plan3.id,
    fileName: "现场照片_v1.jpg",
    fileUrl: "/files/onsite_v1.jpg",
    fileType: "image",
    version: 1,
    uploadedBy: "张申请人",
  });

  const [plan4] = await db
    .insert(outagePlans)
    .values({
      planCode: "OP-2026-004",
      title: "10kV余杭线设备更换停电",
      region: "余杭区",
      lineName: "10kV余杭线",
      outageType: "计划停电",
      plannedStartTime: new Date(now.getTime() + 4 * day),
      plannedEndTime: new Date(now.getTime() + 4 * day + 10 * 60 * 60 * 1000),
      affectedUsers: 520,
      responsiblePerson: "刘工",
      responsiblePersonId: "resp_004",
      applicantId: "applicant_001",
      applicantName: "张申请人",
      status: "reviewing",
      abnormalType: "attachment_version_mismatch",
      businessRecord: "10kV余杭线变压器更换，旧设备拆除，新设备安装调试",
      onsiteDescription: "现场确认设备到货，施工条件满足，安全措施到位",
      evidenceConclusion: "设备更换完成，调试合格",
      blockingReason: "附件版本不一致",
      diffFields: [
        { field: "attachments", expected: "所有附件版本一致", actual: "发现不同版本: 1, 2" },
      ],
      remediationPath: "请上传统一版本的附件后重新提交",
    })
    .returning();

  await db.insert(workflowNodes).values([
    {
      planId: plan4.id,
      action: "create",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: null,
      toStatus: "accepted",
      comment: "创建停电计划",
    },
    {
      planId: plan4.id,
      action: "supplement",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "accepted",
      toStatus: "processing",
      comment: "补充业务记录与说明",
    },
    {
      planId: plan4.id,
      action: "submit_review",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "processing",
      toStatus: "reviewing",
      comment: "提交复核（异常: 附件版本不一致）",
    },
  ]);

  await db.insert(attachments).values([
    {
      planId: plan4.id,
      fileName: "设备清单_v1.xlsx",
      fileUrl: "/files/equip_v1.xlsx",
      fileType: "excel",
      version: 1,
      uploadedBy: "张申请人",
    },
    {
      planId: plan4.id,
      fileName: "设备清单_v2.xlsx",
      fileUrl: "/files/equip_v2.xlsx",
      fileType: "excel",
      version: 2,
      uploadedBy: "张申请人",
    },
    {
      planId: plan4.id,
      fileName: "施工方案_v1.pdf",
      fileUrl: "/files/plan_v1.pdf",
      fileType: "pdf",
      version: 1,
      uploadedBy: "张申请人",
    },
  ]);

  const [plan5] = await db
    .insert(outagePlans)
    .values({
      planCode: "OP-2026-005",
      title: "10kV萧山线重复停电处理",
      region: "萧山区",
      lineName: "10kV萧山线",
      outageType: "故障停电",
      plannedStartTime: new Date(now.getTime() - 1 * day),
      plannedEndTime: new Date(now.getTime() - 1 * day + 5 * 60 * 60 * 1000),
      actualStartTime: new Date(now.getTime() - 1 * day + 30 * 60 * 1000),
      actualEndTime: new Date(now.getTime() - 1 * day + 6 * 60 * 60 * 1000),
      affectedUsers: 280,
      responsiblePerson: "孙工",
      responsiblePersonId: "resp_005",
      applicantId: "applicant_001",
      applicantName: "张申请人",
      reviewerId: "reviewer_001",
      reviewerName: "李复核员",
      status: "reprocessing",
      abnormalType: "reprocessing_needed",
      businessRecord: "10kV萧山线重复跳闸，原因为开关柜接触不良",
      onsiteDescription: "现场发现B相触头烧蚀，需更换触头组件",
      evidenceConclusion: "第一次复电核验未通过，需重新处理",
      conclusionSummary: "第一次复电核验未通过，需重新处理",
      blockingReason: "复电核验未通过，需重新处理",
      remediationPath: "需要重新处理并补充相关材料",
      isArchived: false,
    })
    .returning();

  await db.insert(workflowNodes).values([
    {
      planId: plan5.id,
      action: "create",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: null,
      toStatus: "accepted",
      comment: "创建停电计划",
    },
    {
      planId: plan5.id,
      action: "supplement",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "accepted",
      toStatus: "processing",
      comment: "补充业务记录与说明",
    },
    {
      planId: plan5.id,
      action: "submit_review",
      operatorId: "applicant_001",
      operatorName: "张申请人",
      operatorRole: "applicant",
      fromStatus: "processing",
      toStatus: "reviewing",
      comment: "提交复核",
    },
    {
      planId: plan5.id,
      action: "archive",
      operatorId: "reviewer_001",
      operatorName: "李复核员",
      operatorRole: "reviewer",
      fromStatus: "reviewing",
      toStatus: "archived",
      comment: "审核通过并归档（首次）",
    },
    {
      planId: plan5.id,
      action: "reprocess",
      operatorId: "reviewer_001",
      operatorName: "李复核员",
      operatorRole: "reviewer",
      fromStatus: "archived",
      toStatus: "reprocessing",
      comment: "重新处理: 复电核验未通过，设备仍有异常",
    },
  ]);

  await db.insert(attachments).values([
    {
      planId: plan5.id,
      fileName: "故障报告_v1.pdf",
      fileUrl: "/files/fault_v1.pdf",
      fileType: "pdf",
      version: 1,
      uploadedBy: "张申请人",
    },
    {
      planId: plan5.id,
      fileName: "复电核验单_v1.pdf",
      fileUrl: "/files/verify_v1.pdf",
      fileType: "pdf",
      version: 1,
      uploadedBy: "李复核员",
    },
  ]);

  console.log("Seed completed! Created 5 sample plans:");
  console.log("  1. OP-2026-001 - 正常核销 (archived)");
  console.log("  2. OP-2026-002 - 新建待处理 (accepted)");
  console.log("  3. OP-2026-003 - 记录漏填 (reviewing, abnormal)");
  console.log("  4. OP-2026-004 - 附件版本不一致 (reviewing, abnormal)");
  console.log("  5. OP-2026-005 - 重新处理 (reprocessing, abnormal)");

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
