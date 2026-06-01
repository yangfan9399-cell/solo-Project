import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type VehicleStatus = 'active' | 'out_of_service' | 'in_repair';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plate_number', unique: true, length: 20 })
  plateNumber: string;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 50, nullable: true })
  type: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: VehicleStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
