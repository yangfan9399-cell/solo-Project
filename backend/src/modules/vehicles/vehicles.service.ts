import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async findAll(status?: string) {
    const query = this.vehicleRepository.createQueryBuilder('vehicle');
    
    if (status) {
      query.where('vehicle.status = :status', { status });
    }
    
    query.orderBy('vehicle.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });
    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }
    return vehicle;
  }

  async findOutOfService() {
    const outOfServiceVehicles = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.status IN (:...statuses)', { statuses: ['out_of_service', 'in_repair'] })
      .orderBy('vehicle.updatedAt', 'DESC')
      .getMany();

    const stats = {
      total: outOfServiceVehicles.length,
      outOfService: outOfServiceVehicles.filter(v => v.status === 'out_of_service').length,
      inRepair: outOfServiceVehicles.filter(v => v.status === 'in_repair').length,
    };

    return {
      vehicles: outOfServiceVehicles,
      stats,
    };
  }
}
