import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RepairsService, CreateRepairDto, UpdateRepairDto } from './repairs.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RepairStatus } from '../../database/entities';

@Controller('api/repairs')
@UseGuards(AuthGuard('jwt'))
export class RepairsController {
  constructor(private repairsService: RepairsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('repair_manager')
  async create(@Body() createRepairDto: CreateRepairDto, @Request() req) {
    return this.repairsService.create(createRepairDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: RepairStatus,
  ) {
    return this.repairsService.findAll(+page, +limit, status);
  }

  @Get('accident/:accidentId')
  async findByAccident(@Param('accidentId') accidentId: string) {
    return this.repairsService.findByAccident(accidentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.repairsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('repair_manager')
  async update(@Param('id') id: string, @Body() updateRepairDto: UpdateRepairDto) {
    return this.repairsService.update(id, updateRepairDto);
  }
}
