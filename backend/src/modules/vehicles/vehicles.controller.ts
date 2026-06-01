import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VehiclesService } from './vehicles.service';

@Controller('api/vehicles')
@UseGuards(AuthGuard('jwt'))
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.vehiclesService.findAll(status);
  }

  @Get('out-of-service')
  async findOutOfService() {
    return this.vehiclesService.findOutOfService();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }
}
