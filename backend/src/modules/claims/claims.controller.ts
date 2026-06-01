import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClaimsService, CreateClaimDto, UpdateClaimDto } from './claims.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ClaimStatus } from '../../database/entities';

@Controller('api/claims')
@UseGuards(AuthGuard('jwt'))
export class ClaimsController {
  constructor(private claimsService: ClaimsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('insurance_specialist')
  async create(@Body() createClaimDto: CreateClaimDto, @Request() req) {
    return this.claimsService.create(createClaimDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ClaimStatus,
  ) {
    return this.claimsService.findAll(+page, +limit, status);
  }

  @Get('accident/:accidentId')
  async findByAccident(@Param('accidentId') accidentId: string) {
    return this.claimsService.findByAccident(accidentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('insurance_specialist')
  async update(@Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto) {
    return this.claimsService.update(id, updateClaimDto);
  }
}
