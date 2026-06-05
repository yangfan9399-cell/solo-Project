export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
  CONFLICT = 'CONFLICT',
}

export enum ConflictType {
  TIME_OVERLAP = 'TIME_OVERLAP',
  EQUIPMENT_MISSING = 'EQUIPMENT_MISSING',
  COST_ALLOCATION_MISMATCH = 'COST_ALLOCATION_MISMATCH',
  NONE = 'NONE',
}

export enum Role {
  ADMIN = 'ADMIN',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  REVIEWER = 'REVIEWER',
}

export interface Department {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingRoom {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  hourlyRate: number;
  equipments: Equipment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: string;
  name: string;
  meetingRoomId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingEquipment {
  id: string;
  bookingId: string;
  name: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostAllocation {
  id: string;
  bookingId: string;
  departmentId: string;
  department?: Department;
  amount: number;
  percentage: number;
  confirmed: boolean;
  confirmedAt?: Date;
  confirmedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowRecord {
  id: string;
  bookingId: string;
  action: string;
  operator: string;
  role: Role;
  remark?: string;
  createdAt: Date;
}

export interface Booking {
  id: string;
  title: string;
  meetingRoomId: string;
  meetingRoom?: MeetingRoom;
  departmentId: string;
  department?: Department;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  conflictType: ConflictType;
  conflictReason?: string;
  totalCost: number;
  applicant: string;
  applicantRole: Role;
  equipmentNotes?: string;
  costAllocations: CostAllocation[];
  flowRecords: FlowRecord[];
  bookingEquipments: BookingEquipment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictInfo {
  hasConflict: boolean;
  type: ConflictType;
  reason: string;
  conflictingBooking?: Booking;
}
