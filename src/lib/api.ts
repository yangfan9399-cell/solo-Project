import { prisma } from "./prisma";
import { HospitalizationStatus, AnomalyType, OrderStatus, FeeStatus } from "../types/enums";
import type {
  Hospitalization,
  Pet,
  Owner,
  Department,
  Staff,
  MedicalOrder,
  NursingRecord,
  FeeItem,
  FeeReview,
} from "@prisma/client";

export interface HospitalizationDetail extends Hospitalization {
  pet: Pet & { owner: Owner };
  department: Department;
  medicalOrders: MedicalOrder[];
  nursingRecords: NursingRecord[];
  feeItems: FeeItem[];
  feeReviews: FeeReview[];
}

export interface HospitalizationListItem extends Hospitalization {
  pet: Pet & { owner: Owner };
  department: Department;
}

function decimalToNumber(d: any): number {
  return d ? Number(d) : 0;
}

function convertFeeItem(item: any): FeeItem {
  return {
    ...item,
    unitPrice: decimalToNumber(item.unitPrice),
    totalPrice: decimalToNumber(item.totalPrice),
  } as FeeItem;
}

function convertFeeReview(review: any): FeeReview {
  return {
    ...review,
    totalAmount: decimalToNumber(review.totalAmount),
    actualAmount: review.actualAmount ? decimalToNumber(review.actualAmount) : null,
  } as FeeReview;
}

export async function getHospitalizations(
  status?: string,
  anomalyType?: string
): Promise<HospitalizationListItem[]> {
  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (anomalyType && anomalyType !== "ALL") {
    where.anomalyType = anomalyType;
  }

  const list = await prisma.hospitalization.findMany({
    where,
    include: {
      pet: {
        include: {
          owner: true,
        },
      },
      department: true,
    },
    orderBy: {
      admissionDate: "desc",
    },
  });

  return list as unknown as HospitalizationListItem[];
}

export async function getHospitalizationById(
  id: string
): Promise<HospitalizationDetail | null> {
  const hosp = await prisma.hospitalization.findUnique({
    where: { id },
    include: {
      pet: {
        include: {
          owner: true,
        },
      },
      department: true,
      medicalOrders: {
        orderBy: { createdAt: "desc" },
      },
      nursingRecords: {
        orderBy: { recordTime: "desc" },
      },
      feeItems: {
        orderBy: { createdAt: "asc" },
      },
      feeReviews: {
        orderBy: { reviewedAt: "desc" },
      },
    },
  });

  if (!hosp) return null;

  return {
    ...hosp,
    feeItems: hosp.feeItems.map(convertFeeItem) as any,
    feeReviews: hosp.feeReviews.map(convertFeeReview) as any,
  } as unknown as HospitalizationDetail;
}

export async function checkDischargeAllowed(
  hospitalizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const pendingOrders = await prisma.medicalOrder.count({
    where: {
      hospitalizationId,
      status: OrderStatus.PENDING,
    },
  });

  if (pendingOrders > 0) {
    return {
      allowed: false,
      reason: `存在 ${pendingOrders} 条待确认医嘱，请兽医确认后再办理出院`,
    };
  }

  const pendingFees = await prisma.feeItem.count({
    where: {
      hospitalizationId,
      status: FeeStatus.PENDING,
    },
  });

  if (pendingFees > 0) {
    return {
      allowed: false,
      reason: `存在 ${pendingFees} 项待确认费用，请财务确认后再办理出院`,
    };
  }

  const disputedFees = await prisma.feeItem.count({
    where: {
      hospitalizationId,
      status: FeeStatus.DISPUTED,
    },
  });

  if (disputedFees > 0) {
    return {
      allowed: false,
      reason: `存在 ${disputedFees} 项争议费用，请先处理费用争议`,
    };
  }

  return { allowed: true };
}

export async function getDepartments(): Promise<Department[]> {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getStaffByRole(role: string): Promise<Staff[]> {
  return prisma.staff.findMany({
    where: { role },
    orderBy: { name: "asc" },
  });
}

export async function getStaffById(id: string): Promise<Staff | null> {
  return prisma.staff.findUnique({
    where: { id },
  });
}

export interface StatisticsData {
  totalHospitalizations: number;
  inTreatment: number;
  discharged: number;
  totalRevenue: number;
  byDepartment: { name: string; count: number; revenue: number }[];
  byDisease: { name: string; count: number }[];
  byAnomalyType: { name: string; count: number }[];
  byStayDays: { range: string; count: number }[];
  averageStayDays: number;
}

export async function getStatistics(): Promise<StatisticsData> {
  const totalHospitalizations = await prisma.hospitalization.count();

  const inTreatment = await prisma.hospitalization.count({
    where: { status: HospitalizationStatus.IN_TREATMENT },
  });

  const discharged = await prisma.hospitalization.count({
    where: { status: HospitalizationStatus.DISCHARGED },
  });

  const settledFees = await prisma.feeItem.aggregate({
    _sum: { totalPrice: true },
    where: { status: FeeStatus.SETTLED },
  });
  const totalRevenue = decimalToNumber(settledFees._sum.totalPrice);

  const hospitalizations = await prisma.hospitalization.findMany({
    include: {
      department: true,
      feeItems: {
        where: { status: FeeStatus.SETTLED },
        select: { totalPrice: true },
      },
    },
  });

  const deptMap = new Map<string, { count: number; revenue: number }>();
  for (const h of hospitalizations) {
    const deptName = h.department.name;
    const rev = h.feeItems.reduce((sum, f) => sum + decimalToNumber(f.totalPrice), 0);
    const current = deptMap.get(deptName) || { count: 0, revenue: 0 };
    deptMap.set(deptName, { count: current.count + 1, revenue: current.revenue + rev });
  }
  const byDepartment = Array.from(deptMap.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));

  const diseaseMap = new Map<string, number>();
  for (const h of hospitalizations) {
    const d = h.primaryDiagnosis;
    diseaseMap.set(d, (diseaseMap.get(d) || 0) + 1);
  }
  const byDisease = Array.from(diseaseMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const anomalyMap = new Map<string, number>();
  for (const h of hospitalizations) {
    const type = h.anomalyType;
    anomalyMap.set(type, (anomalyMap.get(type) || 0) + 1);
  }
  const byAnomalyType = Array.from(anomalyMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const dayRanges = [
    { min: 0, max: 3, range: "0-3天" },
    { min: 3, max: 7, range: "3-7天" },
    { min: 7, max: 14, range: "7-14天" },
    { min: 14, max: 30, range: "14-30天" },
    { min: 30, max: Infinity, range: "30天以上" },
  ];
  const byStayDays = dayRanges.map((r) => ({ range: r.range, count: 0 }));
  let totalDays = 0;
  let dischargedCount = 0;

  for (const h of hospitalizations) {
    const end = h.dischargeDate || new Date();
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - h.admissionDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    for (let i = 0; i < dayRanges.length; i++) {
      if (days >= dayRanges[i].min && days < dayRanges[i].max) {
        byStayDays[i].count++;
        break;
      }
    }

    if (h.status === HospitalizationStatus.DISCHARGED) {
      totalDays += days;
      dischargedCount++;
    }
  }

  const averageStayDays = dischargedCount > 0 ? totalDays / dischargedCount : 0;

  return {
    totalHospitalizations,
    inTreatment,
    discharged,
    totalRevenue,
    byDepartment,
    byDisease,
    byAnomalyType,
    byStayDays,
    averageStayDays,
  };
}
