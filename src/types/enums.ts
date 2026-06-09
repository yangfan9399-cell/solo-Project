export enum StaffRole {
  RECEPTIONIST = "RECEPTIONIST",
  NURSE = "NURSE",
  VETERINARIAN = "VETERINARIAN",
  FINANCE = "FINANCE",
}

export enum PetType {
  DOG = "DOG",
  CAT = "CAT",
  RABBIT = "RABBIT",
  BIRD = "BIRD",
  OTHER = "OTHER",
}

export enum HospitalizationStatus {
  ADMITTED = "ADMITTED",
  IN_TREATMENT = "IN_TREATMENT",
  READY_FOR_DISCHARGE = "READY_FOR_DISCHARGE",
  DISCHARGED = "DISCHARGED",
  CANCELLED = "CANCELLED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  DISCONTINUED = "DISCONTINUED",
}

export enum NursingType {
  VITAL_SIGNS = "VITAL_SIGNS",
  MEDICATION = "MEDICATION",
  TREATMENT = "TREATMENT",
  FEEDING = "FEEDING",
  HYGIENE = "HYGIENE",
  OTHER = "OTHER",
}

export enum FeeStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  DISPUTED = "DISPUTED",
  SETTLED = "SETTLED",
}

export enum AnomalyType {
  NONE = "NONE",
  MEDICATION_MISSED = "MEDICATION_MISSED",
  NURSING_ABNORMAL = "NURSING_ABNORMAL",
  FEE_DISPUTE = "FEE_DISPUTE",
}

export const StaffRoleLabels: Record<StaffRole, string> = {
  [StaffRole.RECEPTIONIST]: "前台",
  [StaffRole.NURSE]: "护士",
  [StaffRole.VETERINARIAN]: "兽医",
  [StaffRole.FINANCE]: "财务",
};

export const PetTypeLabels: Record<PetType, string> = {
  [PetType.DOG]: "狗",
  [PetType.CAT]: "猫",
  [PetType.RABBIT]: "兔",
  [PetType.BIRD]: "鸟",
  [PetType.OTHER]: "其他",
};

export const HospitalizationStatusLabels: Record<HospitalizationStatus, string> =
  {
    [HospitalizationStatus.ADMITTED]: "已入院",
    [HospitalizationStatus.IN_TREATMENT]: "治疗中",
    [HospitalizationStatus.READY_FOR_DISCHARGE]: "待出院",
    [HospitalizationStatus.DISCHARGED]: "已出院",
    [HospitalizationStatus.CANCELLED]: "已取消",
  };

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "待确认",
  [OrderStatus.CONFIRMED]: "已确认",
  [OrderStatus.DISCONTINUED]: "已停用",
};

export const NursingTypeLabels: Record<NursingType, string> = {
  [NursingType.VITAL_SIGNS]: "生命体征",
  [NursingType.MEDICATION]: "用药",
  [NursingType.TREATMENT]: "治疗",
  [NursingType.FEEDING]: "喂食",
  [NursingType.HYGIENE]: "卫生护理",
  [NursingType.OTHER]: "其他",
};

export const FeeStatusLabels: Record<FeeStatus, string> = {
  [FeeStatus.PENDING]: "待确认",
  [FeeStatus.CONFIRMED]: "已确认",
  [FeeStatus.DISPUTED]: "有异议",
  [FeeStatus.SETTLED]: "已结算",
};

export const AnomalyTypeLabels: Record<AnomalyType, string> = {
  [AnomalyType.NONE]: "无",
  [AnomalyType.MEDICATION_MISSED]: "用药漏记",
  [AnomalyType.NURSING_ABNORMAL]: "护理异常",
  [AnomalyType.FEE_DISPUTE]: "费用异议",
};
