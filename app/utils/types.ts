export type UserRole = "ADMIN" | "SOCIAL_WORKER" | "MANAGER";

export type DonationStatus = "PENDING" | "INSPECTING" | "APPROVED" | "REJECTED" | "STORED";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISTRIBUTED" | "CANCELLED";

export type DistributionStatus = "PREPARING" | "SHIPPED" | "DELIVERED" | "SIGNED" | "CANCELLED";

export type ExceptionStatus = "OPEN" | "PROCESSING" | "RESOLVED" | "CLOSED";

export type ExceptionType = "QUALITY_ISSUE" | "QUANTITY_MISMATCH" | "DAMAGE" | "LOSS" | "OTHER";

export type InspectionResult = "PASSED" | "FAILED" | "PARTIAL";

export type ActionErrors<T extends string = string> = {
  fieldErrors: Partial<Record<T, string[]>>;
  formErrors?: string[];
};
