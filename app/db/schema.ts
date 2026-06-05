import { pgTable, serial, text, timestamp, integer, jsonb, boolean, varchar, date, time } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const constructionTeams = pgTable("construction_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  leaderName: text("leader_name").notNull(),
  leaderPhone: varchar("leader_phone", { length: 20 }).notNull(),
  licenseNumber: varchar("license_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => constructionTeams.id).notNull(),
  name: text("name").notNull(),
  idCard: varchar("id_card", { length: 30 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  hasSafetyCert: boolean("has_safety_cert").default(false),
  certNumber: varchar("cert_number", { length: 100 }),
  certExpireDate: date("cert_expire_date"),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const constructionAreas = pgTable("construction_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  building: text("building"),
  floor: varchar("floor", { length: 20 }),
  description: text("description"),
  capacity: integer("capacity").default(10),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const permits = pgTable("permits", {
  id: serial("id").primaryKey(),
  permitNumber: varchar("permit_number", { length: 50 }).notNull().unique(),
  teamId: integer("team_id").references(() => constructionTeams.id).notNull(),
  areaId: integer("area_id").references(() => constructionAreas.id).notNull(),
  constructionType: varchar("construction_type", { length: 50 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  workContent: text("work_content").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
  securityOfficerId: integer("security_officer_id").references(() => users.id),
  engineeringManagerId: integer("engineering_manager_id").references(() => users.id),
  safetyReviewerId: integer("safety_reviewer_id").references(() => users.id),
  hasDocuments: boolean("has_documents").default(true),
  documentMissingReason: text("document_missing_reason"),
  hasAreaConflict: boolean("has_area_conflict").default(false),
  areaConflictDetail: text("area_conflict_detail"),
  safetyBriefingStatus: varchar("safety_briefing_status", { length: 50 }).default("PENDING"),
  safetyBriefingEvidence: jsonb("safety_briefing_evidence").default([]),
  safetyRejectReason: text("safety_reject_reason"),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  actualCheckIn: timestamp("actual_check_in"),
  actualCheckOut: timestamp("actual_check_out"),
  anomalyType: varchar("anomaly_type", { length: 50 }),
  anomalyReason: text("anomaly_reason"),
  stayDurationHours: integer("stay_duration_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const permitHistories = pgTable("permit_histories", {
  id: serial("id").primaryKey(),
  permitId: integer("permit_id").references(() => permits.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  statusFrom: varchar("status_from", { length: 50 }),
  statusTo: varchar("status_to", { length: 50 }),
  operatorId: integer("operator_id").references(() => users.id),
  operatorName: text("operator_name").notNull(),
  operatorRole: varchar("operator_role", { length: 50 }).notNull(),
  remark: text("remark"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const permitWorkers = pgTable("permit_workers", {
  id: serial("id").primaryKey(),
  permitId: integer("permit_id").references(() => permits.id).notNull(),
  workerId: integer("worker_id").references(() => workers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
