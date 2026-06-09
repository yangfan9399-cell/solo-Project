"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  HospitalizationStatus,
  OrderStatus,
  FeeStatus,
  AnomalyType,
  NursingType,
} from "../types/enums";

async function recalculateAnomalyType(hospitalizationId: string) {
  const pendingOrders = await prisma.medicalOrder.count({
    where: {
      hospitalizationId,
      status: OrderStatus.PENDING,
    },
  });

  const hasNursingAbnormal = await prisma.nursingRecord.count({
    where: {
      hospitalizationId,
      isAbnormal: true,
    },
  });

  const hasFeeDispute = await prisma.feeItem.count({
    where: {
      hospitalizationId,
      status: FeeStatus.DISPUTED,
    },
  });

  let newAnomaly = AnomalyType.NONE;
  let newNote: string | null = null;

  if (hasFeeDispute > 0) {
    newAnomaly = AnomalyType.FEE_DISPUTE;
    newNote = "存在费用争议";
  } else if (pendingOrders > 0) {
    newAnomaly = AnomalyType.MEDICATION_MISSED;
    newNote = "存在待确认医嘱";
  } else if (hasNursingAbnormal > 0) {
    newAnomaly = AnomalyType.NURSING_ABNORMAL;
    newNote = "存在护理异常记录";
  }

  await prisma.hospitalization.update({
    where: { id: hospitalizationId },
    data: {
      anomalyType: newAnomaly,
      anomalyNote: newNote,
    },
  });
}

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

  const admissionDate = admissionDateStr
    ? new Date(admissionDateStr)
    : new Date();

  const hospitalization = await prisma.$transaction(async (tx) => {
    const owner = await tx.owner.create({
      data: {
        name: ownerName,
        phone: ownerPhone,
        idCard: ownerIdCard || null,
        address: ownerAddress || null,
      },
    });

    const pet = await tx.pet.create({
      data: {
        name: petName,
        type: petType,
        breed: petBreed || null,
        gender: petGender || null,
        age: petAgeStr ? parseFloat(petAgeStr) : null,
        weight: petWeightStr ? parseFloat(petWeightStr) : null,
        ownerId: owner.id,
      },
    });

    const hosp = await tx.hospitalization.create({
      data: {
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
      },
    });

    const baseFees = [
      { name: "挂号费", category: "挂号", unitPrice: 50, quantity: 1 },
      { name: "住院费", category: "住院", unitPrice: 200, quantity: 1 },
      { name: "护理费", category: "护理", unitPrice: 150, quantity: 1 },
    ];

    for (const fee of baseFees) {
      await tx.feeItem.create({
        data: {
          hospitalizationId: hosp.id,
          name: fee.name,
          category: fee.category,
          quantity: fee.quantity,
          unitPrice: fee.unitPrice,
          totalPrice: fee.quantity * fee.unitPrice,
          status: FeeStatus.CONFIRMED,
          recordDate: new Date(),
        },
      });
    }

    return hosp;
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

  await prisma.$transaction(async (tx) => {
    await tx.nursingRecord.create({
      data: {
        hospitalizationId,
        type: type as NursingType,
        content,
        recordedById: "staff_2",
        recordTime: new Date(),
        temperature: temperatureStr ? parseFloat(temperatureStr) : null,
        heartRate: heartRateStr ? parseInt(heartRateStr) : null,
        respiratoryRate: respiratoryRateStr
          ? parseInt(respiratoryRateStr)
          : null,
        bloodPressure: null,
        weight: weightStr ? parseFloat(weightStr) : null,
        appetite: appetite || null,
        stool: null,
        urine: null,
        mentalStatus: mentalStatus || null,
        isAbnormal,
        abnormalNote: isAbnormal && abnormalNote ? abnormalNote : null,
        orderId: null,
      },
    });

    const hosp = await tx.hospitalization.findUnique({
      where: { id: hospitalizationId },
    });

    if (hosp && hosp.status === HospitalizationStatus.ADMITTED) {
      await tx.hospitalization.update({
        where: { id: hospitalizationId },
        data: {
          status: HospitalizationStatus.IN_TREATMENT,
        },
      });
    }
  });

  if (isAbnormal) {
    await recalculateAnomalyType(hospitalizationId);
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

  await prisma.medicalOrder.create({
    data: {
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
    },
  });

  await recalculateAnomalyType(hospitalizationId);

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/orders`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function confirmMedicalOrder(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;

  await prisma.medicalOrder.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CONFIRMED,
      confirmedById: "staff_4",
      confirmedAt: new Date(),
    },
  });

  await recalculateAnomalyType(hospitalizationId);

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/orders`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function confirmFeeItem(formData: FormData) {
  const feeId = formData.get("feeId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;

  await prisma.feeItem.update({
    where: { id: feeId },
    data: {
      status: FeeStatus.CONFIRMED,
      disputeNote: null,
    },
  });

  await recalculateAnomalyType(hospitalizationId);

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function disputeFeeItem(formData: FormData) {
  const feeId = formData.get("feeId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const disputeNote = formData.get("disputeNote") as string;

  await prisma.feeItem.update({
    where: { id: feeId },
    data: {
      status: FeeStatus.DISPUTED,
      disputeNote: disputeNote || "费用有异议",
    },
  });

  await recalculateAnomalyType(hospitalizationId);

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function resolveFeeDispute(formData: FormData) {
  const feeId = formData.get("feeId") as string;
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const resolution = formData.get("resolution") as string;

  if (resolution === "confirm") {
    await prisma.feeItem.update({
      where: { id: feeId },
      data: {
        status: FeeStatus.CONFIRMED,
        disputeNote: null,
      },
    });
  } else if (resolution === "adjust") {
    const newPriceStr = formData.get("newPrice") as string;
    const newPrice = newPriceStr ? parseFloat(newPriceStr) : 0;
    await prisma.feeItem.update({
      where: { id: feeId },
      data: {
        status: FeeStatus.CONFIRMED,
        totalPrice: newPrice,
        disputeNote: null,
      },
    });
  }

  await recalculateAnomalyType(hospitalizationId);

  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);
}

export async function dischargeHospitalization(formData: FormData) {
  const hospitalizationId = formData.get("hospitalizationId") as string;
  const reviewNote = formData.get("reviewNote") as string;

  try {
    const pendingOrders = await prisma.medicalOrder.count({
      where: {
        hospitalizationId,
        status: OrderStatus.PENDING,
      },
    });

    if (pendingOrders > 0) {
      throw new Error(`存在 ${pendingOrders} 条待确认医嘱，请兽医确认后再办理出院`);
    }

    const pendingFees = await prisma.feeItem.count({
      where: {
        hospitalizationId,
        status: FeeStatus.PENDING,
      },
    });

    if (pendingFees > 0) {
      throw new Error(`存在 ${pendingFees} 项待确认费用，请财务确认后再办理出院`);
    }

    const disputedFees = await prisma.feeItem.count({
      where: {
        hospitalizationId,
        status: FeeStatus.DISPUTED,
      },
    });

    if (disputedFees > 0) {
      throw new Error(`存在 ${disputedFees} 项争议费用，请先处理费用争议`);
    }

    await prisma.$transaction(async (tx) => {
      const confirmedFees = await tx.feeItem.findMany({
        where: {
          hospitalizationId,
          status: FeeStatus.CONFIRMED,
        },
      });

      const totalAmount = confirmedFees.reduce(
        (sum, f) => sum + Number(f.totalPrice),
        0
      );

      await tx.hospitalization.update({
        where: { id: hospitalizationId },
        data: {
          status: HospitalizationStatus.DISCHARGED,
          dischargeDate: new Date(),
        },
      });

      await tx.feeItem.updateMany({
        where: {
          hospitalizationId,
          status: FeeStatus.CONFIRMED,
        },
        data: {
          status: FeeStatus.SETTLED,
        },
      });

      await tx.feeReview.create({
        data: {
          hospitalizationId,
          reviewedById: "staff_6",
          totalAmount,
          actualAmount: totalAmount,
          reviewNote: reviewNote || null,
          isFinal: true,
          reviewedAt: new Date(),
        },
      });
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
  revalidatePath("/statistics");

  redirect(`/hospitalizations/${hospitalizationId}`);
}

export async function markReadyForDischarge(formData: FormData) {
  const hospitalizationId = formData.get("hospitalizationId") as string;

  const pendingOrders = await prisma.medicalOrder.count({
    where: {
      hospitalizationId,
      status: OrderStatus.PENDING,
    },
  });

  if (pendingOrders > 0) {
    return {
      error: `存在 ${pendingOrders} 条待确认医嘱，请兽医确认后再办理出院`,
    };
  }

  const pendingFees = await prisma.feeItem.count({
    where: {
      hospitalizationId,
      status: FeeStatus.PENDING,
    },
  });

  if (pendingFees > 0) {
    return { error: `存在 ${pendingFees} 项待确认费用，请财务确认后再办理出院` };
  }

  const disputedFees = await prisma.feeItem.count({
    where: {
      hospitalizationId,
      status: FeeStatus.DISPUTED,
    },
  });

  if (disputedFees > 0) {
    return { error: `存在 ${disputedFees} 项争议费用，请先处理费用争议` };
  }

  await prisma.hospitalization.update({
    where: { id: hospitalizationId },
    data: {
      status: HospitalizationStatus.READY_FOR_DISCHARGE,
    },
  });

  revalidatePath("/");
  revalidatePath(`/hospitalizations/${hospitalizationId}`);
  revalidatePath(`/hospitalizations/${hospitalizationId}/finance`);

  return { success: true };
}
