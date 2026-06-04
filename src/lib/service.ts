import { db } from "../db";
import { registrations, materials, grades, certificates, auditLogs, disputes, courses } from "../db/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function checkDuplicate(applicantIdNo: string, courseId: string, excludeRegId?: string) {
  const conditions = [eq(registrations.applicantIdNo, applicantIdNo), eq(registrations.courseId, courseId)];
  if (excludeRegId) {
    conditions.push(sql`${registrations.id} != ${excludeRegId}`);
  }
  const existing = await db
    .select()
    .from(registrations)
    .where(and(...conditions));
  return existing;
}

export async function createRegistration(data: {
  applicantName: string;
  applicantIdNo: string;
  source: string;
  courseId: string;
}) {
  const id = randomUUID();
  const regNo = `REG-${new Date().getFullYear()}-${String(await getNextRegSeq()).padStart(4, "0")}`;

  const duplicates = await checkDuplicate(data.applicantIdNo, data.courseId);
  let status: typeof registrations.$inferInsert.status = "pending";
  let conflictRegNo: string | null = null;

  if (duplicates.length > 0) {
    status = "duplicate";
    conflictRegNo = duplicates[0].regNo;
    await db
      .update(registrations)
      .set({ status: "duplicate", conflictRegNo: regNo, updatedAt: new Date() })
      .where(eq(registrations.id, duplicates[0].id));
    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: duplicates[0].id,
      action: "detect_duplicate",
      operator: "系统",
      operatorRole: "reviewer",
      detail: `检测到重复报名，冲突报名编号：${regNo}`,
    });
  }

  await db.insert(registrations).values({
    id,
    regNo,
    applicantName: data.applicantName,
    applicantIdNo: data.applicantIdNo,
    source: data.source,
    courseId: data.courseId,
    status,
    conflictRegNo,
    currentAssignee: "经办人",
  });

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: id,
    action: "submit_registration",
    operator: "系统",
    operatorRole: "handler",
    detail: `${data.applicantName}提交报名申请`,
  });

  return { id, regNo, isDuplicate: duplicates.length > 0, conflictRegNo };
}

async function getNextRegSeq() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrations);
  return (result[0]?.count ?? 0) + 1;
}

export async function getRegistrations(filters?: {
  status?: string;
  keyword?: string;
}) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(registrations.status, filters.status as any));
  }
  if (filters?.keyword) {
    conditions.push(
      or(
        like(registrations.applicantName, `%${filters.keyword}%`),
        like(registrations.regNo, `%${filters.keyword}%`)
      )!
    );
  }
  return db
    .select()
    .from(registrations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(registrations.createdAt));
}

export async function getRegistrationDetail(regId: string) {
  const reg = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, regId))
    .then((rows) => rows[0]);

  if (!reg) return null;

  const [courseList, materialList, gradeList, logList, certList, disputeList] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, reg.courseId)).then((r) => r[0]),
    db.select().from(materials).where(eq(materials.registrationId, regId)),
    db.select().from(grades).where(eq(grades.registrationId, regId)),
    db.select().from(auditLogs).where(eq(auditLogs.registrationId, regId)).orderBy(desc(auditLogs.createdAt)),
    db.select().from(certificates).where(eq(certificates.registrationId, regId)),
    db.select().from(disputes).where(eq(disputes.registrationId, regId)),
  ]);

  return {
    registration: reg,
    course: courseList,
    materials: materialList,
    grades: gradeList,
    auditLogs: logList,
    certificates: certList,
    disputes: disputeList,
  };
}

export async function supplementMaterial(regId: string, data: {
  name: string;
  type: string;
  fileUrl?: string;
  operator: string;
}) {
  await db.insert(materials).values({
    id: randomUUID(),
    registrationId: regId,
    name: data.name,
    type: data.type as any,
    fileUrl: data.fileUrl,
    status: "submitted",
  });
  await db
    .update(registrations)
    .set({ updatedAt: new Date() })
    .where(eq(registrations.id, regId));
  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "supplement_material",
    operator: data.operator,
    operatorRole: "handler",
    detail: `经办人补交材料：${data.name}`,
  });
}

export async function updateGrade(regId: string, data: {
  courseId: string;
  score: string;
  operator: string;
}) {
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, data.courseId))
    .then((r) => r[0]);

  const passingScore = Number(course?.passingScore ?? 60);
  const score = Number(data.score);
  const passed = score >= passingScore ? 1 : 0;

  await db.insert(grades).values({
    id: randomUUID(),
    registrationId: regId,
    courseId: data.courseId,
    score: data.score,
    passed,
    recordedBy: data.operator,
  });

  const newStatus = passed ? "course_completed" : "grade_not_met";
  await db
    .update(registrations)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(registrations.id, regId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "record_grade",
    operator: data.operator,
    operatorRole: "handler",
    detail: `成绩录入：${data.score}分，${passed ? "达标" : `未达标（要求${passingScore}分）`}`,
  });

  return { passed, passingScore };
}

export async function reviewQualification(regId: string, data: {
  qualified: boolean;
  operator: string;
  opinion: string;
}) {
  const reg = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, regId))
    .then((r) => r[0]);

  if (!reg) throw new Error("报名记录不存在");

  if (reg.status === "duplicate") {
    throw new Error("重复报名，不可审核通过");
  }

  const newStatus = data.qualified ? "qualified" : "unqualified";
  const newRole = data.qualified ? "handler" : "reviewer";

  await db
    .update(registrations)
    .set({
      status: newStatus,
      currentRole: newRole,
      currentAssignee: data.qualified ? "经办人" : data.operator,
      updatedAt: new Date(),
    })
    .where(eq(registrations.id, regId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: data.qualified ? "review_qualified" : "review_unqualified",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: data.opinion,
  });
}

export async function markMaterialMissing(regId: string, data: {
  operator: string;
  note: string;
}) {
  await db
    .update(registrations)
    .set({
      status: "material_missing",
      currentRole: "handler",
      updatedAt: new Date(),
    })
    .where(eq(registrations.id, regId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "mark_material_missing",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: data.note,
  });
}

export async function returnToHandler(regId: string, data: {
  operator: string;
  reason: string;
}) {
  await db
    .update(registrations)
    .set({
      currentRole: "handler",
      currentAssignee: "经办人",
      updatedAt: new Date(),
    })
    .where(eq(registrations.id, regId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "return_to_handler",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: data.reason,
  });
}

export async function issueCertificate(regId: string, data: {
  operator: string;
  reviewOpinion: string;
}) {
  const reg = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, regId))
    .then((r) => r[0]);

  if (!reg) throw new Error("报名记录不存在");

  if (reg.status === "duplicate") {
    throw new Error("重复报名，禁止发放证书");
  }

  if (reg.status !== "course_completed" && reg.status !== "qualified") {
    throw new Error("当前状态不可发放证书");
  }

  const materialList = await db
    .select()
    .from(materials)
    .where(eq(materials.registrationId, regId));

  const materialSnapshot: Record<string, unknown> = {};
  for (const m of materialList) {
    materialSnapshot[m.id] = {
      name: m.name,
      type: m.type,
      status: m.status,
      reviewNote: m.reviewNote,
    };
  }

  const certId = randomUUID();
  const certNo = `CERT-${new Date().getFullYear()}-${String(await getNextCertSeq()).padStart(4, "0")}`;

  await db.insert(certificates).values({
    id: certId,
    certNo,
    registrationId: regId,
    applicantName: reg.applicantName,
    courseId: reg.courseId,
    issuedBy: data.operator,
    reviewOpinion: data.reviewOpinion,
    materialSnapshot,
  });

  await db
    .update(registrations)
    .set({
      status: "cert_issued",
      updatedAt: new Date(),
    })
    .where(eq(registrations.id, regId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "issue_certificate",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: `发放证书：${certNo}，审核意见：${data.reviewOpinion}`,
  });

  return { certId, certNo };
}

async function getNextCertSeq() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(certificates);
  return (result[0]?.count ?? 0) + 1;
}

export async function archiveCertificate(certId: string, operator: string) {
  await db
    .update(certificates)
    .set({ status: "archived", archivedAt: new Date() })
    .where(eq(certificates.id, certId));

  const cert = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, certId))
    .then((r) => r[0]);

  if (cert) {
    await db
      .update(registrations)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(registrations.id, cert.registrationId));

    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: cert.registrationId,
      action: "archive_certificate",
      operator,
      operatorRole: "reviewer",
      detail: `证书归档：${cert.certNo}`,
    });
  }
}

export async function traceFromCertificate(certId: string) {
  const cert = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, certId))
    .then((r) => r[0]);

  if (!cert) return null;

  const materialList = await db
    .select()
    .from(materials)
    .where(eq(materials.registrationId, cert.registrationId));

  const logList = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.registrationId, cert.registrationId))
    .orderBy(desc(auditLogs.createdAt));

  return {
    certificate: cert,
    materials: materialList,
    auditLogs: logList,
  };
}

export async function createDispute(data: {
  registrationId: string;
  reason: string;
  submittedBy: string;
}) {
  const id = randomUUID();
  await db.insert(disputes).values({
    id,
    registrationId: data.registrationId,
    reason: data.reason,
    submittedBy: data.submittedBy,
  });

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: data.registrationId,
    action: "create_dispute",
    operator: data.submittedBy,
    operatorRole: "handler",
    detail: `提交资格争议：${data.reason}`,
  });

  return { id };
}

export async function resolveDispute(disputeId: string, data: {
  status: "resolved" | "rejected";
  resolution: string;
  resolvedBy: string;
}) {
  const dispute = await db
    .select()
    .from(disputes)
    .where(eq(disputes.id, disputeId))
    .then((r) => r[0]);

  if (!dispute) throw new Error("争议记录不存在");

  await db
    .update(disputes)
    .set({
      status: data.status,
      resolution: data.resolution,
      resolvedBy: data.resolvedBy,
      resolvedAt: new Date(),
    })
    .where(eq(disputes.id, disputeId));

  if (data.status === "resolved") {
    await db
      .update(registrations)
      .set({ status: "under_review", updatedAt: new Date() })
      .where(eq(registrations.id, dispute.registrationId));
  }

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: dispute.registrationId,
    action: "resolve_dispute",
    operator: data.resolvedBy,
    operatorRole: "reviewer",
    detail: `争议${data.status === "resolved" ? "解决" : "驳回"}：${data.resolution}`,
  });
}

export async function getDisputes(regId?: string) {
  if (regId) {
    return db.select().from(disputes).where(eq(disputes.registrationId, regId));
  }
  return db.select().from(disputes).orderBy(desc(disputes.createdAt));
}

export async function getCertificates() {
  return db.select().from(certificates).orderBy(desc(certificates.issuedAt));
}
