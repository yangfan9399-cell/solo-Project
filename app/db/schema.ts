import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, boolean, pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", [
  "accepted",
  "processing",
  "reviewing",
  "archived",
  "returned",
  "reprocessing",
]);

export const abnormalTypeEnum = pgEnum("abnormal_type", [
  "none",
  "missing_record",
  "attachment_version_mismatch",
  "reprocessing_needed",
]);

export const roleEnum = pgEnum("role", ["applicant", "reviewer", "admin"]);

export const nodeActionEnum = pgEnum("node_action", [
  "create",
  "accept",
  "process",
  "submit_review",
  "review_approve",
  "review_return",
  "archive",
  "reprocess",
  "supplement",
  "modify_key_field",
]);

export const outagePlans = pgTable("outage_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  planCode: varchar("plan_code", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  region: varchar("region", { length: 128 }).notNull(),
  lineName: varchar("line_name", { length: 256 }).notNull(),
  outageType: varchar("outage_type", { length: 64 }).notNull(),
  plannedStartTime: timestamp("planned_start_time", { withTimezone: true }).notNull(),
  plannedEndTime: timestamp("planned_end_time", { withTimezone: true }).notNull(),
  actualStartTime: timestamp("actual_start_time", { withTimezone: true }),
  actualEndTime: timestamp("actual_end_time", { withTimezone: true }),
  affectedUsers: integer("affected_users"),
  responsiblePerson: varchar("responsible_person", { length: 128 }).notNull(),
  responsiblePersonId: varchar("responsible_person_id", { length: 64 }).notNull(),
  applicantId: varchar("applicant_id", { length: 64 }).notNull(),
  applicantName: varchar("applicant_name", { length: 128 }).notNull(),
  reviewerId: varchar("reviewer_id", { length: 64 }),
  reviewerName: varchar("reviewer_name", { length: 128 }),
  status: statusEnum("status").notNull().default("accepted"),
  abnormalType: abnormalTypeEnum("abnormal_type").notNull().default("none"),
  businessRecord: text("business_record"),
  onsiteDescription: text("onsite_description"),
  evidenceConclusion: text("evidence_conclusion"),
  basisReference: varchar("basis_reference", { length: 512 }),
  conclusionSummary: varchar("conclusion_summary", { length: 512 }),
  blockingReason: text("blocking_reason"),
  diffFields: jsonb("diff_fields").$type<DiffField[]>(),
  remediationPath: text("remediation_path"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workflowNodes = pgTable("workflow_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => outagePlans.id, { onDelete: "cascade" }),
  action: nodeActionEnum("action").notNull(),
  operatorId: varchar("operator_id", { length: 64 }).notNull(),
  operatorName: varchar("operator_name", { length: 128 }).notNull(),
  operatorRole: roleEnum("operator_role").notNull(),
  fromStatus: statusEnum("from_status"),
  toStatus: statusEnum("to_status"),
  comment: text("comment"),
  changedFields: jsonb("changed_fields").$type<ChangedField[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => outagePlans.id, { onDelete: "cascade" }),
  nodeId: uuid("node_id").references(() => workflowNodes.id),
  fileName: varchar("file_name", { length: 256 }).notNull(),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  version: integer("version").notNull().default(1),
  fileType: varchar("file_type", { length: 64 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 128 }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").notNull().references(() => outagePlans.id, { onDelete: "cascade" }),
  fieldChanged: varchar("field_changed", { length: 128 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedBy: varchar("changed_by", { length: 128 }).notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  isKeyField: boolean("is_key_field").notNull().default(false),
});

export type DiffField = {
  field: string;
  expected: string;
  actual: string;
};

export type ChangedField = {
  field: string;
  oldValue: string;
  newValue: string;
};

export type OutagePlan = typeof outagePlans.$inferSelect;
export type NewOutagePlan = typeof outagePlans.$inferInsert;
export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
