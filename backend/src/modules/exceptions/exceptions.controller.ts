import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExceptionsService, CreateExceptionDto, UpdateExceptionDto } from './exceptions.service';
import { ExceptionStatus } from '../../database/entities';

@Controller('api/exceptions')
@UseGuards(AuthGuard('jwt'))
export class ExceptionsController {
  constructor(private exceptionsService: ExceptionsService) {}

  @Post()
  async create(@Body() createExceptionDto: CreateExceptionDto, @Request() req) {
    return this.exceptionsService.create(createExceptionDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ExceptionStatus,
  ) {
    return this.exceptionsService.findAll(+page, +limit, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.exceptionsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateExceptionDto: UpdateExceptionDto) {
    return this.exceptionsService.update(id, updateExceptionDto);
  }
}
