import {
  pgTable,
  serial,
  varchar,
  date,
  timestamp,
  text,
  integer,
  boolean,
  pgEnum,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "qualified",
  "disqualified",
  "needs_info",
]);

export const checkInStatusEnum = pgEnum("checkin_status", [
  "pending",
  "checked_in",
  "late",
  "no_show",
  "rejected",
  "wrong_group",
]);

export const reviewRoleEnum = pgEnum("review_role", [
  "clerk",
  "referee",
  "checkin_staff",
]);

export const historyActionEnum = pgEnum("history_action", [
  "registered",
  "clerk_updated",
  "group_changed",
  "referee_approved",
  "referee_rejected",
  "checked_in",
  "checkin_rejected",
  "wrong_group_detected",
  "document_expired",
  "score_submitted",
  "withdrawn",
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => projects.id)
    .notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  gender: varchar("gender", { length: 10 }),
  checkInTime: timestamp("check_in_time").notNull(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 50 }).notNull().unique(),
  birthDate: date("birth_date").notNull(),
  gender: varchar("gender", { length: 10 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  idExpiryDate: date("id_expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .references(() => participants.id)
    .notNull(),
  projectId: integer("project_id")
    .references(() => projects.id)
    .notNull(),
  groupId: integer("group_id")
    .references(() => groups.id)
    .notNull(),
  registrationStatus: registrationStatusEnum("registration_status")
    .default("pending")
    .notNull(),
  checkInStatus: checkInStatusEnum("checkin_status")
    .default("pending")
    .notNull(),
  clerkNotes: text("clerk_notes"),
  refereeNotes: text("referee_notes"),
  score: integer("score"),
  rank: integer("rank"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  lastUpdatedAt: timestamp("last_updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id")
    .references(() => registrations.id)
    .notNull(),
  reviewerRole: reviewRoleEnum("reviewer_role").notNull(),
  reviewerName: varchar("reviewer_name", { length: 100 }).notNull(),
  decision: varchar("decision", { length: 50 }).notNull(),
  notes: text("notes"),
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
});

export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id")
    .references(() => registrations.id)
    .notNull(),
  action: historyActionEnum("action").notNull(),
  actorName: varchar("actor_name", { length: 100 }).notNull(),
  details: text("details"),
  oldGroupId: integer("old_group_id").references(() => groups.id),
  newGroupId: integer("new_group_id").references(() => groups.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  groups: many(groups),
  registrations: many(registrations),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  project: one(projects, {
    fields: [groups.projectId],
    references: [projects.id],
  }),
  registrations: many(registrations),
}));

export const participantsRelations = relations(participants, ({ many }) => ({
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  participant: one(participants, {
    fields: [registrations.participantId],
    references: [participants.id],
  }),
  project: one(projects, {
    fields: [registrations.projectId],
    references: [projects.id],
  }),
  group: one(groups, {
    fields: [registrations.groupId],
    references: [groups.id],
  }),
  reviews: many(reviews),
  history: many(history),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  registration: one(registrations, {
    fields: [reviews.registrationId],
    references: [registrations.id],
  }),
}));

export const historyRelations = relations(history, ({ one }) => ({
  registration: one(registrations, {
    fields: [history.registrationId],
    references: [registrations.id],
  }),
  oldGroup: one(groups, {
    fields: [history.oldGroupId],
    references: [groups.id],
  }),
  newGroup: one(groups, {
    fields: [history.newGroupId],
    references: [groups.id],
  }),
}));
