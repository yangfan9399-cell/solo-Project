import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Station } from './station.entity';
import { RepairOrder } from './repair-order.entity';
import { HistoryNode } from './history-node.entity';

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

@Entity('dispatch_orders')
export class DispatchOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNo: string;

  @ManyToOne(() => Station, (station) => station.dispatchOrders, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'stationId' })
  station: Station;

  @Column({ nullable: true })
  stationId: string;

  @Column({ nullable: true })
  reportedStationCode: string;

  @Column('int')
  requiredQuantity: number;

  @Column('int', { default: 0 })
  dispatchedQuantity: number;

  @Column({ nullable: true })
  dispatcherId: string;

  @Column({ nullable: true })
  dispatcherName: string;

  @Column({ nullable: true })
  reviewerId: string;

  @Column({ nullable: true })
  reviewerName: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: DispatchStatus.PENDING,
  })
  status: DispatchStatus;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  sampleType: DispatchSampleType;

  @Column({ nullable: true })
  stationCodeError: boolean;

  @Column({ nullable: true })
  stationCodeErrorMessage: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column('int', { default: 30 })
  timeoutMinutes: number;

  @Column({ nullable: true })
  arrivedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @OneToOne(() => RepairOrder, (repair) => repair.dispatchOrder, { nullable: true })
  repairOrder: RepairOrder;

  @OneToMany(() => HistoryNode, (node) => node.dispatchOrder)
  historyNodes: HistoryNode[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
