import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { DispatchOrder } from './dispatch-order.entity';

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

@Entity('history_nodes')
export class HistoryNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DispatchOrder, (order) => order.historyNodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dispatchOrderId' })
  dispatchOrder: DispatchOrder;

  @Column()
  dispatchOrderId: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  nodeType: NodeType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  operatorId: string;

  @Column({ nullable: true })
  operatorName: string;

  @Column('simple-array', { nullable: true })
  extraData: string[];

  @CreateDateColumn()
  createdAt: Date;
}
