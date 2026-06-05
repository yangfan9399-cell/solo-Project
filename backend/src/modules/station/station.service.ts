import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station, StationStatus } from '../../entities/station.entity';
import { Bike, BikeStatus } from '../../entities/bike.entity';

@Injectable()
export class StationService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(Bike)
    private bikeRepository: Repository<Bike>,
  ) {}

  async findAll(district?: string, status?: StationStatus): Promise<Station[]> {
    const query = this.stationRepository.createQueryBuilder('station')
      .leftJoinAndSelect('station.bikes', 'bike');

    if (district) {
      query.andWhere('station.district = :district', { district });
    }
    if (status) {
      query.andWhere('station.status = :status', { status });
    }

    return query.orderBy('station.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Station> {
    const station = await this.stationRepository.findOne({
      where: { id },
      relations: ['bikes', 'dispatchOrders'],
    });
    if (!station) {
      throw new NotFoundException('站点不存在');
    }
    return station;
  }

  async findByCode(stationCode: string): Promise<Station | null> {
    return this.stationRepository.findOne({
      where: { stationCode },
      relations: ['bikes'],
    });
  }

  async validateStationCode(stationCode: string): Promise<{ valid: boolean; station?: Station; message?: string }> {
    const station = await this.findByCode(stationCode);
    if (!station) {
      return { valid: false, message: `站点编号 ${stationCode} 不存在，请检查或重新绑定站点` };
    }
    return { valid: true, station };
  }

  async create(data: Partial<Station>): Promise<Station> {
    const existing = await this.findByCode(data.stationCode);
    if (existing) {
      throw new BadRequestException('站点编号已存在');
    }
    const station = this.stationRepository.create(data);
    return this.stationRepository.save(station);
  }

  async update(id: string, data: Partial<Station>): Promise<Station> {
    const station = await this.findOne(id);
    Object.assign(station, data);
    return this.stationRepository.save(station);
  }

  async updateStatus(id: string, status: StationStatus): Promise<Station> {
    const station = await this.findOne(id);
    station.status = status;
    return this.stationRepository.save(station);
  }

  async addBikesToStation(stationId: string, bikeIds: string[]): Promise<Station> {
    const station = await this.findOne(stationId);
    const bikes = await this.bikeRepository.findByIds(bikeIds);
    
    for (const bike of bikes) {
      bike.station = station;
      bike.status = BikeStatus.NORMAL;
      await this.bikeRepository.save(bike);
    }

    station.currentBikes = station.bikes ? station.bikes.length + bikeIds.length : bikeIds.length;
    return this.stationRepository.save(station);
  }

  async getDistricts(): Promise<string[]> {
    const result = await this.stationRepository
      .createQueryBuilder('station')
      .select('DISTINCT station.district', 'district')
      .getRawMany();
    return result.map((r) => r.district).filter(Boolean);
  }

  async getLowStockStations(): Promise<Station[]> {
    return this.stationRepository
      .createQueryBuilder('station')
      .where('station.currentBikes < station.capacity * 0.3')
      .andWhere('station.status = :status', { status: StationStatus.LOW_STOCK })
      .getMany();
  }
}
