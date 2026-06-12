import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  department: varchar("department", { length: 100 }),
  avatarColor: varchar("avatar_color", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  recordNo: varchar("record_no", { length: 32 }).notNull().unique(),
  containerNo: varchar("container_no", { length: 20 }).notNull(),
  sealNo: varchar("seal_no", { length: 30 }).notNull(),
  vesselName: varchar("vessel_name", { length: 100 }).notNull(),
  voyageNo: varchar("voyage_no", { length: 30 }).notNull(),
  blNo: varchar("bl_no", { length: 50 }),
  customer: varchar("customer", { length: 200 }),
  exceptionType: varchar("exception_type", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  currentHandlerId: integer("current_handler_id").references(() => users.id),
  applicantId: integer("applicant_id").references(() => users.id),
  reviewerId: integer("reviewer_id").references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  sealTime: timestamp("seal_time"),
  arrivalTime: timestamp("arrival_time"),
  summary: text("summary"),
  conclusion: text("conclusion"),
  basis: text("basis"),
  blockReason: text("block_reason"),
  remedyPath: text("remedy_path"),
  diffFields: jsonb("diff_fields").default({}),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  archivedAt: timestamp("archived_at"),
});

export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id")
    .notNull()
    .references(() => records.id),
  nodeType: varchar("node_type", { length: 30 }).notNull(),
  nodeName: varchar("node_name", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  operatorId: integer("operator_id").references(() => users.id),
  operatorName: varchar("operator_name", { length: 100 }),
  comment: text("comment"),
  fieldChanges: jsonb("field_changes").default({}),
  snapshotBefore: jsonb("snapshot_before").default({}),
  snapshotAfter: jsonb("snapshot_after").default({}),
  basis: text("basis"),
  sequence: integer("sequence").notNull(),
  isReProcess: boolean("is_re_process").default(false),
  parentNodeId: integer("parent_node_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id")
    .notNull()
    .references(() => records.id),
  nodeId: integer("node_id").references(() => nodes.id),
  fileName: varchar("file_name", { length: 200 }).notNull(),
  fileType: varchar("file_type", { length: 200 }),
  fileSize: integer("file_size"),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  version: varchar("version", { length: 20 }).default("1.0"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploaderName: varchar("uploader_name", { length: 100 }),
  description: text("description"),
  isEvidence: boolean("is_evidence").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evidenceItems = pgTable("evidence_items", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id")
    .notNull()
    .references(() => records.id),
  nodeId: integer("node_id").references(() => nodes.id),
  type: varchar("type", { length: 30 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  status: varchar("status", { length: 20 }).default("valid"),
  verified: boolean("verified").default(false),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recordsRelations = relations(records, ({ one, many }) => ({
  currentHandler: one(users, {
    fields: [records.currentHandlerId],
    references: [users.id],
  }),
  applicant: one(users, {
    fields: [records.applicantId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [records.reviewerId],
    references: [users.id],
  }),
  nodes: many(nodes),
  attachments: many(attachments),
  evidenceItems: many(evidenceItems),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  record: one(records, {
    fields: [nodes.recordId],
    references: [records.id],
  }),
  operator: one(users, {
    fields: [nodes.operatorId],
    references: [users.id],
  }),
  attachments: many(attachments),
  evidenceItems: many(evidenceItems),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedRecords: many(records, { relationName: "handler" }),
  appliedRecords: many(records, { relationName: "applicant" }),
  reviewedRecords: many(records, { relationName: "reviewer" }),
  operatedNodes: many(nodes),
  uploadedAttachments: many(attachments),
}));

export type User = typeof users.$inferSelect;
export type Record = typeof records.$inferSelect;
export type Node = typeof nodes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type EvidenceItem = typeof evidenceItems.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
export type NewNode = typeof nodes.$inferInsert;
export type NewAttachment = typeof attachments.$inferInsert;
export type NewEvidenceItem = typeof evidenceItems.$inferInsert;

export const STATUS = {
  PENDING_ACCEPT: "pending_accept",
  PROCESSING: "processing",
  PENDING_REVIEW: "pending_review",
  REVIEWED: "reviewed",
  ARCHIVED: "archived",
  RETURNED: "returned",
} as const;

export const NODE_TYPES = {
  ACCEPT: "accept",
  PROCESS: "process",
  SUPPLEMENT: "supplement",
  REVIEW: "review",
  ARCHIVE: "archive",
  RETURN: "return",
  RE_PROCESS: "re_process",
} as const;

export const EXCEPTION_TYPES = {
  NORMAL: "normal",
  MISSING_RECORD: "missing_record",
  ATTACHMENT_VERSION_MISMATCH: "attachment_version_mismatch",
  RE_PROCESS: "re_process",
} as const;

export const ROLES = {
  APPLICANT: "applicant",
  HANDLER: "handler",
  REVIEWER: "reviewer",
  ARCHIVIST: "archivist",
} as const;
