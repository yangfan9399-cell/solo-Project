import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Vehicle, Accident, Repair, Claim, Attachment, StatusLog, ExceptionEntity } from './entities';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Accident) private accidentRepository: Repository<Accident>,
    @InjectRepository(Repair) private repairRepository: Repository<Repair>,
    @InjectRepository(Claim) private claimRepository: Repository<Claim>,
    @InjectRepository(Attachment) private attachmentRepository: Repository<Attachment>,
    @InjectRepository(StatusLog) private statusLogRepository: Repository<StatusLog>,
    @InjectRepository(ExceptionEntity) private exceptionRepository: Repository<ExceptionEntity>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const userCount = await this.userRepository.count();
    if (userCount > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = await this.userRepository.save([
      { username: 'driver1', password: hashedPassword, name: '张三', role: 'driver', phone: '13800138001' },
      { username: 'driver2', password: hashedPassword, name: '李四', role: 'driver', phone: '13800138002' },
      { username: 'dispatcher', password: hashedPassword, name: '王调度', role: 'dispatcher', phone: '13800138003' },
      { username: 'repair_manager', password: hashedPassword, name: '李维修', role: 'repair_manager', phone: '13800138004' },
      { username: 'insurance', password: hashedPassword, name: '赵保险', role: 'insurance_specialist', phone: '13800138005' },
    ]);

    const vehicles = await this.vehicleRepository.save([
      { plateNumber: '京A12345', model: '东风天龙', type: '重型卡车', status: 'active' },
      { plateNumber: '京A67890', model: '解放J7', type: '重型卡车', status: 'active' },
      { plateNumber: '京B11111', model: '欧曼EST', type: '重型卡车', status: 'out_of_service' },
      { plateNumber: '京B22222', model: '重汽豪沃', type: '中型卡车', status: 'active' },
      { plateNumber: '京C33333', model: '陕汽德龙', type: '重型卡车', status: 'in_repair' },
    ]);

    const accidents: Accident[] = [];
    for (let i = 0; i < 5; i++) {
      const accident = this.accidentRepository.create({
        reportNo: `ACC${Date.now()}${i.toString().padStart(3, '0')}`,
        vehicleId: vehicles[i % vehicles.length].id,
        reporterId: users[i % 2].id,
        accidentTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        location: ['北京市朝阳区建国路', '上海市浦东新区世纪大道', '广州市天河区天河路', '深圳市南山区科技园', '成都市武侯区天府大道'][i],
        cause: ['追尾事故', '变道刮擦', '闯红灯', '疲劳驾驶', '路面湿滑'][i],
        description: `事故描述${i + 1}：车辆在行驶过程中发生事故，请尽快处理。`,
        casualties: i === 2 ? 1 : 0,
        status: ['pending_review', 'reviewed', 'in_repair', 'in_claim', 'completed'][i] as any,
      });
      accidents.push(await this.accidentRepository.save(accident));
    }

    const repairs = await this.repairRepository.save([
      {
        accidentId: accidents[2].id,
        repairManagerId: users[3].id,
        estimatedCost: 8500,
        actualCost: null,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        estimatedEndTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        notes: '前保险杠损坏，需要更换',
      },
      {
        accidentId: accidents[4].id,
        repairManagerId: users[3].id,
        estimatedCost: 3200,
        actualCost: 3100,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        estimatedEndTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        actualEndTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'completed',
        notes: '左侧后视镜损坏，已更换',
      },
      {
        accidentId: accidents[1].id,
        repairManagerId: users[3].id,
        estimatedCost: null,
        actualCost: null,
        startTime: null,
        estimatedEndTime: null,
        status: 'pending',
        notes: '等待评估',
      },
    ]);

    const claims = await this.claimRepository.save([
      {
        accidentId: accidents[3].id,
        insuranceSpecialistId: users[4].id,
        policyNo: 'POLICY2024001',
        claimAmount: 15000,
        paidAmount: null,
        status: 'under_review',
        notes: '材料审核中',
      },
      {
        accidentId: accidents[4].id,
        insuranceSpecialistId: users[4].id,
        policyNo: 'POLICY2024002',
        claimAmount: 5000,
        paidAmount: 5000,
        status: 'paid',
        notes: '已完成赔付',
      },
    ]);

    await this.exceptionRepository.save([
      {
        reporterId: users[0].id,
        title: '系统无法上传图片',
        description: '事故报备时无法上传现场照片，提示文件过大',
        status: 'processing',
      },
      {
        reporterId: users[1].id,
        handlerId: users[2].id,
        title: '车辆状态更新延迟',
        description: '维修完成后车辆状态没有及时更新为可运营',
        status: 'resolved',
      },
    ]);

    console.log('Database seeded successfully!');
    console.log('Test accounts:');
    console.log('  driver/123456 - 司机');
    console.log('  dispatcher/123456 - 调度员');
    console.log('  repair_manager/123456 - 维修主管');
    console.log('  insurance/123456 - 保险专员');
  }
}
