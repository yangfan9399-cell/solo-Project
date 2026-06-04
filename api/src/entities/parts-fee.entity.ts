import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'

@Entity('parts_fees')
export class PartsFee {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ name: 'part_name', length: 128 })
  partName: string

  @Column({ default: 1 })
  quantity: number

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number

  @Column({ name: 'is_disputed', default: false })
  isDisputed: boolean

  @Column({ name: 'dispute_reason', type: 'text', nullable: true })
  disputeReason: string | null

  @Column({ name: 'adjusted_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  adjustedPrice: number | null

  @Column({ name: 'adjustment_reason', type: 'text', nullable: true })
  adjustmentReason: string | null

  @ManyToOne('WorkOrder', 'partsFees', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: any
}
