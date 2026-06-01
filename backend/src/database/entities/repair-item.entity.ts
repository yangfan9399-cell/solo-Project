import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Repair } from './repair.entity';

@Entity('repair_items')
export class RepairItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'repair_id' })
  repairId: string;

  @ManyToOne(() => Repair, repair => repair.items)
  @JoinColumn({ name: 'repair_id' })
  repair: Repair;

  @Column({ length: 200 })
  name: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
