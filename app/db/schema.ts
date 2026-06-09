import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  date,
  boolean,
  integer,
  jsonb,
  foreignKey,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const permitStatusEnum = pgEnum("permit_status", [
  "draft",
  "submitted",
  "security_approved",
  "security_rejected",
  "safety_approved",
  "safety_rejected",
  "manager_approved",
  "manager_rejected",
  "archived",
]);

export const certificateTypeEnum = pgEnum("certificate_type", [
  "height_work",
  "electrician",
  "welding",
  "crane_operator",
  "scaffolding",
  "first_aid",
  "fire_safety",
]);

export const workTypeEnum = pgEnum("work_type", [
  "stage_setup",
  "lighting_install",
  "sound_install",
  "truss_hoisting",
  "scaffolding",
  "electrical",
  "general",
]);

export const roleEnum = pgEnum("role", [
  "contractor",
  "security",
  "safety_officer",
  "project_manager",
]);

export const issueTypeEnum = pgEnum("issue_type", [
  "certificate_expired",
  "zone_conflict",
  "night_permit_missing",
  "incomplete_info",
  "safety_violation",
  "other",
]);

export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id")
    .references(() => contractors.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 50 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  avatar: varchar("avatar", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id")
    .references(() => workers.id)
    .notNull(),
  type: certificateTypeEnum("type").notNull(),
  certificateNumber: varchar("certificate_number", { length: 100 }).notNull(),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  issuingAuthority: varchar("issuing_authority", { length: 255 }),
  certificateImage: varchar("certificate_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workZones = pgTable("work_zones", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  isHighRisk: boolean("is_high_risk").default(false),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workPermits = pgTable("work_permits", {
  id: serial("id").primaryKey(),
  permitNumber: varchar("permit_number", { length: 50 }).notNull().unique(),
  contractorId: integer("contractor_id")
    .references(() => contractors.id)
    .notNull(),
  workType: workTypeEnum("work_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  workZoneId: integer("work_zone_id").references(() => workZones.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isNightWork: boolean("is_night_work").default(false),
  nightPermitNumber: varchar("night_permit_number", { length: 100 }),
  status: permitStatusEnum("status").default("draft").notNull(),
  submittedAt: timestamp("submitted_at"),
  securityApprovedAt: timestamp("security_approved_at"),
  safetyApprovedAt: timestamp("safety_approved_at"),
  managerApprovedAt: timestamp("manager_approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const permitWorkers = pgTable(
  "permit_workers",
  {
    permitId: integer("permit_id")
      .references(() => workPermits.id)
      .notNull(),
    workerId: integer("worker_id")
      .references(() => workers.id)
      .notNull(),
    role: varchar("role", { length: 100 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.permitId, table.workerId] }),
  })
);

export const approvalNodes = pgTable("approval_nodes", {
  id: serial("id").primaryKey(),
  permitId: integer("permit_id")
    .references(() => workPermits.id)
    .notNull(),
  role: roleEnum("role").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  status: permitStatusEnum("status").notNull(),
  comment: text("comment"),
  operatorName: varchar("operator_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const riskItems = pgTable("risk_items", {
  id: serial("id").primaryKey(),
  permitId: integer("permit_id")
    .references(() => workPermits.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: varchar("level", { length: 20 }).default("medium").notNull(),
  mitigation: text("mitigation"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const permitIssues = pgTable("permit_issues", {
  id: serial("id").primaryKey(),
  permitId: integer("permit_id")
    .references(() => workPermits.id)
    .notNull(),
  issueType: issueTypeEnum("issue_type").notNull(),
  description: text("description").notNull(),
  isBlocking: boolean("is_blocking").default(true),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contractorRelations = relations(contractors, ({ many }) => ({
  workers: many(workers),
  permits: many(workPermits),
}));

export const workerRelations = relations(workers, ({ one, many }) => ({
  contractor: one(contractors, {
    fields: [workers.contractorId],
    references: [contractors.id],
  }),
  certificates: many(certificates),
  permits: many(permitWorkers),
}));

export const certificateRelations = relations(certificates, ({ one }) => ({
  worker: one(workers, {
    fields: [certificates.workerId],
    references: [workers.id],
  }),
}));

export const workPermitRelations = relations(workPermits, ({ one, many }) => ({
  contractor: one(contractors, {
    fields: [workPermits.contractorId],
    references: [contractors.id],
  }),
  workZone: one(workZones, {
    fields: [workPermits.workZoneId],
    references: [workZones.id],
  }),
  workers: many(permitWorkers),
  approvalNodes: many(approvalNodes),
  riskItems: many(riskItems),
  issues: many(permitIssues),
}));

export const permitWorkerRelations = relations(permitWorkers, ({ one }) => ({
  permit: one(workPermits, {
    fields: [permitWorkers.permitId],
    references: [workPermits.id],
  }),
  worker: one(workers, {
    fields: [permitWorkers.workerId],
    references: [workers.id],
  }),
}));

export const approvalNodeRelations = relations(approvalNodes, ({ one }) => ({
  permit: one(workPermits, {
    fields: [approvalNodes.permitId],
    references: [workPermits.id],
  }),
}));

export const riskItemRelations = relations(riskItems, ({ one }) => ({
  permit: one(workPermits, {
    fields: [riskItems.permitId],
    references: [workPermits.id],
  }),
}));
