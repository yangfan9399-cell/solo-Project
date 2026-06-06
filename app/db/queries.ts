import initSqlJs, { Database } from "sql.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type {
  User,
  Reagent,
  Requisition,
  Return,
  OperationLog,
  NewUser,
  NewReagent,
  NewRequisition,
  NewReturn,
  NewOperationLog,
  RequisitionStatus,
} from "./schema";

let dbInstance: Database | null = null;
const dbPath = join(process.cwd(), "app.db");

async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: (file: string) =>
      join(process.cwd(), "node_modules/sql.js/dist", file),
  });

  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run("PRAGMA journal_mode = WAL;");
  dbInstance.run("PRAGMA foreign_keys = ON;");

  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapRow<T>(row: any[], columns: string[]): T {
  const obj: Record<string, any> = {};
  columns.forEach((col, i) => {
    const camelKey = snakeToCamel(col);
    obj[camelKey] = row[i];
  });
  return obj as T;
}

function mapRows<T>(results: { columns: string[]; values: any[][] }): T[] {
  if (!results || !results.values) return [];
  return results.values.map((row) => mapRow<T>(row, results.columns));
}

export async function initDatabase() {
  const db = await getDb();

  const schemaSql = readFileSync(
    join(process.cwd(), "drizzle/0000_cloudy_dreadnoughts.sql"),
    "utf-8"
  );

  const statements = schemaSql
    .split("--> statement-breakpoint")
    .filter((s) => s.trim());

  for (const stmt of statements) {
    try {
      db.run(stmt.trim());
    } catch (e) {
      if (e instanceof Error && !e.message.includes("already exists")) {
        console.warn("Warning executing statement:", e.message);
      }
    }
  }

  saveDb();
  console.log("Database schema initialized successfully!");
}

export async function getAllReagents(): Promise<Reagent[]> {
  const db = await getDb();
  const results = db.exec(
    "SELECT * FROM reagents ORDER BY reagent_code ASC"
  );
  return mapRows<Reagent>(results[0] || { columns: [], values: [] });
}

export async function getReagentById(id: number): Promise<Reagent | undefined> {
  const db = await getDb();
  const results = db.exec("SELECT * FROM reagents WHERE id = ?", [id]);
  const rows = mapRows<Reagent>(results[0] || { columns: [], values: [] });
  return rows[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  const results = db.exec("SELECT * FROM users WHERE id = ?", [id]);
  const rows = mapRows<User>(results[0] || { columns: [], values: [] });
  return rows[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  const results = db.exec("SELECT * FROM users WHERE email = ?", [email]);
  const rows = mapRows<User>(results[0] || { columns: [], values: [] });
  return rows[0];
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  const results = db.exec("SELECT * FROM users ORDER BY id ASC");
  return mapRows<User>(results[0] || { columns: [], values: [] });
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const db = await getDb();
  const results = db.exec("SELECT * FROM users WHERE role = ? ORDER BY id ASC", [
    role,
  ]);
  return mapRows<User>(results[0] || { columns: [], values: [] });
}

export async function getUsersByMinPermissionLevel(
  level: number
): Promise<User[]> {
  const db = await getDb();
  const results = db.exec(
    "SELECT * FROM users WHERE permission_level >= ? ORDER BY permission_level ASC",
    [level]
  );
  return mapRows<User>(results[0] || { columns: [], values: [] });
}

export async function getUsersByRoleAndLevel(
  role: string,
  minLevel: number
): Promise<User[]> {
  const db = await getDb();
  const results = db.exec(
    "SELECT * FROM users WHERE role = ? AND permission_level >= ? ORDER BY permission_level ASC",
    [role, minLevel]
  );
  return mapRows<User>(results[0] || { columns: [], values: [] });
}

export async function createRequisition(
  data: NewRequisition
): Promise<Requisition> {
  const db = await getDb();
  const now = Date.now();

  const result = db.exec(
    `INSERT INTO requisitions (
      requisition_no, reagent_id, requester_id, purpose, quantity,
      expected_return_date, status, lab_admin_id, lab_admin_comment,
      safety_officer_id, safety_officer_comment, escalated_to_id,
      picked_up_at, returned_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *`,
    [
      data.requisitionNo,
      data.reagentId,
      data.requesterId,
      data.purpose,
      data.quantity,
      new Date(data.expectedReturnDate).getTime(),
      data.status || "pending",
      data.labAdminId ?? null,
      data.labAdminComment ?? null,
      data.safetyOfficerId ?? null,
      data.safetyOfficerComment ?? null,
      data.escalatedToId ?? null,
      data.pickedUpAt ? new Date(data.pickedUpAt).getTime() : null,
      data.returnedAt ? new Date(data.returnedAt).getTime() : null,
      now,
      now,
    ]
  );

  const rows = mapRows<Requisition>(
    result[0] || { columns: [], values: [] }
  );
  saveDb();
  return rows[0];
}

export async function updateRequisitionStatus(
  id: number,
  status: RequisitionStatus,
  data: Partial<Omit<Requisition, "id" | "createdAt">>
): Promise<Requisition | undefined> {
  const db = await getDb();
  const now = Date.now();

  const fields: string[] = ["status = ?", "updated_at = ?"];
  const values: any[] = [status, now];

  if (data.labAdminId !== undefined) {
    fields.push("lab_admin_id = ?");
    values.push(data.labAdminId);
  }
  if (data.labAdminComment !== undefined) {
    fields.push("lab_admin_comment = ?");
    values.push(data.labAdminComment);
  }
  if (data.safetyOfficerId !== undefined) {
    fields.push("safety_officer_id = ?");
    values.push(data.safetyOfficerId);
  }
  if (data.safetyOfficerComment !== undefined) {
    fields.push("safety_officer_comment = ?");
    values.push(data.safetyOfficerComment);
  }
  if (data.escalatedToId !== undefined) {
    fields.push("escalated_to_id = ?");
    values.push(data.escalatedToId);
  }
  if (data.pickedUpAt !== undefined) {
    fields.push("picked_up_at = ?");
    values.push(data.pickedUpAt ? new Date(data.pickedUpAt).getTime() : null);
  }
  if (data.returnedAt !== undefined) {
    fields.push("returned_at = ?");
    values.push(data.returnedAt ? new Date(data.returnedAt).getTime() : null);
  }

  values.push(id);

  const result = db.exec(
    `UPDATE requisitions SET ${fields.join(", ")} WHERE id = ? RETURNING *`,
    values
  );

  const rows = mapRows<Requisition>(
    result[0] || { columns: [], values: [] }
  );
  saveDb();
  return rows[0];
}

export async function getRequisitionById(
  id: number
): Promise<Requisition | undefined> {
  const db = await getDb();
  const results = db.exec("SELECT * FROM requisitions WHERE id = ?", [id]);
  const rows = mapRows<Requisition>(
    results[0] || { columns: [], values: [] }
  );
  return rows[0];
}

export async function getRequisitionWithDetails(id: number) {
  const req = await getRequisitionById(id);
  if (!req) return null;

  const reagent = await getReagentById(req.reagentId);
  const requester = await getUserById(req.requesterId);
  const labAdmin = req.labAdminId ? await getUserById(req.labAdminId) : null;
  const safetyOfficer = req.safetyOfficerId
    ? await getUserById(req.safetyOfficerId)
    : null;
  const escalatedTo = req.escalatedToId
    ? await getUserById(req.escalatedToId)
    : null;

  const returnRecords = await getReturnsByRequisitionId(id);
  const logs = await getOperationLogsByRequisition(id);

  return {
    requisition: req,
    reagent,
    requester,
    labAdmin,
    safetyOfficer,
    escalatedTo,
    returns: returnRecords,
    logs,
  };
}

export async function getRequisitionsByRequester(
  requesterId: number
): Promise<Requisition[]> {
  const db = await getDb();
  const results = db.exec(
    "SELECT * FROM requisitions WHERE requester_id = ? ORDER BY created_at DESC",
    [requesterId]
  );
  return mapRows<Requisition>(results[0] || { columns: [], values: [] });
}

export async function getRequisitionsByStatus(
  status: RequisitionStatus
): Promise<Requisition[]> {
  const db = await getDb();
  const results = db.exec(
    "SELECT * FROM requisitions WHERE status = ? ORDER BY created_at DESC",
    [status]
  );
  return mapRows<Requisition>(results[0] || { columns: [], values: [] });
}

export async function getPendingLabApprovals(): Promise<Requisition[]> {
  return getRequisitionsByStatus("pending");
}

export async function getPendingSafetyApprovals(): Promise<Requisition[]> {
  return getRequisitionsByStatus("lab_approved");
}

export async function getPendingEscalatedApprovals(
  userId: number
): Promise<Requisition[]> {
  const db = await getDb();
  const results = db.exec(
    "SELECT * FROM requisitions WHERE status = ? AND escalated_to_id = ? ORDER BY created_at ASC",
    ["escalated", userId]
  );
  return mapRows<Requisition>(results[0] || { columns: [], values: [] });
}

export async function getReturnableRequisitions(): Promise<Requisition[]> {
  return getRequisitionsByStatus("picked_up");
}

export async function createReturn(data: NewReturn): Promise<Return> {
  const db = await getDb();
  const now = Date.now();

  const result = db.exec(
    `INSERT INTO returns (requisition_id, returned_quantity, condition, verifier_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      data.requisitionId,
      data.returnedQuantity,
      data.condition,
      data.verifierId,
      data.notes ?? null,
      now,
    ]
  );

  const rows = mapRows<Return>(result[0] || { columns: [], values: [] });
  saveDb();
  return rows[0];
}

export async function getReturnsByRequisitionId(
  requisitionId: number
): Promise<any[]> {
  const db = await getDb();
  const results = db.exec(
    `SELECT ret.*, u.name as verifier_name
     FROM returns ret
     LEFT JOIN users u ON ret.verifier_id = u.id
     WHERE ret.requisition_id = ?
     ORDER BY ret.created_at DESC`,
    [requisitionId]
  );
  return mapRows(results[0] || { columns: [], values: [] });
}

export async function createOperationLog(
  data: NewOperationLog
): Promise<OperationLog> {
  const db = await getDb();
  const now = Date.now();

  const result = db.exec(
    `INSERT INTO operation_logs (requisition_id, reagent_id, user_id, action, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      data.requisitionId ?? null,
      data.reagentId ?? null,
      data.userId,
      data.action,
      data.details ?? null,
      now,
    ]
  );

  const rows = mapRows<OperationLog>(
    result[0] || { columns: [], values: [] }
  );
  saveDb();
  return rows[0];
}

export async function getOperationLogsByRequisition(
  requisitionId: number
): Promise<any[]> {
  const db = await getDb();
  const results = db.exec(
    `SELECT ol.id, ol.action, ol.details, ol.created_at, ol.user_id, u.name as user_name
     FROM operation_logs ol
     LEFT JOIN users u ON ol.user_id = u.id
     WHERE ol.requisition_id = ?
     ORDER BY ol.created_at DESC`,
    [requisitionId]
  );
  return mapRows(results[0] || { columns: [], values: [] });
}

export async function updateReagentRemainingQuantity(
  reagentId: number,
  quantityChange: number
): Promise<Reagent | undefined> {
  const db = await getDb();
  const reagent = await getReagentById(reagentId);
  if (!reagent) throw new Error("Reagent not found");

  const newQuantity = reagent.remainingQuantity + quantityChange;
  if (newQuantity < 0) throw new Error("Insufficient quantity");

  const result = db.exec(
    "UPDATE reagents SET remaining_quantity = ? WHERE id = ? RETURNING *",
    [newQuantity, reagentId]
  );

  const rows = mapRows<Reagent>(result[0] || { columns: [], values: [] });
  saveDb();
  return rows[0];
}

export async function getStatistics() {
  const db = await getDb();

  const totalReagentsResult = db.exec("SELECT COUNT(*) as count FROM reagents");
  const totalRequisitionsResult = db.exec(
    "SELECT COUNT(*) as count FROM requisitions"
  );
  const overdueCountResult = db.exec(
    "SELECT COUNT(*) as count FROM requisitions WHERE status = 'overdue'"
  );
  const pendingCountResult = db.exec(
    "SELECT COUNT(*) as count FROM requisitions WHERE status = 'pending'"
  );

  return {
    totalReagents: mapRows<{ count: number }>(
      totalReagentsResult[0] || { columns: [], values: [] }
    )[0]?.count || 0,
    totalRequisitions: mapRows<{ count: number }>(
      totalRequisitionsResult[0] || { columns: [], values: [] }
    )[0]?.count || 0,
    overdueCount: mapRows<{ count: number }>(
      overdueCountResult[0] || { columns: [], values: [] }
    )[0]?.count || 0,
    pendingCount: mapRows<{ count: number }>(
      pendingCountResult[0] || { columns: [], values: [] }
    )[0]?.count || 0,
  };
}

export async function getStatisticsByCollege() {
  const db = await getDb();
  const results = db.exec(
    `SELECT u.college, COUNT(*) as count
     FROM requisitions r
     LEFT JOIN users u ON r.requester_id = u.id
     GROUP BY u.college
     ORDER BY count DESC`
  );
  return mapRows<{ college: string; count: number }>(
    results[0] || { columns: [], values: [] }
  );
}

export async function getStatisticsByCategory() {
  const db = await getDb();
  const results = db.exec(
    `SELECT r.category, COUNT(*) as count, COALESCE(SUM(req.quantity), 0) as total_quantity
     FROM requisitions req
     LEFT JOIN reagents r ON req.reagent_id = r.id
     GROUP BY r.category
     ORDER BY count DESC`
  );
  const rows = mapRows<{ category: string; count: number; totalQuantity: number }>(
    results[0] || { columns: [], values: [] }
  );
  return rows;
}

export async function getOverdueStatistics() {
  const db = await getDb();
  const now = Date.now();

  const results = db.exec(
    `SELECT r.id, r.requisition_no, r.reagent_id, rg.name as reagent_name,
            r.requester_id, u.name as requester_name, u.college,
            r.expected_return_date, r.quantity
     FROM requisitions r
     LEFT JOIN reagents rg ON r.reagent_id = rg.id
     LEFT JOIN users u ON r.requester_id = u.id
     WHERE r.status = 'overdue' AND r.expected_return_date < ?
     ORDER BY r.expected_return_date ASC`,
    [now]
  );

  const rows = mapRows<{
    id: number;
    requisitionNo: string;
    reagentId: number;
    reagentName: string;
    requesterId: number;
    requesterName: string;
    college: string;
    expectedReturnDate: number;
    quantity: number;
  }>(results[0] || { columns: [], values: [] });

  return rows.map((r) => ({
    ...r,
    overdueDays: Math.floor(
      (now - (r.expectedReturnDate || 0)) / (1000 * 60 * 60 * 24)
    ),
  }));
}

export async function getOverdueStatisticsByCollege() {
  const db = await getDb();
  const now = Date.now();

  const results = db.exec(
    `SELECT u.college, COUNT(*) as overdue_count
     FROM requisitions r
     LEFT JOIN users u ON r.requester_id = u.id
     WHERE r.status = 'overdue' AND r.expected_return_date < ?
     GROUP BY u.college
     ORDER BY overdue_count DESC`,
    [now]
  );

  return mapRows<{ college: string; overdueCount: number }>(
    results[0] || { columns: [], values: [] }
  );
}

export async function getOverdueStatisticsByCategory() {
  const db = await getDb();
  const now = Date.now();

  const results = db.exec(
    `SELECT rg.category, COUNT(*) as overdue_count
     FROM requisitions r
     LEFT JOIN reagents rg ON r.reagent_id = rg.id
     WHERE r.status = 'overdue' AND r.expected_return_date < ?
     GROUP BY rg.category
     ORDER BY overdue_count DESC`,
    [now]
  );

  return mapRows<{ category: string; overdueCount: number }>(
    results[0] || { columns: [], values: [] }
  );
}

export async function getApprovalDurationStats() {
  const db = await getDb();

  const createResults = db.exec(
    `SELECT requisition_id, created_at 
     FROM operation_logs 
     WHERE action = 'create_requisition'`
  );
  const createLogs = mapRows<{ requisitionId: number; createdAt: number }>(
    createResults[0] || { columns: [], values: [] }
  );

  const approvalResults = db.exec(
    `SELECT requisition_id, MAX(created_at) as approved_at
     FROM operation_logs 
     WHERE action IN ('lab_approve', 'lab_reject', 'safety_approve', 'safety_reject')
     GROUP BY requisition_id`
  );
  const approvalLogs = mapRows<{ requisitionId: number; approvedAt: number }>(
    approvalResults[0] || { columns: [], values: [] }
  );

  const createMap = new Map(createLogs.map((l) => [l.requisitionId, l.createdAt]));
  const approvalMap = new Map(approvalLogs.map((l) => [l.requisitionId, l.approvedAt]));

  const durations: number[] = [];
  for (const [reqId, approvedAt] of approvalMap) {
    const createdAt = createMap.get(reqId);
    if (createdAt && approvedAt) {
      durations.push(approvedAt - createdAt);
    }
  }

  const avgMs = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : null;

  return {
    avgApprovalHours: avgMs !== null ? (avgMs / (1000 * 60 * 60)).toFixed(1) : "N/A",
    totalApproved: durations.length,
  };
}

export async function generateRequisitionNo(): Promise<string> {
  const db = await getDb();
  const now = new Date();
  const year = now.getFullYear();

  const result = db.exec("SELECT COUNT(*) as count FROM requisitions");
  const countVal = mapRows<{ count: number }>(
    result[0] || { columns: [], values: [] }
  )[0]?.count || 0;

  return `REQ-${year}-${String(countVal + 1).padStart(3, "0")}`;
}

export async function seedDatabase() {
  const db = await getDb();

  db.exec("DELETE FROM operation_logs");
  db.exec("DELETE FROM returns");
  db.exec("DELETE FROM requisitions");
  db.exec("DELETE FROM reagents");
  db.exec("DELETE FROM users");

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const usersData = [
    {
      id: 1,
      name: "张实验员",
      email: "zhang@lab.edu",
      role: "experimenter",
      permissionLevel: 1,
      college: "化学学院",
      department: "有机化学系",
    },
    {
      id: 2,
      name: "李研究员",
      email: "li@lab.edu",
      role: "experimenter",
      permissionLevel: 2,
      college: "化学学院",
      department: "分析化学系",
    },
    {
      id: 3,
      name: "王高级",
      email: "wang@lab.edu",
      role: "experimenter",
      permissionLevel: 3,
      college: "材料学院",
      department: "高分子材料系",
    },
    {
      id: 4,
      name: "陈管理员",
      email: "chen@lab.edu",
      role: "lab_admin",
      permissionLevel: 3,
      college: "化学学院",
      department: "实验中心",
    },
    {
      id: 5,
      name: "刘安全员",
      email: "liu@lab.edu",
      role: "safety_officer",
      permissionLevel: 4,
      college: "化学学院",
      department: "安全管理办公室",
    },
    {
      id: 6,
      name: "赵主任",
      email: "zhao@lab.edu",
      role: "safety_officer",
      permissionLevel: 5,
      college: "化学学院",
      department: "安全管理办公室",
    },
  ];

  for (const u of usersData) {
    db.run(
      `INSERT INTO users (id, name, email, role, permission_level, college, department, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.role, u.permissionLevel, u.college, u.department, now]
    );
  }

  const reagentsData = [
    {
      id: 1,
      reagentCode: "R-001",
      name: "乙醇",
      category: "有机溶剂",
      hazardLevel: "low",
      requiredPermissionLevel: 1,
      totalQuantity: 5000,
      remainingQuantity: 4500,
      unit: "mL",
      location: "A栋101室",
      manufacturer: "国药集团",
      description: "分析纯乙醇，95%浓度",
    },
    {
      id: 2,
      reagentCode: "R-002",
      name: "浓硫酸",
      category: "无机酸",
      hazardLevel: "high",
      requiredPermissionLevel: 3,
      totalQuantity: 2000,
      remainingQuantity: 1800,
      unit: "mL",
      location: "A栋203室保险柜",
      manufacturer: "西陇化工",
      description: "98%浓硫酸，强腐蚀性",
    },
    {
      id: 3,
      reagentCode: "R-003",
      name: "氰化钾",
      category: "剧毒化学品",
      hazardLevel: "extreme",
      requiredPermissionLevel: 4,
      totalQuantity: 100,
      remainingQuantity: 50,
      unit: "g",
      location: "B栋305室剧毒柜",
      manufacturer: "阿拉丁",
      description: "剧毒化学品，需双人双锁管理",
    },
    {
      id: 4,
      reagentCode: "R-004",
      name: "氢氧化钠",
      category: "无机碱",
      hazardLevel: "medium",
      requiredPermissionLevel: 2,
      totalQuantity: 5000,
      remainingQuantity: 50,
      unit: "g",
      location: "A栋102室",
      manufacturer: "国药集团",
      description: "粒状氢氧化钠，分析纯",
    },
    {
      id: 5,
      reagentCode: "R-005",
      name: "丙酮",
      category: "有机溶剂",
      hazardLevel: "medium",
      requiredPermissionLevel: 2,
      totalQuantity: 3000,
      remainingQuantity: 2200,
      unit: "mL",
      location: "A栋101室",
      manufacturer: "国药集团",
      description: "色谱纯丙酮",
    },
    {
      id: 6,
      reagentCode: "R-006",
      name: "硝酸银",
      category: "无机盐",
      hazardLevel: "high",
      requiredPermissionLevel: 3,
      totalQuantity: 500,
      remainingQuantity: 420,
      unit: "g",
      location: "B栋201室避光柜",
      manufacturer: "阿拉丁",
      description: "分析纯硝酸银，需避光保存",
    },
  ];

  for (const r of reagentsData) {
    db.run(
      `INSERT INTO reagents (id, reagent_code, name, category, hazard_level, required_permission_level, total_quantity, remaining_quantity, unit, location, manufacturer, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.reagentCode, r.name, r.category, r.hazardLevel, r.requiredPermissionLevel, r.totalQuantity, r.remainingQuantity, r.unit, r.location, r.manufacturer, r.description, now]
    );
  }

  const requisitionsData = [
    {
      id: 1,
      requisitionNo: "REQ-2024-001",
      reagentId: 1,
      requesterId: 1,
      purpose: "有机合成实验，作为反应溶剂使用",
      quantity: 500,
      expectedReturnDate: now + 7 * oneDay,
      status: "safety_approved",
      labAdminId: 4,
      labAdminComment: "库存充足，同意发放",
      safetyOfficerId: 5,
      safetyOfficerComment: "用途合理，同意审批",
      createdAt: now - 10 * oneDay,
      updatedAt: now - 9 * oneDay,
    },
    {
      id: 2,
      requisitionNo: "REQ-2024-002",
      reagentId: 2,
      requesterId: 1,
      purpose: "样品前处理，酸解反应",
      quantity: 100,
      expectedReturnDate: now + 5 * oneDay,
      status: "pending",
      createdAt: now - 1 * oneDay,
      updatedAt: now - 1 * oneDay,
    },
    {
      id: 3,
      requisitionNo: "REQ-2024-003",
      reagentId: 4,
      requesterId: 2,
      purpose: "pH调节实验",
      quantity: 1000,
      expectedReturnDate: now + 3 * oneDay,
      status: "lab_rejected",
      labAdminId: 4,
      labAdminComment: "库存不足，剩余仅50g，请减少用量或等待补货",
      createdAt: now - 5 * oneDay,
      updatedAt: now - 4 * oneDay,
    },
    {
      id: 4,
      requisitionNo: "REQ-2024-004",
      reagentId: 3,
      requesterId: 2,
      purpose: "金属离子络合滴定实验",
      quantity: 5,
      expectedReturnDate: now + 10 * oneDay,
      status: "pending",
      createdAt: now - 2 * oneDay,
      updatedAt: now - 2 * oneDay,
    },
    {
      id: 5,
      requisitionNo: "REQ-2024-005",
      reagentId: 5,
      requesterId: 1,
      purpose: "色谱分析，作为流动相",
      quantity: 800,
      expectedReturnDate: now - 3 * oneDay,
      status: "overdue",
      labAdminId: 4,
      labAdminComment: "库存充足",
      safetyOfficerId: 5,
      safetyOfficerComment: "同意",
      pickedUpAt: now - 15 * oneDay,
      createdAt: now - 20 * oneDay,
      updatedAt: now - 15 * oneDay,
    },
    {
      id: 6,
      requisitionNo: "REQ-2024-006",
      reagentId: 6,
      requesterId: 3,
      purpose: "卤素离子定量分析",
      quantity: 50,
      expectedReturnDate: now + 14 * oneDay,
      status: "picked_up",
      labAdminId: 4,
      labAdminComment: "库存充足，已核验",
      safetyOfficerId: 5,
      safetyOfficerComment: "同意领用",
      pickedUpAt: now - 2 * oneDay,
      createdAt: now - 7 * oneDay,
      updatedAt: now - 2 * oneDay,
    },
    {
      id: 7,
      requisitionNo: "REQ-2024-007",
      reagentId: 1,
      requesterId: 1,
      purpose: "产物重结晶",
      quantity: 200,
      expectedReturnDate: now + 2 * oneDay,
      status: "returned",
      labAdminId: 4,
      labAdminComment: "同意",
      safetyOfficerId: 5,
      safetyOfficerComment: "同意",
      pickedUpAt: now - 10 * oneDay,
      returnedAt: now - 1 * oneDay,
      createdAt: now - 14 * oneDay,
      updatedAt: now - 1 * oneDay,
    },
    {
      id: 8,
      requisitionNo: "REQ-2024-008",
      reagentId: 3,
      requesterId: 3,
      purpose: "剧毒试剂标准溶液配制",
      quantity: 10,
      expectedReturnDate: now + 7 * oneDay,
      status: "escalated",
      labAdminId: 4,
      labAdminComment: "库存充足，但申请人权限等级不足，需升级审批",
      escalatedToId: 6,
      createdAt: now - 1 * oneDay,
      updatedAt: now - 1 * oneDay,
    },
  ];

  for (const req of requisitionsData) {
    db.run(
      `INSERT INTO requisitions (id, requisition_no, reagent_id, requester_id, purpose, quantity, expected_return_date, status, lab_admin_id, lab_admin_comment, safety_officer_id, safety_officer_comment, escalated_to_id, picked_up_at, returned_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.id,
        req.requisitionNo,
        req.reagentId,
        req.requesterId,
        req.purpose,
        req.quantity,
        req.expectedReturnDate,
        req.status,
        req.labAdminId ?? null,
        req.labAdminComment ?? null,
        req.safetyOfficerId ?? null,
        req.safetyOfficerComment ?? null,
        req.escalatedToId ?? null,
        req.pickedUpAt ?? null,
        req.returnedAt ?? null,
        req.createdAt,
        req.updatedAt,
      ]
    );
  }

  db.run(
    `INSERT INTO returns (id, requisition_id, returned_quantity, condition, verifier_id, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [1, 7, 150, "good", 4, "剩余溶剂密封良好，无污染", now - 1 * oneDay]
  );

  const logsData = [
    { id: 1, requisitionId: 1, reagentId: 1, userId: 1, action: "create_requisition", details: "提交乙醇领用申请，数量500mL", createdAt: now - 10 * oneDay },
    { id: 2, requisitionId: 1, reagentId: 1, userId: 4, action: "lab_approve", details: "实验室管理员审批通过，核验库存", createdAt: now - 9.5 * oneDay },
    { id: 3, requisitionId: 1, reagentId: 1, userId: 5, action: "safety_approve", details: "安全员审批通过", createdAt: now - 9 * oneDay },
    { id: 4, requisitionId: 3, reagentId: 4, userId: 2, action: "create_requisition", details: "提交氢氧化钠领用申请，数量1000g", createdAt: now - 5 * oneDay },
    { id: 5, requisitionId: 3, reagentId: 4, userId: 4, action: "lab_reject", details: "拒绝：库存不足，剩余仅50g", createdAt: now - 4 * oneDay },
    { id: 6, requisitionId: 5, reagentId: 5, userId: 1, action: "create_requisition", details: "提交丙酮领用申请，数量800mL", createdAt: now - 20 * oneDay },
    { id: 7, requisitionId: 5, reagentId: 5, userId: 4, action: "lab_approve", details: "实验室管理员审批通过", createdAt: now - 18 * oneDay },
    { id: 8, requisitionId: 5, reagentId: 5, userId: 5, action: "safety_approve", details: "安全员审批通过", createdAt: now - 16 * oneDay },
    { id: 9, requisitionId: 5, reagentId: 5, userId: 4, action: "pick_up", details: "已领取，预计归还日期已过3天", createdAt: now - 15 * oneDay },
    { id: 10, requisitionId: 7, reagentId: 1, userId: 1, action: "return_reagent", details: "归还乙醇150mL，状态良好", createdAt: now - 1 * oneDay },
    { id: 11, requisitionId: 8, reagentId: 3, userId: 4, action: "escalate", details: "权限等级不足，升级至赵主任审批", createdAt: now - 1 * oneDay },
  ];

  for (const log of logsData) {
    db.run(
      `INSERT INTO operation_logs (id, requisition_id, reagent_id, user_id, action, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.requisitionId,
        log.reagentId,
        log.userId,
        log.action,
        log.details,
        log.createdAt,
      ]
    );
  }

  saveDb();
  console.log("Database seeded successfully!");
  console.log("- Users: 6");
  console.log("- Reagents: 6");
  console.log("- Requisitions: 8");
  console.log("- Returns: 1");
  console.log("- Operation Logs: 11");
}
