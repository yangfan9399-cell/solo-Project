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
