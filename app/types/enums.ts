export const Role = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  FINANCE: "FINANCE",
  CAMPUS_DIRECTOR: "CAMPUS_DIRECTOR",
} as const;

export type Role = typeof Role[keyof typeof Role];

export const ScheduleStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  TEACHER_CONFIRMED: "TEACHER_CONFIRMED",
  TEACHER_REJECTED: "TEACHER_REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  SETTLED: "SETTLED",
} as const;

export type ScheduleStatus = typeof ScheduleStatus[keyof typeof ScheduleStatus];

export const ConflictType = {
  TEACHER_CONFLICT: "TEACHER_CONFLICT",
  CLASSROOM_CONFLICT: "CLASSROOM_CONFLICT",
  NONE: "NONE",
} as const;

export type ConflictType = typeof ConflictType[keyof typeof ConflictType];

export const SettlementStatus = {
  PENDING: "PENDING",
  REVIEWING: "REVIEWING",
  APPROVED: "APPROVED",
  PAID: "PAID",
} as const;

export type SettlementStatus = typeof SettlementStatus[keyof typeof SettlementStatus];

export const AttendanceStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
} as const;

export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];
