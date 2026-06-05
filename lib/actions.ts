"use server";

import { db } from "./db";
import {
  stores,
  users,
  medicines,
  medicineBatches,
  inventory,
  expiryReports,
  transferRequests,
  destructionRequests,
  auditLogs,
  evidence,
  historyNodes,
  type Store,
  type User,
  type Medicine,
  type MedicineBatch,
  type ExpiryReport,
  type TransferRequest,
  type DestructionRequest,
  type AuditLog,
  type Evidence,
  type HistoryNode,
} from "./db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type { Store, User, Medicine, MedicineBatch };

export interface CreateReportInput {
  storeId: number;
  reportedBy: number;
  batchId: number;
  reportedQuantity: number;
  inventoryQuantity: number;
  notes?: string;
  disposalType: "transfer" | "destruction" | "none";
  suggestedTransferStoreId?: number;
  actualBatchNumber?: string;
  systemBatchNumber?: string;
}

async function getNextReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(expiryReports)
    .where(sql`extract(year from ${expiryReports.createdAt}) = ${year}`);

  const count = Number(result[0]?.count || 0) + 1;
  return `EXP-${year}-${String(count).padStart(5, "0")}`;
}

export async function createReport(input: CreateReportInput) {
  const batchResult = await db
    .select({
      id: medicineBatches.id,
      batchNumber: medicineBatches.batchNumber,
      medicineId: medicineBatches.medicineId,
      medicine: {
        name: medicines.name,
        unit: medicines.unit,
      },
    })
    .from(medicineBatches)
    .leftJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
    .where(eq(medicineBatches.id, input.batchId))
    .limit(1);

  const batch = batchResult[0];
  if (!batch) {
    return { success: false, error: "药品批次不存在" };
  }

  const storeResult = await db
    .select()
    .from(stores)
    .where(eq(stores.id, input.storeId))
    .limit(1);
  const store = storeResult[0];

  let conflictType: "batch_mismatch" | "quantity_exceeded" | "store_conflict" | "none" =
    "none";
  let conflictNotes = "";
  let status: "pending" | "blocked" = "pending";

  if (
    input.actualBatchNumber &&
    input.systemBatchNumber &&
    input.actualBatchNumber !== input.systemBatchNumber
  ) {
    conflictType = "batch_mismatch";
    conflictNotes = `上报批号为 ${input.systemBatchNumber}，但实际盘点批号为 ${input.actualBatchNumber}，批号不一致`;
    status = "blocked";
  }

  if (input.reportedQuantity !== input.inventoryQuantity) {
    conflictNotes +=
      (conflictNotes ? "; " : "") +
      `上报数量 ${input.reportedQuantity} 与系统库存 ${input.inventoryQuantity} 不一致`;
  }

  if (input.disposalType === "destruction" && input.reportedQuantity > 20) {
    conflictType = "quantity_exceeded";
    conflictNotes = `月度销毁限额为20单位，申请销毁${input.reportedQuantity}单位，超出限额${input.reportedQuantity - 20}单位`;
  }

  const reportNumber = await getNextReportNumber();

  const [report] = await db
    .insert(expiryReports)
    .values({
      reportNumber,
      storeId: input.storeId,
      reportedBy: input.reportedBy,
      batchId: input.batchId,
      reportedQuantity: input.reportedQuantity,
      inventoryQuantity: input.inventoryQuantity,
      notes: input.notes,
      conflictType,
      conflictNotes: conflictNotes || null,
      status,
      disposalType: input.disposalType,
      suggestedTransferStoreId: input.suggestedTransferStoreId || null,
    })
    .returning();

  await db.insert(historyNodes).values({
    reportId: report.id,
    nodeType: "report",
    title: "门店上报",
    description: `${store?.name || "未知门店"}经办人上报${batch.medicine?.name || "药品"}近效期情况`,
    userId: input.reportedBy,
    quantityChange: input.reportedQuantity,
  });

  await db.insert(auditLogs).values({
    reportId: report.id,
    userId: input.reportedBy,
    action: "create_report",
    newStatus: status,
    notes: `创建近效期药品上报：${batch.medicine?.name || "药品"} ${input.reportedQuantity}${batch.medicine?.unit || ""}`,
  });

  if (conflictType === "batch_mismatch") {
    await db.insert(historyNodes).values({
      reportId: report.id,
      nodeType: "blocked",
      title: "批号不一致阻断",
      description: "检测到实际批号与系统记录批号不一致，流程已阻断，请重新盘点",
      userId: input.reportedBy,
    });

    await db.insert(auditLogs).values({
      reportId: report.id,
      userId: input.reportedBy,
      action: "detect_mismatch",
      previousStatus: "pending",
      newStatus: "blocked",
      notes: "检测到批号不一致，流程已阻断",
    });
  }

  if (input.disposalType === "transfer" && input.suggestedTransferStoreId) {
    const suggestedStoreResult = await db
      .select()
      .from(stores)
      .where(eq(stores.id, input.suggestedTransferStoreId))
      .limit(1);
    const suggestedStore = suggestedStoreResult[0];

    await db.insert(historyNodes).values({
      reportId: report.id,
      nodeType: "suggest_transfer",
      title: "调拨建议",
      description: `建议调拨至 ${suggestedStore?.name || "目标门店"}`,
      userId: input.reportedBy,
    });

    await db.insert(auditLogs).values({
      reportId: report.id,
      userId: input.reportedBy,
      action: "suggest_transfer",
      previousStatus: status,
      newStatus: status,
      notes: "建议调拨",
    });
  }

  if (input.disposalType === "destruction") {
    await db.insert(historyNodes).values({
      reportId: report.id,
      nodeType: "request_destruction",
      title: "销毁申请",
      description: "申请销毁过期药品",
      userId: input.reportedBy,
    });

    await db.insert(auditLogs).values({
      reportId: report.id,
      userId: input.reportedBy,
      action: "request_destruction",
      previousStatus: status,
      newStatus: status,
      notes: "申请销毁",
    });
  }

  return { success: true, report };
}

export interface ApproveTransferInput {
  reportId: number;
  approvedBy: number;
  targetStoreId: number;
  quantity: number;
  notes?: string;
}

export async function approveTransfer(input: ApproveTransferInput) {
  const reportResult = await db
    .select()
    .from(expiryReports)
    .where(eq(expiryReports.id, input.reportId))
    .limit(1);
  const report = reportResult[0];

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  if (report.conflictType === "batch_mismatch") {
    return { success: false, error: "批号不一致，流程已阻断，请先重新盘点" };
  }

  await db
    .update(expiryReports)
    .set({
      status: "approved",
      disposalType: "transfer",
      updatedAt: new Date(),
    })
    .where(eq(expiryReports.id, input.reportId));

  const [transferRequest] = await db
    .insert(transferRequests)
    .values({
      reportId: input.reportId,
      sourceStoreId: report.storeId,
      targetStoreId: input.targetStoreId,
      quantity: input.quantity,
      approvedBy: input.approvedBy,
      approvedAt: new Date(),
      status: "approved",
      notes: input.notes || null,
      evidenceUrls: [],
    })
    .returning();

  const sourceStoreResult = await db
    .select()
    .from(stores)
    .where(eq(stores.id, report.storeId))
    .limit(1);
  const sourceStore = sourceStoreResult[0];

  const targetStoreResult = await db
    .select()
    .from(stores)
    .where(eq(stores.id, input.targetStoreId))
    .limit(1);
  const targetStore = targetStoreResult[0];

  await db.insert(historyNodes).values({
    reportId: input.reportId,
    nodeType: "approve_transfer",
    title: "药师审核通过（调拨）",
    description: `区域药师批准从 ${sourceStore?.name || "原门店"} 调拨至 ${targetStore?.name || "目标门店"}`,
    userId: input.approvedBy,
    quantityChange: input.quantity,
  });

  await db.insert(auditLogs).values({
    reportId: input.reportId,
    userId: input.approvedBy,
    action: "approve_transfer",
    previousStatus: report.status,
    newStatus: "approved",
    notes: `药师审核通过，调拨 ${input.quantity} 单位`,
  });

  return { success: true, transferRequest };
}

export interface ApproveDestructionInput {
  reportId: number;
  approvedBy: number;
  quantity: number;
  maxAllowedQuantity: number;
  lossAmount: string;
  notes?: string;
}

export async function approveDestruction(input: ApproveDestructionInput) {
  const reportResult = await db
    .select()
    .from(expiryReports)
    .where(eq(expiryReports.id, input.reportId))
    .limit(1);
  const report = reportResult[0];

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  await db
    .update(expiryReports)
    .set({
      status: "approved",
      disposalType: "destruction",
      updatedAt: new Date(),
    })
    .where(eq(expiryReports.id, input.reportId));

  const [destructionRequest] = await db
    .insert(destructionRequests)
    .values({
      reportId: input.reportId,
      storeId: report.storeId,
      quantity: input.quantity,
      maxAllowedQuantity: input.maxAllowedQuantity,
      approvedBy: input.approvedBy,
      approvedAt: new Date(),
      status: "approved",
      lossAmount: input.lossAmount,
      notes: input.notes || null,
      evidenceUrls: [],
    })
    .returning();

  await db.insert(historyNodes).values({
    reportId: input.reportId,
    nodeType: "approve_destruction",
    title: "药师审核通过（销毁）",
    description: `区域药师批准销毁 ${input.quantity} 单位药品`,
    userId: input.approvedBy,
    quantityChange: input.quantity,
  });

  await db.insert(auditLogs).values({
    reportId: input.reportId,
    userId: input.approvedBy,
    action: "approve_destruction",
    previousStatus: report.status,
    newStatus: "approved",
    notes: `药师审核通过，销毁 ${input.quantity} 单位`,
  });

  return { success: true, destructionRequest };
}

export interface RejectReportInput {
  reportId: number;
  rejectedBy: number;
  reason: string;
}

export async function rejectReport(input: RejectReportInput) {
  const reportResult = await db
    .select()
    .from(expiryReports)
    .where(eq(expiryReports.id, input.reportId))
    .limit(1);
  const report = reportResult[0];

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  await db
    .update(expiryReports)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(expiryReports.id, input.reportId));

  await db.insert(historyNodes).values({
    reportId: input.reportId,
    nodeType: "rejected",
    title: "审核拒绝",
    description: `审核拒绝：${input.reason}`,
    userId: input.rejectedBy,
  });

  await db.insert(auditLogs).values({
    reportId: input.reportId,
    userId: input.rejectedBy,
    action: "reject_report",
    previousStatus: report.status,
    newStatus: "rejected",
    notes: input.reason,
  });

  return { success: true };
}

export interface FinanceReviewInput {
  reportId: number;
  destructionRequestId: number;
  approvedBy: number;
  lossAmount: string;
  notes?: string;
}

export async function financeReview(input: FinanceReviewInput) {
  const reportResult = await db
    .select()
    .from(expiryReports)
    .where(eq(expiryReports.id, input.reportId))
    .limit(1);
  const report = reportResult[0];

  const destructionRequestResult = await db
    .select()
    .from(destructionRequests)
    .where(eq(destructionRequests.id, input.destructionRequestId))
    .limit(1);
  const destructionRequest = destructionRequestResult[0];

  if (!report || !destructionRequest) {
    return { success: false, error: "记录不存在" };
  }

  await db
    .update(expiryReports)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(expiryReports.id, input.reportId));

  await db
    .update(destructionRequests)
    .set({
      financeApprovedBy: input.approvedBy,
      financeApprovedAt: new Date(),
      status: "archived",
      lossAmount: input.lossAmount,
      notes: input.notes || null,
    })
    .where(eq(destructionRequests.id, input.destructionRequestId));

  const storeResult = await db
    .select()
    .from(stores)
    .where(eq(stores.id, report.storeId))
    .limit(1);
  const store = storeResult[0];

  await db.insert(historyNodes).values({
    reportId: input.reportId,
    nodeType: "finance_approve",
    title: "财务复核通过",
    description: `财务复核通过，${store?.name || "门店"}销毁损耗已确认，金额：¥${input.lossAmount}`,
    userId: input.approvedBy,
  });

  await db.insert(auditLogs).values({
    reportId: input.reportId,
    userId: input.approvedBy,
    action: "finance_approve",
    previousStatus: report.status,
    newStatus: "archived",
    notes: `财务复核通过，损耗金额：¥${input.lossAmount}`,
  });

  return { success: true };
}

export interface RestartInventoryInput {
  reportId: number;
  restartedBy: number;
  newBatchNumber: string;
  newQuantity: number;
  notes?: string;
}

export async function restartInventory(input: RestartInventoryInput) {
  const reportResult = await db
    .select()
    .from(expiryReports)
    .where(eq(expiryReports.id, input.reportId))
    .limit(1);
  const report = reportResult[0];

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  await db
    .update(medicineBatches)
    .set({
      batchNumber: input.newBatchNumber,
    })
    .where(eq(medicineBatches.id, report.batchId));

  await db
    .update(inventory)
    .set({
      quantity: input.newQuantity,
      lastCountedAt: new Date(),
      lastCountedBy: input.restartedBy,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventory.storeId, report.storeId),
        eq(inventory.batchId, report.batchId)
      )
    );

  await db
    .update(expiryReports)
    .set({
      status: "pending",
      conflictType: "none",
      conflictNotes: null,
      reportedQuantity: input.newQuantity,
      inventoryQuantity: input.newQuantity,
      notes: input.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(expiryReports.id, input.reportId));

  await db.insert(historyNodes).values({
    reportId: input.reportId,
    nodeType: "restart_inventory",
    title: "重新盘点",
    description: `已完成重新盘点，新批号：${input.newBatchNumber}，数量：${input.newQuantity}`,
    userId: input.restartedBy,
    quantityChange: input.newQuantity,
  });

  await db.insert(auditLogs).values({
    reportId: input.reportId,
    userId: input.restartedBy,
    action: "restart_inventory",
    previousStatus: report.status,
    newStatus: "pending",
    notes: `重新盘点完成，新批号：${input.newBatchNumber}，数量：${input.newQuantity}`,
  });

  return { success: true };
}

export async function getReportDetail(id: number) {
  const reportResult = await db
    .select()
    .from(expiryReports)
    .where(eq(expiryReports.id, id))
    .limit(1);
  const report = reportResult[0];

  if (!report) return null;

  const storeResult = await db
    .select()
    .from(stores)
    .where(eq(stores.id, report.storeId))
    .limit(1);
  const store = storeResult[0];

  const reportedByResult = await db
    .select()
    .from(users)
    .where(eq(users.id, report.reportedBy))
    .limit(1);
  const reportedBy = reportedByResult[0];

  const batchResult = await db
    .select({
      id: medicineBatches.id,
      medicineId: medicineBatches.medicineId,
      batchNumber: medicineBatches.batchNumber,
      productionDate: medicineBatches.productionDate,
      expiryDate: medicineBatches.expiryDate,
      createdAt: medicineBatches.createdAt,
      medicine: {
        id: medicines.id,
        name: medicines.name,
        genericName: medicines.genericName,
        specification: medicines.specification,
        manufacturer: medicines.manufacturer,
        category: medicines.category,
        unit: medicines.unit,
        price: medicines.price,
      },
    })
    .from(medicineBatches)
    .leftJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
    .where(eq(medicineBatches.id, report.batchId))
    .limit(1);
  const batch = batchResult[0];

  const suggestedStore = report.suggestedTransferStoreId
    ? (
        await db
          .select()
          .from(stores)
          .where(eq(stores.id, report.suggestedTransferStoreId))
          .limit(1)
      )[0]
    : null;

  const transferRequestResult = await db
    .select()
    .from(transferRequests)
    .where(eq(transferRequests.reportId, id))
    .limit(1);
  const transferRequest = transferRequestResult[0];

  const destructionRequestResult = await db
    .select()
    .from(destructionRequests)
    .where(eq(destructionRequests.reportId, id))
    .limit(1);
  const destructionRequest = destructionRequestResult[0];

  const evidenceList = await db
    .select()
    .from(evidence)
    .where(eq(evidence.reportId, id));

  const historyNodesList = await db
    .select()
    .from(historyNodes)
    .where(eq(historyNodes.reportId, id))
    .orderBy(desc(historyNodes.createdAt));

  const auditLogsList = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.reportId, id))
    .orderBy(desc(auditLogs.createdAt));

  const sourceStore = transferRequest
    ? (
        await db
          .select()
          .from(stores)
          .where(eq(stores.id, transferRequest.sourceStoreId))
          .limit(1)
      )[0]
    : null;

  const targetStore = transferRequest
    ? (
        await db
          .select()
          .from(stores)
          .where(eq(stores.id, transferRequest.targetStoreId))
          .limit(1)
      )[0]
    : null;

  return {
    report,
    store,
    reportedBy,
    batch,
    suggestedStore,
    transferRequest,
    destructionRequest,
    evidence: evidenceList,
    historyNodes: historyNodesList,
    auditLogs: auditLogsList,
    sourceStore,
    targetStore,
  };
}

export async function getAllReports() {
  const reports = await db.select().from(expiryReports).orderBy(desc(expiryReports.createdAt));

  const result = [];
  for (const report of reports) {
    const storeResult = await db
      .select()
      .from(stores)
      .where(eq(stores.id, report.storeId))
      .limit(1);
    const store = storeResult[0];

    const batchResult = await db
      .select({
        id: medicineBatches.id,
        medicineId: medicineBatches.medicineId,
        batchNumber: medicineBatches.batchNumber,
        productionDate: medicineBatches.productionDate,
        expiryDate: medicineBatches.expiryDate,
        createdAt: medicineBatches.createdAt,
        medicine: {
          id: medicines.id,
          name: medicines.name,
          genericName: medicines.genericName,
          specification: medicines.specification,
          manufacturer: medicines.manufacturer,
          category: medicines.category,
          unit: medicines.unit,
          price: medicines.price,
        },
      })
      .from(medicineBatches)
      .leftJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .where(eq(medicineBatches.id, report.batchId))
      .limit(1);
    const batch = batchResult[0];

    result.push({ report, store, batch });
  }

  return result;
}

export async function getPendingPharmacistReviews() {
  const reports = await db
    .select()
    .from(expiryReports)
    .where(
      and(
        eq(expiryReports.status, "pending"),
        eq(expiryReports.conflictType, "none")
      )
    )
    .orderBy(desc(expiryReports.createdAt));

  const blockedReports = await db
    .select()
    .from(expiryReports)
    .where(eq(expiryReports.status, "blocked"))
    .orderBy(desc(expiryReports.createdAt));

  const allReports = [...reports, ...blockedReports];

  const result = [];
  for (const report of allReports) {
    const storeResult = await db
      .select()
      .from(stores)
      .where(eq(stores.id, report.storeId))
      .limit(1);
    const store = storeResult[0];

    const batchResult = await db
      .select({
        id: medicineBatches.id,
        medicineId: medicineBatches.medicineId,
        batchNumber: medicineBatches.batchNumber,
        productionDate: medicineBatches.productionDate,
        expiryDate: medicineBatches.expiryDate,
        createdAt: medicineBatches.createdAt,
        medicine: {
          id: medicines.id,
          name: medicines.name,
          genericName: medicines.genericName,
          specification: medicines.specification,
          manufacturer: medicines.manufacturer,
          category: medicines.category,
          unit: medicines.unit,
          price: medicines.price,
        },
      })
      .from(medicineBatches)
      .leftJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .where(eq(medicineBatches.id, report.batchId))
      .limit(1);
    const batch = batchResult[0];

    result.push({ report, store, batch });
  }

  return result;
}

export async function getPendingFinanceReviews() {
  const reports = await db
    .select()
    .from(expiryReports)
    .where(
      and(
        sql`(${expiryReports.status} = 'approved' OR ${expiryReports.status} = 'archived')`,
        eq(expiryReports.disposalType, "destruction")
      )
    )
    .orderBy(desc(expiryReports.createdAt));

  const result = [];
  for (const report of reports) {
    const storeResult = await db
      .select()
      .from(stores)
      .where(eq(stores.id, report.storeId))
      .limit(1);
    const store = storeResult[0];

    const batchResult = await db
      .select({
        id: medicineBatches.id,
        medicineId: medicineBatches.medicineId,
        batchNumber: medicineBatches.batchNumber,
        productionDate: medicineBatches.productionDate,
        expiryDate: medicineBatches.expiryDate,
        createdAt: medicineBatches.createdAt,
        medicine: {
          id: medicines.id,
          name: medicines.name,
          genericName: medicines.genericName,
          specification: medicines.specification,
          manufacturer: medicines.manufacturer,
          category: medicines.category,
          unit: medicines.unit,
          price: medicines.price,
        },
      })
      .from(medicineBatches)
      .leftJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .where(eq(medicineBatches.id, report.batchId))
      .limit(1);
    const batch = batchResult[0];

    const destructionRequestResult = await db
      .select()
      .from(destructionRequests)
      .where(eq(destructionRequests.reportId, report.id))
      .limit(1);
    const destructionRequest = destructionRequestResult[0];

    result.push({ report, store, batch, destructionRequest });
  }

  return result;
}

export async function getSummaryStats() {
  const totalReportsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(expiryReports);
  const totalReports = Number(totalReportsResult[0]?.count || 0);

  const pendingReportsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(expiryReports)
    .where(eq(expiryReports.status, "pending"));
  const pendingReports = Number(pendingReportsResult[0]?.count || 0);

  const blockedReportsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(expiryReports)
    .where(eq(expiryReports.status, "blocked"));
  const blockedReports = Number(blockedReportsResult[0]?.count || 0);

  const totalLossResult = await db
    .select({ total: sql<number>`sum(${destructionRequests.lossAmount})` })
    .from(destructionRequests)
    .where(
      or(
        eq(destructionRequests.status, "approved"),
        eq(destructionRequests.status, "archived")
      )
    );
  const totalLoss = Number(totalLossResult[0]?.total || 0);

  return {
    totalReports,
    pendingReports,
    blockedReports,
    totalLoss,
  };
}

function or(...conditions: any[]) {
  if (conditions.length === 0) return undefined;
  return conditions.reduce((acc, cond) => sql`${acc} OR ${cond}`);
}

export async function getStoreSummaries() {
  const allStores = await db.select().from(stores);
  const summaries = [];

  for (const store of allStores) {
    const storeReportsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(expiryReports)
      .where(eq(expiryReports.storeId, store.id));
    const reportCount = Number(storeReportsResult[0]?.count || 0);

    const transferQuantityResult = await db
      .select({ total: sql<number>`sum(${transferRequests.quantity})` })
      .from(transferRequests)
      .innerJoin(
        expiryReports,
        eq(transferRequests.reportId, expiryReports.id)
      )
      .where(eq(expiryReports.storeId, store.id));
    const transferQuantity = Number(transferQuantityResult[0]?.total || 0);

    const destructionResult = await db
      .select({
        quantity: sql<number>`sum(${destructionRequests.quantity})`,
        loss: sql<number>`sum(${destructionRequests.lossAmount})`,
      })
      .from(destructionRequests)
      .innerJoin(
        expiryReports,
        eq(destructionRequests.reportId, expiryReports.id)
      )
      .where(eq(expiryReports.storeId, store.id));
    const destructionQuantity = Number(destructionResult[0]?.quantity || 0);
    const lossAmount = Number(destructionResult[0]?.loss || 0);

    summaries.push({
      store,
      reportCount,
      transferQuantity,
      destructionQuantity,
      lossAmount,
    });
  }

  return summaries;
}

export async function getCategorySummaries() {
  const categories = [
    "antibiotics",
    "cardiovascular",
    "gastrointestinal",
    "nervous_system",
    "respiratory",
    "vitamins",
    "other",
  ];
  const summaries = [];

  for (const category of categories) {
    const categoryReportsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(expiryReports)
      .innerJoin(
        medicineBatches,
        eq(expiryReports.batchId, medicineBatches.id)
      )
      .innerJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .where(eq(medicines.category, category as any));
    const reportCount = Number(categoryReportsResult[0]?.count || 0);

    const transferQuantityResult = await db
      .select({ total: sql<number>`sum(${transferRequests.quantity})` })
      .from(transferRequests)
      .innerJoin(
        expiryReports,
        eq(transferRequests.reportId, expiryReports.id)
      )
      .innerJoin(
        medicineBatches,
        eq(expiryReports.batchId, medicineBatches.id)
      )
      .innerJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .where(eq(medicines.category, category as any));
    const transferQuantity = Number(transferQuantityResult[0]?.total || 0);

    const destructionResult = await db
      .select({
        quantity: sql<number>`sum(${destructionRequests.quantity})`,
        loss: sql<number>`sum(${destructionRequests.lossAmount})`,
      })
      .from(destructionRequests)
      .innerJoin(
        expiryReports,
        eq(destructionRequests.reportId, expiryReports.id)
      )
      .innerJoin(
        medicineBatches,
        eq(expiryReports.batchId, medicineBatches.id)
      )
      .innerJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .where(eq(medicines.category, category as any));
    const destructionQuantity = Number(destructionResult[0]?.quantity || 0);
    const lossAmount = Number(destructionResult[0]?.loss || 0);

    summaries.push({
      category,
      reportCount,
      transferQuantity,
      destructionQuantity,
      lossAmount,
    });
  }

  return summaries;
}

export async function getDisposalSummaries() {
  const transferResult = await db
    .select({
      count: sql<number>`count(*)`,
      totalQuantity: sql<number>`sum(${transferRequests.quantity})`,
    })
    .from(transferRequests)
    .where(sql`${transferRequests.status} != 'rejected'`);

  const destructionResult = await db
    .select({
      count: sql<number>`count(*)`,
      totalQuantity: sql<number>`sum(${destructionRequests.quantity})`,
      totalLoss: sql<number>`sum(${destructionRequests.lossAmount})`,
    })
    .from(destructionRequests)
    .where(sql`${destructionRequests.status} != 'rejected'`);

  return {
    transfer: {
      count: Number(transferResult[0]?.count || 0),
      totalQuantity: Number(transferResult[0]?.totalQuantity || 0),
    },
    destruction: {
      count: Number(destructionResult[0]?.count || 0),
      totalQuantity: Number(destructionResult[0]?.totalQuantity || 0),
      totalLoss: Number(destructionResult[0]?.totalLoss || 0),
    },
  };
}

export async function getStores() {
  return db.select().from(stores);
}

export async function getMedicines() {
  return db.select().from(medicines);
}

export async function getBatches() {
  return db.select().from(medicineBatches);
}

export async function getBatchesByMedicine(medicineId: number) {
  const batches = await db
    .select({
      id: medicineBatches.id,
      medicineId: medicineBatches.medicineId,
      batchNumber: medicineBatches.batchNumber,
      productionDate: medicineBatches.productionDate,
      expiryDate: medicineBatches.expiryDate,
      createdAt: medicineBatches.createdAt,
    })
    .from(medicineBatches)
    .where(eq(medicineBatches.medicineId, medicineId));

  const medicineResult = await db
    .select()
    .from(medicines)
    .where(eq(medicines.id, medicineId))
    .limit(1);
  const medicine = medicineResult[0];

  return batches.map((batch) => ({
    ...batch,
    medicine,
  }));
}

export async function getInventoryByStoreAndBatch(storeId: number, batchId: number) {
  const result = await db
    .select()
    .from(inventory)
    .where(
      and(eq(inventory.storeId, storeId), eq(inventory.batchId, batchId))
    )
    .limit(1);
  return result[0];
}

export async function getUsers() {
  return db.select().from(users);
}
