export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string | null;
  createdAt: string;
}

export interface Cleaner {
  id: number;
  userId: number | null;
  name: string;
  phone: string;
  level: string;
  city: string;
  rating: string;
  createdAt: string;
}

export interface Photo {
  id: number;
  orderId: number;
  url: string;
  type: string;
  uploadedBy: number | null;
  createdAt: string;
}

export interface Complaint {
  id: number;
  orderId: number;
  title: string;
  description: string;
  evidencePhotos: string[];
  raisedBy: number | null;
  createdAt: string;
}

export interface Rework {
  id: number;
  orderId: number;
  reason: string;
  description: string;
  deadline: string;
  assignedCleanerId: number | null;
  completedAt: string | null;
  isTimeout: boolean;
  createdBy: number | null;
  createdAt: string;
}

export interface Compensation {
  id: number;
  orderId: number;
  amount: string;
  reason: string;
  ruleType: string;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewRemark: string | null;
  createdAt: string;
}

export interface OrderLog {
  id: number;
  orderId: number;
  action: string;
  description: string | null;
  operatorId: number | null;
  operatorName: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  customerId: number;
  cleanerId: number | null;
  serviceType: string;
  city: string;
  address: string;
  scheduledTime: string;
  duration: number;
  price: string;
  status: string;
  remark: string | null;
  assignedBy: number | null;
  assignedAt: string | null;
  completedAt: string | null;
  inspectedBy: number | null;
  inspectedAt: string | null;
  inspectionRemark: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  cleaner?: Cleaner | null;
}

export interface OrderDetail {
  order: Order;
  customer: Customer;
  cleaner: Cleaner | null;
  photos: Photo[];
  complaint: Complaint | null;
  rework: Rework | null;
  compensation: Compensation | null;
  logs: OrderLog[];
}

export interface CompensationRule {
  id: number;
  type: string;
  name: string;
  description: string;
  baseAmount: string;
  multiplier: string;
  isActive: boolean;
  createdAt: string;
}

export interface Statistics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  reworkOrders: number;
  totalRevenue: string;
  totalCompensation: string;
  compensationCount: number;
  byServiceType: Record<string, { count: number; totalPrice: string; reworkCount: number; compensationAmount: string; compensationCount: number }>;
  byCity: Record<string, { count: number; totalPrice: string; compensationAmount: string; compensationCount: number }>;
  byReworkReason: Record<string, { count: number; compensationAmount: string; compensationCount: number }>;
  byCompensationRuleType: Record<string, { count: number; totalAmount: string }>;
}
