import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  datetime,
  mysqlEnum,
  json,
  index,
} from "drizzle-orm/mysql-core";

export const registrations = mysqlTable(
  "registrations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    regNo: varchar("reg_no", { length: 20 }).notNull().unique(),
    applicantName: varchar("applicant_name", { length: 100 }).notNull(),
    applicantIdNo: varchar("applicant_id_no", { length: 50 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    courseId: varchar("course_id", { length: 36 }).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "material_missing",
      "under_review",
      "qualified",
      "unqualified",
      "grade_not_met",
      "duplicate",
      "course_completed",
      "cert_issued",
      "archived",
    ])
      .notNull()
      .default("pending"),
    currentRole: mysqlEnum("current_role", ["handler", "reviewer"]).notNull().default("handler"),
    currentAssignee: varchar("current_assignee", { length: 100 }),
    conflictRegNo: varchar("conflict_reg_no", { length: 20 }),
    createdAt: datetime("created_at").notNull().default(new Date()),
    updatedAt: datetime("updated_at").notNull().default(new Date()),
  },
  (table) => ({
    applicantIdIdx: index("idx_applicant_id").on(table.applicantIdNo),
    courseIdIdx: index("idx_course_id").on(table.courseId),
    statusIdx: index("idx_status").on(table.status),
  })
);

export const courses = mysqlTable("courses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).notNull().default("60.00"),
  description: text("description"),
  createdAt: datetime("created_at").notNull().default(new Date()),
});

export const materials = mysqlTable(
  "materials",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    type: mysqlEnum("type", ["id_copy", "certificate", "transcript", "photo", "other"]).notNull(),
    fileUrl: varchar("file_url", { length: 500 }),
    status: mysqlEnum("status", ["pending", "submitted", "verified", "rejected"])
      .notNull()
      .default("pending"),
    reviewedBy: varchar("reviewed_by", { length: 100 }),
    reviewNote: text("review_note"),
    createdAt: datetime("created_at").notNull().default(new Date()),
    updatedAt: datetime("updated_at").notNull().default(new Date()),
  },
  (table) => ({
    regIdx: index("idx_mat_reg").on(table.registrationId),
  })
);

export const grades = mysqlTable(
  "grades",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    courseId: varchar("course_id", { length: 36 }).notNull(),
    score: decimal("score", { precision: 5, scale: 2 }).notNull(),
    passed: int("passed", { unsigned: true }).notNull().default(0),
    recordedBy: varchar("recorded_by", { length: 100 }),
    recordedAt: datetime("recorded_at").notNull().default(new Date()),
  },
  (table) => ({
    regIdx: index("idx_grade_reg").on(table.registrationId),
  })
);

export const certificates = mysqlTable(
  "certificates",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    certNo: varchar("cert_no", { length: 30 }).notNull().unique(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    applicantName: varchar("applicant_name", { length: 100 }).notNull(),
    courseId: varchar("course_id", { length: 36 }).notNull(),
    issuedBy: varchar("issued_by", { length: 100 }).notNull(),
    issuedAt: datetime("issued_at").notNull().default(new Date()),
    reviewOpinion: text("review_opinion"),
    materialSnapshot: json("material_snapshot").$type<Record<string, unknown>>(),
    archivedAt: datetime("archived_at"),
    status: mysqlEnum("status", ["active", "archived", "revoked"]).notNull().default("active"),
  },
  (table) => ({
    regIdx: index("idx_cert_reg").on(table.registrationId),
  })
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    operator: varchar("operator", { length: 100 }).notNull(),
    operatorRole: mysqlEnum("operator_role", ["handler", "reviewer"]).notNull(),
    detail: text("detail"),
    createdAt: datetime("created_at").notNull().default(new Date()),
  },
  (table) => ({
    regIdx: index("idx_audit_reg").on(table.registrationId),
    createdIdx: index("idx_audit_created").on(table.createdAt),
  })
);

export const disputes = mysqlTable(
  "disputes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    registrationId: varchar("registration_id", { length: 36 }).notNull(),
    conflictRegNo: varchar("conflict_reg_no", { length: 20 }),
    reason: text("reason").notNull(),
    status: mysqlEnum("status", ["open", "under_review", "resolved", "rejected"])
      .notNull()
      .default("open"),
    submittedBy: varchar("submitted_by", { length: 100 }).notNull(),
    resolvedBy: varchar("resolved_by", { length: 100 }),
    resolution: text("resolution"),
    createdAt: datetime("created_at").notNull().default(new Date()),
    resolvedAt: datetime("resolved_at"),
  },
  (table) => ({
    regIdx: index("idx_dispute_reg").on(table.registrationId),
  })
);
