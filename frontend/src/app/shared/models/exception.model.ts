export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

export interface Exception {
  id: string;
  reporterId: string;
  handlerId?: string;
  accidentId?: string;
  title: string;
  description?: string;
  status: ExceptionStatus;
  reporter?: any;
  handler?: any;
  accident?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExceptionRequest {
  title: string;
  description?: string;
  accidentId?: string;
}

export interface UpdateExceptionRequest {
  status?: ExceptionStatus;
  handlerId?: string;
  description?: string;
}
