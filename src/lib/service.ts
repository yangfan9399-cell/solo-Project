import { db } from "../db";
import { registrations, materials, grades, certificates, auditLogs, disputes, courses } from "../db/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const STATUS_LABELS: Record<string, string> = {
  pending: "待审核",
  material_missing: "材料缺失",
  under_review: "审核中",
  qualified: "资格通过",
  unqualified: "资格不通过",
  grade_not_met: "成绩未达标",
  duplicate: "重复报名",
  course_completed: "课程完成",
  cert_issued: "已发证",
  archived: "已归档",
};

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
  materialId?: string;
  name: string;
  type: string;
  fileUrl?: string;
  operator: string;
}) {
  const reg = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, regId))
    .then((r) => r[0]);

  if (!reg) throw new Error("报名记录不存在");

  if (data.materialId) {
    const existing = await db
      .select()
      .from(materials)
      .where(and(eq(materials.id, data.materialId), eq(materials.registrationId, regId)))
      .then((r) => r[0]);

    if (!existing) throw new Error("材料记录不存在");

    await db
      .update(materials)
      .set({ status: "submitted", fileUrl: data.fileUrl || existing.fileUrl, updatedAt: new Date() })
      .where(eq(materials.id, data.materialId));

    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: regId,
      action: "supplement_material",
      operator: data.operator,
      operatorRole: "handler",
      detail: `经办人补交材料：${existing.name}（${existing.status} → submitted）`,
    });
  } else {
    await db.insert(materials).values({
      id: randomUUID(),
      registrationId: regId,
      name: data.name,
      type: data.type as any,
      fileUrl: data.fileUrl,
      status: "submitted",
    });
    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: regId,
      action: "supplement_material",
      operator: data.operator,
      operatorRole: "handler",
      detail: `经办人补交材料：${data.name}`,
    });
  }

  if (reg.status === "material_missing") {
    const allMaterials = await db
      .select()
      .from(materials)
      .where(eq(materials.registrationId, regId));
    const hasMissing = allMaterials.some((m) => m.status === "pending" || m.status === "rejected");

    await db
      .update(registrations)
      .set({
        status: hasMissing ? "material_missing" : "under_review",
        currentRole: "reviewer",
        currentAssignee: "复核人",
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, regId));

    await db.insert(auditLogs).values({
      id: randomUUID(),
      registrationId: regId,
      action: "route_to_reviewer",
      operator: data.operator,
      operatorRole: "handler",
      detail: hasMissing ? "仍有材料缺失，提交复核人审阅" : "材料已补齐，流转复核人审核",
    });
  } else {
    await db
      .update(registrations)
      .set({ updatedAt: new Date() })
      .where(eq(registrations.id, regId));
  }
}

export async function updateGrade(regId: string, data: {
  courseId: string;
  score: string;
  operator: string;
}) {
  const reg = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, regId))
    .then((r) => r[0]);

  if (!reg) throw new Error("报名记录不存在");

  if (reg.status === "duplicate") throw new Error("重复报名，不可更新成绩");
  if (reg.status === "cert_issued") throw new Error("已发证，不可更新成绩");
  if (reg.status === "archived") throw new Error("已归档，不可更新成绩");

  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, data.courseId))
    .then((r) => r[0]);

  const passingScore = Number(course?.passingScore ?? 60);
  const score = Number(data.score);
  const passed = score >= passingScore ? 1 : 0;

  const existingGrade = await db
    .select()
    .from(grades)
    .where(and(eq(grades.registrationId, regId), eq(grades.courseId, data.courseId)))
    .then((r) => r[0]);

  if (existingGrade) {
    await db
      .update(grades)
      .set({ score: data.score, passed, recordedBy: data.operator, recordedAt: new Date() })
      .where(eq(grades.id, existingGrade.id));
  } else {
    await db.insert(grades).values({
      id: randomUUID(),
      registrationId: regId,
      courseId: data.courseId,
      score: data.score,
      passed,
      recordedBy: data.operator,
    });
  }

  const newStatus = passed ? "course_completed" : "grade_not_met";
  const newRole: "handler" | "reviewer" = passed ? "reviewer" : "handler";
  const newAssignee = passed ? "复核人" : "经办人";

  await db
    .update(registrations)
    .set({ status: newStatus, currentRole: newRole, currentAssignee: newAssignee, updatedAt: new Date() })
    .where(eq(registrations.id, regId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: "record_grade",
    operator: data.operator,
    operatorRole: "handler",
    detail: `成绩录入：${data.score}分，${passed ? `达标，流转复核人确认发证（要求${passingScore}分）` : `未达标（要求${passingScore}分），当前责任人：经办人`}`,
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
    throw new Error(`重复报名（冲突编号：${reg.conflictRegNo}），不可审核通过。如需处理请提交资格争议`);
  }

  if (reg.status === "cert_issued") {
    throw new Error("已发证，不可再审核资格");
  }

  if (reg.status === "archived") {
    throw new Error("已归档，不可再审核资格");
  }

  const newStatus = data.qualified ? "qualified" : "unqualified";
  const newRole: "handler" | "reviewer" = data.qualified ? "reviewer" : "reviewer";
  const newAssignee = data.qualified ? "复核人" : data.operator;

  await db
    .update(registrations)
    .set({
      status: newStatus,
      currentRole: newRole,
      currentAssignee: newAssignee,
      updatedAt: new Date(),
    })
    .where(eq(registrations.id, regId));

  await db.insert(auditLogs).values({
    id: randomUUID(),
    registrationId: regId,
    action: data.qualified ? "review_qualified" : "review_unqualified",
    operator: data.operator,
    operatorRole: "reviewer",
    detail: data.qualified ? `${data.opinion}（资格通过，复核人可确认发证）` : `${data.opinion}（资格不通过）`,
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
    throw new Error(`重复报名，禁止发放证书（冲突编号：${reg.conflictRegNo}）`);
  }

  if (reg.status === "material_missing") {
    throw new Error("材料缺失，请先由经办人补齐材料后再发证");
  }

  if (reg.status === "grade_not_met") {
    throw new Error("成绩未达标，请先由经办人更新成绩后再发证");
  }

  if (reg.status === "unqualified") {
    throw new Error("资格审核未通过，不可发放证书");
  }

  if (reg.status === "pending" || reg.status === "under_review") {
    throw new Error("资格尚未审核，请先完成资格审核");
  }

  if (reg.status !== "course_completed" && reg.status !== "qualified") {
    throw new Error(`当前状态为"${STATUS_LABELS[reg.status] || reg.status}"，不可发放证书`);
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
