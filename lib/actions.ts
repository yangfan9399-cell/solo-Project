"use server";

import {
  getData,
  saveExpiryReport,
  updateExpiryReport,
  saveHistoryNode,
  saveAuditLog,
  saveTransferRequest,
  saveDestructionRequest,
  updateDestructionRequest,
  updateTransferRequest,
  getNextReportNumber,
  getStoreById,
  getBatchById,
  type ExpiryReport,
  type TransferRequest,
  type DestructionRequest,
} from "./db/storage";

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

export async function createReport(input: CreateReportInput) {
  const data = await getData();
  const batch = getBatchById(data, input.batchId);
  const store = getStoreById(data, input.storeId);

  let conflictType: "batch_mismatch" | "quantity_exceeded" | "store_conflict" | "none" = "none";
  let conflictNotes = "";
  let status: "pending" | "blocked" = "pending";

  if (input.actualBatchNumber && input.systemBatchNumber && input.actualBatchNumber !== input.systemBatchNumber) {
    conflictType = "batch_mismatch";
    conflictNotes = `上报批号为 ${input.systemBatchNumber}，但实际盘点批号为 ${input.actualBatchNumber}，批号不一致`;
    status = "blocked";
  }

  if (input.reportedQuantity !== input.inventoryQuantity) {
    conflictNotes += (conflictNotes ? "; " : "") + `上报数量 ${input.reportedQuantity} 与系统库存 ${input.inventoryQuantity} 不一致`;
  }

  if (input.disposalType === "destruction" && input.reportedQuantity > 20) {
    conflictType = "quantity_exceeded";
    conflictNotes = `月度销毁限额为20单位，申请销毁${input.reportedQuantity}单位，超出限额${input.reportedQuantity - 20}单位`;
  }

  const report = await saveExpiryReport({
    reportNumber: getNextReportNumber(),
    storeId: input.storeId,
    reportedBy: input.reportedBy,
    batchId: input.batchId,
    reportedQuantity: input.reportedQuantity,
    inventoryQuantity: input.inventoryQuantity,
    notes: input.notes,
    conflictType,
    conflictNotes: conflictNotes || undefined,
    status,
    disposalType: input.disposalType,
    suggestedTransferStoreId: input.suggestedTransferStoreId,
  });

  await saveHistoryNode({
    reportId: report.id,
    nodeType: "report",
    title: "门店上报",
    description: `${store?.name || "未知门店"}经办人上报${batch?.medicine?.name || "药品"}近效期情况`,
    userId: input.reportedBy,
    quantityChange: input.reportedQuantity,
  });

  await saveAuditLog({
    reportId: report.id,
    userId: input.reportedBy,
    action: "create_report",
    newStatus: status,
    notes: `创建近效期药品上报：${batch?.medicine?.name || "药品"} ${input.reportedQuantity}${batch?.medicine?.unit || ""}`,
  });

  if (conflictType === "batch_mismatch") {
    await saveHistoryNode({
      reportId: report.id,
      nodeType: "blocked",
      title: "批号不一致阻断",
      description: "检测到实际批号与系统记录批号不一致，流程已阻断，请重新盘点",
      userId: input.reportedBy,
    });

    await saveAuditLog({
      reportId: report.id,
      userId: input.reportedBy,
      action: "detect_mismatch",
      previousStatus: "pending",
      newStatus: "blocked",
      notes: "检测到批号不一致，流程已阻断",
    });
  }

  if (input.disposalType === "transfer" && input.suggestedTransferStoreId) {
    await saveHistoryNode({
      reportId: report.id,
      nodeType: "suggest_transfer",
      title: "调拨建议",
      description: `建议调拨至 ${getStoreById(data, input.suggestedTransferStoreId)?.name || "目标门店"}`,
      userId: input.reportedBy,
    });

    await saveAuditLog({
      reportId: report.id,
      userId: input.reportedBy,
      action: "suggest_transfer",
      previousStatus: status,
      newStatus: status,
      notes: "建议调拨",
    });
  }

  if (input.disposalType === "destruction") {
    await saveHistoryNode({
      reportId: report.id,
      nodeType: "request_destruction",
      title: "销毁申请",
      description: "申请销毁过期药品",
      userId: input.reportedBy,
    });

    await saveAuditLog({
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
  const data = await getData();
  const report = data.expiryReports.find((r) => r.id === input.reportId);

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  if (report.conflictType === "batch_mismatch") {
    return { success: false, error: "批号不一致，流程已阻断，请先重新盘点" };
  }

  await updateExpiryReport(input.reportId, {
    status: "approved",
    disposalType: "transfer",
  });

  const transferRequest = await saveTransferRequest({
    reportId: input.reportId,
    sourceStoreId: report.storeId,
    targetStoreId: input.targetStoreId,
    quantity: input.quantity,
    approvedBy: input.approvedBy,
    approvedAt: new Date().toISOString(),
    status: "approved",
    notes: input.notes,
    evidenceUrls: [],
  });

  const sourceStore = getStoreById(data, report.storeId);
  const targetStore = getStoreById(data, input.targetStoreId);

  await saveHistoryNode({
    reportId: input.reportId,
    nodeType: "approve_transfer",
    title: "药师审核通过（调拨）",
    description: `区域药师批准从 ${sourceStore?.name || "原门店"} 调拨至 ${targetStore?.name || "目标门店"}`,
    userId: input.approvedBy,
    quantityChange: input.quantity,
  });

  await saveAuditLog({
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
  const data = await getData();
  const report = data.expiryReports.find((r) => r.id === input.reportId);

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  await updateExpiryReport(input.reportId, {
    status: "approved",
    disposalType: "destruction",
  });

  const destructionRequest = await saveDestructionRequest({
    reportId: input.reportId,
    storeId: report.storeId,
    quantity: input.quantity,
    maxAllowedQuantity: input.maxAllowedQuantity,
    approvedBy: input.approvedBy,
    approvedAt: new Date().toISOString(),
    status: "approved",
    lossAmount: input.lossAmount,
    notes: input.notes,
    evidenceUrls: [],
  });

  await saveHistoryNode({
    reportId: input.reportId,
    nodeType: "approve_destruction",
    title: "药师审核通过（销毁）",
    description: `区域药师批准销毁 ${input.quantity} 单位药品`,
    userId: input.approvedBy,
    quantityChange: input.quantity,
  });

  await saveAuditLog({
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
  const data = await getData();
  const report = data.expiryReports.find((r) => r.id === input.reportId);

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  await updateExpiryReport(input.reportId, {
    status: "rejected",
  });

  await saveHistoryNode({
    reportId: input.reportId,
    nodeType: "rejected",
    title: "审核拒绝",
    description: `审核拒绝：${input.reason}`,
    userId: input.rejectedBy,
  });

  await saveAuditLog({
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
  const data = await getData();
  const report = data.expiryReports.find((r) => r.id === input.reportId);
  const destructionRequest = data.destructionRequests.find((r) => r.id === input.destructionRequestId);

  if (!report || !destructionRequest) {
    return { success: false, error: "记录不存在" };
  }

  await updateExpiryReport(input.reportId, {
    status: "archived",
  });

  await updateDestructionRequest(input.destructionRequestId, {
    financeApprovedBy: input.approvedBy,
    financeApprovedAt: new Date().toISOString(),
    status: "archived",
    lossAmount: input.lossAmount,
    notes: input.notes,
  });

  const store = getStoreById(data, report.storeId);

  await saveHistoryNode({
    reportId: input.reportId,
    nodeType: "finance_approve",
    title: "财务复核通过",
    description: `财务复核通过，${store?.name || "门店"}销毁损耗已确认，金额：¥${input.lossAmount}`,
    userId: input.approvedBy,
  });

  await saveAuditLog({
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
  const data = await getData();
  const report = data.expiryReports.find((r) => r.id === input.reportId);

  if (!report) {
    return { success: false, error: "上报记录不存在" };
  }

  await updateExpiryReport(input.reportId, {
    status: "pending",
    conflictType: "none",
    conflictNotes: undefined,
    reportedQuantity: input.newQuantity,
    notes: input.notes,
  });

  await saveHistoryNode({
    reportId: input.reportId,
    nodeType: "restart_inventory",
    title: "重新盘点",
    description: `已完成重新盘点，新批号：${input.newBatchNumber}，数量：${input.newQuantity}`,
    userId: input.restartedBy,
    quantityChange: input.newQuantity,
  });

  await saveAuditLog({
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
  const data = await getData();
  const report = data.expiryReports.find((r) => r.id === id);
  if (!report) return null;

  const store = getStoreById(data, report.storeId);
  const reportedBy = data.users.find((u) => u.id === report.reportedBy);
  const batch = getBatchById(data, report.batchId);
  const suggestedStore = report.suggestedTransferStoreId
    ? getStoreById(data, report.suggestedTransferStoreId)
    : null;
  const transferRequest = data.transferRequests.find((t) => t.reportId === id);
  const destructionRequest = data.destructionRequests.find((d) => d.reportId === id);
  const evidence = data.evidence.filter((e) => e.reportId === id);
  const historyNodes = data.historyNodes
    .filter((n) => n.reportId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const auditLogs = data.auditLogs
    .filter((l) => l.reportId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sourceStore = transferRequest
    ? getStoreById(data, transferRequest.sourceStoreId)
    : null;
  const targetStore = transferRequest
    ? getStoreById(data, transferRequest.targetStoreId)
    : null;

  return {
    report,
    store,
    reportedBy,
    batch,
    suggestedStore,
    transferRequest,
    destructionRequest,
    evidence,
    historyNodes,
    auditLogs,
    sourceStore,
    targetStore,
  };
}

export async function getAllReports() {
  const data = await getData();
  return data.expiryReports.map((report) => {
    const store = getStoreById(data, report.storeId);
    const batch = getBatchById(data, report.batchId);
    return { report, store, batch };
  });
}

export async function getPendingPharmacistReviews() {
  const data = await getData();
  return data.expiryReports
    .filter((r) => r.status === "pending" || r.status === "blocked")
    .map((report) => {
      const store = getStoreById(data, report.storeId);
      const batch = getBatchById(data, report.batchId);
      return { report, store, batch };
    });
}

export async function getPendingFinanceReviews() {
  const data = await getData();
  return data.expiryReports
    .filter((r) => r.status === "approved" && r.disposalType === "destruction")
    .map((report) => {
      const store = getStoreById(data, report.storeId);
      const batch = getBatchById(data, report.batchId);
      const destructionRequest = data.destructionRequests.find((d) => d.reportId === report.id);
      return { report, store, batch, destructionRequest };
    });
}

export async function getSummaryStats() {
  const data = await getData();

  const totalReports = data.expiryReports.length;
  const pendingReports = data.expiryReports.filter((r) => r.status === "pending").length;
  const blockedReports = data.expiryReports.filter((r) => r.status === "blocked").length;

  let totalLoss = 0;
  data.destructionRequests.forEach((d) => {
    if (d.lossAmount && (d.status === "approved" || d.status === "archived")) {
      totalLoss += parseFloat(d.lossAmount);
    }
  });

  return {
    totalReports,
    pendingReports,
    blockedReports,
    totalLoss,
  };
}

export async function getStoreSummaries() {
  const data = await getData();
  const summaries: Array<{
    store: typeof data.stores[0];
    reportCount: number;
    transferQuantity: number;
    destructionQuantity: number;
    lossAmount: number;
  }> = [];

  data.stores.forEach((store) => {
    const storeReports = data.expiryReports.filter((r) => r.storeId === store.id);
    const transferRequests = data.transferRequests.filter(
      (t) => data.expiryReports.find((r) => r.id === t.reportId)?.storeId === store.id
    );
    const destructionRequests = data.destructionRequests.filter(
      (d) => data.expiryReports.find((r) => r.id === d.reportId)?.storeId === store.id
    );

    summaries.push({
      store,
      reportCount: storeReports.length,
      transferQuantity: transferRequests.reduce((sum, t) => sum + t.quantity, 0),
      destructionQuantity: destructionRequests.reduce((sum, d) => sum + d.quantity, 0),
      lossAmount: destructionRequests.reduce((sum, d) => sum + (d.lossAmount ? parseFloat(d.lossAmount) : 0), 0),
    });
  });

  return summaries;
}

export async function getCategorySummaries() {
  const data = await getData();
  const summaries: Array<{
    category: string;
    reportCount: number;
    transferQuantity: number;
    destructionQuantity: number;
    lossAmount: number;
  }> = [];

  const categories = ["antibiotics", "cardiovascular", "gastrointestinal", "nervous_system", "respiratory", "vitamins", "other"];

  categories.forEach((category) => {
    const categoryMedicines = data.medicines.filter((m) => m.category === category);
    const categoryBatches = data.medicineBatches.filter((b) =>
      categoryMedicines.some((m) => m.id === b.medicineId)
    );
    const categoryReports = data.expiryReports.filter((r) =>
      categoryBatches.some((b) => b.id === r.batchId)
    );

    const transferRequests = data.transferRequests.filter((t) =>
      categoryReports.some((r) => r.id === t.reportId)
    );
    const destructionRequests = data.destructionRequests.filter((d) =>
      categoryReports.some((r) => r.id === d.reportId)
    );

    summaries.push({
      category,
      reportCount: categoryReports.length,
      transferQuantity: transferRequests.reduce((sum, t) => sum + t.quantity, 0),
      destructionQuantity: destructionRequests.reduce((sum, d) => sum + d.quantity, 0),
      lossAmount: destructionRequests.reduce((sum, d) => sum + (d.lossAmount ? parseFloat(d.lossAmount) : 0), 0),
    });
  });

  return summaries;
}

export async function getDisposalSummaries() {
  const data = await getData();

  const transferRequests = data.transferRequests.filter((t) => t.status !== "rejected");
  const destructionRequests = data.destructionRequests.filter((d) => d.status !== "rejected");

  const transferCount = transferRequests.length;
  const transferTotalQuantity = transferRequests.reduce((sum, t) => sum + t.quantity, 0);
  const destructionCount = destructionRequests.length;
  const destructionTotalQuantity = destructionRequests.reduce((sum, d) => sum + d.quantity, 0);
  const totalLoss = destructionRequests.reduce((sum, d) => sum + (d.lossAmount ? parseFloat(d.lossAmount) : 0), 0);

  return {
    transfer: {
      count: transferCount,
      totalQuantity: transferTotalQuantity,
    },
    destruction: {
      count: destructionCount,
      totalQuantity: destructionTotalQuantity,
      totalLoss,
    },
  };
}

export async function getStores() {
  const data = await getData();
  return data.stores;
}

export async function getMedicines() {
  const data = await getData();
  return data.medicines;
}

export async function getBatches() {
  const data = await getData();
  return data.medicineBatches;
}

export async function getBatchesByMedicine(medicineId: number) {
  const data = await getData();
  return data.medicineBatches
    .filter((b) => b.medicineId === medicineId)
    .map((b) => ({
      ...b,
      medicine: data.medicines.find((m) => m.id === b.medicineId),
    }));
}

export async function getInventoryByStoreAndBatch(storeId: number, batchId: number) {
  const data = await getData();
  return data.inventory.find((i) => i.storeId === storeId && i.batchId === batchId);
}

export async function getUsers() {
  const data = await getData();
  return data.users;
}
