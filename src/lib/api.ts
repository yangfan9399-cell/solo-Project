import {
  hospitalizations,
  pets,
  owners,
  departments,
  staffList,
  medicalOrders,
  nursingRecords,
  feeItems,
  feeReviews,
  type Hospitalization,
  type Pet,
  type Owner,
  type Department,
  type Staff,
  type MedicalOrder,
  type NursingRecord,
  type FeeItem,
  type FeeReview,
} from "../data/mockData";
import { HospitalizationStatus, AnomalyType, OrderStatus, FeeStatus } from "../types/enums";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export async function getHospitalizations(
  status?: string,
  anomalyType?: string
): Promise<HospitalizationListItem[]> {
  await delay(100);
  let list = [...hospitalizations];

  if (status && status !== "ALL") {
    list = list.filter((h) => h.status === status);
  }
  if (anomalyType && anomalyType !== "ALL") {
    list = list.filter((h) => h.anomalyType === anomalyType);
  }

  return list.map((h) => ({
    ...h,
    pet: {
      ...pets.find((p) => p.id === h.petId)!,
      owner: owners.find((o) => o.id === pets.find((p) => p.id === h.petId)!.ownerId)!,
    },
    department: departments.find((d) => d.id === h.departmentId)!,
  }));
}

export async function getHospitalizationById(
  id: string
): Promise<HospitalizationDetail | null> {
  await delay(100);
  const hosp = hospitalizations.find((h) => h.id === id);
  if (!hosp) return null;

  const pet = pets.find((p) => p.id === hosp.petId)!;
  const owner = owners.find((o) => o.id === pet.ownerId)!;
  const department = departments.find((d) => d.id === hosp.departmentId)!;

  return {
    ...hosp,
    pet: { ...pet, owner },
    department,
    medicalOrders: medicalOrders
      .filter((o) => o.hospitalizationId === id)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    nursingRecords: nursingRecords
      .filter((r) => r.hospitalizationId === id)
      .sort((a, b) => b.recordTime.getTime() - a.recordTime.getTime()),
    feeItems: feeItems
      .filter((f) => f.hospitalizationId === id)
      .sort((a, b) => b.recordDate.getTime() - a.recordDate.getTime()),
    feeReviews: feeReviews
      .filter((r) => r.hospitalizationId === id)
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime()),
  };
}

export async function checkDischargeAllowed(
  hospitalizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const detail = await getHospitalizationById(hospitalizationId);
  if (!detail) return { allowed: false, reason: "住院记录不存在" };

  const pendingOrders = detail.medicalOrders.filter(
    (o) => o.status === OrderStatus.PENDING
  );
  if (pendingOrders.length > 0) {
    return {
      allowed: false,
      reason: `存在 ${pendingOrders.length} 条待确认医嘱，请兽医确认后再办理出院`,
    };
  }

  const disputedFees = detail.feeItems.filter(
    (f) => f.status === FeeStatus.DISPUTED
  );
  if (disputedFees.length > 0) {
    return {
      allowed: false,
      reason: `存在 ${disputedFees.length} 项费用争议，请先解决费用问题再办理出院`,
    };
  }

  return { allowed: true };
}

export async function getDepartments(): Promise<Department[]> {
  await delay(50);
  return departments;
}

export async function getStaffByRole(role: string): Promise<Staff[]> {
  await delay(50);
  return staffList.filter((s) => s.role === role);
}

export async function getStaffById(id: string): Promise<Staff | undefined> {
  await delay(50);
  return staffList.find((s) => s.id === id);
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
  await delay(100);

  const total = hospitalizations.length;
  const inTreatment = hospitalizations.filter(
    (h) => h.status === HospitalizationStatus.IN_TREATMENT
  ).length;
  const discharged = hospitalizations.filter(
    (h) => h.status === HospitalizationStatus.DISCHARGED
  ).length;

  const totalRevenue = feeItems
    .filter((f) => f.status === FeeStatus.SETTLED)
    .reduce((sum, f) => sum + f.totalPrice, 0);

  const deptMap = new Map<string, { count: number; revenue: number }>();
  for (const h of hospitalizations) {
    const dept = departments.find((d) => d.id === h.departmentId)?.name || h.departmentId;
    const rev = feeItems
      .filter((f) => f.hospitalizationId === h.id && f.status === FeeStatus.SETTLED)
      .reduce((sum, f) => sum + f.totalPrice, 0);
    const current = deptMap.get(dept) || { count: 0, revenue: 0 };
    deptMap.set(dept, { count: current.count + 1, revenue: current.revenue + rev });
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
    const days = Math.max(1, Math.ceil((end.getTime() - h.admissionDate.getTime()) / (1000 * 60 * 60 * 24)));
    
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
    totalHospitalizations: total,
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
