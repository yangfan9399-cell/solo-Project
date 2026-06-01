import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Accident } from './accident.entity';
import { User } from './user.entity';

export type ClaimStatus = 'pending_materials' | 'under_review' | 'approved' | 'paid' | 'rejected';

@Entity('claims')
export class Claim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'accident_id' })
  accidentId: string;

  @ManyToOne(() => Accident)
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @Column({ name: 'insurance_specialist_id' })
  insuranceSpecialistId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'insurance_specialist_id' })
  insuranceSpecialist: User;

  @Column({ name: 'policy_no', length: 100, nullable: true })
  policyNo: string;

  @Column({ name: 'claim_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  claimAmount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidAmount: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending_materials',
  })
  status: ClaimStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
