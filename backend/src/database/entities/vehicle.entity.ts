import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export type VehicleStatus = 'active' | 'out_of_service' | 'in_repair';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plate_number', unique: true, length: 20 })
  plateNumber: string;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 50, nullable: true })
  type: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: VehicleStatus;

  @Column({ name: 'out_of_service_reason', type: 'text', nullable: true })
  outOfServiceReason: string;

  @Column({ name: 'out_of_service_time', type: 'datetime', nullable: true })
  outOfServiceTime: Date;

  @Column({ name: 'expected_resume_time', type: 'datetime', nullable: true })
  expectedResumeTime: Date;

  @Column({ name: 'dispatcher_id', nullable: true })
  dispatcherId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'dispatcher_id' })
  dispatcher: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
