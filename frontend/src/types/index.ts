export enum StationStatus {
  NORMAL = 'normal',
  LOW_STOCK = 'low_stock',
  FAULTY = 'faulty',
  MAINTENANCE = 'maintenance',
}

export interface Station {
  id: string;
  stationCode: string;
  name: string;
  address: string;
  district: string;
  capacity: number;
  currentBikes: number;
  status: StationStatus;
  latitude?: number;
  longitude?: number;
  bikes?: Bike[];
  dispatchOrders?: DispatchOrder[];
  createdAt: string;
  updatedAt: string;
}

export enum BikeStatus {
  NORMAL = 'normal',
  FAULTY = 'faulty',
  MAINTENANCE = 'maintenance',
  IN_TRANSIT = 'in_transit',
}

export interface Bike {
  id: string;
  bikeCode: string;
  status: BikeStatus;
  model: string;
  mileage: number;
  stationId?: string;
  station?: Station;
  createdAt: string;
  updatedAt: string;
}

export enum DispatchStatus {
  PENDING = 'pending',
  DISPATCHING = 'dispatching',
  ARRIVED = 'arrived',
  IN_REPAIR = 'in_repair',
  PENDING_REVIEW = 'pending_review',
  COMPLETED = 'completed',
  RETURNED = 'returned',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

export enum DispatchSampleType {
  NORMAL = 'normal',
  FAULTY = 'faulty',
  STATION_ERROR = 'station_error',
  TIMEOUT = 'timeout',
}

export interface DispatchOrder {
  id: string;
  orderNo: string;
  stationId?: string;
  station?: Station;
  reportedStationCode?: string;
  requiredQuantity: number;
  dispatchedQuantity: number;
  dispatcherId?: string;
  dispatcherName?: string;
  reviewerId?: string;
  reviewerName?: string;
  status: DispatchStatus;
  sampleType?: DispatchSampleType;
  stationCodeError?: boolean;
  stationCodeErrorMessage?: string;
  remark?: string;
  timeoutMinutes: number;
  arrivedAt?: string;
  completedAt?: string;
  repairOrder?: RepairOrder;
  historyNodes?: HistoryNode[];
  createdAt: string;
  updatedAt: string;
}

export enum FaultType {
  BRAKE = 'brake',
  TIRE = 'tire',
  CHAIN = 'chain',
  ELECTRIC = 'electric',
  STRUCTURE = 'structure',
  OTHER = 'other',
}

export enum RepairStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANNOT_REPAIR = 'cannot_repair',
}

export interface RepairOrder {
  id: string;
  repairNo: string;
  dispatchOrderId: string;
  dispatchOrder?: DispatchOrder;
  bikeId?: string;
  bike?: Bike;
  faultType: FaultType;
  faultDescription: string;
  evidenceImages: string[];
  repairerId?: string;
  repairerName?: string;
  status: RepairStatus;
  repairRemark?: string;
  repairedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum NodeType {
  ALERT = 'alert',
  DISPATCH_ASSIGNED = 'dispatch_assigned',
  DISPATCH_STARTED = 'dispatch_started',
  ARRIVED = 'arrived',
  FAULT_REPORTED = 'fault_reported',
  REPAIR_STARTED = 'repair_started',
  REPAIR_COMPLETED = 'repair_completed',
  PENDING_REVIEW = 'pending_review',
  REVIEW_PASSED = 'review_passed',
  REVIEW_RETURNED = 'review_returned',
  TIMEOUT = 'timeout',
  STATION_ERROR = 'station_error',
  STATION_REBIND = 'station_rebind',
  REMARK = 'remark',
}

export interface HistoryNode {
  id: string;
  dispatchOrderId: string;
  nodeType: NodeType;
  title: string;
  description?: string;
  operatorId?: string;
  operatorName?: string;
  extraData?: string[];
  createdAt: string;
}

export enum UserRole {
  DISPATCHER = 'dispatcher',
  REPAIRER = 'repairer',
  REVIEWER = 'reviewer',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DistrictStats {
  district: string;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  timeoutOrders: number;
  faultOrders: number;
}

export interface FaultTypeStats {
  faultType: FaultType;
  faultTypeLabel: string;
  count: number;
  percentage: number;
}

export interface ResponseTimeStats {
  range: string;
  label: string;
  count: number;
  percentage: number;
  avgMinutes: number;
}

export interface OverallStats {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  faultRate: number;
  avgResponseTime: number;
  avgRepairTime: number;
  districtStats: DistrictStats[];
  faultTypeStats: FaultTypeStats[];
  responseTimeStats: ResponseTimeStats[];
}
