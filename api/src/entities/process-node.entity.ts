import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'

@Entity('process_nodes')
export class ProcessNode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ length: 64 })
  action: string

  @Column({ length: 64 })
  operator: string

  @Column({ name: 'operator_role', length: 32 })
  operatorRole: string

  @Column({ type: 'text', nullable: true })
  note: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne('WorkOrder', 'processNodes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: any
}
