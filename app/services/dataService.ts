import {
  getRecordById as getDbRecordById,
  getNodesByRecordId as getDbNodesByRecordId,
  getAttachmentsByRecordId as getDbAttachmentsByRecordId,
  getEvidenceItemsByRecordId as getDbEvidenceItemsByRecordId,
  getDashboardStats as getDbDashboardStats,
  getRecordsByFilters as getDbRecordsByFilters,
  getProcessingRecords as getDbProcessingRecords,
  updateRecord as updateDbRecord,
  addNode as addDbNode,
  getCurrentUser as getDbCurrentUser,
  enrichRecordsWithHandlers,
} from "~/db/queries";
import type { RecordSummary, RecordDetail, NodeDetail, DashboardStats, AttachmentInfo, EvidenceItemInfo } from "~/types";
import { STATUS, NODE_TYPES } from "~/db/schema";
import type { Record as DbRecord, Node, Attachment, EvidenceItem } from "~/db/schema";

type DbRecordWithHandlers = DbRecord & { currentHandlerName?: string; applicantName?: string; reviewerName?: string };

function dbRecordToSummary(r: DbRecordWithHandlers): RecordSummary {
  return {
    id: r.id,
    recordNo: r.recordNo,
    containerNo: r.containerNo,
    sealNo: r.sealNo,
    vesselName: r.vesselName,
    voyageNo: r.voyageNo,
    exceptionType: r.exceptionType,
    status: r.status,
    currentHandler: r.currentHandlerName,
    summary: r.summary || "",
    amount: typeof r.amount === "string" ? r.amount : r.amount != null ? String(r.amount) : undefined,
    source: r.source,
    isArchived: !!r.isArchived,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt?.toISOString() || "",
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt?.toISOString() || "",
    customer: r.customer ?? undefined,
  };
}

function dbNodeToDetail(n: Node): NodeDetail {
  return {
    id: n.id,
    recordId: n.recordId,
    nodeType: n.nodeType,
    nodeName: n.nodeName,
    status: n.status,
    operatorName: n.operatorName ?? undefined,
    comment: n.comment ?? undefined,
    fieldChanges: (n.fieldChanges as { [key: string]: any }) || undefined,
    snapshotBefore: (n.snapshotBefore as { [key: string]: any }) || undefined,
    snapshotAfter: (n.snapshotAfter as { [key: string]: any }) || undefined,
    basis: n.basis ?? undefined,
    sequence: n.sequence,
    isReProcess: !!n.isReProcess,
    parentNodeId: n.parentNodeId ?? undefined,
    createdAt: typeof n.createdAt === "string" ? n.createdAt : n.createdAt?.toISOString() || "",
  };
}

function dbAttachmentToInfo(a: Attachment): AttachmentInfo {
  return {
    id: a.id,
    recordId: a.recordId,
    fileName: a.fileName,
    fileType: a.fileType || "",
    fileSize: a.fileSize ?? undefined,
    fileUrl: a.fileUrl,
    version: a.version || "1.0",
    uploaderName: a.uploaderName ?? undefined,
    description: a.description ?? undefined,
    isEvidence: !!a.isEvidence,
    createdAt: typeof a.createdAt === "string" ? a.createdAt : a.createdAt?.toISOString() || "",
  };
}

function dbEvidenceToInfo(e: EvidenceItem): EvidenceItemInfo {
  return {
    id: e.id,
    recordId: e.recordId,
    type: e.type,
    title: e.title,
    content: e.content ?? undefined,
    status: e.status || "valid",
    verified: !!e.verified,
    createdAt: typeof e.createdAt === "string" ? e.createdAt : e.createdAt?.toISOString() || "",
  };
}

export async function getRecords(filters?: { status?: string; exceptionType?: string; search?: string }): Promise<{ records: RecordSummary[] }> {
  const dbRecs = await getDbRecordsByFilters(filters);
  const enriched = await enrichRecordsWithHandlers(dbRecs);
  return { records: enriched.map(dbRecordToSummary) };
}

export async function getRecordDetail(id: number): Promise<{ record: RecordDetail | null }> {
  const rec = await getDbRecordById(id);
  if (!rec) return { record: null };

  const [dbNodes, dbAttachments, dbEvidence] = await Promise.all([
    getDbNodesByRecordId(id),
    getDbAttachmentsByRecordId(id),
    getDbEvidenceItemsByRecordId(id),
  ]);

  const enriched = await enrichRecordsWithHandlers([rec]);
  const r = enriched[0];
  const summary = dbRecordToSummary(r);

  const detail: RecordDetail = {
    ...summary,
    blNo: rec.blNo ?? undefined,
    customer: rec.customer ?? undefined,
    applicantId: rec.applicantId ?? undefined,
    applicantName: r.applicantName,
    reviewerId: rec.reviewerId ?? undefined,
    reviewerName: r.reviewerName,
    currentHandlerId: rec.currentHandlerId ?? undefined,
    currentHandlerName: r.currentHandlerName,
    sealTime: typeof rec.sealTime === "string" ? rec.sealTime : rec.sealTime?.toISOString(),
    arrivalTime: typeof rec.arrivalTime === "string" ? rec.arrivalTime : rec.arrivalTime?.toISOString(),
    conclusion: rec.conclusion ?? undefined,
    basis: rec.basis ?? undefined,
    blockReason: rec.blockReason ?? undefined,
    remedyPath: rec.remedyPath ?? undefined,
    diffFields: (rec.diffFields as { [key: string]: any }) || undefined,
    archivedAt: typeof rec.archivedAt === "string" ? rec.archivedAt : rec.archivedAt?.toISOString(),
    nodes: dbNodes.map(dbNodeToDetail),
    attachments: dbAttachments.map(dbAttachmentToInfo),
    evidenceItems: dbEvidence.map(dbEvidenceToInfo),
  };

  return { record: detail };
}

export async function getStats(): Promise<{ stats: DashboardStats }> {
  const dbStats = await getDbDashboardStats();
  const enriched = await enrichRecordsWithHandlers(dbStats.recentRecords);
  const stats: DashboardStats = {
    ...dbStats,
    recentRecords: enriched.map(dbRecordToSummary),
  };
  return { stats };
}

export async function getProcessingList(): Promise<{ records: RecordSummary[] }> {
  const dbRecs = await getDbProcessingRecords();
  const enriched = await enrichRecordsWithHandlers(dbRecs);
  return { records: enriched.map(dbRecordToSummary) };
}

export async function updateRecord(id: number, updates: Partial<RecordDetail>): Promise<RecordDetail | null> {
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.isArchived !== undefined) dbUpdates.isArchived = updates.isArchived;
  if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
  if (updates.conclusion !== undefined) dbUpdates.conclusion = updates.conclusion;
  if (updates.basis !== undefined) dbUpdates.basis = updates.basis;
  if (updates.blockReason !== undefined) dbUpdates.blockReason = updates.blockReason;
  if (updates.remedyPath !== undefined) dbUpdates.remedyPath = updates.remedyPath;
  if (updates.diffFields !== undefined) dbUpdates.diffFields = updates.diffFields;
  if (updates.currentHandlerId !== undefined) dbUpdates.currentHandlerId = updates.currentHandlerId;
  if (updates.reviewerId !== undefined) dbUpdates.reviewerId = updates.reviewerId;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.sealTime !== undefined) dbUpdates.sealTime = updates.sealTime ? new Date(updates.sealTime) : null;
  if (updates.arrivalTime !== undefined) dbUpdates.arrivalTime = updates.arrivalTime ? new Date(updates.arrivalTime) : null;
  if (updates.archivedAt !== undefined) dbUpdates.archivedAt = updates.archivedAt ? new Date(updates.archivedAt) : null;
  if (updates.sealNo !== undefined) dbUpdates.sealNo = updates.sealNo;
  if (updates.containerNo !== undefined) dbUpdates.containerNo = updates.containerNo;
  if (updates.exceptionType !== undefined) dbUpdates.exceptionType = updates.exceptionType;
  if (updates.customer !== undefined) dbUpdates.customer = updates.customer;

  await updateDbRecord(id, dbUpdates);
  const { record } = await getRecordDetail(id);
  return record;
}

export async function addNodeToRecord(
  recordId: number,
  node: Omit<NodeDetail, "id" | "createdAt"> & { operatorId?: number }
): Promise<NodeDetail | null> {
  const dbNode = await addDbNode(recordId, {
    nodeType: node.nodeType,
    nodeName: node.nodeName,
    status: node.status,
    operatorId: node.operatorId,
    operatorName: node.operatorName,
    comment: node.comment,
    fieldChanges: node.fieldChanges,
    snapshotBefore: node.snapshotBefore,
    snapshotAfter: node.snapshotAfter,
    basis: node.basis,
    sequence: node.sequence,
    isReProcess: node.isReProcess,
    parentNodeId: node.parentNodeId,
  });
  return dbNode ? dbNodeToDetail(dbNode) : null;
}

export async function getCurrentUserInfo(): Promise<{ id: number; username: string; displayName: string; role: string; department: string }> {
  const u = await getDbCurrentUser();
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    department: u.department || "",
  };
}

export { STATUS, NODE_TYPES };
