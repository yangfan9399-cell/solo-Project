import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Bike } from './bike.entity';
import { DispatchOrder } from './dispatch-order.entity';

export enum StationStatus {
  NORMAL = 'normal',
  LOW_STOCK = 'low_stock',
  FAULTY = 'faulty',
  MAINTENANCE = 'maintenance',
}

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  stationCode: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  district: string;

  @Column('int')
  capacity: number;

  @Column('int', { default: 0 })
  currentBikes: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: StationStatus.NORMAL,
  })
  status: StationStatus;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @OneToMany(() => Bike, (bike) => bike.station)
  bikes: Bike[];

  @OneToMany(() => DispatchOrder, (order) => order.station)
  dispatchOrders: DispatchOrder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
