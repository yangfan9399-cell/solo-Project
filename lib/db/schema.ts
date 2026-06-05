import { pgTable, serial, varchar, timestamp, integer, text, boolean, date, decimal, jsonb, enum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = enum("role", ["store_clerk", "regional_pharmacist", "finance", "admin"]);
export const statusEnum = enum("status", ["pending", "approved", "rejected", "blocked", "archived"]);
export const disposalTypeEnum = enum("disposal_type", ["transfer", "destruction", "none"]);
export const categoryEnum = enum("category", ["antibiotics", "cardiovascular", "gastrointestinal", "nervous_system", "respiratory", "vitamins", "other"]);
export const conflictTypeEnum = enum("conflict_type", ["batch_mismatch", "quantity_exceeded", "store_conflict", "none"]);

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  address: text("address"),
  region: varchar("region", { length: 100 }),
  manager: varchar("manager", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  role: roleEnum("role").notNull(),
  storeId: integer("store_id").references(() => stores.id),
  region: varchar("region", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  genericName: varchar("generic_name", { length: 256 }),
  specification: varchar("specification", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 256 }),
  category: categoryEnum("category").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicineBatches = pgTable("medicine_batches", {
  id: serial("id").primaryKey(),
  medicineId: integer("medicine_id").references(() => medicines.id).notNull(),
  batchNumber: varchar("batch_number", { length: 100 }).notNull(),
  productionDate: date("production_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  batchId: integer("batch_id").references(() => medicineBatches.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  lastCountedAt: timestamp("last_counted_at"),
  lastCountedBy: integer("last_counted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expiryReports = pgTable("expiry_reports", {
  id: serial("id").primaryKey(),
  reportNumber: varchar("report_number", { length: 50 }).unique().notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  reportedBy: integer("reported_by").references(() => users.id).notNull(),
  batchId: integer("batch_id").references(() => medicineBatches.id).notNull(),
  reportedQuantity: integer("reported_quantity").notNull(),
  inventoryQuantity: integer("inventory_quantity").notNull(),
  notes: text("notes"),
  conflictType: conflictTypeEnum("conflict_type").default("none"),
  conflictNotes: text("conflict_notes"),
  status: statusEnum("status").default("pending"),
  disposalType: disposalTypeEnum("disposal_type").default("none"),
  suggestedTransferStoreId: integer("suggested_transfer_store_id").references(() => stores.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transferRequests = pgTable("transfer_requests", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => expiryReports.id).notNull(),
  sourceStoreId: integer("source_store_id").references(() => stores.id).notNull(),
  targetStoreId: integer("target_store_id").references(() => stores.id).notNull(),
  quantity: integer("quantity").notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  status: statusEnum("status").default("pending"),
  notes: text("notes"),
  evidenceUrls: jsonb("evidence_urls").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const destructionRequests = pgTable("destruction_requests", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => expiryReports.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  quantity: integer("quantity").notNull(),
  maxAllowedQuantity: integer("max_allowed_quantity").notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  financeApprovedBy: integer("finance_approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  financeApprovedAt: timestamp("finance_approved_at"),
  status: statusEnum("status").default("pending"),
  lossAmount: decimal("loss_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  evidenceUrls: jsonb("evidence_urls").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => expiryReports.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  previousStatus: statusEnum("previous_status"),
  newStatus: statusEnum("new_status"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => expiryReports.id).notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  fileName: varchar("file_name", { length: 256 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const historyNodes = pgTable("history_nodes", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => expiryReports.id).notNull(),
  nodeType: varchar("node_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  quantityChange: integer("quantity_change"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storesRelations = relations(stores, ({ many }) => ({
  users: many(users),
  inventory: many(inventory),
  sourceTransfers: many(transferRequests, { relationName: "sourceStore" }),
  targetTransfers: many(transferRequests, { relationName: "targetStore" }),
  reports: many(expiryReports),
  destructions: many(destructionRequests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, { fields: [users.storeId], references: [stores.id] }),
  reports: many(expiryReports),
  approvedTransfers: many(transferRequests),
  auditLogs: many(auditLogs),
  evidence: many(evidence),
  historyNodes: many(historyNodes),
}));

export const medicinesRelations = relations(medicines, ({ many }) => ({
  batches: many(medicineBatches),
}));

export const medicineBatchesRelations = relations(medicineBatches, ({ one, many }) => ({
  medicine: one(medicines, { fields: [medicineBatches.medicineId], references: [medicines.id] }),
  inventory: many(inventory),
  reports: many(expiryReports),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  store: one(stores, { fields: [inventory.storeId], references: [stores.id] }),
  batch: one(medicineBatches, { fields: [inventory.batchId], references: [medicineBatches.id] }),
  lastCountedByUser: one(users, { fields: [inventory.lastCountedBy], references: [users.id] }),
}));

export const expiryReportsRelations = relations(expiryReports, ({ one, many }) => ({
  store: one(stores, { fields: [expiryReports.storeId], references: [stores.id] }),
  reportedByUser: one(users, { fields: [expiryReports.reportedBy], references: [users.id] }),
  batch: one(medicineBatches, { fields: [expiryReports.batchId], references: [medicineBatches.id] }),
  suggestedTransferStore: one(stores, { fields: [expiryReports.suggestedTransferStoreId], references: [stores.id], relationName: "suggestedStore" }),
  transferRequests: many(transferRequests),
  destructionRequests: many(destructionRequests),
  auditLogs: many(auditLogs),
  evidence: many(evidence),
  historyNodes: many(historyNodes),
}));

export const transferRequestsRelations = relations(transferRequests, ({ one }) => ({
  report: one(expiryReports, { fields: [transferRequests.reportId], references: [expiryReports.id] }),
  sourceStore: one(stores, { fields: [transferRequests.sourceStoreId], references: [stores.id], relationName: "sourceStore" }),
  targetStore: one(stores, { fields: [transferRequests.targetStoreId], references: [stores.id], relationName: "targetStore" }),
  approvedByUser: one(users, { fields: [transferRequests.approvedBy], references: [users.id] }),
}));

export const destructionRequestsRelations = relations(destructionRequests, ({ one }) => ({
  report: one(expiryReports, { fields: [destructionRequests.reportId], references: [expiryReports.id] }),
  store: one(stores, { fields: [destructionRequests.storeId], references: [stores.id] }),
  approvedByUser: one(users, { fields: [destructionRequests.approvedBy], references: [users.id] }),
  financeApprovedByUser: one(users, { fields: [destructionRequests.financeApprovedBy], references: [users.id] }),
}));

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Medicine = typeof medicines.$inferSelect;
export type NewMedicine = typeof medicines.$inferInsert;
export type MedicineBatch = typeof medicineBatches.$inferSelect;
export type NewMedicineBatch = typeof medicineBatches.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
export type ExpiryReport = typeof expiryReports.$inferSelect;
export type NewExpiryReport = typeof expiryReports.$inferInsert;
export type TransferRequest = typeof transferRequests.$inferSelect;
export type NewTransferRequest = typeof transferRequests.$inferInsert;
export type DestructionRequest = typeof destructionRequests.$inferSelect;
export type NewDestructionRequest = typeof destructionRequests.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
export type HistoryNode = typeof historyNodes.$inferSelect;
export type NewHistoryNode = typeof historyNodes.$inferInsert;
