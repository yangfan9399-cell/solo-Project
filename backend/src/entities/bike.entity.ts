import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Station } from './station.entity';

export enum BikeStatus {
  NORMAL = 'normal',
  FAULTY = 'faulty',
  MAINTENANCE = 'maintenance',
  IN_TRANSIT = 'in_transit',
}

@Entity('bikes')
export class Bike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bikeCode: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: BikeStatus.NORMAL,
  })
  status: BikeStatus;

  @Column({ nullable: true })
  model: string;

  @Column('int', { default: 0 })
  mileage: number;

  @ManyToOne(() => Station, (station) => station.bikes, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stationId' })
  station: Station;

  @Column({ nullable: true })
  stationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
