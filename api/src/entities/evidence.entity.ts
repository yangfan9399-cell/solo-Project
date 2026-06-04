import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'

@Entity('evidences')
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ length: 16 })
  type: 'image' | 'log'

  @Column({ length: 256 })
  title: string

  @Column({ length: 512 })
  url: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne('WorkOrder', 'evidences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: any
}
