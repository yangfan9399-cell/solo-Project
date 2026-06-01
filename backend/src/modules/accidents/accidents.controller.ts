import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentStatusDto } from './dto/update-accident-status.dto';
import { ScheduleOutOfServiceDto } from './dto/schedule-out-of-service.dto';
import { ConfirmResumeDto } from './dto/confirm-resume.dto';
import { AccidentStatus } from '../../database/entities';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';

@Controller('api/accidents')
@UseGuards(AuthGuard('jwt'))
export class AccidentsController {
  constructor(private accidentsService: AccidentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('driver', 'dispatcher')
  async create(@Body() createAccidentDto: CreateAccidentDto, @Request() req) {
    return this.accidentsService.create(createAccidentDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: AccidentStatus,
    @Query('mine') mine?: string,
    @Request() req?,
  ) {
    const reporterId = mine === 'true' ? req.user.id : undefined;
    return this.accidentsService.findAll(+page, +limit, status, reporterId);
  }

  @Get('stats')
  async getStats() {
    return this.accidentsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.accidentsService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles('dispatcher', 'repair_manager', 'insurance_specialist')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAccidentStatusDto,
    @Request() req,
  ) {
    return this.accidentsService.updateStatus(id, updateStatusDto, req.user.id);
  }

  @Post(':id/schedule-out-of-service')
  @UseGuards(RolesGuard)
  @Roles('dispatcher')
  async scheduleOutOfService(
    @Param('id') id: string,
    @Body() dto: ScheduleOutOfServiceDto,
    @Request() req,
  ) {
    return this.accidentsService.scheduleOutOfService(id, dto, req.user.id);
  }

  @Post(':id/confirm-resume')
  @UseGuards(RolesGuard)
  @Roles('dispatcher')
  async confirmResume(
    @Param('id') id: string,
    @Body() dto: ConfirmResumeDto,
    @Request() req,
  ) {
    return this.accidentsService.confirmResume(id, dto, req.user.id);
  }

  @Get(':id/logs')
  async getStatusLogs(@Param('id') id: string) {
    return this.accidentsService.getStatusLogs(id);
  }
}
