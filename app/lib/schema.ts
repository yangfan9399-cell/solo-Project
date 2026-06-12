import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  projectName: text("project_name").notNull(),
  sceneName: text("scene_name").notNull(),
  location: text("location").notNull(),
  applicantName: text("applicant_name").notNull(),
  applicantRole: text("applicant_role").notNull().default("applicant"),
  status: text("status").notNull().default("received"),
  shootingStartDate: timestamp("shooting_start_date"),
  shootingEndDate: timestamp("shooting_end_date"),
  crewCount: integer("crew_count"),
  budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 }),
  safetyPlanSummary: text("safety_plan_summary"),
  riskLevel: text("risk_level").default("medium"),
  currentResponsible: text("current_responsible"),
  currentResponsibleRole: text("current_responsible_role"),
  source: text("source").default("online_application"),
  conclusion: text("conclusion"),
  sampleType: text("sample_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowNodes = pgTable("workflow_nodes", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id),
  nodeType: text("node_type").notNull(),
  operatorName: text("operator_name"),
  operatorRole: text("operator_role"),
  actionTaken: text("action_taken"),
  actionResult: text("action_result"),
  blockingReason: text("blocking_reason"),
  diffFields: jsonb("diff_fields").$type<Record<string, DiffField>>(),
  remedyPath: text("remedy_path"),
  basisReference: text("basis_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id),
  workflowNodeId: integer("workflow_node_id").references(() => workflowNodes.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileVersion: text("file_version").notNull(),
  fileHash: text("file_hash"),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isEvidence: boolean("is_evidence").default(false),
});

export const fieldChanges = pgTable("field_changes", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id),
  workflowNodeId: integer("workflow_node_id").references(() => workflowNodes.id),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  changeType: text("change_type").notNull(),
});

export const businessRecords = pgTable("business_records", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id),
  workflowNodeId: integer("workflow_node_id").references(() => workflowNodes.id),
  recordType: text("record_type").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface DiffField {
  field: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
}

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type FieldChange = typeof fieldChanges.$inferSelect;
export type BusinessRecord = typeof businessRecords.$inferSelect;
