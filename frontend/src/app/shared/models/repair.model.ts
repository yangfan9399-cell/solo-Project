export type RepairStatus = 'pending' | 'in_progress' | 'completed';

export interface RepairItem {
  id: string;
  repairId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
}

export interface Repair {
  id: string;
  accidentId: string;
  repairManagerId: string;
  estimatedCost?: number;
  actualCost?: number;
  startTime?: Date;
  estimatedEndTime?: Date;
  actualEndTime?: Date;
  status: RepairStatus;
  notes?: string;
  items?: RepairItem[];
  repairManager?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRepairRequest {
  accidentId: string;
  estimatedEndTime?: string;
  notes?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdateRepairRequest {
  actualCost?: number;
  startTime?: string;
  actualEndTime?: string;
  status?: RepairStatus;
  notes?: string;
}
