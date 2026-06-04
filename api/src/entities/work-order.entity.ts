import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'

export enum WorkOrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  REPAIRING = 'repairing',
  PENDING_SETTLEMENT = 'pending_settlement',
  DISPUTED = 'disputed',
  ARCHIVED = 'archived'
}

export enum FaultSource {
  MONITOR_ALERT = 'monitor_alert',
  USER_REPORT = 'user_report',
  PATROL_FOUND = 'patrol_found'
}

export enum FaultType {
  COMMUNICATION_FAULT = 'communication_fault',
  CHARGING_FAULT = 'charging_fault',
  POWER_FAULT = 'power_fault',
  GUN_FAULT = 'gun_fault',
  SCREEN_FAULT = 'screen_fault',
  OTHER = 'other'
}

export enum RepairType {
  REMOTE_RECOVERY = 'remote_recovery',
  ON_SITE_REPAIR = 'on_site_repair'
}

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_no', type: 'varchar', unique: true, length: 32 })
  orderNo: string

  @Column({ type: 'varchar', length: 32, default: WorkOrderStatus.PENDING })
  status: WorkOrderStatus

  @Column({ name: 'fault_source', type: 'varchar', length: 32 })
  faultSource: FaultSource

  @Column({ name: 'fault_type', type: 'varchar', length: 32 })
  faultType: FaultType

  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId: string

  @Column({ name: 'device_no', type: 'varchar', length: 64 })
  deviceNo: string

  @Column({ name: 'station_id', type: 'varchar', length: 64 })
  stationId: string

  @Column({ name: 'station_name', type: 'varchar', length: 128 })
  stationName: string

  @Column({ name: 'repair_type', type: 'varchar', length: 32, nullable: true })
  repairType: string | null

  @Column({ name: 'repair_note', type: 'text', nullable: true })
  repairNote: string | null

  @Column({ name: 'repair_duration', type: 'int', nullable: true })
  repairDuration: number | null

  @Column({ name: 'assignee_id', type: 'varchar', length: 64, nullable: true })
  assigneeId: string | null

  @Column({ name: 'assignee_name', type: 'varchar', length: 64, nullable: true })
  assigneeName: string | null

  @Column({ name: 'is_repeat', type: 'boolean', default: false })
  isRepeat: boolean

  @Column({ name: 'repeat_count', type: 'int', default: 0 })
  repeatCount: number

  @Column({ name: 'created_by', type: 'varchar', length: 64 })
  createdBy: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany('PartsFee', 'order')
  partsFees: any[]

  @OneToMany('LaborFee', 'order')
  laborFees: any[]

  @OneToMany('ProcessNode', 'order')
  processNodes: any[]

  @OneToMany('Evidence', 'order')
  evidences: any[]
}
