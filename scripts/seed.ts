import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../app/lib/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  await db.delete(schema.fieldChanges);
  await db.delete(schema.businessRecords);
  await db.delete(schema.attachments);
  await db.delete(schema.workflowNodes);
  await db.delete(schema.applications);

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  const [app1] = await db.insert(schema.applications).values({
    title: "《风云际会》古战场爆炸场景拍摄许可",
    projectName: "风云际会",
    sceneName: "古战场爆炸场景",
    location: "河北承德影视基地3号场地",
    applicantName: "王制片",
    applicantRole: "applicant",
    status: "archived",
    shootingStartDate: daysAgo(10),
    shootingEndDate: daysAgo(5),
    crewCount: 85,
    budgetAmount: "500000.00",
    safetyPlanSummary: "已制定详细爆炸场景安全预案，包括人员疏散路线、安全距离标定、专业爆破团队资质确认、现场医疗急救准备等",
    riskLevel: "high",
    currentResponsible: "李复核",
    currentResponsibleRole: "reviewer",
    source: "online_application",
    conclusion: "安全验收通过，场景符合拍摄安全规范，准予归档",
    sampleType: "normal",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  }).returning();

  await db.insert(schema.workflowNodes).values({
    applicationId: app1.id, nodeType: "received", operatorName: "系统", operatorRole: "processor",
    actionTaken: "受理申请", actionResult: "已受理", notes: "线上申请自动受理", createdAt: daysAgo(15),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app1.id, nodeType: "processing", operatorName: "张处理", operatorRole: "processor",
    actionTaken: "完成安全审查", actionResult: "审查通过",
    basisReference: "《影视拍摄安全管理规范》第5、6、7条",
    notes: "爆炸场景安全预案完整，专业团队资质齐全", createdAt: daysAgo(10),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app1.id, nodeType: "review", operatorName: "李复核", operatorRole: "reviewer",
    actionTaken: "复核确认", actionResult: "复核通过",
    basisReference: "《影视拍摄安全管理规范》第15条", createdAt: daysAgo(5),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app1.id, nodeType: "archived", operatorName: "李复核", operatorRole: "reviewer",
    actionTaken: "确认归档", actionResult: "已归档",
    basisReference: "《影视拍摄安全管理规范》第18条：验收通过后归档",
    notes: "所有文件完整，验收合格", createdAt: daysAgo(2),
  });

  await db.insert(schema.attachments).values({
    applicationId: app1.id, fileName: "爆炸场景安全预案v2.0.pdf", fileType: "pdf",
    fileVersion: "v2.0", uploadedBy: "王制片", isEvidence: true, uploadedAt: daysAgo(15),
  });
  await db.insert(schema.attachments).values({
    applicationId: app1.id, fileName: "爆破团队资质证书.pdf", fileType: "pdf",
    fileVersion: "v1.0", uploadedBy: "王制片", isEvidence: true, uploadedAt: daysAgo(15),
  });
  await db.insert(schema.attachments).values({
    applicationId: app1.id, fileName: "现场安全检查记录.pdf", fileType: "pdf",
    fileVersion: "v1.0", uploadedBy: "张处理", isEvidence: false, uploadedAt: daysAgo(10),
  });

  await db.insert(schema.businessRecords).values({
    applicationId: app1.id, recordType: "business_record",
    content: "爆炸场景安全预案已由专业爆破团队审核确认，安全距离标定完毕",
    createdBy: "王制片", createdAt: daysAgo(14),
  });
  await db.insert(schema.businessRecords).values({
    applicationId: app1.id, recordType: "site_description",
    content: "现场已设置三道安全警戒线，疏散路线标识清晰，医疗急救点已就位",
    createdBy: "王制片", createdAt: daysAgo(12),
  });

  const [app2] = await db.insert(schema.applications).values({
    title: "《星河远航》高空威亚场景拍摄许可",
    projectName: "星河远航",
    sceneName: "高空威亚飞行场景",
    location: "上海车墩影视基地空中搭建区",
    applicantName: "赵导演",
    applicantRole: "applicant",
    status: "returned",
    shootingStartDate: daysAgo(5),
    shootingEndDate: daysAgo(1),
    crewCount: 45,
    budgetAmount: "280000.00",
    safetyPlanSummary: "高空威亚飞行场景安全预案（部分待补充）",
    riskLevel: "high",
    currentResponsible: "赵导演",
    currentResponsibleRole: "applicant",
    source: "online_application",
    sampleType: "missing_records",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(3),
  }).returning();

  await db.insert(schema.workflowNodes).values({
    applicationId: app2.id, nodeType: "received", operatorName: "系统", operatorRole: "processor",
    actionTaken: "受理申请", actionResult: "已受理", createdAt: daysAgo(8),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app2.id, nodeType: "processing", operatorName: "张处理", operatorRole: "processor",
    actionTaken: "安全审查发现业务记录不完整", actionResult: "退回补证",
    blockingReason: "业务记录不完整，缺少现场安全检查记录和应急预案确认记录",
    diffFields: {
      missing_field_1: { field: "safety_inspection_record", label: "现场安全检查记录", oldValue: "缺失", newValue: "待补充" },
      missing_field_2: { field: "emergency_plan_confirmation", label: "应急预案确认记录", oldValue: "缺失", newValue: "待补充" },
      missing_field_3: { field: "safety_officer_signature", label: "安全负责人签字确认", oldValue: "缺失", newValue: "待补充" },
    } as any,
    remedyPath: "申请人需补充：1.现场安全检查记录 2.应急预案确认记录 3.安全负责人签字确认",
    basisReference: "《影视拍摄安全管理规范》第12条：场景拍摄需完整记录安全检查情况",
    createdAt: daysAgo(5),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app2.id, nodeType: "returned", operatorName: "张处理", operatorRole: "processor",
    actionTaken: "退回补证", actionResult: "已退回",
    blockingReason: "业务记录不完整",
    remedyPath: "补充缺失的业务记录后重新提交", createdAt: daysAgo(3),
  });

  await db.insert(schema.attachments).values({
    applicationId: app2.id, fileName: "高空威亚安全预案v1.0.pdf", fileType: "pdf",
    fileVersion: "v1.0", uploadedBy: "赵导演", isEvidence: true, uploadedAt: daysAgo(8),
  });

  const [app3] = await db.insert(schema.applications).values({
    title: "《长安故事》古城火灾场景拍摄许可",
    projectName: "长安故事",
    sceneName: "古城火灾场景",
    location: "横店影视城明清宫苑",
    applicantName: "孙策划",
    applicantRole: "applicant",
    status: "returned",
    shootingStartDate: daysAgo(3),
    shootingEndDate: daysAgo(0),
    crewCount: 120,
    budgetAmount: "750000.00",
    safetyPlanSummary: "火灾场景拍摄安全预案，包含消防准备和人员疏散方案",
    riskLevel: "high",
    currentResponsible: "孙策划",
    currentResponsibleRole: "applicant",
    source: "online_application",
    sampleType: "inconsistent_attachments",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(2),
  }).returning();

  await db.insert(schema.workflowNodes).values({
    applicationId: app3.id, nodeType: "received", operatorName: "系统", operatorRole: "processor",
    actionTaken: "受理申请", actionResult: "已受理", createdAt: daysAgo(7),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app3.id, nodeType: "processing", operatorName: "张处理", operatorRole: "processor",
    actionTaken: "安全审查发现附件版本不一致", actionResult: "退回补证",
    blockingReason: "证据附件版本不一致，安全预案文件v1.2与现场确认文件v2.0存在差异",
    diffFields: {
      version_mismatch: { field: "attachment_version", label: "附件版本", oldValue: "安全预案v1.2 / 现场确认v2.0", newValue: "待统一版本" },
      content_diff: { field: "attachment_content", label: "附件内容", oldValue: "安全预案中疏散路线与现场确认不一致", newValue: "待修正并统一" },
    } as any,
    remedyPath: "申请人需重新上传统一版本的安全预案和现场确认文件（版本号需一致），确保疏散路线描述统一",
    basisReference: "《影视拍摄安全管理规范》第8条：证据附件版本须保持一致",
    createdAt: daysAgo(4),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app3.id, nodeType: "returned", operatorName: "张处理", operatorRole: "processor",
    actionTaken: "退回补证", actionResult: "已退回",
    blockingReason: "附件版本不一致",
    remedyPath: "重新上传统一版本的附件", createdAt: daysAgo(2),
  });

  await db.insert(schema.attachments).values({
    applicationId: app3.id, fileName: "火灾场景安全预案v1.2.pdf", fileType: "pdf",
    fileVersion: "v1.2", uploadedBy: "孙策划", isEvidence: true, uploadedAt: daysAgo(7),
  });
  await db.insert(schema.attachments).values({
    applicationId: app3.id, fileName: "现场安全确认书v2.0.pdf", fileType: "pdf",
    fileVersion: "v2.0", uploadedBy: "孙策划", isEvidence: true, uploadedAt: daysAgo(7),
  });
  await db.insert(schema.attachments).values({
    applicationId: app3.id, fileName: "消防准备记录.pdf", fileType: "pdf",
    fileVersion: "v1.0", uploadedBy: "孙策划", isEvidence: false, uploadedAt: daysAgo(6),
  });

  const [app4] = await db.insert(schema.applications).values({
    title: "《深海迷踪》水下拍摄场景许可",
    projectName: "深海迷踪",
    sceneName: "水下洞穴探险场景",
    location: "海南三亚潜水基地",
    applicantName: "刘制片",
    applicantRole: "applicant",
    status: "reprocessing",
    shootingStartDate: daysAgo(0),
    shootingEndDate: daysAgo(-5),
    crewCount: 30,
    budgetAmount: "350000.00",
    safetyPlanSummary: "水下拍摄安全预案（已更新潜水设备标准和紧急上浮方案）",
    riskLevel: "high",
    currentResponsible: "张处理",
    currentResponsibleRole: "processor",
    source: "online_application",
    conclusion: "原结论：安全验收通过（需更新）",
    sampleType: "reprocessing",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  }).returning();

  await db.insert(schema.workflowNodes).values({
    applicationId: app4.id, nodeType: "received", operatorName: "系统", operatorRole: "processor",
    actionTaken: "受理申请", actionResult: "已受理", createdAt: daysAgo(20),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app4.id, nodeType: "processing", operatorName: "张处理", operatorRole: "processor",
    actionTaken: "完成安全审查", actionResult: "审查通过",
    basisReference: "《影视拍摄安全管理规范》第5条", createdAt: daysAgo(15),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app4.id, nodeType: "review", operatorName: "李复核", operatorRole: "reviewer",
    actionTaken: "复核确认", actionResult: "复核通过",
    basisReference: "《影视拍摄安全管理规范》第15条", createdAt: daysAgo(10),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app4.id, nodeType: "archived", operatorName: "李复核", operatorRole: "reviewer",
    actionTaken: "确认归档", actionResult: "已归档",
    basisReference: "《影视拍摄安全管理规范》第18条",
    notes: "初次归档完成", createdAt: daysAgo(8),
  });
  await db.insert(schema.workflowNodes).values({
    applicationId: app4.id, nodeType: "reprocessing", operatorName: "李复核", operatorRole: "reviewer",
    actionTaken: "重新处理：潜水设备标准已更新，需按新标准重新审查", actionResult: "重新处理中",
    basisReference: "《影视拍摄安全管理规范》2026年修订版第9条",
    notes: "国家潜水安全标准更新，原验收依据已过时", createdAt: daysAgo(1),
  });

  await db.insert(schema.fieldChanges).values({
    applicationId: app4.id, fieldName: "budgetAmount", fieldLabel: "预算金额",
    oldValue: "350000.00", newValue: "420000.00", changedBy: "张处理",
    changeType: "amount", changedAt: daysAgo(1),
  });
  await db.insert(schema.fieldChanges).values({
    applicationId: app4.id, fieldName: "shootingEndDate", fieldLabel: "拍摄结束时间",
    oldValue: daysAgo(0).toISOString(), newValue: daysAgo(-5).toISOString(),
    changedBy: "张处理", changeType: "time", changedAt: daysAgo(1),
  });
  await db.insert(schema.fieldChanges).values({
    applicationId: app4.id, fieldName: "conclusion", fieldLabel: "验收结论",
    oldValue: "安全验收通过", newValue: "原结论：安全验收通过（需更新）",
    changedBy: "李复核", changeType: "evidence_conclusion", changedAt: daysAgo(1),
  });

  await db.insert(schema.attachments).values({
    applicationId: app4.id, fileName: "水下拍摄安全预案v1.0.pdf", fileType: "pdf",
    fileVersion: "v1.0", uploadedBy: "刘制片", isEvidence: true, uploadedAt: daysAgo(20),
  });
  await db.insert(schema.attachments).values({
    applicationId: app4.id, fileName: "潜水设备检查记录v1.0.pdf", fileType: "pdf",
    fileVersion: "v1.0", uploadedBy: "刘制片", isEvidence: true, uploadedAt: daysAgo(18),
  });
  await db.insert(schema.attachments).values({
    applicationId: app4.id, fileName: "2026年新潜水安全标准.pdf", fileType: "pdf",
    fileVersion: "v1.0", uploadedBy: "李复核", isEvidence: true, uploadedAt: daysAgo(1),
  });

  await db.insert(schema.businessRecords).values({
    applicationId: app4.id, recordType: "business_record",
    content: "原安全预案基于旧版潜水标准，需按2026年修订标准更新",
    createdBy: "李复核", createdAt: daysAgo(1),
  });
  await db.insert(schema.businessRecords).values({
    applicationId: app4.id, recordType: "site_description",
    content: "潜水基地已按新标准完成设备升级，紧急上浮方案已更新",
    createdBy: "刘制片", createdAt: daysAgo(1),
  });

  console.log("Seed completed successfully!");
  await client.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
