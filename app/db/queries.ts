import { db } from "./index";
import { records, nodes, attachments, evidenceItems, users, STATUS, NODE_TYPES, EXCEPTION_TYPES, ROLES } from "./schema";
import { eq, and, desc, count, sql, inArray } from "drizzle-orm";
import type { Record as DbRecord, Node, Attachment, EvidenceItem, User, NewNode } from "./schema";

export async function getAllRecords(): Promise<DbRecord[]> {
  return await db.select().from(records).orderBy(desc(records.updatedAt));
}

export async function getRecordsByStatus(status?: string): Promise<DbRecord[]> {
  if (!status) return getAllRecords();
  return await db.select().from(records).where(eq(records.status, status)).orderBy(desc(records.updatedAt));
}

export async function getRecordsByExceptionType(exceptionType?: string): Promise<DbRecord[]> {
  if (!exceptionType) return getAllRecords();
  return await db.select().from(records).where(eq(records.exceptionType, exceptionType)).orderBy(desc(records.updatedAt));
}

export async function getRecordById(id: number): Promise<DbRecord | null> {
  const result = await db.select().from(records).where(eq(records.id, id)).limit(1);
  return result[0] || null;
}

export async function getNodesByRecordId(recordId: number): Promise<Node[]> {
  return await db.select().from(nodes).where(eq(nodes.recordId, recordId)).orderBy(nodes.sequence);
}

export async function getAttachmentsByRecordId(recordId: number): Promise<Attachment[]> {
  return await db.select().from(attachments).where(eq(attachments.recordId, recordId)).orderBy(desc(attachments.createdAt));
}

export async function getEvidenceItemsByRecordId(recordId: number): Promise<EvidenceItem[]> {
  return await db.select().from(evidenceItems).where(eq(evidenceItems.recordId, recordId)).orderBy(desc(evidenceItems.createdAt));
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getCurrentUser(): Promise<User> {
  const result = await db.select().from(users).where(eq(users.username, "liming")).limit(1);
  return result[0];
}

export interface DashboardStatsDB {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  archived: number;
  exceptionCount: number;
  normalCount: number;
  avgProcessTime: number;
  byType: { [key: string]: number };
  byStatus: { [key: string]: number };
  recentRecords: DbRecord[];
}

export async function getDashboardStats(): Promise<DashboardStatsDB> {
  const allRecords = await getAllRecords();

  const total = allRecords.length;
  const pending = allRecords.filter((r) => r.status === STATUS.PENDING_ACCEPT || r.status === STATUS.RETURNED).length;
  const processing = allRecords.filter((r) => r.status === STATUS.PROCESSING || r.status === STATUS.PENDING_REVIEW).length;
  const completed = allRecords.filter((r) => r.status === STATUS.REVIEWED || r.status === STATUS.ARCHIVED).length;
  const archived = allRecords.filter((r) => r.status === STATUS.ARCHIVED).length;
  const exceptionCount = allRecords.filter((r) => r.exceptionType !== EXCEPTION_TYPES.NORMAL).length;
  const normalCount = allRecords.filter((r) => r.exceptionType === EXCEPTION_TYPES.NORMAL).length;

  const byType: { [key: string]: number } = {};
  for (const r of allRecords) {
    byType[r.exceptionType] = (byType[r.exceptionType] || 0) + 1;
  }

  const byStatus: { [key: string]: number } = {};
  for (const r of allRecords) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }

  let totalDays = 0;
  let archivedCount = 0;
  for (const r of allRecords) {
    if (r.archivedAt && r.createdAt) {
      const days = (new Date(r.archivedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (days > 0) {
        totalDays += days;
        archivedCount++;
      }
    }
  }
  const avgProcessTime = archivedCount > 0 ? Math.round((totalDays / archivedCount) * 10) / 10 : 3.5;

  const recentRecords = [...allRecords].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return {
    total,
    pending,
    processing,
    completed,
    archived,
    exceptionCount,
    normalCount,
    avgProcessTime,
    byType,
    byStatus,
    recentRecords,
  };
}

export async function updateRecord(id: number, updates: Partial<DbRecord>): Promise<DbRecord | null> {
  const result = await db
    .update(records)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(records.id, id))
    .returning();
  return result[0] || null;
}

export async function addNode(recordId: number, node: Omit<NewNode, "id" | "createdAt" | "recordId">): Promise<Node | null> {
  const result = await db
    .insert(nodes)
    .values({
      ...node,
      recordId,
      createdAt: new Date(),
    })
    .returning();

  await db
    .update(records)
    .set({ updatedAt: new Date() })
    .where(eq(records.id, recordId));

  return result[0] || null;
}

export async function getRecordsByFilters(filters?: { status?: string; exceptionType?: string; search?: string }): Promise<DbRecord[]> {
  let query = db.select().from(records).$dynamic();

  if (filters?.status) {
    query = query.where(eq(records.status, filters.status));
  }
  if (filters?.exceptionType) {
    query = query.where(eq(records.exceptionType, filters.exceptionType));
  }
  if (filters?.search) {
    const search = `%${filters.search}%`;
    query = query.where(
      sql`(${records.recordNo} ILIKE ${search} OR ${records.containerNo} ILIKE ${search} OR ${records.sealNo} ILIKE ${search} OR ${records.vesselName} ILIKE ${search})`
    );
  }

  const result = await query.orderBy(desc(records.updatedAt));
  return result;
}

export interface RecordWithHandlers extends DbRecord {
  currentHandlerName?: string;
  applicantName?: string;
  reviewerName?: string;
}

export async function enrichRecordsWithHandlers(recordList: DbRecord[]): Promise<RecordWithHandlers[]> {
  const userIds = new Set<number>();
  for (const r of recordList) {
    if (r.currentHandlerId) userIds.add(r.currentHandlerId);
    if (r.applicantId) userIds.add(r.applicantId);
    if (r.reviewerId) userIds.add(r.reviewerId);
  }

  const userMap = new Map<number, User>();
  if (userIds.size > 0) {
    const userList = await db.select().from(users).where(inArray(users.id, Array.from(userIds)));
    for (const u of userList) {
      userMap.set(u.id, u);
    }
  }

  return recordList.map((r) => ({
    ...r,
    currentHandlerName: r.currentHandlerId ? userMap.get(r.currentHandlerId)?.displayName : undefined,
    applicantName: r.applicantId ? userMap.get(r.applicantId)?.displayName : undefined,
    reviewerName: r.reviewerId ? userMap.get(r.reviewerId)?.displayName : undefined,
  }));
}

export async function getProcessingRecords(): Promise<RecordWithHandlers[]> {
  const statuses = [STATUS.PENDING_ACCEPT, STATUS.PROCESSING, STATUS.PENDING_REVIEW, STATUS.RETURNED];
  const recs = await db.select().from(records).where(inArray(records.status, statuses)).orderBy(desc(records.updatedAt));
  return enrichRecordsWithHandlers(recs);
}
