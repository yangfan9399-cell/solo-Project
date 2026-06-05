import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserRole } from '../../entities/user.entity';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query('role') role?: UserRole): Promise<User[]> {
    return this.userService.findAll(role);
  }

  @Get('dispatchers')
  async getDispatchers(): Promise<User[]> {
    return this.userService.getDispatchers();
  }

  @Get('repairers')
  async getRepairers(): Promise<User[]> {
    return this.userService.getRepairers();
  }

  @Get('reviewers')
  async getReviewers(): Promise<User[]> {
    return this.userService.getReviewers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<User>): Promise<User> {
    return this.userService.create(data);
  }
}
