"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { store } from "../data/store";
import {
  HospitalizationStatus,
  OrderStatus,
  FeeStatus,
  AnomalyType,
  NursingType,
} from "../types/enums";

export async function createAdmission(formData: FormData) {
  const ownerName = formData.get("ownerName") as string;
  const ownerPhone = formData.get("ownerPhone") as string;
  const ownerIdCard = formData.get("ownerIdCard") as string;
  const ownerAddress = formData.get("ownerAddress") as string;

  const petName = formData.get("petName") as string;
  const petType = formData.get("petType") as string;
  const petBreed = formData.get("petBreed") as string;
  const petGender = formData.get("petGender") as string;
  const petAgeStr = formData.get("petAge") as string;
  const petWeightStr = formData.get("petWeight") as string;

  const departmentId = formData.get("departmentId") as string;
  const ward = formData.get("ward") as string;
  const cageNumber = formData.get("cageNumber") as string;
  const primaryDiagnosis = formData.get("primaryDiagnosis") as string;
  const chiefComplaint = formData.get("chiefComplaint") as string;
  const admissionDateStr = formData.get("admissionDate") as string;

  const owner = store.addOwner({
    name: ownerName,
    phone: ownerPhone,
    idCard: ownerIdCard || null,
    address: ownerAddress || null,
  });

  const pet = store.addPet({
    name: petName,
    type: petType,
    breed: petBreed || null,
    gender: petGender || null,
    age: petAgeStr ? parseFloat(petAgeStr) : null,
    weight: petWeightStr ? parseFloat(petWeightStr) : null,
    ownerId: owner.id,
  });

  const admissionDate = admissionDateStr
    ? new Date(admissionDateStr)
    : new Date();

  const hospitalization = store.addHospitalization({
    petId: pet.id,
    departmentId,
    primaryDiagnosis: primaryDiagnosis || "待诊",
    secondaryDiagnosis: null,
    admissionDate,
    dischargeDate: null,
    status: HospitalizationStatus.ADMITTED,
    ward: ward || null,
    cageNumber: cageNumber || null,
    chiefComplaint: chiefComplaint || null,
    anomalyType: AnomalyType.NONE,
    anomalyNote: null,
  });

  const baseFees = [
    { name: "挂号费", category: "挂号", unitPrice: 50, quantity: 1 },
    { name: "住院费", category: "住院", unitPrice: 200, quantity: 1 },
    { name: "护理费", category: "护理", unitPrice: 150, quantity: 1 },
  ];

  baseFees.forEach((fee) => {
    store.addFeeItem({
      hospitalizationId: hospitalization.id,
      name: fee.name,
      category: fee.category,
      quantity: fee.quantity,
      unitPrice: fee.unitPrice,
      totalPrice: fee.quantity * fee.unitPrice,
      status: FeeStatus.CONFIRMED,
      recordDate: new Date(),
    });
  });

  revalidatePath("/");
  redirect(`/hospitalizations/${hospitalization.id}`);
}

export async function addNursingRecord(formData: FormData) {
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const temperatureStr = formData.get("temperature") as string;
  const heartRateStr = formData.get("heartRate") as string;
  const respiratoryRateStr = formData.get("respiratoryRate") as string;
  const weightStr = formData.get("weight") as string;
  const appetite = formData.get("appetite") as string;
  const mentalStatus = formData.get("mentalStatus") as string;
  const isAbnormalStr = formData.get("isAbnormal") as string;
  const abnormalNote = formData.get("abnormalNote") as string;

  const isAbnormal = isAbnormalStr === "on";

  store.addNursingRecord({
    hospitalizationId,
    type: type as NursingType,
    content,
    recordedById: "staff_2",
    recordTime: new Date(),
    temperature: temperatureStr ? parseFloat(temperatureStr) : null,
    heartRate: heartRateStr ? parseInt(heartRateStr) : null,
    respiratoryRate: respiratoryRateStr ? parseInt(respiratoryRateStr) : null,
    bloodPressure: null,
    weight: weightStr ? parseFloat(weightStr) : null,
    appetite: appetite || null,
    stool: null,
    urine: null,
    mentalStatus: mentalStatus || null,
    isAbnormal,
    abnormalNote: isAbnormal && abnormalNote ? abnormalNote : null,
    orderId: null,
  });

  const hosp = store.getHospitalizationById(hospitalizationId);
  if (hosp && hosp.status === HospitalizationStatus.ADMITTED) {
    store.updateHospitalization(hospitalizationId, {
      status: HospitalizationStatus.IN_TREATMENT,
    });
  }

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/nursing`);
}

export async function addMedicalOrder(formData: FormData) {
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const orderType = formData.get("orderType") as string;
  const content = formData.get("content") as string;
  const dosage = formData.get("dosage") as string;
  const frequency = formData.get("frequency") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const note = formData.get("note") as string;

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const endDate = endDateStr ? new Date(endDateStr) : null;

  store.addMedicalOrder({
    hospitalizationId,
    orderType,
    content,
    dosage: dosage || null,
    frequency: frequency || null,
    startDate,
    endDate,
    status: OrderStatus.PENDING,
    createdById: "staff_4",
    confirmedById: null,
    confirmedAt: null,
    note: note || null,
  });

  const hosp = store.getHospitalizationById(hospitalizationId);
  if (hosp && hosp.anomalyType !== AnomalyType.MEDICATION_MISSED) {
    store.updateHospitalization(hospitalizationId, {
      anomalyType: AnomalyType.MEDICATION_MISSED,
      anomalyNote: "存在待确认医嘱",
    });
  }

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/orders`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function confirmMedicalOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;

  store.updateMedicalOrder(orderId, {
    status: OrderStatus.CONFIRMED,
    confirmedById: "staff_4",
    confirmedAt: new Date(),
  });

  const orders = store.getMedicalOrdersByHospitalization(hospitalizationId);
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING);

  if (pendingOrders.length === 0) {
    const hosp = store.getHospitalizationById(hospitalizationId);
    if (hosp && hosp.anomalyType === AnomalyType.MEDICATION_MISSED) {
      const hasNursingAbnormal = store
        .getNursingRecordsByHospitalization(hospitalizationId)
        .some((r) => r.isAbnormal);
      const hasFeeDispute = store
        .getFeeItemsByHospitalization(hospitalizationId)
        .some((f) => f.status === FeeStatus.DISPUTED);

      let newAnomaly = AnomalyType.NONE;
      let newNote: string | null = null;

      if (hasFeeDispute) {
        newAnomaly = AnomalyType.FEE_DISPUTE;
        newNote = "存在费用争议";
      } else if (hasNursingAbnormal) {
        newAnomaly = AnomalyType.NURSING_ABNORMAL;
        newNote = "存在护理异常记录";
      }

      store.updateHospitalization(hospitalizationId, {
        anomalyType: newAnomaly,
        anomalyNote: newNote,
      });
    }
  }

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/orders`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function confirmFeeItem(formData: FormData) {
  const feeId = formData.get("feeId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;

  store.updateFeeItem(feeId, {
    status: FeeStatus.CONFIRMED,
    disputeNote: null,
  });

  const fees = store.getFeeItemsByHospitalization(hospitalizationId);
  const disputedFees = fees.filter((f) => f.status === FeeStatus.DISPUTED);

  if (disputedFees.length === 0) {
    const hosp = store.getHospitalizationById(hospitalizationId);
    if (hosp && hosp.anomalyType === AnomalyType.FEE_DISPUTE) {
      const hasNursingAbnormal = store
        .getNursingRecordsByHospitalization(hospitalizationId)
        .some((r) => r.isAbnormal);
      const hasPendingOrders = store
        .getMedicalOrdersByHospitalization(hospitalizationId)
        .some((o) => o.status === OrderStatus.PENDING);

      let newAnomaly = AnomalyType.NONE;
      let newNote: string | null = null;

      if (hasPendingOrders) {
        newAnomaly = AnomalyType.MEDICATION_MISSED;
        newNote = "存在待确认医嘱";
      } else if (hasNursingAbnormal) {
        newAnomaly = AnomalyType.NURSING_ABNORMAL;
        newNote = "存在护理异常记录";
      }

      store.updateHospitalization(hospitalizationId, {
        anomalyType: newAnomaly,
        anomalyNote: newNote,
      });
    }
  }

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function disputeFeeItem(formData: FormData) {
  const feeId = formData.get("feeId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const disputeNote = formData.get("disputeNote") as string;

  store.updateFeeItem(feeId, {
    status: FeeStatus.DISPUTED,
    disputeNote: disputeNote || "费用有异议",
  });

  const hosp = store.getHospitalizationById(hospitalizationId);
  if (hosp) {
    store.updateHospitalization(hospitalizationId, {
      anomalyType: AnomalyType.FEE_DISPUTE,
      anomalyNote: "存在费用争议，待协商解决",
    });
  }

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function resolveFeeDispute(formData: FormData) {
  const feeId = formData.get("feeId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const resolution = formData.get("resolution") as string;

  if (resolution === "confirm") {
    store.updateFeeItem(feeId, {
      status: FeeStatus.CONFIRMED,
      disputeNote: null,
    });
  } else if (resolution === "adjust") {
    const newPriceStr = formData.get("newPrice") as string;
    const newPrice = newPriceStr ? parseFloat(newPriceStr) : 0;
    store.updateFeeItem(feeId, {
      status: FeeStatus.CONFIRMED,
      totalPrice: newPrice,
      disputeNote: null,
    });
  }

  const fees = store.getFeeItemsByHospitalization(hospitalizationId);
  const disputedFees = fees.filter((f) => f.status === FeeStatus.DISPUTED);

  if (disputedFees.length === 0) {
    const hosp = store.getHospitalizationById(hospitalizationId);
    if (hosp && hosp.anomalyType === AnomalyType.FEE_DISPUTE) {
      const hasNursingAbnormal = store
        .getNursingRecordsByHospitalization(hospitalizationId)
        .some((r) => r.isAbnormal);
      const hasPendingOrders = store
        .getMedicalOrdersByHospitalization(hospitalizationId)
        .some((o) => o.status === OrderStatus.PENDING);

      let newAnomaly = AnomalyType.NONE;
      let newNote: string | null = null;

      if (hasPendingOrders) {
        newAnomaly = AnomalyType.MEDICATION_MISSED;
        newNote = "存在待确认医嘱";
      } else if (hasNursingAbnormal) {
        newAnomaly = AnomalyType.NURSING_ABNORMAL;
        newNote = "存在护理异常记录";
      }

      store.updateHospitalization(hospitalizationId, {
        anomalyType: newAnomaly,
        anomalyNote: newNote,
      });
    }
  }

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function dischargeHospitalization(formData: FormData) {
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const reviewNote = formData.get("reviewNote") as string;

  try {
    store.dischargeHospitalization(hospitalizationId, {
      reviewedById: "staff_6",
      reviewNote: reviewNote || undefined,
    });
  } catch (error) {
    redirect(
      `/hospitalizations/${hospitalizationId}/finance?error=${encodeURIComponent(
        (error as Error).message
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);

  redirect(`/hospitalizations/${hospitalizationId}`);
}

export async function markReadyForDischarge(formData: FormData) {
  const hospitalizationId = formData.get("hospitalizationId") as string;

  const check = store.canDischarge(hospitalizationId);
  if (!check.allowed) {
    return { error: check.reason };
  }

  store.updateHospitalization(hospitalizationId, {
    status: HospitalizationStatus.READY_FOR_DISCHARGE,
  });

  revalidatePath("/");
  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);

  return { success: true };
}
