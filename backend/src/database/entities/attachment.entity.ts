import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Accident } from './accident.entity';
import { Repair } from './repair.entity';
import { Claim } from './claim.entity';
import { User } from './user.entity';

export type AttachmentCategory = 'scene' | 'repair' | 'insurance';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'accident_id', nullable: true })
  accidentId: string;

  @ManyToOne(() => Accident, { nullable: true })
  @JoinColumn({ name: 'accident_id' })
  accident: Accident;

  @Column({ name: 'repair_id', nullable: true })
  repairId: string;

  @ManyToOne(() => Repair, { nullable: true })
  @JoinColumn({ name: 'repair_id' })
  repair: Repair;

  @Column({ name: 'claim_id', nullable: true })
  claimId: string;

  @ManyToOne(() => Claim, { nullable: true })
  @JoinColumn({ name: 'claim_id' })
  claim: Claim;

  @Column({ name: 'uploader_id' })
  uploaderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_type', length: 50 })
  fileType: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ length: 50, nullable: true })
  category: AttachmentCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
