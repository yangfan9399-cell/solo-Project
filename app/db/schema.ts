import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["experimenter", "lab_admin", "safety_officer"] }).notNull(),
  permissionLevel: integer("permission_level").notNull().default(1),
  college: text("college").notNull(),
  department: text("department"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

export const reagents = sqliteTable("reagents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reagentCode: text("reagent_code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  hazardLevel: text("hazard_level", { enum: ["low", "medium", "high", "extreme"] }).notNull(),
  requiredPermissionLevel: integer("required_permission_level").notNull().default(1),
  totalQuantity: real("total_quantity").notNull(),
  remainingQuantity: real("remaining_quantity").notNull(),
  unit: text("unit").notNull(),
  location: text("location"),
  manufacturer: text("manufacturer"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

export const requisitions = sqliteTable("requisitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requisitionNo: text("requisition_no").notNull().unique(),
  reagentId: integer("reagent_id").notNull().references(() => reagents.id),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  purpose: text("purpose").notNull(),
  quantity: real("quantity").notNull(),
  expectedReturnDate: integer("expected_return_date", { mode: "timestamp" }).notNull(),
  status: text("status", {
    enum: [
      "pending",
      "lab_approved",
      "lab_rejected",
      "safety_approved",
      "safety_rejected",
      "picked_up",
      "returned",
      "overdue",
      "escalated",
    ],
  }).notNull().default("pending"),
  labAdminId: integer("lab_admin_id").references(() => users.id),
  labAdminComment: text("lab_admin_comment"),
  safetyOfficerId: integer("safety_officer_id").references(() => users.id),
  safetyOfficerComment: text("safety_officer_comment"),
  escalatedToId: integer("escalated_to_id").references(() => users.id),
  pickedUpAt: integer("picked_up_at", { mode: "timestamp" }),
  returnedAt: integer("returned_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().defaultNow(),
});

export const returns = sqliteTable("returns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requisitionId: integer("requisition_id").notNull().references(() => requisitions.id),
  returnedQuantity: real("returned_quantity").notNull(),
  condition: text("condition", { enum: ["good", "partial", "empty", "contaminated"] }).notNull(),
  verifierId: integer("verifier_id").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

export const operationLogs = sqliteTable("operation_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requisitionId: integer("requisition_id").references(() => requisitions.id),
  reagentId: integer("reagent_id").references(() => reagents.id),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  requisitions: many(requisitions, { relationName: "requester" }),
  labApprovals: many(requisitions, { relationName: "labAdmin" }),
  safetyApprovals: many(requisitions, { relationName: "safetyOfficer" }),
  verifications: many(returns),
  logs: many(operationLogs),
}));

export const reagentsRelations = relations(reagents, ({ many }) => ({
  requisitions: many(requisitions),
  logs: many(operationLogs),
}));

export const requisitionsRelations = relations(requisitions, ({ one, many }) => ({
  reagent: one(reagents, {
    fields: [requisitions.reagentId],
    references: [reagents.id],
  }),
  requester: one(users, {
    fields: [requisitions.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  labAdmin: one(users, {
    fields: [requisitions.labAdminId],
    references: [users.id],
    relationName: "labAdmin",
  }),
  safetyOfficer: one(users, {
    fields: [requisitions.safetyOfficerId],
    references: [users.id],
    relationName: "safetyOfficer",
  }),
  returns: many(returns),
  logs: many(operationLogs),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  requisition: one(requisitions, {
    fields: [returns.requisitionId],
    references: [requisitions.id],
  }),
  verifier: one(users, {
    fields: [returns.verifierId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Reagent = typeof reagents.$inferSelect;
export type NewReagent = typeof reagents.$inferInsert;
export type Requisition = typeof requisitions.$inferSelect;
export type NewRequisition = typeof requisitions.$inferInsert;
export type Return = typeof returns.$inferSelect;
export type NewReturn = typeof returns.$inferInsert;
export type OperationLog = typeof operationLogs.$inferSelect;
export type NewOperationLog = typeof operationLogs.$inferInsert;

export type RequisitionStatus = Requisition["status"];
export type HazardLevel = Reagent["hazardLevel"];
export type UserRole = User["role"];
