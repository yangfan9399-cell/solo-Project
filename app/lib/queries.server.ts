import { eq, desc, sql, and, count } from "drizzle-orm";
import { db } from "./db.server";
import {
  applications,
  workflowNodes,
  attachments,
  fieldChanges,
  businessRecords,
} from "./schema";
import type { AppStatus } from "./types";

export const PROCESSOR_ACTIONS = new Set([
  "start_processing",
  "block_missing_records",
  "block_inconsistent_attachments",
  "approve_to_review",
]);

export const REVIEWER_ACTIONS = new Set([
  "confirm_archive",
  "return_for_evidence",
  "reprocess",
]);

export const APPLICANT_ACTIONS = new Set([
  "add_business_record",
  "add_attachment",
  "start_processing",
]);

export async function assertRoleAllowed(actionType: string, operatorRole: string, applicationStatus: string) {
  if (operatorRole === "reviewer") {
    if (PROCESSOR_ACTIONS.has(actionType)) {
      throw new Response("无权限：复核人不能执行处理员操作", { status: 403 });
    }
  }

  if (operatorRole === "applicant") {
    if (!APPLICANT_ACTIONS.has(actionType)) {
      throw new Response("无权限：申请人只能补充业务记录、现场说明和证据附件", { status: 403 });
    }
    if (actionType === "start_processing" && applicationStatus !== "returned") {
      throw new Response("无权限：申请人仅能在退回补证状态下重新提交", { status: 403 });
    }
  }

  if (operatorRole === "processor" || operatorRole === "reviewer") {
    if (actionType === "reprocess") {
      if (operatorRole !== "reviewer") {
        throw new Response("无权限：仅复核人可发起重新处理", { status: 403 });
      }
    }
  }
}

export async function assertNotArchived(
  status: string,
  actionType: string
) {
  if (status === "archived" && actionType !== "reprocess") {
    throw new Response("已归档：归档记录只读，需发起重新处理才能修改", { status: 403 });
  }
}

export async function assertReviewerOnly(
  actionType: string,
  operatorRole: string
) {
  if (REVIEWER_ACTIONS.has(actionType) && operatorRole !== "reviewer") {
    throw new Response("无权限：该操作仅归档复核人可执行", { status: 403 });
  }
}

export async function assertStatusFlow(
  actionType: string,
  currentStatus: string
) {
  const allowed: Record<string, Set<string>> = {
    start_processing: new Set(["received", "returned", "reprocessing"]),
    block_missing_records: new Set(["processing", "reprocessing"]),
    block_inconsistent_attachments: new Set(["processing", "reprocessing"]),
    approve_to_review: new Set(["processing", "reprocessing"]),
    confirm_archive: new Set(["review"]),
    return_for_evidence: new Set(["review"]),
    reprocess: new Set(["archived"]),
    add_business_record: new Set(["returned"]),
    add_attachment: new Set(["returned"]),
  };

  if (allowed[actionType]) {
    if (!allowed[actionType].has(currentStatus)) {
      const allowedStr = Array.from(allowed[actionType]).join("、");
      const label: Record<string, string> = {
        received: "已受理",
        returned: "退回补证",
        reprocessing: "重新处理中",
        processing: "处理中",
        review: "复核中",
        archived: "已归档",
      };
      throw new Response(
        `状态不允许：当前状态【${label[currentStatus] || currentStatus}】不允许执行该操作，仅允许状态：${allowedStr.split("、").map(s => label[s] || s).join("、")}`,
        { status: 400 }
      );
    }
  }
}

export async function getApplicationDetail(id: number) {
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, id),
  });
  if (!app) return null;

  const nodes = await db.query.workflowNodes.findMany({
    where: eq(workflowNodes.applicationId, id),
    orderBy: [desc(workflowNodes.createdAt)],
  });

  const attachs = await db.query.attachments.findMany({
    where: eq(attachments.applicationId, id),
    orderBy: [desc(attachments.uploadedAt)],
  });

  const changes = await db.query.fieldChanges.findMany({
    where: eq(fieldChanges.applicationId, id),
    orderBy: [desc(fieldChanges.changedAt)],
  });

  const records = await db.query.businessRecords.findMany({
    where: eq(businessRecords.applicationId, id),
    orderBy: [desc(businessRecords.createdAt)],
  });

  return { application: app, nodes, attachments: attachs, fieldChanges: changes, businessRecords: records };
}

export async function getApplicationList(filters?: {
  status?: AppStatus;
  search?: string;
}) {
  let query = db.select().from(applications).orderBy(desc(applications.updatedAt));

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(applications.status, filters.status));
  }

  if (conditions.length > 0) {
    query = db
      .select()
      .from(applications)
      .where(and(...conditions))
      .orderBy(desc(applications.updatedAt)) as any;
  }

  return query;
}

export async function getDashboardStats() {
  const statusCounts = await db
    .select({
      status: applications.status,
      count: count(),
    })
    .from(applications)
    .groupBy(applications.status);

  const sampleTypeCounts = await db
    .select({
      sampleType: applications.sampleType,
      count: count(),
    })
    .from(applications)
    .groupBy(applications.sampleType);

  const riskCounts = await db
    .select({
      riskLevel: applications.riskLevel,
      count: count(),
    })
    .from(applications)
    .groupBy(applications.riskLevel);

  const totalBudget = await db
    .select({
      total: sql<string>`COALESCE(SUM(CAST(${applications.budgetAmount} AS NUMERIC)), 0)`,
    })
    .from(applications);

  return {
    statusCounts,
    sampleTypeCounts,
    riskCounts,
    totalBudget: totalBudget[0]?.total || "0",
  };
}

export async function advanceWorkflow(
  appId: number,
  nodeType: string,
  operatorName: string,
  operatorRole: string,
  data: {
    actionTaken?: string;
    actionResult?: string;
    blockingReason?: string;
    diffFields?: Record<string, any>;
    remedyPath?: string;
    basisReference?: string;
    notes?: string;
    newStatus?: AppStatus;
    newResponsible?: string;
    newResponsibleRole?: string;
    conclusion?: string;
    newBudgetAmount?: string;
    newShootingStartDate?: Date;
    newShootingEndDate?: Date;
    newCrewCount?: number;
    fieldChangesData?: Array<{
      fieldName: string;
      fieldLabel: string;
      oldValue: string | null;
      newValue: string | null;
      changedBy: string;
      changeType: string;
    }>;
  }
) {
  const node = await db.insert(workflowNodes).values({
    applicationId: appId,
    nodeType,
    operatorName,
    operatorRole,
    actionTaken: data.actionTaken || null,
    actionResult: data.actionResult || null,
    blockingReason: data.blockingReason || null,
    diffFields: data.diffFields || null,
    remedyPath: data.remedyPath || null,
    basisReference: data.basisReference || null,
    notes: data.notes || null,
  }).returning();

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };
  if (data.newStatus) updateData.status = data.newStatus;
  if (data.newResponsible) updateData.currentResponsible = data.newResponsible;
  if (data.newResponsibleRole) updateData.currentResponsibleRole = data.newResponsibleRole;
  if (data.conclusion !== undefined) updateData.conclusion = data.conclusion;
  if (data.newBudgetAmount !== undefined) updateData.budgetAmount = data.newBudgetAmount;
  if (data.newShootingStartDate !== undefined) updateData.shootingStartDate = data.newShootingStartDate;
  if (data.newShootingEndDate !== undefined) updateData.shootingEndDate = data.newShootingEndDate;
  if (data.newCrewCount !== undefined) updateData.crewCount = data.newCrewCount;

  await db
    .update(applications)
    .set(updateData)
    .where(eq(applications.id, appId));

  if (data.fieldChangesData && data.fieldChangesData.length > 0) {
    for (const fc of data.fieldChangesData) {
      await db.insert(fieldChanges).values({
        applicationId: appId,
        workflowNodeId: node[0].id,
        fieldName: fc.fieldName,
        fieldLabel: fc.fieldLabel,
        oldValue: fc.oldValue,
        newValue: fc.newValue,
        changedBy: fc.changedBy,
        changeType: fc.changeType,
      });
    }
  }

  return node[0];
}

export async function addBusinessRecord(
  appId: number,
  recordType: string,
  content: string,
  createdBy: string,
  workflowNodeId?: number
) {
  return db.insert(businessRecords).values({
    applicationId: appId,
    workflowNodeId: workflowNodeId || null,
    recordType,
    content,
    createdBy,
  }).returning();
}

export async function addAttachment(
  appId: number,
  fileName: string,
  fileType: string,
  fileVersion: string,
  uploadedBy: string,
  isEvidence: boolean,
  workflowNodeId?: number
) {
  return db.insert(attachments).values({
    applicationId: appId,
    workflowNodeId: workflowNodeId || null,
    fileName,
    fileType,
    fileVersion,
    fileHash: `hash_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    uploadedBy,
    isEvidence,
  }).returning();
}
