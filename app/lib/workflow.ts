import { eq, and, desc, sql, like, or, count } from "drizzle-orm";
import { db } from "~/db";
import {
  outagePlans,
  workflowNodes,
  attachments,
  auditLogs,
  type OutagePlan,
  type WorkflowNode,
  type Attachment,
  type AuditLog,
  type ChangedField,
  type DiffField,
} from "~/db/schema";

const KEY_FIELDS = [
  "plannedStartTime",
  "plannedEndTime",
  "actualStartTime",
  "actualEndTime",
  "responsiblePerson",
  "responsiblePersonId",
  "affectedUsers",
  "evidenceConclusion",
];

export function isKeyField(field: string): boolean {
  return KEY_FIELDS.includes(field);
}

export async function listPlans(filters?: {
  status?: string;
  keyword?: string;
  abnormalType?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(outagePlans.status, filters.status as any));
  }
  if (filters?.abnormalType) {
    conditions.push(eq(outagePlans.abnormalType, filters.abnormalType as any));
  }
  if (filters?.keyword) {
    const kw = `%${filters.keyword}%`;
    conditions.push(
      or(
        like(outagePlans.planCode, kw),
        like(outagePlans.title, kw),
        like(outagePlans.lineName, kw),
        like(outagePlans.responsiblePerson, kw),
        like(outagePlans.region, kw)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const [plans, totalResult] = await Promise.all([
    db
      .select()
      .from(outagePlans)
      .where(where)
      .orderBy(desc(outagePlans.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(outagePlans)
      .where(where),
  ]);

  return { plans, total: totalResult[0].count };
}

export async function getPlan(id: string) {
  const plan = await db.query.outagePlans.findFirst({
    where: eq(outagePlans.id, id),
  });
  return plan;
}

export async function getPlanDetail(id: string) {
  const [plan, nodes, files, logs] = await Promise.all([
    db.query.outagePlans.findFirst({ where: eq(outagePlans.id, id) }),
    db
      .select()
      .from(workflowNodes)
      .where(eq(workflowNodes.planId, id))
      .orderBy(workflowNodes.createdAt),
    db
      .select()
      .from(attachments)
      .where(eq(attachments.planId, id))
      .orderBy(desc(attachments.uploadedAt)),
    db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.planId, id))
      .orderBy(desc(auditLogs.changedAt)),
  ]);
  return { plan, nodes: nodes ?? [], attachments: files ?? [], auditLogs: logs ?? [] };
}

export async function createPlan(data: {
  planCode: string;
  title: string;
  region: string;
  lineName: string;
  outageType: string;
  plannedStartTime: string;
  plannedEndTime: string;
  affectedUsers?: number;
  responsiblePerson: string;
  responsiblePersonId: string;
  applicantId: string;
  applicantName: string;
  businessRecord?: string;
  onsiteDescription?: string;
}) {
  const [plan] = await db
    .insert(outagePlans)
    .values({
      ...data,
      plannedStartTime: new Date(data.plannedStartTime),
      plannedEndTime: new Date(data.plannedEndTime),
      status: "accepted",
      abnormalType: "none",
    })
    .returning();

  await db.insert(workflowNodes).values({
    planId: plan.id,
    action: "create",
    operatorId: data.applicantId,
    operatorName: data.applicantName,
    operatorRole: "applicant",
    fromStatus: null,
    toStatus: "accepted",
    comment: "创建停电计划",
  });

  return plan;
}

export async function processPlan(
  planId: string,
  operatorId: string,
  operatorName: string,
  operatorRole: "applicant" | "reviewer",
  data: {
    businessRecord?: string;
    onsiteDescription?: string;
    evidenceConclusion?: string;
    basisReference?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    affectedUsers?: number;
    attachments?: { fileName: string; fileUrl: string; fileType: string }[];
  }
) {
  const plan = await getPlan(planId);
  if (!plan) throw new Error("计划不存在");
  if (plan.isArchived) throw new Error("已归档的计划不可操作");
  if (plan.status !== "accepted" && plan.status !== "returned" && plan.status !== "reprocessing") {
    throw new Error(`当前状态 ${plan.status} 不允许处理`);
  }

  const changedFields: ChangedField[] = [];
  const updates: Partial<OutagePlan> = { status: "processing" as any, updatedAt: new Date() };

  if (data.businessRecord !== undefined && data.businessRecord !== plan.businessRecord) {
    changedFields.push({ field: "businessRecord", oldValue: plan.businessRecord || "", newValue: data.businessRecord });
    updates.businessRecord = data.businessRecord;
  }
  if (data.onsiteDescription !== undefined && data.onsiteDescription !== plan.onsiteDescription) {
    changedFields.push({ field: "onsiteDescription", oldValue: plan.onsiteDescription || "", newValue: data.onsiteDescription });
    updates.onsiteDescription = data.onsiteDescription;
  }
  if (data.evidenceConclusion !== undefined && data.evidenceConclusion !== plan.evidenceConclusion) {
    changedFields.push({ field: "evidenceConclusion", oldValue: plan.evidenceConclusion || "", newValue: data.evidenceConclusion });
    updates.evidenceConclusion = data.evidenceConclusion;
    updates.conclusionSummary = data.evidenceConclusion.substring(0, 200);
  }
  if (data.basisReference !== undefined) {
    updates.basisReference = data.basisReference;
  }
  if (data.actualStartTime !== undefined) {
    const newTime = new Date(data.actualStartTime).toISOString();
    const oldTime = plan.actualStartTime ? plan.actualStartTime.toISOString() : "";
    if (newTime !== oldTime) {
      changedFields.push({ field: "actualStartTime", oldValue: oldTime, newValue: newTime });
      updates.actualStartTime = new Date(data.actualStartTime);
    }
  }
  if (data.actualEndTime !== undefined) {
    const newTime = new Date(data.actualEndTime).toISOString();
    const oldTime = plan.actualEndTime ? plan.actualEndTime.toISOString() : "";
    if (newTime !== oldTime) {
      changedFields.push({ field: "actualEndTime", oldValue: oldTime, newValue: newTime });
      updates.actualEndTime = new Date(data.actualEndTime);
    }
  }
  if (data.affectedUsers !== undefined && data.affectedUsers !== plan.affectedUsers) {
    changedFields.push({ field: "affectedUsers", oldValue: String(plan.affectedUsers || ""), newValue: String(data.affectedUsers) });
    updates.affectedUsers = data.affectedUsers;
  }

  const [updated] = await db
    .update(outagePlans)
    .set(updates)
    .where(eq(outagePlans.id, planId))
    .returning();

  const [node] = await db
    .insert(workflowNodes)
    .values({
      planId,
      action: operatorRole === "applicant" ? "supplement" : "process",
      operatorId,
      operatorName,
      operatorRole,
      fromStatus: plan.status as any,
      toStatus: "processing",
      comment: operatorRole === "applicant" ? "补充业务记录与说明" : "处理停电计划",
      changedFields: changedFields.length > 0 ? changedFields : undefined,
    })
    .returning();

  for (const keyChange of changedFields) {
    if (isKeyField(keyChange.field)) {
      await db.insert(auditLogs).values({
        planId,
        fieldChanged: keyChange.field,
        oldValue: keyChange.oldValue,
        newValue: keyChange.newValue,
        changedBy: operatorName,
        isKeyField: true,
      });
    }
  }

  if (data.attachments && data.attachments.length > 0 && node) {
    for (const att of data.attachments) {
      await db.insert(attachments).values({
        planId,
        nodeId: node.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        uploadedBy: operatorName,
      });
    }
  }

  return updated;
}

export async function submitForReview(
  planId: string,
  operatorId: string,
  operatorName: string
) {
  const plan = await getPlan(planId);
  if (!plan) throw new Error("计划不存在");
  if (plan.isArchived) throw new Error("已归档的计划不可操作");
  if (plan.status !== "processing") throw new Error("只有处理中的计划才能提交复核");

  const abnormalResult = await detectAbnormal(planId);
  const abnormalType = abnormalResult.isAbnormal ? abnormalResult.type : "none";

  const updates: Partial<OutagePlan> = {
    status: "reviewing",
    abnormalType: abnormalType as any,
    updatedAt: new Date(),
  };

  if (abnormalResult.isAbnormal) {
    updates.blockingReason = abnormalResult.blockingReason;
    updates.diffFields = abnormalResult.diffFields;
    updates.remediationPath = abnormalResult.remediationPath;
  }

  const [updated] = await db
    .update(outagePlans)
    .set(updates)
    .where(eq(outagePlans.id, planId))
    .returning();

  await db.insert(workflowNodes).values({
    planId,
    action: "submit_review",
    operatorId,
    operatorName,
    operatorRole: "applicant",
    fromStatus: "processing",
    toStatus: "reviewing",
    comment: abnormalResult.isAbnormal
      ? `提交复核（异常: ${abnormalResult.blockingReason}）`
      : "提交复核",
  });

  return { updated, abnormal: abnormalResult };
}

async function detectAbnormal(planId: string) {
  const detail = await getPlanDetail(planId);
  const plan = detail.plan!;
  const files = detail.attachments;

  if (!plan.businessRecord || !plan.onsiteDescription) {
    return {
      isAbnormal: true,
      type: "missing_record" as const,
      blockingReason: "业务记录或现场说明未填写",
      diffFields: [
        {
          field: "businessRecord",
          expected: "必填",
          actual: plan.businessRecord ? "已填" : "未填",
        },
        {
          field: "onsiteDescription",
          expected: "必填",
          actual: plan.onsiteDescription ? "已填" : "未填",
        },
      ],
      remediationPath: "请返回补充业务记录和现场说明后重新提交",
    };
  }

  const versions = new Map<string, number[]>();
  for (const file of files) {
    const baseName = file.fileName.replace(/_v\d+/, "");
    if (!versions.has(baseName)) versions.set(baseName, []);
    versions.get(baseName)!.push(file.version);
  }
  for (const [, vers] of versions) {
    if (vers.length > 1 && new Set(vers).size > 1) {
      return {
        isAbnormal: true,
        type: "attachment_version_mismatch" as const,
        blockingReason: "附件版本不一致",
        diffFields: [
          {
            field: "attachments",
            expected: "所有附件版本一致",
            actual: `发现不同版本: ${Array.from(vers).join(", ")}`,
          },
        ],
        remediationPath: "请上传统一版本的附件后重新提交",
      };
    }
  }

  if (plan.status === "reprocessing") {
    return {
      isAbnormal: true,
      type: "reprocessing_needed" as const,
      blockingReason: "该计划为重新处理，需要额外复核",
      diffFields: [],
      remediationPath: "请复核人员确认重新处理的原因和结果",
    };
  }

  return {
    isAbnormal: false,
    type: "none" as const,
    blockingReason: null,
    diffFields: [],
    remediationPath: null,
  };
}

export async function reviewPlan(
  planId: string,
  reviewerId: string,
  reviewerName: string,
  action: "approve" | "return",
  conclusionSummary?: string,
  comment?: string
) {
  const plan = await getPlan(planId);
  if (!plan) throw new Error("计划不存在");
  if (plan.isArchived) throw new Error("已归档的计划不可操作");
  if (plan.status !== "reviewing") throw new Error("只有复核中的计划才能审核");

  if (action === "approve") {
    const [updated] = await db
      .update(outagePlans)
      .set({
        status: "archived",
        isArchived: true,
        reviewerId,
        reviewerName,
        conclusionSummary: conclusionSummary || plan.conclusionSummary,
        updatedAt: new Date(),
      })
      .where(eq(outagePlans.id, planId))
      .returning();

    await db.insert(workflowNodes).values({
      planId,
      action: "archive",
      operatorId: reviewerId,
      operatorName: reviewerName,
      operatorRole: "reviewer",
      fromStatus: "reviewing",
      toStatus: "archived",
      comment: comment || "审核通过并归档",
    });

    return updated;
  } else {
    const [updated] = await db
      .update(outagePlans)
      .set({
        status: "returned",
        reviewerId,
        reviewerName,
        updatedAt: new Date(),
      })
      .where(eq(outagePlans.id, planId))
      .returning();

    await db.insert(workflowNodes).values({
      planId,
      action: "review_return",
      operatorId: reviewerId,
      operatorName: reviewerName,
      operatorRole: "reviewer",
      fromStatus: "reviewing",
      toStatus: "returned",
      comment: comment || "退回补证",
    });

    return updated;
  }
}

export async function reprocessPlan(
  planId: string,
  operatorId: string,
  operatorName: string,
  reason: string
) {
  const plan = await getPlan(planId);
  if (!plan) throw new Error("计划不存在");
  if (!plan.isArchived) throw new Error("只有已归档的计划才能重新处理");

  const [updated] = await db
    .update(outagePlans)
    .set({
      status: "reprocessing",
      abnormalType: "reprocessing_needed",
      isArchived: false,
      blockingReason: reason,
      remediationPath: "需要重新处理并补充相关材料",
      updatedAt: new Date(),
    })
    .where(eq(outagePlans.id, planId))
    .returning();

  await db.insert(workflowNodes).values({
    planId,
    action: "reprocess",
    operatorId,
    operatorName,
    operatorRole: "reviewer",
    fromStatus: "archived",
    toStatus: "reprocessing",
    comment: `重新处理: ${reason}`,
  });

  await db.insert(auditLogs).values({
    planId,
    fieldChanged: "status",
    oldValue: "archived",
    newValue: "reprocessing",
    changedBy: operatorName,
    isKeyField: true,
  });

  return updated;
}

export async function getDashboardStats() {
  const statusCounts = await db
    .select({
      status: outagePlans.status,
      count: count(),
    })
    .from(outagePlans)
    .groupBy(outagePlans.status);

  const abnormalCounts = await db
    .select({
      abnormalType: outagePlans.abnormalType,
      count: count(),
    })
    .from(outagePlans)
    .where(sql`${outagePlans.abnormalType} != 'none'`)
    .groupBy(outagePlans.abnormalType);

  const recentAbnormals = await db
    .select()
    .from(outagePlans)
    .where(sql`${outagePlans.abnormalType} != 'none'`)
    .orderBy(desc(outagePlans.updatedAt))
    .limit(10);

  const regionCounts = await db
    .select({
      region: outagePlans.region,
      count: count(),
    })
    .from(outagePlans)
    .groupBy(outagePlans.region);

  const totalPlans = await db
    .select({ count: count() })
    .from(outagePlans);

  return {
    statusCounts,
    abnormalCounts,
    recentAbnormals,
    regionCounts,
    totalPlans: totalPlans[0].count,
  };
}
