import {
  mockUsers,
  mockTeams,
  mockWorkers,
  mockAreas,
  mockPermits,
  mockPermitHistories,
  mockPermitWorkers,
} from "./mockData";
import type {
  Permit,
  PermitHistory,
  ConstructionTeam,
  Worker,
  ConstructionArea,
  User,
} from "./types";
import { generatePermitNumber } from "./utils";

let permits = [...mockPermits];
let permitHistories = [...mockPermitHistories];
let permitWorkers = [...mockPermitWorkers];
let nextPermitId = mockPermits.length + 1;
let nextHistoryId = mockPermitHistories.length + 1;
let nextPermitWorkerId = mockPermitWorkers.length + 1;

export async function getPermits(filters?: {
  status?: string;
  constructionType?: string;
  areaId?: number;
  search?: string;
}): Promise<Permit[]> {
  let result = [...permits];

  if (filters?.status) {
    result = result.filter((p) => p.status === filters.status);
  }
  if (filters?.constructionType) {
    result = result.filter((p) => p.constructionType === filters.constructionType);
  }
  if (filters?.areaId) {
    result = result.filter((p) => p.areaId === filters.areaId);
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.permitNumber.toLowerCase().includes(search) ||
        p.workContent.toLowerCase().includes(search)
    );
  }

  return result.sort((a, b) => b.id - a.id);
}

export async function getPermitById(id: number): Promise<Permit | undefined> {
  return permits.find((p) => p.id === id);
}

export async function getPermitHistories(
  permitId: number
): Promise<PermitHistory[]> {
  return permitHistories
    .filter((h) => h.permitId === permitId)
    .sort((a, b) => a.id - b.id);
}

export async function getPermitWorkers(
  permitId: number
): Promise<Worker[]> {
  const pwList = permitWorkers.filter((pw) => pw.permitId === permitId);
  const workerIds = pwList.map((pw) => pw.workerId);
  return mockWorkers.filter((w) => workerIds.includes(w.id));
}

export async function getTeams(): Promise<ConstructionTeam[]> {
  return mockTeams;
}

export async function getTeamById(id: number): Promise<ConstructionTeam | undefined> {
  return mockTeams.find((t) => t.id === id);
}

export async function getWorkersByTeamId(teamId: number): Promise<Worker[]> {
  return mockWorkers.filter((w) => w.teamId === teamId);
}

export async function getAreas(): Promise<ConstructionArea[]> {
  return mockAreas.filter((a) => a.isActive);
}

export async function getAreaById(id: number): Promise<ConstructionArea | undefined> {
  return mockAreas.find((a) => a.id === id);
}

export async function getUsers(): Promise<User[]> {
  return mockUsers;
}

export async function getUserById(id: number): Promise<User | undefined> {
  return mockUsers.find((u) => u.id === id);
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
  const newPermit: Permit = {
    id: nextPermitId++,
    permitNumber: generatePermitNumber(),
    teamId: data.teamId,
    areaId: data.areaId,
    constructionType: data.constructionType,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    workContent: data.workContent,
    status: data.hasDocuments ? "PENDING_AREA_CONFIRM" : "PENDING_DOCUMENT",
    securityOfficerId: 1,
    hasDocuments: data.hasDocuments,
    documentMissingReason: data.documentMissingReason,
    hasAreaConflict: false,
    safetyBriefingStatus: "PENDING",
    safetyBriefingEvidence: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    anomalyType: data.hasDocuments ? undefined : "DOCUMENT_MISSING",
    anomalyReason: data.hasDocuments ? undefined : "证件缺失",
  };

  permits.push(newPermit);

  for (const workerId of data.workerIds) {
    permitWorkers.push({
      id: nextPermitWorkerId++,
      permitId: newPermit.id,
      workerId,
      createdAt: new Date().toISOString(),
    });
  }

  permitHistories.push({
    id: nextHistoryId++,
    permitId: newPermit.id,
    action: "CREATE",
    statusTo: "DRAFT",
    operatorId: 1,
    operatorName: "张安保",
    operatorRole: "SECURITY_OFFICER",
    remark: "创建施工许可申请",
    createdAt: new Date().toISOString(),
  });

  if (data.hasDocuments) {
    permitHistories.push({
      id: nextHistoryId++,
      permitId: newPermit.id,
      action: "SUBMIT",
      statusFrom: "DRAFT",
      statusTo: "PENDING_AREA_CONFIRM",
      operatorId: 1,
      operatorName: "张安保",
      operatorRole: "SECURITY_OFFICER",
      remark: "提交审核，等待工程负责人确认施工区域",
      createdAt: new Date().toISOString(),
    });
  } else {
    permitHistories.push({
      id: nextHistoryId++,
      permitId: newPermit.id,
      action: "REJECT_DOCUMENT",
      statusFrom: "DRAFT",
      statusTo: "PENDING_DOCUMENT",
      operatorId: 1,
      operatorName: "张安保",
      operatorRole: "SECURITY_OFFICER",
      remark: data.documentMissingReason || "证件不全，需要补充",
      createdAt: new Date().toISOString(),
    });
  }

  return newPermit;
}

export async function checkAreaConflict(
  areaId: number,
  startDate: string,
  endDate: string,
  excludePermitId?: number
): Promise<{ hasConflict: boolean; conflictingPermits: Permit[] }> {
  const conflictingPermits = permits.filter((p) => {
    if (excludePermitId && p.id === excludePermitId) return false;
    if (p.areaId !== areaId) return false;
    if (p.status === "COMPLETED" || p.status === "AREA_CONFLICT") return false;

    const pStart = new Date(p.startDate);
    const pEnd = new Date(p.endDate);
    const nStart = new Date(startDate);
    const nEnd = new Date(endDate);

    return nStart <= pEnd && nEnd >= pStart;
  });

  return {
    hasConflict: conflictingPermits.length > 0,
    conflictingPermits,
  };
}

export async function confirmArea(permitId: number): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.status = "PENDING_SAFETY_BRIEFING";
  permit.engineeringManagerId = 2;
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "CONFIRM_AREA",
    statusFrom: "PENDING_AREA_CONFIRM",
    statusTo: "PENDING_SAFETY_BRIEFING",
    operatorId: 2,
    operatorName: "李工程",
    operatorRole: "ENGINEERING_MANAGER",
    remark: "施工区域确认无误",
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function markAreaConflict(
  permitId: number,
  conflictDetail: string
): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.status = "AREA_CONFLICT";
  permit.hasAreaConflict = true;
  permit.areaConflictDetail = conflictDetail;
  permit.anomalyType = "AREA_CONFLICT";
  permit.anomalyReason = "施工区域冲突";
  permit.engineeringManagerId = 2;
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "AREA_CONFLICT",
    statusFrom: "PENDING_AREA_CONFIRM",
    statusTo: "AREA_CONFLICT",
    operatorId: 2,
    operatorName: "李工程",
    operatorRole: "ENGINEERING_MANAGER",
    remark: conflictDetail,
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function updateAreaAndResubmit(
  permitId: number,
  areaId: number,
  startDate: string,
  endDate: string
): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.areaId = areaId;
  permit.startDate = startDate;
  permit.endDate = endDate;
  permit.status = "PENDING_AREA_CONFIRM";
  permit.hasAreaConflict = false;
  permit.areaConflictDetail = undefined;
  permit.anomalyType = undefined;
  permit.anomalyReason = undefined;
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "RESUBMIT_AREA",
    statusFrom: "AREA_CONFLICT",
    statusTo: "PENDING_AREA_CONFIRM",
    operatorId: 1,
    operatorName: "张安保",
    operatorRole: "SECURITY_OFFICER",
    remark: "调整施工区域/时间后重新提交",
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function confirmSafety(permitId: number): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.status = "APPROVED";
  permit.safetyBriefingStatus = "COMPLETED";
  permit.safetyReviewerId = 3;
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "CONFIRM_SAFETY",
    statusFrom: "PENDING_SAFETY_BRIEFING",
    statusTo: "APPROVED",
    operatorId: 3,
    operatorName: "王安全",
    operatorRole: "SAFETY_REVIEWER",
    remark: "安全交底完成，施工许可已批准",
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function rejectSafety(
  permitId: number,
  reason: string
): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.status = "SAFETY_BRIEFING_REJECTED";
  permit.safetyBriefingStatus = "REJECTED";
  permit.safetyRejectReason = reason;
  permit.safetyReviewerId = 3;
  permit.anomalyType = "SAFETY_BRIEFING_FAILED";
  permit.anomalyReason = "安全交底未通过";
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "REJECT_SAFETY",
    statusFrom: "PENDING_SAFETY_BRIEFING",
    statusTo: "SAFETY_BRIEFING_REJECTED",
    operatorId: 3,
    operatorName: "王安全",
    operatorRole: "SAFETY_REVIEWER",
    remark: reason,
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function resubmitSafety(permitId: number): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.status = "PENDING_SAFETY_BRIEFING";
  permit.safetyBriefingStatus = "PENDING";
  permit.safetyRejectReason = undefined;
  permit.anomalyType = undefined;
  permit.anomalyReason = undefined;
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "RESUBMIT_SAFETY",
    statusFrom: "SAFETY_BRIEFING_REJECTED",
    statusTo: "PENDING_SAFETY_BRIEFING",
    operatorId: 1,
    operatorName: "张安保",
    operatorRole: "SECURITY_OFFICER",
    remark: "重新提交安全交底审核",
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function supplyDocuments(
  permitId: number
): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.status = "PENDING_AREA_CONFIRM";
  permit.hasDocuments = true;
  permit.documentMissingReason = undefined;
  permit.anomalyType = undefined;
  permit.anomalyReason = undefined;
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "SUPPLY_DOCUMENTS",
    statusFrom: "PENDING_DOCUMENT",
    statusTo: "PENDING_AREA_CONFIRM",
    operatorId: 1,
    operatorName: "张安保",
    operatorRole: "SECURITY_OFFICER",
    remark: "证件已补齐，提交区域确认",
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function checkIn(permitId: number): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  permit.status = "IN_PROGRESS";
  permit.actualCheckIn = new Date().toISOString();
  permit.checkInTime = new Date().toISOString();
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "CHECK_IN",
    statusFrom: "APPROVED",
    statusTo: "IN_PROGRESS",
    operatorId: 1,
    operatorName: "张安保",
    operatorRole: "SECURITY_OFFICER",
    remark: "施工队入园登记",
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function checkOut(permitId: number): Promise<Permit | undefined> {
  const permit = permits.find((p) => p.id === permitId);
  if (!permit) return undefined;

  const now = new Date();
  const actualCheckIn = permit.actualCheckIn
    ? new Date(permit.actualCheckIn)
    : now;
  const durationMs = now.getTime() - actualCheckIn.getTime();
  const durationHours = Math.round(durationMs / (1000 * 60 * 60));

  const plannedEnd = new Date(`${permit.endDate}T${permit.endTime}`);
  if (now > plannedEnd) {
    permit.anomalyType = "OVERSTAY";
    permit.anomalyReason = "超时滞留";
  }

  permit.status = "COMPLETED";
  permit.actualCheckOut = now.toISOString();
  permit.checkOutTime = now.toISOString();
  permit.stayDurationHours = durationHours;
  permit.updatedAt = new Date().toISOString();

  permitHistories.push({
    id: nextHistoryId++,
    permitId: permit.id,
    action: "CHECK_OUT",
    statusFrom: "IN_PROGRESS",
    statusTo: "COMPLETED",
    operatorId: 1,
    operatorName: "张安保",
    operatorRole: "SECURITY_OFFICER",
    remark: `施工队离场核销，实际滞留${durationHours}小时`,
    createdAt: new Date().toISOString(),
  });

  return permit;
}

export async function getStatistics() {
  const completedPermits = permits.filter((p) => p.status === "COMPLETED");
  const totalPermits = permits.length;
  const anomalyPermits = permits.filter((p) => p.anomalyType && p.anomalyType !== "NONE");

  const byType: Record<string, number> = {};
  const byArea: Record<string, number> = {};
  const byAnomaly: Record<string, number> = {};
  let totalStayHours = 0;
  let completedCount = 0;

  for (const permit of permits) {
    byType[permit.constructionType] = (byType[permit.constructionType] || 0) + 1;

    const area = mockAreas.find((a) => a.id === permit.areaId);
    if (area) {
      byArea[area.name] = (byArea[area.name] || 0) + 1;
    }

    if (permit.anomalyType && permit.anomalyType !== "NONE") {
      byAnomaly[permit.anomalyType] = (byAnomaly[permit.anomalyType] || 0) + 1;
    } else if (!permit.anomalyType) {
      byAnomaly["NONE"] = (byAnomaly["NONE"] || 0) + 1;
    }

    if (permit.stayDurationHours) {
      totalStayHours += permit.stayDurationHours;
      completedCount++;
    }
  }

  const avgStayHours = completedCount > 0 ? Math.round(totalStayHours / completedCount) : 0;

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
