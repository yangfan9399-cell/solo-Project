import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(role?: UserRole): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    return query.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ where: { role, isActive: true } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async getDispatchers(): Promise<User[]> {
    return this.findByRole(UserRole.DISPATCHER);
  }

  async getRepairers(): Promise<User[]> {
    return this.findByRole(UserRole.REPAIRER);
  }

  async getReviewers(): Promise<User[]> {
    return this.findByRole(UserRole.REVIEWER);
  }
}
