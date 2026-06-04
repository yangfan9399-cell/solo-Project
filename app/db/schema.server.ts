import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["operator", "reviewer", "admin"]);
export const serviceStatusEnum = pgEnum("service_status", [
  "scheduled",
  "in_progress",
  "completed",
  "no_answer",
  "time_conflict",
  "complaint",
  "archived",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
  "rework",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("operator"),
  phone: text("phone"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const elders = pgTable("elders", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  idCard: text("id_card").unique(),
  phone: text("phone"),
  address: text("address").notNull(),
  gender: text("gender"),
  age: integer("age"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  healthNotes: text("health_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  skills: text("skills").array(),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const serviceRecords = pgTable("service_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  elderId: uuid("elder_id")
    .references(() => elders.id)
    .notNull(),
  staffId: uuid("staff_id")
    .references(() => staff.id)
    .notNull(),
  operatorId: uuid("operator_id")
    .references(() => users.id)
    .notNull(),
  serviceType: text("service_type").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  status: serviceStatusEnum("status").notNull().default("scheduled"),
  serviceNotes: text("service_notes"),
  attachments: text("attachments").array().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reviewNodes = pgTable("review_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceRecordId: uuid("service_record_id")
    .references(() => serviceRecords.id)
    .notNull(),
  parentId: uuid("parent_id").references(() => reviewNodes.id),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  operatorId: uuid("operator_id")
    .references(() => users.id)
    .notNull(),
  reviewStatus: reviewStatusEnum("review_status").notNull().default("pending"),
  reviewConclusion: text("review_conclusion"),
  reviewNotes: text("review_notes"),
  supplementNotes: text("supplement_notes"),
  supplementAttachments: text("supplement_attachments").array().default([]),
  isArchived: boolean("is_archived").notNull().default(false),
  nodeOrder: integer("node_order").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const changeLogs = pgTable("change_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceRecordId: uuid("service_record_id")
    .references(() => serviceRecords.id)
    .notNull(),
  reviewNodeId: uuid("review_node_id").references(() => reviewNodes.id),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  fieldName: text("field_name").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const serviceRecordsRelations = relations(serviceRecords, ({ one, many }) => ({
  elder: one(elders, {
    fields: [serviceRecords.elderId],
    references: [elders.id],
  }),
  staff: one(staff, {
    fields: [serviceRecords.staffId],
    references: [staff.id],
  }),
  operator: one(users, {
    fields: [serviceRecords.operatorId],
    references: [users.id],
  }),
  reviewNodes: many(reviewNodes),
  changeLogs: many(changeLogs),
}));

export const reviewNodesRelations = relations(reviewNodes, ({ one, many }) => ({
  serviceRecord: one(serviceRecords, {
    fields: [reviewNodes.serviceRecordId],
    references: [serviceRecords.id],
  }),
  parent: one(reviewNodes, {
    fields: [reviewNodes.parentId],
    references: [reviewNodes.id],
  }),
  reviewer: one(users, {
    fields: [reviewNodes.reviewerId],
    references: [users.id],
  }),
  operator: one(users, {
    fields: [reviewNodes.operatorId],
    references: [users.id],
  }),
  children: many(reviewNodes),
}));

export const changeLogsRelations = relations(changeLogs, ({ one }) => ({
  serviceRecord: one(serviceRecords, {
    fields: [changeLogs.serviceRecordId],
    references: [serviceRecords.id],
  }),
  reviewNode: one(reviewNodes, {
    fields: [changeLogs.reviewNodeId],
    references: [reviewNodes.id],
  }),
  user: one(users, {
    fields: [changeLogs.userId],
    references: [users.id],
  }),
}));
