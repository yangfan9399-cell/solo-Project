import type {
  Campus,
  Classroom,
  Equipment,
  BorrowApplication,
  EquipmentHandover,
  ReturnVerification,
  ApplicationHistory,
} from "@prisma/client";

export type {
  Campus,
  Classroom,
  Equipment,
  BorrowApplication,
  EquipmentHandover,
  ReturnVerification,
  ApplicationHistory,
};

export interface ApplicationWithRelations extends BorrowApplication {
  classroom: Classroom & { campus: Campus };
  verification?: ReturnVerification;
  history?: ApplicationHistory[];
  handovers?: EquipmentHandover[];
}

export interface CampusWithClassrooms extends Campus {
  classrooms: Classroom[];
}

export interface ClassroomWithCampus extends Classroom {
  campus: Campus;
}

export interface EquipmentWithClassroom extends Equipment {
  classroom: Classroom & { campus: Campus };
}

export type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EQUIPMENT_HANDED"
  | "IN_USE"
  | "RETURN_PENDING"
  | "COMPLETED"
  | "CANCELLED";

export type CleaningStatus = "PASSED" | "FAILED" | "PENDING";

export type AbnormalReason = "EQUIPMENT_LOST" | "CLEANING_FAILED" | "DAMAGE" | "OTHER";

export type ClassroomType = "普通" | "多媒体" | "实验室";
