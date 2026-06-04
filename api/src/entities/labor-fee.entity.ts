import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'

@Entity('labor_fees')
export class LaborFee {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number

  @ManyToOne('WorkOrder', 'laborFees', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: any
}
