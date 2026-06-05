import { db } from "./index";
import { stores, users, medicines, medicineBatches, inventory, expiryReports, transferRequests, destructionRequests, auditLogs, evidence, historyNodes } from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("开始播种数据库...");

  await db.delete(historyNodes);
  await db.delete(auditLogs);
  await db.delete(evidence);
  await db.delete(destructionRequests);
  await db.delete(transferRequests);
  await db.delete(expiryReports);
  await db.delete(inventory);
  await db.delete(medicineBatches);
  await db.delete(medicines);
  await db.delete(users);
  await db.delete(stores);

  const insertedStores = await db.insert(stores).values([
    { name: "朝阳大药房总店", code: "CY-001", address: "北京市朝阳区建国路88号", region: "华北区", manager: "张经理", phone: "13800138001" },
    { name: "朝阳大药房海淀分店", code: "CY-002", address: "北京市海淀区中关村大街1号", region: "华北区", manager: "李店长", phone: "13800138002" },
    { name: "朝阳大药房西城分店", code: "CY-003", address: "北京市西城区金融街15号", region: "华北区", manager: "王店长", phone: "13800138003" },
    { name: "朝阳大药房东城分店", code: "CY-004", address: "北京市东城区王府井大街20号", region: "华北区", manager: "赵店长", phone: "13800138004" },
    { name: "朝阳大药房丰台分店", code: "CY-005", address: "北京市丰台区南三环西路5号", region: "华北区", manager: "刘店长", phone: "13800138005" },
  ]).returning();

  console.log("门店数据已插入");

  const insertedUsers = await db.insert(users).values([
    { name: "总店经办人", username: "clerk_cy001", password: "123456", role: "store_clerk", storeId: insertedStores[0].id, region: "华北区" },
    { name: "海淀经办人", username: "clerk_cy002", password: "123456", role: "store_clerk", storeId: insertedStores[1].id, region: "华北区" },
    { name: "西城经办人", username: "clerk_cy003", password: "123456", role: "store_clerk", storeId: insertedStores[2].id, region: "华北区" },
    { name: "区域药师王", username: "pharmacist_wang", password: "123456", role: "regional_pharmacist", region: "华北区" },
    { name: "财务张", username: "finance_zhang", password: "123456", role: "finance", region: "华北区" },
    { name: "管理员", username: "admin", password: "admin123", role: "admin", region: "华北区" },
  ]).returning();

  console.log("用户数据已插入");

  const insertedMedicines = await db.insert(medicines).values([
    { name: "阿莫西林胶囊", genericName: "Amoxicillin Capsules", specification: "0.25g*24粒", manufacturer: "华北制药股份有限公司", category: "antibiotics", unit: "盒", price: "15.80" },
    { name: "硝苯地平缓释片", genericName: "Nifedipine Sustained Release Tablets", specification: "10mg*30片", manufacturer: "拜耳医药保健有限公司", category: "cardiovascular", unit: "盒", price: "28.50" },
    { name: "奥美拉唑肠溶胶囊", genericName: "Omeprazole Enteric-coated Capsules", specification: "20mg*14粒", manufacturer: "阿斯利康制药有限公司", category: "gastrointestinal", unit: "盒", price: "45.00" },
    { name: "布洛芬缓释胶囊", genericName: "Ibuprofen Sustained Release Capsules", specification: "0.3g*20粒", manufacturer: "中美天津史克制药有限公司", category: "nervous_system", unit: "盒", price: "22.00" },
    { name: "维生素C片", genericName: "Vitamin C Tablets", specification: "100mg*100片", manufacturer: "东北制药集团股份有限公司", category: "vitamins", unit: "瓶", price: "8.50" },
  ]).returning();

  console.log("药品数据已插入");

  const insertedBatches = await db.insert(medicineBatches).values([
    { medicineId: insertedMedicines[0].id, batchNumber: "AMX202601001", productionDate: "2026-01-15", expiryDate: "2026-07-15" },
    { medicineId: insertedMedicines[0].id, batchNumber: "AMX202602002", productionDate: "2026-02-20", expiryDate: "2026-08-20" },
    { medicineId: insertedMedicines[1].id, batchNumber: "NFD202512005", productionDate: "2025-12-10", expiryDate: "2026-06-10" },
    { medicineId: insertedMedicines[2].id, batchNumber: "OME202511008", productionDate: "2025-11-05", expiryDate: "2026-06-05" },
    { medicineId: insertedMedicines[3].id, batchNumber: "IBU202601015", productionDate: "2026-01-20", expiryDate: "2026-07-20" },
    { medicineId: insertedMedicines[4].id, batchNumber: "VTC202510020", productionDate: "2025-10-15", expiryDate: "2026-06-15" },
  ]).returning();

  console.log("药品批次数据已插入");

  await db.insert(inventory).values([
    { storeId: insertedStores[0].id, batchId: insertedBatches[0].id, quantity: 50, lastCountedBy: insertedUsers[0].id },
    { storeId: insertedStores[1].id, batchId: insertedBatches[0].id, quantity: 0, lastCountedBy: insertedUsers[1].id },
    { storeId: insertedStores[2].id, batchId: insertedBatches[0].id, quantity: 100, lastCountedBy: insertedUsers[2].id },
    { storeId: insertedStores[0].id, batchId: insertedBatches[1].id, quantity: 80, lastCountedBy: insertedUsers[0].id },
    { storeId: insertedStores[1].id, batchId: insertedBatches[2].id, quantity: 45, lastCountedBy: insertedUsers[1].id },
    { storeId: insertedStores[2].id, batchId: insertedBatches[3].id, quantity: 30, lastCountedBy: insertedUsers[2].id },
    { storeId: insertedStores[0].id, batchId: insertedBatches[4].id, quantity: 120, lastCountedBy: insertedUsers[0].id },
    { storeId: insertedStores[1].id, batchId: insertedBatches[5].id, quantity: 200, lastCountedBy: insertedUsers[1].id },
  ]);

  console.log("库存数据已插入");

  const insertedReports = await db.insert(expiryReports).values([
    {
      reportNumber: "EXP-2026-00001",
      storeId: insertedStores[0].id,
      reportedBy: insertedUsers[0].id,
      batchId: insertedBatches[0].id,
      reportedQuantity: 50,
      inventoryQuantity: 50,
      notes: "阿莫西林胶囊即将过期，建议调拨至海淀分店（库存为0）",
      conflictType: "none",
      status: "pending",
      disposalType: "transfer",
      suggestedTransferStoreId: insertedStores[1].id,
    },
    {
      reportNumber: "EXP-2026-00002",
      storeId: insertedStores[1].id,
      reportedBy: insertedUsers[1].id,
      batchId: insertedBatches[2].id,
      reportedQuantity: 45,
      inventoryQuantity: 38,
      notes: "盘点发现库存数量与系统记录不一致",
      conflictType: "batch_mismatch",
      conflictNotes: "上报批号为 NFD202512005，但实际盘点发现部分药品批号为 NFD202512006，批号不一致",
      status: "blocked",
      disposalType: "none",
    },
    {
      reportNumber: "EXP-2026-00003",
      storeId: insertedStores[2].id,
      reportedBy: insertedUsers[2].id,
      batchId: insertedBatches[3].id,
      reportedQuantity: 30,
      inventoryQuantity: 30,
      notes: "奥美拉唑肠溶胶囊即将过期，销毁申请数量超过月度限额",
      conflictType: "quantity_exceeded",
      conflictNotes: "月度销毁限额为20盒，申请销毁30盒，超出限额10盒",
      status: "pending",
      disposalType: "destruction",
    },
    {
      reportNumber: "EXP-2026-00004",
      storeId: insertedStores[0].id,
      reportedBy: insertedUsers[0].id,
      batchId: insertedBatches[5].id,
      reportedQuantity: 50,
      inventoryQuantity: 50,
      notes: "维生素C片责任门店归属存在争议",
      conflictType: "store_conflict",
      conflictNotes: "该批次药品由总店调拨至海淀分店，但调拨手续未完成，责任门店不明确",
      status: "pending",
      disposalType: "none",
    },
  ]).returning();

  console.log("上报数据已插入");

  const insertedTransfers = await db.insert(transferRequests).values([
    {
      reportId: insertedReports[0].id,
      sourceStoreId: insertedStores[0].id,
      targetStoreId: insertedStores[1].id,
      quantity: 50,
      status: "pending",
      notes: "海淀分店该药品库存为0，有患者需求",
      evidenceUrls: ["https://example.com/evidence/transfer1.jpg"],
    },
  ]).returning();

  console.log("调拨申请数据已插入");

  const insertedDestructions = await db.insert(destructionRequests).values([
    {
      reportId: insertedReports[2].id,
      storeId: insertedStores[2].id,
      quantity: 30,
      maxAllowedQuantity: 20,
      status: "pending",
      lossAmount: "1350.00",
      notes: "药品已过期无法使用",
      evidenceUrls: ["https://example.com/evidence/destruction1.jpg"],
    },
  ]).returning();

  console.log("销毁申请数据已插入");

  await db.insert(auditLogs).values([
    { reportId: insertedReports[0].id, userId: insertedUsers[0].id, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报" },
    { reportId: insertedReports[0].id, userId: insertedUsers[0].id, action: "suggest_transfer", previousStatus: "pending", newStatus: "pending", notes: "建议调拨至海淀分店" },
    { reportId: insertedReports[1].id, userId: insertedUsers[1].id, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报" },
    { reportId: insertedReports[1].id, userId: insertedUsers[3].id, action: "detect_mismatch", previousStatus: "pending", newStatus: "blocked", notes: "检测到批号不一致，阻断流程" },
    { reportId: insertedReports[2].id, userId: insertedUsers[2].id, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报" },
    { reportId: insertedReports[2].id, userId: insertedUsers[2].id, action: "request_destruction", previousStatus: "pending", newStatus: "pending", notes: "申请销毁" },
    { reportId: insertedReports[3].id, userId: insertedUsers[0].id, action: "create_report", newStatus: "pending", notes: "创建近效期药品上报" },
  ]);

  console.log("审核日志数据已插入");

  await db.insert(evidence).values([
    { reportId: insertedReports[0].id, uploadedBy: insertedUsers[0].id, fileName: "transfer_evidence.jpg", fileUrl: "https://example.com/evidence/transfer1.jpg", fileType: "image/jpeg", description: "库存照片" },
    { reportId: insertedReports[1].id, uploadedBy: insertedUsers[1].id, fileName: "batch_mismatch.pdf", fileUrl: "https://example.com/evidence/batch_mismatch.pdf", fileType: "application/pdf", description: "批号不一致盘点报告" },
    { reportId: insertedReports[2].id, uploadedBy: insertedUsers[2].id, fileName: "expired_meds.jpg", fileUrl: "https://example.com/evidence/expired_meds.jpg", fileType: "image/jpeg", description: "过期药品照片" },
  ]);

  console.log("证据数据已插入");

  await db.insert(historyNodes).values([
    { reportId: insertedReports[0].id, nodeType: "report", title: "门店上报", description: "总店经办人上报阿莫西林胶囊近效期情况", userId: insertedUsers[0].id, quantityChange: 50 },
    { reportId: insertedReports[0].id, nodeType: "suggest_transfer", title: "调拨建议", description: "系统建议调拨至海淀分店（该店库存为0）", userId: insertedUsers[0].id },
    { reportId: insertedReports[1].id, nodeType: "report", title: "门店上报", description: "海淀分店经办人上报硝苯地平缓释片", userId: insertedUsers[1].id, quantityChange: 45 },
    { reportId: insertedReports[1].id, nodeType: "blocked", title: "批号不一致阻断", description: "检测到实际批号与系统记录批号不一致，流程已阻断，请重新盘点", userId: insertedUsers[3].id },
    { reportId: insertedReports[2].id, nodeType: "report", title: "门店上报", description: "西城分店经办人上报奥美拉唑肠溶胶囊", userId: insertedUsers[2].id, quantityChange: 30 },
    { reportId: insertedReports[2].id, nodeType: "request_destruction", title: "销毁申请", description: "申请销毁过期药品", userId: insertedUsers[2].id },
    { reportId: insertedReports[3].id, nodeType: "report", title: "门店上报", description: "总店上报维生素C片", userId: insertedUsers[0].id, quantityChange: 50 },
    { reportId: insertedReports[3].id, nodeType: "conflict", title: "责任门店冲突", description: "该批次药品责任门店归属存在争议", userId: insertedUsers[3].id },
  ]);

  console.log("历史节点数据已插入");
  console.log("数据库播种完成！");
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}
