import { db } from "~/db";
import {
  users,
  constructionTeams,
  workers,
  constructionAreas,
  permits,
  permitHistories,
  permitWorkers,
} from "~/db/schema";
import { eq, and, or, like, desc, between, ne, isNull, inArray } from "drizzle-orm";
import type {
  Permit,
  PermitHistory,
  ConstructionTeam,
  Worker,
  ConstructionArea,
  User,
} from "./types";
import { generatePermitNumber } from "./utils";

function formatDateField(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

function mapPermit(p: any): Permit {
  return {
    ...p,
    createdAt: formatDateField(p.createdAt),
    updatedAt: formatDateField(p.updatedAt),
    checkInTime: p.checkInTime ? formatDateField(p.checkInTime) : undefined,
    checkOutTime: p.checkOutTime ? formatDateField(p.checkOutTime) : undefined,
    actualCheckIn: p.actualCheckIn ? formatDateField(p.actualCheckIn) : undefined,
    actualCheckOut: p.actualCheckOut ? formatDateField(p.actualCheckOut) : undefined,
    safetyBriefingEvidence: p.safetyBriefingEvidence as
      | Array<{ type: string; url: string; description: string }>
      | undefined,
  };
}

function mapTeam(t: any): ConstructionTeam {
  return {
    ...t,
    createdAt: formatDateField(t.createdAt),
  };
}

function mapWorker(w: any): Worker {
  return {
    ...w,
    certExpireDate: w.certExpireDate
      ? typeof w.certExpireDate === "string"
        ? w.certExpireDate
        : w.certExpireDate.toISOString?.().split("T")[0] || ""
      : undefined,
    createdAt: formatDateField(w.createdAt),
  };
}

function mapArea(a: any): ConstructionArea {
  return {
    ...a,
    createdAt: formatDateField(a.createdAt),
  };
}

function mapUser(u: any): User {
  return {
    ...u,
    createdAt: formatDateField(u.createdAt),
  };
}

function mapHistory(h: any): PermitHistory {
  return {
    ...h,
    createdAt: formatDateField(h.createdAt),
  };
}

export async function getPermits(filters?: {
  status?: string;
  constructionType?: string;
  areaId?: number;
  search?: string;
}): Promise<Permit[]> {
  const conditions: any[] = [];

  if (filters?.status) {
    conditions.push(eq(permits.status, filters.status));
  }
  if (filters?.constructionType) {
    conditions.push(eq(permits.constructionType, filters.constructionType));
  }
  if (filters?.areaId) {
    conditions.push(eq(permits.areaId, filters.areaId));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(permits.permitNumber, `%${filters.search}%`),
        like(permits.workContent, `%${filters.search}%`)
      )
    );
  }

  const result = await db
    .select()
    .from(permits)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(permits.id));

  return result.map(mapPermit);
}

export async function getPermitById(id: number): Promise<Permit | undefined> {
  const result = await db
    .select()
    .from(permits)
    .where(eq(permits.id, id))
    .limit(1);

  return result.length > 0 ? mapPermit(result[0]) : undefined;
}

export async function getPermitHistories(
  permitId: number
): Promise<PermitHistory[]> {
  const result = await db
    .select()
    .from(permitHistories)
    .where(eq(permitHistories.permitId, permitId))
    .orderBy(permitHistories.id);

  return result.map(mapHistory);
}

export async function getPermitWorkers(
  permitId: number
): Promise<Worker[]> {
  const pwList = await db
    .select()
    .from(permitWorkers)
    .where(eq(permitWorkers.permitId, permitId));

  if (pwList.length === 0) return [];

  const workerIds = pwList.map((pw) => pw.workerId);
  const workerList = await db
    .select()
    .from(workers)
    .where(inArray(workers.id, workerIds));

  return workerList.map(mapWorker);
}

export async function getTeams(): Promise<ConstructionTeam[]> {
  const result = await db.select().from(constructionTeams);
  return result.map(mapTeam);
}

export async function getTeamById(
  id: number
): Promise<ConstructionTeam | undefined> {
  const result = await db
    .select()
    .from(constructionTeams)
    .where(eq(constructionTeams.id, id))
    .limit(1);
  return result.length > 0 ? mapTeam(result[0]) : undefined;
}

export async function getWorkersByTeamId(teamId: number): Promise<Worker[]> {
  const result = await db
    .select()
    .from(workers)
    .where(eq(workers.teamId, teamId));
  return result.map(mapWorker);
}

export async function getAreas(): Promise<ConstructionArea[]> {
  const result = await db
    .select()
    .from(constructionAreas)
    .where(eq(constructionAreas.isActive, true));
  return result.map(mapArea);
}

export async function getAreaById(
  id: number
): Promise<ConstructionArea | undefined> {
  const result = await db
    .select()
    .from(constructionAreas)
    .where(eq(constructionAreas.id, id))
    .limit(1);
  return result.length > 0 ? mapArea(result[0]) : undefined;
}

export async function getUsers(): Promise<User[]> {
  const result = await db.select().from(users);
  return result.map(mapUser);
}

export async function getUserById(id: number): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result.length > 0 ? mapUser(result[0]) : undefined;
}

export interface CreatePermitData {
  teamId: number;
  areaId: number;
  constructionType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  workContent: string;
  workerIds: number[];
  hasDocuments: boolean;
  documentMissingReason?: string;
}

export async function createPermit(data: CreatePermitData): Promise<Permit> {
  return await db.transaction(async (tx) => {
    let status = data.hasDocuments ? "PENDING_AREA_CONFIRM" : "PENDING_DOCUMENT";
    let anomalyType = data.hasDocuments ? null : "DOCUMENT_MISSING";
    let anomalyReason = data.hasDocuments ? null : "证件缺失";
    let hasAreaConflict = false;
    let areaConflictDetail: string | null = null;

    if (data.hasDocuments) {
      const conditions: any[] = [
        eq(permits.areaId, data.areaId),
        ne(permits.status, "COMPLETED"),
        ne(permits.status, "AREA_CONFLICT"),
      ];

      const allPermits = await tx
        .select()
        .from(permits)
        .where(and(...conditions));

      const conflictingPermits = allPermits.filter((p) => {
        const pStart = new Date(p.startDate as string);
        const pEnd = new Date(p.endDate as string);
        const nStart = new Date(data.startDate);
        const nEnd = new Date(data.endDate);
        return nStart <= pEnd && nEnd >= pStart;
      });

      if (conflictingPermits.length > 0) {
        status = "AREA_CONFLICT";
        anomalyType = "AREA_CONFLICT";
        anomalyReason = "施工区域冲突";
        hasAreaConflict = true;
        const conflictNames = conflictingPermits.map(p => p.permitNumber).join("、");
        areaConflictDetail = `检测到与以下许可冲突：${conflictNames}`;
      }
    }

    const [newPermit] = await tx
      .insert(permits)
      .values({
        permitNumber: generatePermitNumber(),
        teamId: data.teamId,
        areaId: data.areaId,
        constructionType: data.constructionType,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        workContent: data.workContent,
        status,
        securityOfficerId: 1,
        hasDocuments: data.hasDocuments,
        documentMissingReason: data.documentMissingReason || null,
        hasAreaConflict,
        areaConflictDetail,
        safetyBriefingStatus: "PENDING",
        safetyBriefingEvidence: [],
        anomalyType,
        anomalyReason,
      })
      .returning();

    for (const workerId of data.workerIds) {
      await tx.insert(permitWorkers).values({
        permitId: newPermit.id,
        workerId,
      });
    }

    await tx.insert(permitHistories).values({
      permitId: newPermit.id,
      action: "CREATE",
      statusTo: "DRAFT",
      operatorId: 1,
      operatorName: "张安保",
      operatorRole: "SECURITY_OFFICER",
      remark: "创建施工许可申请",
    });

    if (data.hasDocuments) {
      if (hasAreaConflict) {
        await tx.insert(permitHistories).values({
          permitId: newPermit.id,
          action: "AREA_CONFLICT",
          statusFrom: "DRAFT",
          statusTo: "AREA_CONFLICT",
          operatorId: 1,
          operatorName: "张安保",
          operatorRole: "SECURITY_OFFICER",
          remark: areaConflictDetail || "检测到区域冲突",
        });
      } else {
        await tx.insert(permitHistories).values({
          permitId: newPermit.id,
          action: "SUBMIT",
          statusFrom: "DRAFT",
          statusTo: "PENDING_AREA_CONFIRM",
          operatorId: 1,
          operatorName: "张安保",
          operatorRole: "SECURITY_OFFICER",
          remark: "提交审核，等待工程负责人确认施工区域",
        });
      }
    } else {
      await tx.insert(permitHistories).values({
        permitId: newPermit.id,
        action: "REJECT_DOCUMENT",
        statusFrom: "DRAFT",
        statusTo: "PENDING_DOCUMENT",
        operatorId: 1,
        operatorName: "张安保",
        operatorRole: "SECURITY_OFFICER",
        remark: data.documentMissingReason || "证件不全，需要补充",
      });
    }

    return mapPermit(newPermit);
  });
}

export async function checkAreaConflict(
  areaId: number,
  startDate: string,
  endDate: string,
  excludePermitId?: number
): Promise<{ hasConflict: boolean; conflictingPermits: Permit[] }> {
  const conditions: any[] = [
    eq(permits.areaId, areaId),
    ne(permits.status, "COMPLETED"),
    ne(permits.status, "AREA_CONFLICT"),
  ];

  if (excludePermitId) {
    conditions.push(ne(permits.id, excludePermitId));
  }

  const allPermits = await db
    .select()
    .from(permits)
    .where(and(...conditions));

  const conflictingPermits = allPermits.filter((p) => {
    const pStart = new Date(p.startDate as string);
    const pEnd = new Date(p.endDate as string);
    const nStart = new Date(startDate);
    const nEnd = new Date(endDate);
    return nStart <= pEnd && nEnd >= pStart;
  });

  return {
    hasConflict: conflictingPermits.length > 0,
    conflictingPermits: conflictingPermits.map(mapPermit),
  };
}

export async function confirmArea(
  permitId: number
): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const conditions: any[] = [
      eq(permits.areaId, permit.areaId),
      ne(permits.status, "COMPLETED"),
      ne(permits.status, "AREA_CONFLICT"),
      ne(permits.id, permitId),
    ];

    const allPermits = await tx
      .select()
      .from(permits)
      .where(and(...conditions));

    const conflictingPermits = allPermits.filter((p) => {
      const pStart = new Date(p.startDate as string);
      const pEnd = new Date(p.endDate as string);
      const nStart = new Date(permit.startDate as string);
      const nEnd = new Date(permit.endDate as string);
      return nStart <= pEnd && nEnd >= pStart;
    });

    const hasConflict = conflictingPermits.length > 0;

    if (hasConflict) {
      const conflictDetail = `检测到与以下许可冲突：${conflictingPermits.map(p => p.permitNumber).join("、")}`;

      const [updated] = await tx
        .update(permits)
        .set({
          status: "AREA_CONFLICT",
          hasAreaConflict: true,
          areaConflictDetail: conflictDetail,
          anomalyType: "AREA_CONFLICT",
          anomalyReason: "施工区域冲突",
          engineeringManagerId: 2,
          updatedAt: new Date(),
        })
        .where(eq(permits.id, permitId))
        .returning();

      await tx.insert(permitHistories).values({
        permitId: permit.id,
        action: "AREA_CONFLICT",
        statusFrom: permit.status,
        statusTo: "AREA_CONFLICT",
        operatorId: 2,
        operatorName: "李工程",
        operatorRole: "ENGINEERING_MANAGER",
        remark: conflictDetail,
      });

      return mapPermit(updated);
    }

    const [updated] = await tx
      .update(permits)
      .set({
        status: "PENDING_SAFETY_BRIEFING",
        engineeringManagerId: 2,
        updatedAt: new Date(),
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "CONFIRM_AREA",
      statusFrom: "PENDING_AREA_CONFIRM",
      statusTo: "PENDING_SAFETY_BRIEFING",
      operatorId: 2,
      operatorName: "李工程",
      operatorRole: "ENGINEERING_MANAGER",
      remark: "施工区域确认无误",
    });

    return mapPermit(updated);
  });
}

export async function markAreaConflict(
  permitId: number,
  conflictDetail: string
): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const [updated] = await tx
      .update(permits)
      .set({
        status: "AREA_CONFLICT",
        hasAreaConflict: true,
        areaConflictDetail: conflictDetail,
        anomalyType: "AREA_CONFLICT",
        anomalyReason: "施工区域冲突",
        engineeringManagerId: 2,
        updatedAt: new Date(),
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "AREA_CONFLICT",
      statusFrom: "PENDING_AREA_CONFIRM",
      statusTo: "AREA_CONFLICT",
      operatorId: 2,
      operatorName: "李工程",
      operatorRole: "ENGINEERING_MANAGER",
      remark: conflictDetail,
    });

    return mapPermit(updated);
  });
}

export async function updateAreaAndResubmit(
  permitId: number,
  areaId: number,
  startDate: string,
  endDate: string
): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const conditions: any[] = [
      eq(permits.areaId, areaId),
      ne(permits.status, "COMPLETED"),
      ne(permits.status, "AREA_CONFLICT"),
      ne(permits.id, permitId),
    ];

    const allPermits = await tx
      .select()
      .from(permits)
      .where(and(...conditions));

    const conflictingPermits = allPermits.filter((p) => {
      const pStart = new Date(p.startDate as string);
      const pEnd = new Date(p.endDate as string);
      const nStart = new Date(startDate);
      const nEnd = new Date(endDate);
      return nStart <= pEnd && nEnd >= pStart;
    });

    const hasConflict = conflictingPermits.length > 0;
    const newStatus = hasConflict ? "AREA_CONFLICT" : "PENDING_AREA_CONFIRM";
    const newAnomalyType = hasConflict ? "AREA_CONFLICT" : null;
    const newAnomalyReason = hasConflict ? "施工区域冲突" : null;
    const conflictDetail = hasConflict
      ? `检测到与以下许可冲突：${conflictingPermits.map(p => p.permitNumber).join("、")}`
      : null;

    const [updated] = await tx
      .update(permits)
      .set({
        areaId,
        startDate,
        endDate,
        status: newStatus,
        hasAreaConflict: hasConflict,
        areaConflictDetail: conflictDetail,
        anomalyType: newAnomalyType,
        anomalyReason: newAnomalyReason,
        updatedAt: new Date(),
      })
      .where(eq(permits.id, permitId))
      .returning();

    if (hasConflict) {
      await tx.insert(permitHistories).values({
        permitId: permit.id,
        action: "AREA_CONFLICT",
        statusFrom: permit.status,
        statusTo: "AREA_CONFLICT",
        operatorId: 1,
        operatorName: "张安保",
        operatorRole: "SECURITY_OFFICER",
        remark: conflictDetail || "检测到区域冲突",
      });
    } else {
      await tx.insert(permitHistories).values({
        permitId: permit.id,
        action: "RESUBMIT_AREA",
        statusFrom: permit.status,
        statusTo: "PENDING_AREA_CONFIRM",
        operatorId: 1,
        operatorName: "张安保",
        operatorRole: "SECURITY_OFFICER",
        remark: "调整施工区域/时间后重新提交",
      });
    }

    return mapPermit(updated);
  });
}

export async function confirmSafety(
  permitId: number
): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const [updated] = await tx
      .update(permits)
      .set({
        status: "APPROVED",
        safetyBriefingStatus: "COMPLETED",
        safetyReviewerId: 3,
        updatedAt: new Date(),
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "CONFIRM_SAFETY",
      statusFrom: "PENDING_SAFETY_BRIEFING",
      statusTo: "APPROVED",
      operatorId: 3,
      operatorName: "王安全",
      operatorRole: "SAFETY_REVIEWER",
      remark: "安全交底完成，施工许可已批准",
    });

    return mapPermit(updated);
  });
}

export async function rejectSafety(
  permitId: number,
  reason: string
): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const [updated] = await tx
      .update(permits)
      .set({
        status: "SAFETY_BRIEFING_REJECTED",
        safetyBriefingStatus: "REJECTED",
        safetyRejectReason: reason,
        safetyReviewerId: 3,
        anomalyType: "SAFETY_BRIEFING_FAILED",
        anomalyReason: "安全交底未通过",
        updatedAt: new Date(),
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "REJECT_SAFETY",
      statusFrom: "PENDING_SAFETY_BRIEFING",
      statusTo: "SAFETY_BRIEFING_REJECTED",
      operatorId: 3,
      operatorName: "王安全",
      operatorRole: "SAFETY_REVIEWER",
      remark: reason,
    });

    return mapPermit(updated);
  });
}

export async function resubmitSafety(
  permitId: number
): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const [updated] = await tx
      .update(permits)
      .set({
        status: "PENDING_SAFETY_BRIEFING",
        safetyBriefingStatus: "PENDING",
        safetyRejectReason: null,
        anomalyType: null,
        anomalyReason: null,
        updatedAt: new Date(),
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "RESUBMIT_SAFETY",
      statusFrom: "SAFETY_BRIEFING_REJECTED",
      statusTo: "PENDING_SAFETY_BRIEFING",
      operatorId: 1,
      operatorName: "张安保",
      operatorRole: "SECURITY_OFFICER",
      remark: "重新提交安全交底审核",
    });

    return mapPermit(updated);
  });
}

export async function supplyDocuments(
  permitId: number
): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const [updated] = await tx
      .update(permits)
      .set({
        status: "PENDING_AREA_CONFIRM",
        hasDocuments: true,
        documentMissingReason: null,
        anomalyType: null,
        anomalyReason: null,
        updatedAt: new Date(),
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "SUPPLY_DOCUMENTS",
      statusFrom: "PENDING_DOCUMENT",
      statusTo: "PENDING_AREA_CONFIRM",
      operatorId: 1,
      operatorName: "张安保",
      operatorRole: "SECURITY_OFFICER",
      remark: "证件已补齐，提交区域确认",
    });

    return mapPermit(updated);
  });
}

export async function checkIn(permitId: number): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const now = new Date();
    const [updated] = await tx
      .update(permits)
      .set({
        status: "IN_PROGRESS",
        actualCheckIn: now,
        checkInTime: now,
        updatedAt: now,
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "CHECK_IN",
      statusFrom: "APPROVED",
      statusTo: "IN_PROGRESS",
      operatorId: 1,
      operatorName: "张安保",
      operatorRole: "SECURITY_OFFICER",
      remark: "施工队入园登记",
    });

    return mapPermit(updated);
  });
}

export async function checkOut(permitId: number): Promise<Permit | undefined> {
  return await db.transaction(async (tx) => {
    const [permit] = await tx
      .select()
      .from(permits)
      .where(eq(permits.id, permitId))
      .limit(1);

    if (!permit) return undefined;

    const now = new Date();
    const actualCheckIn = permit.actualCheckIn
      ? permit.actualCheckIn instanceof Date
        ? permit.actualCheckIn
        : new Date(permit.actualCheckIn as unknown as string)
      : now;
    const durationMs = now.getTime() - actualCheckIn.getTime();
    const durationHours = Math.round(durationMs / (1000 * 60 * 60));

    const plannedEnd = new Date(
      `${permit.endDate}T${permit.endTime}`
    );

    let anomalyType = permit.anomalyType;
    let anomalyReason = permit.anomalyReason;
    if (now > plannedEnd && !permit.anomalyType) {
      anomalyType = "OVERSTAY";
      anomalyReason = "超时滞留";
    }

    const [updated] = await tx
      .update(permits)
      .set({
        status: "COMPLETED",
        actualCheckOut: now,
        checkOutTime: now,
        stayDurationHours: durationHours,
        anomalyType,
        anomalyReason,
        updatedAt: now,
      })
      .where(eq(permits.id, permitId))
      .returning();

    await tx.insert(permitHistories).values({
      permitId: permit.id,
      action: "CHECK_OUT",
      statusFrom: "IN_PROGRESS",
      statusTo: "COMPLETED",
      operatorId: 1,
      operatorName: "张安保",
      operatorRole: "SECURITY_OFFICER",
      remark: `施工队离场核销，实际滞留${durationHours}小时`,
    });

    return mapPermit(updated);
  });
}

export async function getStatistics() {
  const allPermits = await db.select().from(permits);
  const allAreas = await db.select().from(constructionAreas);

  const areaMap = new Map<number, string>();
  for (const area of allAreas) {
    areaMap.set(area.id, area.name);
  }

  const completedPermits = allPermits.filter((p) => p.status === "COMPLETED");
  const totalPermits = allPermits.length;
  const anomalyPermits = allPermits.filter(
    (p) => p.anomalyType && p.anomalyType !== "NONE"
  );

  const byType: Record<string, number> = {};
  const byArea: Record<string, number> = {};
  const byAnomaly: Record<string, number> = {};
  let totalStayHours = 0;
  let completedCount = 0;

  for (const permit of allPermits) {
    byType[permit.constructionType] =
      (byType[permit.constructionType] || 0) + 1;

    const areaName = areaMap.get(permit.areaId);
    if (areaName) {
      byArea[areaName] = (byArea[areaName] || 0) + 1;
    }

    if (permit.anomalyType && permit.anomalyType !== "NONE") {
      byAnomaly[permit.anomalyType] =
        (byAnomaly[permit.anomalyType] || 0) + 1;
    } else if (!permit.anomalyType) {
      byAnomaly["NONE"] = (byAnomaly["NONE"] || 0) + 1;
    }

    if (permit.stayDurationHours) {
      totalStayHours += permit.stayDurationHours;
      completedCount++;
    }
  }

  const avgStayHours =
    completedCount > 0 ? Math.round(totalStayHours / completedCount) : 0;

  const stayDurationDistribution = [
    { range: "0-8小时", count: 0 },
    { range: "8-24小时", count: 0 },
    { range: "24-48小时", count: 0 },
    { range: "48小时以上", count: 0 },
  ];

  for (const permit of completedPermits) {
    const hours = permit.stayDurationHours || 0;
    if (hours <= 8) stayDurationDistribution[0].count++;
    else if (hours <= 24) stayDurationDistribution[1].count++;
    else if (hours <= 48) stayDurationDistribution[2].count++;
    else stayDurationDistribution[3].count++;
  }

  return {
    totalPermits,
    completedPermits: completedPermits.length,
    anomalyCount: anomalyPermits.length,
    avgStayHours,
    byType,
    byArea,
    byAnomaly,
    stayDurationDistribution,
  };
}
