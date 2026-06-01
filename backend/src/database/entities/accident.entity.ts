import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { User } from './user.entity';

export type AccidentStatus = 'pending_review' | 'reviewed' | 'in_repair' | 'in_claim' | 'completed' | 'rejected';

@Entity('accidents')
export class Accident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_no', unique: true, length: 50 })
  reportNo: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'accident_time', type: 'datetime' })
  accidentTime: Date;

  @Column({ length: 255 })
  location: string;

  @Column({ type: 'text', nullable: true })
  cause: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  casualties: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending_review',
  })
  status: AccidentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
