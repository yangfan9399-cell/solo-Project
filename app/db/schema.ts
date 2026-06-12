import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  varchar,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // applicant, reviewer, archivist
  department: text("department"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  caseNo: varchar("case_no", { length: 50 }).notNull().unique(),
  source: text("source").notNull(), // 12345热线, 现场巡查, 信访, 其他
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  
  currentStatus: text("current_status").notNull().default("pending"),
  // pending:待受理, processing:处理中, review:待复核, archived:已归档, rejected:退回补证
  
  currentHandlerId: integer("current_handler_id").references(() => users.id),
  applicantId: integer("applicant_id").references(() => users.id).notNull(),
  
  noiseLevelBefore: decimal("noise_level_before", { precision: 5, scale: 1 }),
  noiseLevelAfter: decimal("noise_level_after", { precision: 5, scale: 1 }),
  fineAmount: decimal("fine_amount", { precision: 10, scale: 2 }),
  
  responsibleParty: text("responsible_party"),
  responsiblePerson: text("responsible_person"),
  contactPhone: varchar("contact_phone", { length: 20 }),
  
  violationType: text("violation_type"),
  legalBasis: text("legal_basis"),
  conclusion: text("conclusion"),
  
  isArchived: boolean("is_archived").default(false),
  hasException: boolean("has_exception").default(false),
  exceptionType: text("exception_type"), // missing_fields, attachment_version_mismatch, reprocess
  blockingReason: text("blocking_reason"),
  remedyPath: text("remedy_path"),
  
  receivedAt: timestamp("received_at"),
  assignedAt: timestamp("assigned_at"),
  processedAt: timestamp("processed_at"),
  reviewedAt: timestamp("reviewed_at"),
  archivedAt: timestamp("archived_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complaintNodes = pgTable("complaint_nodes", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").references(() => complaints.id).notNull(),
  nodeType: text("node_type").notNull(),
  // accept:受理, assign:分派, process:处理, review:复核, archive:归档, reject:退回, reprocess:重新处理, supplement:补充材料
  
  status: text("status").notNull(),
  operatorId: integer("operator_id").references(() => users.id).notNull(),
  operatorName: text("operator_name").notNull(),
  operatorRole: text("operator_role").notNull(),
  
  remark: text("remark"),
  changes: jsonb("changes"),
  diffFields: jsonb("diff_fields"),
  
  isBlocking: boolean("is_blocking").default(false),
  blockingReason: text("blocking_reason"),
  remedyPath: text("remedy_path"),
  
  timestamp: timestamp("timestamp").defaultNow(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").references(() => complaints.id).notNull(),
  nodeId: integer("node_id").references(() => complaintNodes.id),
  type: text("type").notNull(), // evidence, document, photo, audio, video, report
  name: text("name").notNull(),
  url: text("url").notNull(),
  version: integer("version").default(1),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  description: text("description"),
  isEvidence: boolean("is_evidence").default(false),
  evidenceConclusion: text("evidence_conclusion"), // 支持, 不支持, 待核实
});

export const complaintRelations = relations(complaints, ({ many, one }) => ({
  nodes: many(complaintNodes),
  attachments: many(attachments),
  applicant: one(users, {
    fields: [complaints.applicantId],
    references: [users.id],
  }),
  currentHandler: one(users, {
    fields: [complaints.currentHandlerId],
    references: [users.id],
  }),
}));

export const nodeRelations = relations(complaintNodes, ({ one, many }) => ({
  complaint: one(complaints, {
    fields: [complaintNodes.complaintId],
    references: [complaints.id],
  }),
  operator: one(users, {
    fields: [complaintNodes.operatorId],
    references: [users.id],
  }),
  attachments: many(attachments),
}));

export const attachmentRelations = relations(attachments, ({ one }) => ({
  complaint: one(complaints, {
    fields: [attachments.complaintId],
    references: [complaints.id],
  }),
  node: one(complaintNodes, {
    fields: [attachments.nodeId],
    references: [complaintNodes.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type ComplaintNode = typeof complaintNodes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
