export interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  region: string;
  manager: string;
  phone: string;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: "store_clerk" | "regional_pharmacist" | "finance" | "admin";
  storeId?: number;
  region: string;
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  specification: string;
  manufacturer: string;
  category: "antibiotics" | "cardiovascular" | "gastrointestinal" | "nervous_system" | "respiratory" | "vitamins" | "other";
  unit: string;
  price: string;
}

export interface MedicineBatch {
  id: number;
  medicineId: number;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  medicine?: Medicine;
}

export interface Inventory {
  id: number;
  storeId: number;
  batchId: number;
  quantity: number;
  lastCountedAt?: string;
  lastCountedBy?: number;
}

export interface ExpiryReport {
  id: number;
  reportNumber: string;
  storeId: number;
  reportedBy: number;
  batchId: number;
  reportedQuantity: number;
  inventoryQuantity: number;
  notes?: string;
  conflictType: "batch_mismatch" | "quantity_exceeded" | "store_conflict" | "none";
  conflictNotes?: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "archived";
  disposalType: "transfer" | "destruction" | "none";
  suggestedTransferStoreId?: number;
  createdAt: string;
  updatedAt: string;
  store?: Store;
  reportedByUser?: User;
  batch?: MedicineBatch;
  suggestedTransferStore?: Store;
}

export interface TransferRequest {
  id: number;
  reportId: number;
  sourceStoreId: number;
  targetStoreId: number;
  quantity: number;
  approvedBy?: number;
  approvedAt?: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "archived";
  notes?: string;
  evidenceUrls: string[];
  sourceStore?: Store;
  targetStore?: Store;
  approvedByUser?: User;
}

export interface DestructionRequest {
  id: number;
  reportId: number;
  storeId: number;
  quantity: number;
  maxAllowedQuantity: number;
  approvedBy?: number;
  financeApprovedBy?: number;
  approvedAt?: string;
  financeApprovedAt?: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "archived";
  lossAmount?: string;
  notes?: string;
  evidenceUrls: string[];
  store?: Store;
  approvedByUser?: User;
  financeApprovedByUser?: User;
}

export interface AuditLog {
  id: number;
  reportId: number;
  userId: number;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  createdAt: string;
  user?: User;
}

export interface Evidence {
  id: number;
  reportId: number;
  uploadedBy: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  description?: string;
  createdAt: string;
  uploadedByUser?: User;
}

export interface HistoryNode {
  id: number;
  reportId: number;
  nodeType: string;
  title: string;
  description: string;
  userId?: number;
  quantityChange?: number;
  createdAt: string;
  user?: User;
}

export const mockStores: Store[] = [
  { id: 1, name: "朝阳大药房总店", code: "CY-001", address: "北京市朝阳区建国路88号", region: "华北区", manager: "张经理", phone: "13800138001", createdAt: "2026-01-01T00:00:00Z" },
  { id: 2, name: "朝阳大药房海淀分店", code: "CY-002", address: "北京市海淀区中关村大街1号", region: "华北区", manager: "李店长", phone: "13800138002", createdAt: "2026-01-01T00:00:00Z" },
  { id: 3, name: "朝阳大药房西城分店", code: "CY-003", address: "北京市西城区金融街15号", region: "华北区", manager: "王店长", phone: "13800138003", createdAt: "2026-01-01T00:00:00Z" },
  { id: 4, name: "朝阳大药房东城分店", code: "CY-004", address: "北京市东城区王府井大街20号", region: "华北区", manager: "赵店长", phone: "13800138004", createdAt: "2026-01-01T00:00:00Z" },
  { id: 5, name: "朝阳大药房丰台分店", code: "CY-005", address: "北京市丰台区南三环西路5号", region: "华北区", manager: "刘店长", phone: "13800138005", createdAt: "2026-01-01T00:00:00Z" },
];

export const mockUsers: User[] = [
  { id: 1, name: "总店经办人", username: "clerk_cy001", role: "store_clerk", storeId: 1, region: "华北区" },
  { id: 2, name: "海淀经办人", username: "clerk_cy002", role: "store_clerk", storeId: 2, region: "华北区" },
  { id: 3, name: "西城经办人", username: "clerk_cy003", role: "store_clerk", storeId: 3, region: "华北区" },
  { id: 4, name: "区域药师王", username: "pharmacist_wang", role: "regional_pharmacist", region: "华北区" },
  { id: 5, name: "财务张", username: "finance_zhang", role: "finance", region: "华北区" },
  { id: 6, name: "管理员", username: "admin", role: "admin", region: "华北区" },
];

export const mockMedicines: Medicine[] = [
  { id: 1, name: "阿莫西林胶囊", genericName: "Amoxicillin Capsules", specification: "0.25g*24粒", manufacturer: "华北制药股份有限公司", category: "antibiotics", unit: "盒", price: "15.80" },
  { id: 2, name: "硝苯地平缓释片", genericName: "Nifedipine Sustained Release Tablets", specification: "10mg*30片", manufacturer: "拜耳医药保健有限公司", category: "cardiovascular", unit: "盒", price: "28.50" },
  { id: 3, name: "奥美拉唑肠溶胶囊", genericName: "Omeprazole Enteric-coated Capsules", specification: "20mg*14粒", manufacturer: "阿斯利康制药有限公司", category: "gastrointestinal", unit: "盒", price: "45.00" },
  { id: 4, name: "布洛芬缓释胶囊", genericName: "Ibuprofen Sustained Release Capsules", specification: "0.3g*20粒", manufacturer: "中美天津史克制药有限公司", category: "nervous_system", unit: "盒", price: "22.00" },
  { id: 5, name: "维生素C片", genericName: "Vitamin C Tablets", specification: "100mg*100片", manufacturer: "东北制药集团股份有限公司", category: "vitamins", unit: "瓶", price: "8.50" },
];

export const mockBatches: MedicineBatch[] = [
  { id: 1, medicineId: 1, batchNumber: "AMX202601001", productionDate: "2026-01-15", expiryDate: "2026-07-15" },
  { id: 2, medicineId: 1, batchNumber: "AMX202602002", productionDate: "2026-02-20", expiryDate: "2026-08-20" },
  { id: 3, medicineId: 2, batchNumber: "NFD202512005", productionDate: "2025-12-10", expiryDate: "2026-06-10" },
  { id: 4, medicineId: 3, batchNumber: "OME202511008", productionDate: "2025-11-05", expiryDate: "2026-06-05" },
  { id: 5, medicineId: 4, batchNumber: "IBU202601015", productionDate: "2026-01-20", expiryDate: "2026-07-20" },
  { id: 6, medicineId: 5, batchNumber: "VTC202510020", productionDate: "2025-10-15", expiryDate: "2026-06-15" },
];

export const mockInventory: Inventory[] = [
  { id: 1, storeId: 1, batchId: 1, quantity: 50, lastCountedBy: 1 },
  { id: 2, storeId: 2, batchId: 1, quantity: 0, lastCountedBy: 2 },
  { id: 3, storeId: 3, batchId: 1, quantity: 100, lastCountedBy: 3 },
  { id: 4, storeId: 1, batchId: 2, quantity: 80, lastCountedBy: 1 },
  { id: 5, storeId: 2, batchId: 3, quantity: 45, lastCountedBy: 2 },
  { id: 6, storeId: 3, batchId: 4, quantity: 30, lastCountedBy: 3 },
  { id: 7, storeId: 1, batchId: 5, quantity: 120, lastCountedBy: 1 },
  { id: 8, storeId: 2, batchId: 6, quantity: 200, lastCountedBy: 2 },
];

export const mockExpiryReports: ExpiryReport[] = [
  {
    id: 1,
    reportNumber: "EXP-2026-00001",
    storeId: 1,
    reportedBy: 1,
    batchId: 1,
    reportedQuantity: 50,
    inventoryQuantity: 50,
    notes: "阿莫西林胶囊即将过期，建议调拨至海淀分店（库存为0）",
    conflictType: "none",
    status: "pending",
    disposalType: "transfer",
    suggestedTransferStoreId: 2,
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-06-01T09:00:00Z",
  },
  {
    id: 2,
    reportNumber: "EXP-2026-00002",
    storeId: 2,
    reportedBy: 2,
    batchId: 3,
    reportedQuantity: 45,
    inventoryQuantity: 38,
    notes: "盘点发现库存数量与系统记录不一致",
    conflictType: "batch_mismatch",
    conflictNotes: "上报批号为 NFD202512005，但实际盘点发现部分药品批号为 NFD202512006，批号不一致",
    status: "blocked",
    disposalType: "none",
    createdAt: "2026-06-02T10:30:00Z",
    updatedAt: "2026-06-02T14:00:00Z",
  },
  {
    id: 3,
    reportNumber: "EXP-2026-00003",
    storeId: 3,
    reportedBy: 3,
    batchId: 4,
    reportedQuantity: 30,
    inventoryQuantity: 30,
    notes: "奥美拉唑肠溶胶囊即将过期，销毁申请数量超过月度限额",
    conflictType: "quantity_exceeded",
    conflictNotes: "月度销毁限额为20盒，申请销毁30盒，超出限额10盒",
    status: "pending",
    disposalType: "destruction",
    createdAt: "2026-06-03T11:00:00Z",
    updatedAt: "2026-06-03T11:00:00Z",
  },
  {
    id: 4,
    reportNumber: "EXP-2026-00004",
    storeId: 1,
    reportedBy: 1,
    batchId: 6,
    reportedQuantity: 50,
    inventoryQuantity: 50,
    notes: "维生素C片责任门店归属存在争议",
    conflictType: "store_conflict",
    conflictNotes: "该批次药品由总店调拨至海淀分店，但调拨手续未完成，责任门店不明确",
    status: "pending",
    disposalType: "none",
    createdAt: "2026-06-04T15:00:00Z",
    updatedAt: "2026-06-04T15:00:00Z",
  },
];

export const mockTransferRequests: TransferRequest[] = [
  {
    id: 1,
    reportId: 1,
    sourceStoreId: 1,
    targetStoreId: 2,
    quantity: 50,
    status: "pending",
    notes: "海淀分店该药品库存为0，有患者需求",
    evidenceUrls: ["https://example.com/evidence/transfer1.jpg"],
  },
];

export const mockDestructionRequests: DestructionRequest[] = [
  {
    id: 1,
    reportId: 3,
    storeId: 3,
    quantity: 30,
    maxAllowedQuantity: 20,
    status: "pending",
    lossAmount: "1350.00",
    notes: "药品已过期无法使用",
    evidenceUrls: ["https://example.com/evidence/destruction1.jpg"],
  },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 1, reportId: 1, userId: 1, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-01T09:00:00Z" },
  { id: 2, reportId: 1, userId: 1, action: "suggest_transfer", previousStatus: "pending", newStatus: "pending", notes: "建议调拨至海淀分店", createdAt: "2026-06-01T09:05:00Z" },
  { id: 3, reportId: 2, userId: 2, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-02T10:30:00Z" },
  { id: 4, reportId: 2, userId: 4, action: "detect_mismatch", previousStatus: "pending", newStatus: "blocked", notes: "检测到批号不一致，阻断流程", createdAt: "2026-06-02T14:00:00Z" },
  { id: 5, reportId: 3, userId: 3, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-03T11:00:00Z" },
  { id: 6, reportId: 3, userId: 3, action: "request_destruction", previousStatus: "pending", newStatus: "pending", notes: "申请销毁", createdAt: "2026-06-03T11:10:00Z" },
  { id: 7, reportId: 4, userId: 1, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-04T15:00:00Z" },
];

export const mockEvidence: Evidence[] = [
  { id: 1, reportId: 1, uploadedBy: 1, fileName: "transfer_evidence.jpg", fileUrl: "https://example.com/evidence/transfer1.jpg", fileType: "image/jpeg", description: "库存照片", createdAt: "2026-06-01T09:10:00Z" },
  { id: 2, reportId: 2, uploadedBy: 2, fileName: "batch_mismatch.pdf", fileUrl: "https://example.com/evidence/batch_mismatch.pdf", fileType: "application/pdf", description: "批号不一致盘点报告", createdAt: "2026-06-02T14:05:00Z" },
  { id: 3, reportId: 3, uploadedBy: 3, fileName: "expired_meds.jpg", fileUrl: "https://example.com/evidence/expired_meds.jpg", fileType: "image/jpeg", description: "过期药品照片", createdAt: "2026-06-03T11:15:00Z" },
];

export const mockHistoryNodes: HistoryNode[] = [
  { id: 1, reportId: 1, nodeType: "report", title: "门店上报", description: "总店经办人上报阿莫西林胶囊近效期情况", userId: 1, quantityChange: 50, createdAt: "2026-06-01T09:00:00Z" },
  { id: 2, reportId: 1, nodeType: "suggest_transfer", title: "调拨建议", description: "系统建议调拨至海淀分店（该店库存为0）", userId: 1, createdAt: "2026-06-01T09:05:00Z" },
  { id: 3, reportId: 2, nodeType: "report", title: "门店上报", description: "海淀分店经办人上报硝苯地平缓释片", userId: 2, quantityChange: 45, createdAt: "2026-06-02T10:30:00Z" },
  { id: 4, reportId: 2, nodeType: "blocked", title: "批号不一致阻断", description: "检测到实际批号与系统记录批号不一致，流程已阻断，请重新盘点", userId: 4, createdAt: "2026-06-02T14:00:00Z" },
  { id: 5, reportId: 3, nodeType: "report", title: "门店上报", description: "西城分店经办人上报奥美拉唑肠溶胶囊", userId: 3, quantityChange: 30, createdAt: "2026-06-03T11:00:00Z" },
  { id: 6, reportId: 3, nodeType: "request_destruction", title: "销毁申请", description: "申请销毁过期药品", userId: 3, createdAt: "2026-06-03T11:10:00Z" },
  { id: 7, reportId: 4, nodeType: "report", title: "门店上报", description: "总店上报维生素C片", userId: 1, quantityChange: 50, createdAt: "2026-06-04T15:00:00Z" },
  { id: 8, reportId: 4, nodeType: "conflict", title: "责任门店冲突", description: "该批次药品责任门店归属存在争议", userId: 4, createdAt: "2026-06-04T15:30:00Z" },
];

export function getStoreById(id: number): Store | undefined {
  return mockStores.find(s => s.id === id);
}

export function getUserById(id: number): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function getMedicineById(id: number): Medicine | undefined {
  return mockMedicines.find(m => m.id === id);
}

export function getBatchById(id: number): MedicineBatch | undefined {
  const batch = mockBatches.find(b => b.id === id);
  if (batch) {
    return { ...batch, medicine: getMedicineById(batch.medicineId) };
  }
  return undefined;
}

export function getExpiryReportDetail(id: number): ExpiryReport | undefined {
  const report = mockExpiryReports.find(r => r.id === id);
  if (report) {
    return {
      ...report,
      store: getStoreById(report.storeId),
      reportedByUser: getUserById(report.reportedBy),
      batch: getBatchById(report.batchId),
      suggestedTransferStore: report.suggestedTransferStoreId ? getStoreById(report.suggestedTransferStoreId) : undefined,
    };
  }
  return undefined;
}

export function getTransferRequestsByReportId(reportId: number): TransferRequest[] {
  return mockTransferRequests
    .filter(t => t.reportId === reportId)
    .map(t => ({
      ...t,
      sourceStore: getStoreById(t.sourceStoreId),
      targetStore: getStoreById(t.targetStoreId),
      approvedByUser: t.approvedBy ? getUserById(t.approvedBy) : undefined,
    }));
}

export function getDestructionRequestsByReportId(reportId: number): DestructionRequest[] {
  return mockDestructionRequests
    .filter(d => d.reportId === reportId)
    .map(d => ({
      ...d,
      store: getStoreById(d.storeId),
      approvedByUser: d.approvedBy ? getUserById(d.approvedBy) : undefined,
      financeApprovedByUser: d.financeApprovedBy ? getUserById(d.financeApprovedBy) : undefined,
    }));
}

export function getAuditLogsByReportId(reportId: number): AuditLog[] {
  return mockAuditLogs
    .filter(a => a.reportId === reportId)
    .map(a => ({
      ...a,
      user: getUserById(a.userId),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getEvidenceByReportId(reportId: number): Evidence[] {
  return mockEvidence
    .filter(e => e.reportId === reportId)
    .map(e => ({
      ...e,
      uploadedByUser: getUserById(e.uploadedBy),
    }));
}

export function getHistoryNodesByReportId(reportId: number): HistoryNode[] {
  return mockHistoryNodes
    .filter(h => h.reportId === reportId)
    .map(h => ({
      ...h,
      user: h.userId ? getUserById(h.userId) : undefined,
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export interface SummaryStats {
  totalReports: number;
  pendingReports: number;
  blockedReports: number;
  approvedReports: number;
  totalLossAmount: number;
  totalTransferQuantity: number;
  totalDestructionQuantity: number;
}

export function getSummaryStats(): SummaryStats {
  const approvedDestructions = mockDestructionRequests.filter(d => d.status === "approved");
  const totalLossAmount = approvedDestructions.reduce((sum, d) => sum + (parseFloat(d.lossAmount || "0")), 0);
  const approvedTransfers = mockTransferRequests.filter(t => t.status === "approved");
  const totalTransferQuantity = approvedTransfers.reduce((sum, t) => sum + t.quantity, 0);
  const totalDestructionQuantity = approvedDestructions.reduce((sum, d) => sum + d.quantity, 0);

  return {
    totalReports: mockExpiryReports.length,
    pendingReports: mockExpiryReports.filter(r => r.status === "pending").length,
    blockedReports: mockExpiryReports.filter(r => r.status === "blocked").length,
    approvedReports: mockExpiryReports.filter(r => r.status === "approved").length,
    totalLossAmount,
    totalTransferQuantity,
    totalDestructionQuantity,
  };
}

export interface StoreSummary {
  storeId: number;
  storeName: string;
  storeCode: string;
  reportCount: number;
  transferQuantity: number;
  destructionQuantity: number;
  lossAmount: number;
}

export function getStoreSummaries(): StoreSummary[] {
  return mockStores.map(store => {
    const storeReports = mockExpiryReports.filter(r => r.storeId === store.id);
    const storeDestructions = mockDestructionRequests.filter(d => d.storeId === store.id && d.status === "approved");
    const storeTransfers = mockTransferRequests.filter(t => t.sourceStoreId === store.id && t.status === "approved");

    return {
      storeId: store.id,
      storeName: store.name,
      storeCode: store.code,
      reportCount: storeReports.length,
      transferQuantity: storeTransfers.reduce((sum, t) => sum + t.quantity, 0),
      destructionQuantity: storeDestructions.reduce((sum, d) => sum + d.quantity, 0),
      lossAmount: storeDestructions.reduce((sum, d) => sum + (parseFloat(d.lossAmount || "0")), 0),
    };
  });
}

export interface CategorySummary {
  category: string;
  reportCount: number;
  transferQuantity: number;
  destructionQuantity: number;
  lossAmount: number;
}

export function getCategorySummaries(): CategorySummary[] {
  const categories = ["antibiotics", "cardiovascular", "gastrointestinal", "nervous_system", "respiratory", "vitamins", "other"];

  return categories.map(category => {
    const categoryMedicines = mockMedicines.filter(m => m.category === category);
    const categoryBatches = mockBatches.filter(b => categoryMedicines.some(m => m.id === b.medicineId));
    const categoryReports = mockExpiryReports.filter(r => categoryBatches.some(b => b.id === r.batchId));
    const categoryTransfers = mockTransferRequests.filter(t => t.status === "approved" && categoryReports.some(r => r.id === t.reportId));
    const categoryDestructions = mockDestructionRequests.filter(d => d.status === "approved" && categoryReports.some(r => r.id === d.reportId));

    return {
      category,
      reportCount: categoryReports.length,
      transferQuantity: categoryTransfers.reduce((sum, t) => sum + t.quantity, 0),
      destructionQuantity: categoryDestructions.reduce((sum, d) => sum + d.quantity, 0),
      lossAmount: categoryDestructions.reduce((sum, d) => sum + (parseFloat(d.lossAmount || "0")), 0),
    };
  }).filter(c => c.reportCount > 0 || c.transferQuantity > 0 || c.destructionQuantity > 0);
}

export interface DisposalSummary {
  disposalType: string;
  reportCount: number;
  quantity: number;
  lossAmount: number;
}

export function getDisposalSummaries(): DisposalSummary[] {
  return [
    {
      disposalType: "transfer",
      reportCount: mockExpiryReports.filter(r => r.disposalType === "transfer").length,
      quantity: mockTransferRequests.filter(t => t.status === "approved").reduce((sum, t) => sum + t.quantity, 0),
      lossAmount: 0,
    },
    {
      disposalType: "destruction",
      reportCount: mockExpiryReports.filter(r => r.disposalType === "destruction").length,
      quantity: mockDestructionRequests.filter(d => d.status === "approved").reduce((sum, d) => sum + d.quantity, 0),
      lossAmount: mockDestructionRequests.filter(d => d.status === "approved").reduce((sum, d) => sum + (parseFloat(d.lossAmount || "0")), 0),
    },
  ];
}
