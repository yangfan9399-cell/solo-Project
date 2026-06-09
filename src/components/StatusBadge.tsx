import {
  HospitalizationStatus,
  OrderStatus,
  FeeStatus,
  AnomalyType,
  NursingType,
  HospitalizationStatusLabels,
  OrderStatusLabels,
  FeeStatusLabels,
  AnomalyTypeLabels,
  NursingTypeLabels,
} from "../types/enums";

export function HospitalizationStatusBadge({
  status,
}: {
  status: string;
}) {
  const s = status as HospitalizationStatus;
  const styles: Record<HospitalizationStatus, string> = {
    [HospitalizationStatus.ADMITTED]: "bg-blue-100 text-blue-800",
    [HospitalizationStatus.IN_TREATMENT]: "bg-yellow-100 text-yellow-800",
    [HospitalizationStatus.READY_FOR_DISCHARGE]:
      "bg-purple-100 text-purple-800",
    [HospitalizationStatus.DISCHARGED]: "bg-green-100 text-green-800",
    [HospitalizationStatus.CANCELLED]: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[s] || "bg-gray-100 text-gray-800"}`}
    >
      {HospitalizationStatusLabels[s] || status}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  const styles: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [OrderStatus.CONFIRMED]: "bg-green-100 text-green-800",
    [OrderStatus.DISCONTINUED]: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[s] || "bg-gray-100 text-gray-800"}`}
    >
      {OrderStatusLabels[s] || status}
    </span>
  );
}

export function FeeStatusBadge({ status }: { status: string }) {
  const s = status as FeeStatus;
  const styles: Record<FeeStatus, string> = {
    [FeeStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [FeeStatus.CONFIRMED]: "bg-blue-100 text-blue-800",
    [FeeStatus.DISPUTED]: "bg-red-100 text-red-800",
    [FeeStatus.SETTLED]: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[s] || "bg-gray-100 text-gray-800"}`}
    >
      {FeeStatusLabels[s] || status}
    </span>
  );
}

export function AnomalyBadge({ type }: { type: string }) {
  const t = type as AnomalyType;
  if (t === AnomalyType.NONE) return null;

  const styles: Record<AnomalyType, string> = {
    [AnomalyType.NONE]: "",
    [AnomalyType.MEDICATION_MISSED]: "bg-orange-100 text-orange-800",
    [AnomalyType.NURSING_ABNORMAL]: "bg-red-100 text-red-800",
    [AnomalyType.FEE_DISPUTE]: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[t] || ""}`}
    >
      ⚠️ {AnomalyTypeLabels[t] || type}
    </span>
  );
}

export function NursingTypeBadge({ type }: { type: string }) {
  const t = type as NursingType;
  const styles: Record<NursingType, string> = {
    [NursingType.VITAL_SIGNS]: "bg-blue-100 text-blue-800",
    [NursingType.MEDICATION]: "bg-green-100 text-green-800",
    [NursingType.TREATMENT]: "bg-purple-100 text-purple-800",
    [NursingType.FEEDING]: "bg-yellow-100 text-yellow-800",
    [NursingType.HYGIENE]: "bg-cyan-100 text-cyan-800",
    [NursingType.OTHER]: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[t] || "bg-gray-100 text-gray-800"}`}
    >
      {NursingTypeLabels[t] || type}
    </span>
  );
}
