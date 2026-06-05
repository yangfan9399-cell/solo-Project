import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "pharmacy-data.json");

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
}

export interface PharmacyData {
  stores: Store[];
  users: User[];
  medicines: Medicine[];
  medicineBatches: MedicineBatch[];
  inventory: Inventory[];
  expiryReports: ExpiryReport[];
  transferRequests: TransferRequest[];
  destructionRequests: DestructionRequest[];
  auditLogs: AuditLog[];
  evidence: Evidence[];
  historyNodes: HistoryNode[];
}

const initialData: PharmacyData = {
  stores: [
    { id: 1, name: "朝阳大药房总店", code: "CY-001", address: "北京市朝阳区建国路88号", region: "华北区", manager: "张经理", phone: "13800138001", createdAt: "2026-01-01T00:00:00Z" },
    { id: 2, name: "朝阳大药房海淀分店", code: "CY-002", address: "北京市海淀区中关村大街1号", region: "华北区", manager: "李店长", phone: "13800138002", createdAt: "2026-01-01T00:00:00Z" },
    { id: 3, name: "朝阳大药房西城分店", code: "CY-003", address: "北京市西城区金融街15号", region: "华北区", manager: "王店长", phone: "13800138003", createdAt: "2026-01-01T00:00:00Z" },
    { id: 4, name: "朝阳大药房东城分店", code: "CY-004", address: "北京市东城区王府井大街20号", region: "华北区", manager: "赵店长", phone: "13800138004", createdAt: "2026-01-01T00:00:00Z" },
    { id: 5, name: "朝阳大药房丰台分店", code: "CY-005", address: "北京市丰台区南三环西路5号", region: "华北区", manager: "刘店长", phone: "13800138005", createdAt: "2026-01-01T00:00:00Z" },
  ],
  users: [
    { id: 1, name: "总店经办人", username: "clerk_cy001", role: "store_clerk", storeId: 1, region: "华北区" },
    { id: 2, name: "海淀经办人", username: "clerk_cy002", role: "store_clerk", storeId: 2, region: "华北区" },
    { id: 3, name: "西城经办人", username: "clerk_cy003", role: "store_clerk", storeId: 3, region: "华北区" },
    { id: 4, name: "区域药师王", username: "pharmacist_wang", role: "regional_pharmacist", region: "华北区" },
    { id: 5, name: "财务张", username: "finance_zhang", role: "finance", region: "华北区" },
    { id: 6, name: "管理员", username: "admin", role: "admin", region: "华北区" },
  ],
  medicines: [
    { id: 1, name: "阿莫西林胶囊", genericName: "Amoxicillin Capsules", specification: "0.25g*24粒", manufacturer: "华北制药股份有限公司", category: "antibiotics", unit: "盒", price: "15.80" },
    { id: 2, name: "硝苯地平缓释片", genericName: "Nifedipine Sustained Release Tablets", specification: "10mg*30片", manufacturer: "拜耳医药保健有限公司", category: "cardiovascular", unit: "盒", price: "28.50" },
    { id: 3, name: "奥美拉唑肠溶胶囊", genericName: "Omeprazole Enteric-coated Capsules", specification: "20mg*14粒", manufacturer: "阿斯利康制药有限公司", category: "gastrointestinal", unit: "盒", price: "45.00" },
    { id: 4, name: "布洛芬缓释胶囊", genericName: "Ibuprofen Sustained Release Capsules", specification: "0.3g*20粒", manufacturer: "中美天津史克制药有限公司", category: "nervous_system", unit: "盒", price: "22.00" },
    { id: 5, name: "维生素C片", genericName: "Vitamin C Tablets", specification: "100mg*100片", manufacturer: "东北制药集团股份有限公司", category: "vitamins", unit: "瓶", price: "8.50" },
  ],
  medicineBatches: [
    { id: 1, medicineId: 1, batchNumber: "AMX202601001", productionDate: "2026-01-15", expiryDate: "2026-07-15" },
    { id: 2, medicineId: 1, batchNumber: "AMX202602002", productionDate: "2026-02-20", expiryDate: "2026-08-20" },
    { id: 3, medicineId: 2, batchNumber: "NFD202512005", productionDate: "2025-12-10", expiryDate: "2026-06-10" },
    { id: 4, medicineId: 3, batchNumber: "OME202511008", productionDate: "2025-11-05", expiryDate: "2026-06-05" },
    { id: 5, medicineId: 4, batchNumber: "IBU202601015", productionDate: "2026-01-20", expiryDate: "2026-07-20" },
    { id: 6, medicineId: 5, batchNumber: "VTC202510020", productionDate: "2025-10-15", expiryDate: "2026-06-15" },
    { id: 7, medicineId: 2, batchNumber: "NFD202512006", productionDate: "2025-12-12", expiryDate: "2026-06-12" },
  ],
  inventory: [
    { id: 1, storeId: 1, batchId: 1, quantity: 50, lastCountedBy: 1 },
    { id: 2, storeId: 2, batchId: 1, quantity: 0, lastCountedBy: 2 },
    { id: 3, storeId: 3, batchId: 1, quantity: 100, lastCountedBy: 3 },
    { id: 4, storeId: 1, batchId: 2, quantity: 80, lastCountedBy: 1 },
    { id: 5, storeId: 2, batchId: 3, quantity: 45, lastCountedBy: 2 },
    { id: 6, storeId: 3, batchId: 4, quantity: 30, lastCountedBy: 3 },
    { id: 7, storeId: 1, batchId: 5, quantity: 120, lastCountedBy: 1 },
    { id: 8, storeId: 2, batchId: 6, quantity: 200, lastCountedBy: 2 },
  ],
  expiryReports: [
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
  ],
  transferRequests: [
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
  ],
  destructionRequests: [
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
  ],
  auditLogs: [
    { id: 1, reportId: 1, userId: 1, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-01T09:00:00Z" },
    { id: 2, reportId: 1, userId: 1, action: "suggest_transfer", previousStatus: "pending", newStatus: "pending", notes: "建议调拨至海淀分店", createdAt: "2026-06-01T09:05:00Z" },
    { id: 3, reportId: 2, userId: 2, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-02T10:30:00Z" },
    { id: 4, reportId: 2, userId: 4, action: "detect_mismatch", previousStatus: "pending", newStatus: "blocked", notes: "检测到批号不一致，阻断流程", createdAt: "2026-06-02T14:00:00Z" },
    { id: 5, reportId: 3, userId: 3, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-03T11:00:00Z" },
    { id: 6, reportId: 3, userId: 3, action: "request_destruction", previousStatus: "pending", newStatus: "pending", notes: "申请销毁", createdAt: "2026-06-03T11:10:00Z" },
    { id: 7, reportId: 4, userId: 1, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报", createdAt: "2026-06-04T15:00:00Z" },
  ],
  evidence: [
    { id: 1, reportId: 1, uploadedBy: 1, fileName: "transfer_evidence.jpg", fileUrl: "https://example.com/evidence/transfer1.jpg", fileType: "image/jpeg", description: "库存照片", createdAt: "2026-06-01T09:10:00Z" },
    { id: 2, reportId: 2, uploadedBy: 2, fileName: "batch_mismatch.pdf", fileUrl: "https://example.com/evidence/batch_mismatch.pdf", fileType: "application/pdf", description: "批号不一致盘点报告", createdAt: "2026-06-02T14:05:00Z" },
    { id: 3, reportId: 3, uploadedBy: 3, fileName: "expired_meds.jpg", fileUrl: "https://example.com/evidence/expired_meds.jpg", fileType: "image/jpeg", description: "过期药品照片", createdAt: "2026-06-03T11:15:00Z" },
  ],
  historyNodes: [
    { id: 1, reportId: 1, nodeType: "report", title: "门店上报", description: "总店经办人上报阿莫西林胶囊近效期情况", userId: 1, quantityChange: 50, createdAt: "2026-06-01T09:00:00Z" },
    { id: 2, reportId: 1, nodeType: "suggest_transfer", title: "调拨建议", description: "系统建议调拨至海淀分店（该店库存为0）", userId: 1, createdAt: "2026-06-01T09:05:00Z" },
    { id: 3, reportId: 2, nodeType: "report", title: "门店上报", description: "海淀分店经办人上报硝苯地平缓释片", userId: 2, quantityChange: 45, createdAt: "2026-06-02T10:30:00Z" },
    { id: 4, reportId: 2, nodeType: "blocked", title: "批号不一致阻断", description: "检测到实际批号与系统记录批号不一致，流程已阻断，请重新盘点", userId: 4, createdAt: "2026-06-02T14:00:00Z" },
    { id: 5, reportId: 3, nodeType: "report", title: "门店上报", description: "西城分店经办人上报奥美拉唑肠溶胶囊", userId: 3, quantityChange: 30, createdAt: "2026-06-03T11:00:00Z" },
    { id: 6, reportId: 3, nodeType: "request_destruction", title: "销毁申请", description: "申请销毁过期药品", userId: 3, createdAt: "2026-06-03T11:10:00Z" },
    { id: 7, reportId: 4, nodeType: "report", title: "门店上报", description: "总店上报维生素C片", userId: 1, quantityChange: 50, createdAt: "2026-06-04T15:00:00Z" },
    { id: 8, reportId: 4, nodeType: "conflict", title: "责任门店冲突", description: "该批次药品责任门店归属存在争议", userId: 4, createdAt: "2026-06-04T15:30:00Z" },
  ],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadData(): PharmacyData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return initialData;
  }
}

function saveData(data: PharmacyData) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getData(): Promise<PharmacyData> {
  return loadData();
}

export async function saveExpiryReport(report: Omit<ExpiryReport, "id" | "createdAt" | "updatedAt">): Promise<ExpiryReport> {
  const data = loadData();
  const newId = Math.max(...data.expiryReports.map((r) => r.id), 0) + 1;
  const now = new Date().toISOString();
  const newReport: ExpiryReport = {
    ...report,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };
  data.expiryReports.push(newReport);
  saveData(data);
  return newReport;
}

export async function updateExpiryReport(id: number, updates: Partial<ExpiryReport>): Promise<ExpiryReport | null> {
  const data = loadData();
  const index = data.expiryReports.findIndex((r) => r.id === id);
  if (index === -1) return null;
  data.expiryReports[index] = {
    ...data.expiryReports[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  return data.expiryReports[index];
}

export async function saveHistoryNode(node: Omit<HistoryNode, "id" | "createdAt">): Promise<HistoryNode> {
  const data = loadData();
  const newId = Math.max(...data.historyNodes.map((n) => n.id), 0) + 1;
  const newNode: HistoryNode = {
    ...node,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  data.historyNodes.push(newNode);
  saveData(data);
  return newNode;
}

export async function saveAuditLog(log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
  const data = loadData();
  const newId = Math.max(...data.auditLogs.map((l) => l.id), 0) + 1;
  const newLog: AuditLog = {
    ...log,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  data.auditLogs.push(newLog);
  saveData(data);
  return newLog;
}

export async function saveTransferRequest(request: Omit<TransferRequest, "id">): Promise<TransferRequest> {
  const data = loadData();
  const newId = Math.max(...data.transferRequests.map((r) => r.id), 0) + 1;
  const newRequest: TransferRequest = {
    ...request,
    id: newId,
  };
  data.transferRequests.push(newRequest);
  saveData(data);
  return newRequest;
}

export async function updateTransferRequest(id: number, updates: Partial<TransferRequest>): Promise<TransferRequest | null> {
  const data = loadData();
  const index = data.transferRequests.findIndex((r) => r.id === id);
  if (index === -1) return null;
  data.transferRequests[index] = {
    ...data.transferRequests[index],
    ...updates,
  };
  saveData(data);
  return data.transferRequests[index];
}

export async function saveDestructionRequest(request: Omit<DestructionRequest, "id">): Promise<DestructionRequest> {
  const data = loadData();
  const newId = Math.max(...data.destructionRequests.map((r) => r.id), 0) + 1;
  const newRequest: DestructionRequest = {
    ...request,
    id: newId,
  };
  data.destructionRequests.push(newRequest);
  saveData(data);
  return newRequest;
}

export async function updateDestructionRequest(id: number, updates: Partial<DestructionRequest>): Promise<DestructionRequest | null> {
  const data = loadData();
  const index = data.destructionRequests.findIndex((r) => r.id === id);
  if (index === -1) return null;
  data.destructionRequests[index] = {
    ...data.destructionRequests[index],
    ...updates,
  };
  saveData(data);
  return data.destructionRequests[index];
}

export function getNextReportNumber(): string {
  const data = loadData();
  const year = new Date().getFullYear();
  const num = data.expiryReports.length + 1;
  return `EXP-${year}-${String(num).padStart(5, "0")}`;
}

export function getStoreById(data: PharmacyData, id: number) {
  return data.stores.find((s) => s.id === id);
}

export function getUserById(data: PharmacyData, id: number) {
  return data.users.find((u) => u.id === id);
}

export function getMedicineById(data: PharmacyData, id: number) {
  return data.medicines.find((m) => m.id === id);
}

export function getBatchById(data: PharmacyData, id: number) {
  const batch = data.medicineBatches.find((b) => b.id === id);
  if (batch) {
    return { ...batch, medicine: getMedicineById(data, batch.medicineId) };
  }
  return undefined;
}
