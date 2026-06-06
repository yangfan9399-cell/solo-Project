import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  decimal,
  boolean,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "inspector",
  "operation_manager",
  "maintenance_worker",
  "reviewer",
]);

export const defectStatusEnum = pgEnum("defect_status", [
  "registered",
  "assigned",
  "processing",
  "pending_review",
  "awaiting_parts",
  "accepted",
  "rejected",
  "false_positive",
]);

export const defectLevelEnum = pgEnum("defect_level", [
  "critical",
  "major",
  "minor",
  "general",
]);

export const deviceTypeEnum = pgEnum("device_type", [
  "pv_module",
  "inverter",
  "combiner_box",
  "tracker",
  "transformer",
  "cable",
]);

export const sparePartStatusEnum = pgEnum("spare_part_status", [
  "in_stock",
  "out_of_stock",
  "on_order",
]);

export const historyActionEnum = pgEnum("history_action", [
  "register",
  "assign",
  "start_processing",
  "submit_result",
  "request_parts",
  "parts_arrived",
  "accept",
  "reject",
  "mark_false_positive",
]);

export const powerStations = pgTable("power_stations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  capacity: decimal("capacity", { precision: 10, scale: 2 }),
  commissionDate: timestamp("commission_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id")
    .references(() => powerStations.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  deviceType: deviceTypeEnum("device_type").notNull(),
  model: varchar("model", { length: 100 }),
  array: varchar("array", { length: 50 }),
  position: varchar("position", { length: 50 }),
  ratedPower: decimal("rated_power", { precision: 10, scale: 2 }),
  manufacturer: varchar("manufacturer", { length: 100 }),
  installDate: timestamp("install_date"),
  status: varchar("status", { length: 20 }).default("normal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  role: userRoleEnum("role").notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  avatar: varchar("avatar", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const spareParts = pgTable("spare_parts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  partNumber: varchar("part_number", { length: 50 }),
  category: varchar("category", { length: 50 }),
  quantity: integer("quantity").default(0),
  unit: varchar("unit", { length: 20 }),
  status: sparePartStatusEnum("status").default("in_stock"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const defects = pgTable("defects", {
  id: serial("id").primaryKey(),
  defectNo: varchar("defect_no", { length: 30 }).notNull().unique(),
  stationId: integer("station_id")
    .references(() => powerStations.id)
    .notNull(),
  deviceId: integer("device_id")
    .references(() => devices.id)
    .notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  defectLevel: defectLevelEnum("defect_level").notNull(),
  deviceType: deviceTypeEnum("device_type").notNull(),
  status: defectStatusEnum("status").default("registered").notNull(),
  affectedPower: decimal("affected_power", { precision: 10, scale: 2 }),
  photoUrls: json("photo_urls").$type<string[]>(),
  location: varchar("location", { length: 100 }),
  array: varchar("array", { length: 50 }),
  isFalsePositive: boolean("is_false_positive").default(false),
  inspectorId: integer("inspector_id").references(() => users.id),
  assigneeId: integer("assignee_id").references(() => users.id),
  reviewerId: integer("reviewer_id").references(() => users.id),
  partsNeeded: json("parts_needed").$type<
    { partId: number; partName: string; quantity: number }[]
  >(),
  processingResult: text("processing_result"),
  processingPhotos: json("processing_photos").$type<string[]>(),
  reviewComment: text("review_comment"),
  registeredAt: timestamp("registered_at"),
  assignedAt: timestamp("assigned_at"),
  processingStartedAt: timestamp("processing_started_at"),
  processingFinishedAt: timestamp("processing_finished_at"),
  reviewedAt: timestamp("reviewed_at"),
  closedAt: timestamp("closed_at"),
  resolutionDuration: integer("resolution_duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const defectHistories = pgTable("defect_histories", {
  id: serial("id").primaryKey(),
  defectId: integer("defect_id")
    .references(() => defects.id)
    .notNull(),
  action: historyActionEnum("action").notNull(),
  userId: integer("user_id").references(() => users.id),
  userName: varchar("user_name", { length: 50 }),
  description: text("description"),
  statusBefore: defectStatusEnum("status_before"),
  statusAfter: defectStatusEnum("status_after"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const defectSpareParts = pgTable("defect_spare_parts", {
  id: serial("id").primaryKey(),
  defectId: integer("defect_id")
    .references(() => defects.id)
    .notNull(),
  sparePartId: integer("spare_part_id")
    .references(() => spareParts.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).default("requested"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const powerStationsRelations = relations(powerStations, ({ many }) => ({
  devices: many(devices),
  defects: many(defects),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  station: one(powerStations, {
    fields: [devices.stationId],
    references: [powerStations.id],
  }),
  defects: many(defects),
}));

export const usersRelations = relations(users, ({ many }) => ({
  registeredDefects: many(defects, { relationName: "inspector" }),
  assignedDefects: many(defects, { relationName: "assignee" }),
  reviewedDefects: many(defects, { relationName: "reviewer" }),
  histories: many(defectHistories),
}));

export const defectsRelations = relations(defects, ({ one, many }) => ({
  station: one(powerStations, {
    fields: [defects.stationId],
    references: [powerStations.id],
  }),
  device: one(devices, {
    fields: [defects.deviceId],
    references: [devices.id],
  }),
  inspector: one(users, {
    fields: [defects.inspectorId],
    references: [users.id],
    relationName: "inspector",
  }),
  assignee: one(users, {
    fields: [defects.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  reviewer: one(users, {
    fields: [defects.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
  histories: many(defectHistories),
  spareParts: many(defectSpareParts),
}));

export const defectHistoriesRelations = relations(
  defectHistories,
  ({ one }) => ({
    defect: one(defects, {
      fields: [defectHistories.defectId],
      references: [defects.id],
    }),
    user: one(users, {
      fields: [defectHistories.userId],
      references: [users.id],
    }),
  })
);

export const defectSparePartsRelations = relations(
  defectSpareParts,
  ({ one }) => ({
    defect: one(defects, {
      fields: [defectSpareParts.defectId],
      references: [defects.id],
    }),
    sparePart: one(spareParts, {
      fields: [defectSpareParts.sparePartId],
      references: [spareParts.id],
    }),
  })
);
