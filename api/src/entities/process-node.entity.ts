import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'

@Entity('process_nodes')
export class ProcessNode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ type: 'varchar', length: 64 })
  action: string

  @Column({ type: 'varchar', length: 64 })
  operator: string

  @Column({ name: 'operator_role', type: 'varchar', length: 32 })
  operatorRole: string

  @Column({ type: 'text', nullable: true })
  note: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne('WorkOrder', 'processNodes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: any
}
