import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DispatchOrder } from './dispatch-order.entity';
import { Bike } from './bike.entity';

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

@Entity('repair_orders')
export class RepairOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  repairNo: string;

  @OneToOne(() => DispatchOrder, (dispatch) => dispatch.repairOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dispatchOrderId' })
  dispatchOrder: DispatchOrder;

  @Column()
  dispatchOrderId: string;

  @ManyToOne(() => Bike, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bikeId' })
  bike: Bike;

  @Column({ nullable: true })
  bikeId: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  faultType: FaultType;

  @Column({ type: 'text' })
  faultDescription: string;

  @Column('simple-array', { nullable: true })
  evidenceImages: string[];

  @Column({ nullable: true })
  repairerId: string;

  @Column({ nullable: true })
  repairerName: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: RepairStatus.PENDING,
  })
  status: RepairStatus;

  @Column({ type: 'text', nullable: true })
  repairRemark: string;

  @Column({ nullable: true })
  repairedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
