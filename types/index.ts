import type { Role, RequisitionStatus, Requisition, Supply, SupplyBatch, Department, User, RequisitionHistory } from '@prisma/client'

export type { Role, RequisitionStatus, Requisition, Supply, SupplyBatch, Department, User, RequisitionHistory }

export interface RequisitionWithRelations extends Requisition {
  supply: Supply
  supplyBatch: SupplyBatch | null
  department: Department
  nurse: User
  warehouseAdmin: User | null
  reviewer: User | null
  history: (RequisitionHistory & { operator: User })[]
}

export interface SupplyWithBatches extends Supply {
  batches: SupplyBatch[]
}
