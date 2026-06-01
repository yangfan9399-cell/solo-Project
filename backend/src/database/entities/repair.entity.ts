import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Accident } from './accident.entity';
import { User } from './user.entity';
import { RepairItem } from './repair-item.entity';

export type RepairStatus = 'pending' | 'in_progress' | 'completed';

@Entity('repairs')
export class Repair {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'accident_id' })
  accidentId: string;

  @ManyToOne(() => Accident)
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @Column({ name: 'repair_manager_id' })
  repairManagerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'repair_manager_id' })
  repairManager: User;

  @Column({ name: 'estimated_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number;

  @Column({ name: 'start_time', type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ name: 'estimated_end_time', type: 'datetime', nullable: true })
  estimatedEndTime: Date;

  @Column({ name: 'actual_end_time', type: 'datetime', nullable: true })
  actualEndTime: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: RepairStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => RepairItem, item => item.repair, { cascade: true })
  items: RepairItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
