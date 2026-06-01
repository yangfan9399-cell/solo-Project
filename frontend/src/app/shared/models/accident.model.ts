export type AccidentStatus = 'pending_review' | 'reviewed' | 'in_repair' | 'in_claim' | 'pending_resume' | 'completed' | 'rejected';

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type?: string;
  status: 'active' | 'out_of_service' | 'in_repair';
  outOfServiceReason?: string;
  outOfServiceTime?: Date;
  expectedResumeTime?: Date;
  dispatcherId?: string;
  dispatcher?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Accident {
  id: string;
  reportNo: string;
  vehicleId: string;
  reporterId: string;
  accidentTime: Date;
  location: string;
  cause?: string;
  description?: string;
  casualties: number;
  status: AccidentStatus;
  vehicle?: Vehicle;
  reporter?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccidentRequest {
  vehicleId: string;
  accidentTime: string;
  location: string;
  cause?: string;
  description?: string;
  casualties?: number;
}

export interface UpdateAccidentStatusRequest {
  status: AccidentStatus;
  remark?: string;
}

export interface StatusLog {
  id: string;
  accidentId: string;
  operatorId: string;
  fromStatus?: string;
  toStatus: string;
  remark?: string;
  operator?: any;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
