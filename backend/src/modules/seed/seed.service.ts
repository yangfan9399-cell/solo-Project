import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Station, StationStatus } from '../../entities/station.entity';
import { Bike, BikeStatus } from '../../entities/bike.entity';
import { User, UserRole } from '../../entities/user.entity';
import { DispatchOrder, DispatchStatus, DispatchSampleType } from '../../entities/dispatch-order.entity';
import { RepairOrder, FaultType, RepairStatus } from '../../entities/repair-order.entity';
import { HistoryNode, NodeType } from '../../entities/history-node.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(Bike)
    private bikeRepository: Repository<Bike>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DispatchOrder)
    private dispatchOrderRepository: Repository<DispatchOrder>,
    @InjectRepository(RepairOrder)
    private repairOrderRepository: Repository<RepairOrder>,
    @InjectRepository(HistoryNode)
    private historyNodeRepository: Repository<HistoryNode>,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  async seedData() {
    const stationCount = await this.stationRepository.count();
    if (stationCount > 0) {
      console.log('数据已存在，跳过种子数据初始化');
      return;
    }

    console.log('开始初始化种子数据...');
    await this.dataSource.transaction(async (manager) => {
      const stations = await this.createStations(manager);
      const bikes = await this.createBikes(manager, stations);
      const users = await this.createUsers(manager);

      await this.createSampleNormal(manager, stations, users, bikes);
      await this.createSampleFaulty(manager, stations, users, bikes);
      await this.createSampleStationError(manager, users);
      await this.createSampleTimeout(manager, stations, users, bikes);
    });

    console.log('种子数据初始化完成');
  }

  private async createStations(manager: any): Promise<Station[]> {
    const stationsData = [
      { stationCode: 'ST001', name: '人民广场站', address: '人民广场1号', district: '黄浦区', capacity: 30, currentBikes: 5, status: StationStatus.LOW_STOCK, latitude: 31.2304, longitude: 121.4737 },
      { stationCode: 'ST002', name: '南京东路站', address: '南京东路100号', district: '黄浦区', capacity: 40, currentBikes: 35, status: StationStatus.NORMAL, latitude: 31.2350, longitude: 121.4800 },
      { stationCode: 'ST003', name: '陆家嘴站', address: '陆家嘴环路200号', district: '浦东新区', capacity: 50, currentBikes: 8, status: StationStatus.LOW_STOCK, latitude: 31.2397, longitude: 121.4998 },
      { stationCode: 'ST004', name: '徐家汇站', address: '徐家汇路300号', district: '徐汇区', capacity: 45, currentBikes: 40, status: StationStatus.NORMAL, latitude: 31.1957, longitude: 121.4373 },
      { stationCode: 'ST005', name: '静安寺站', address: '静安寺路400号', district: '静安区', capacity: 35, currentBikes: 3, status: StationStatus.LOW_STOCK, latitude: 31.2238, longitude: 121.4450 },
      { stationCode: 'ST006', name: '中山公园站', address: '中山公园路500号', district: '长宁区', capacity: 40, currentBikes: 38, status: StationStatus.NORMAL, latitude: 31.2176, longitude: 121.4200 },
      { stationCode: 'ST007', name: '世纪公园站', address: '世纪公园路600号', district: '浦东新区', capacity: 30, currentBikes: 25, status: StationStatus.NORMAL, latitude: 31.2230, longitude: 121.5500 },
      { stationCode: 'ST008', name: '外滩站', address: '中山东一路1号', district: '黄浦区', capacity: 50, currentBikes: 10, status: StationStatus.LOW_STOCK, latitude: 31.2397, longitude: 121.4900 },
    ];

    const stations: Station[] = [];
    for (const data of stationsData) {
      const station = manager.create(Station, data);
      stations.push(await manager.save(Station, station));
    }
    return stations;
  }

  private async createBikes(manager: any, stations: Station[]): Promise<Bike[]> {
    const bikes: Bike[] = [];
    let bikeIndex = 1;

    for (const station of stations) {
      for (let i = 0; i < station.currentBikes; i++) {
        const bikeCode = `B${String(bikeIndex).padStart(5, '0')}`;
        const bike = manager.create(Bike, {
          bikeCode,
          status: BikeStatus.NORMAL,
          model: i % 3 === 0 ? '标准版' : i % 3 === 1 ? '助力版' : '儿童版',
          mileage: Math.floor(Math.random() * 5000),
          stationId: station.id,
          station,
        });
        bikes.push(await manager.save(Bike, bike));
        bikeIndex++;
      }
    }

    for (let i = 0; i < 20; i++) {
      const bikeCode = `B${String(bikeIndex).padStart(5, '0')}`;
      const bike = manager.create(Bike, {
        bikeCode,
        status: BikeStatus.IN_TRANSIT,
        model: '标准版',
        mileage: Math.floor(Math.random() * 3000),
        stationId: null,
      });
      bikes.push(await manager.save(Bike, bike));
      bikeIndex++;
    }

    return bikes;
  }

  private async createUsers(manager: any): Promise<Record<string, User>> {
    const usersData = [
      { username: 'dispatcher01', name: '张调度', role: UserRole.DISPATCHER, phone: '13800000001' },
      { username: 'dispatcher02', name: '李调度', role: UserRole.DISPATCHER, phone: '13800000002' },
      { username: 'repairer01', name: '王维修', role: UserRole.REPAIRER, phone: '13900000001' },
      { username: 'repairer02', name: '赵维修', role: UserRole.REPAIRER, phone: '13900000002' },
      { username: 'reviewer01', name: '陈复核', role: UserRole.REVIEWER, phone: '13700000001' },
      { username: 'admin', name: '系统管理员', role: UserRole.ADMIN, phone: '13600000001' },
    ];

    const users: Record<string, User> = {};
    for (const data of usersData) {
      const user = manager.create(User, data);
      const saved = await manager.save(User, user);
      users[saved.role] = saved;
    }
    return users;
  }

  private async createSampleNormal(manager: any, stations: Station[], users: Record<string, User>, bikes: Bike[]) {
    const station = stations.find((s) => s.stationCode === 'ST001')!;
    const dispatcher = users[UserRole.DISPATCHER];
    const reviewer = users[UserRole.REVIEWER];

    const order = manager.create(DispatchOrder, {
      orderNo: 'DD202401150001',
      stationId: station.id,
      station,
      reportedStationCode: station.stationCode,
      requiredQuantity: 15,
      dispatchedQuantity: 15,
      dispatcherId: dispatcher.id,
      dispatcherName: dispatcher.name,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      status: DispatchStatus.COMPLETED,
      sampleType: DispatchSampleType.NORMAL,
      timeoutMinutes: 30,
      arrivedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 1800000),
      createdAt: new Date(Date.now() - 7200000),
    });
    const savedOrder = await manager.save(DispatchOrder, order);

    const historyNodes = [
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.ALERT, title: '缺车告警', description: '站点缺车，需补充 15 辆自行车', operatorName: '系统', createdAt: new Date(Date.now() - 7200000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.DISPATCH_ASSIGNED, title: '调度员已分配', description: `调度员：${dispatcher.name}，调度车辆数：15 辆`, operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 7000000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.DISPATCH_STARTED, title: '开始调度', description: '调度员已出发前往站点', operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 6800000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.ARRIVED, title: '调度到达', description: '调度车辆已到达站点，准备补车', operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 3600000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.PENDING_REVIEW, title: '补车完成，待复核', description: '已完成补车 15 辆，等待复核人确认', operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 2400000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.REVIEW_PASSED, title: '复核通过，已归档', description: '复核人确认站点已恢复正常，调度单归档', operatorId: reviewer.id, operatorName: reviewer.name, createdAt: new Date(Date.now() - 1800000) },
    ];

    for (const node of historyNodes) {
      const hn = manager.create(HistoryNode, node);
      await manager.save(HistoryNode, hn);
    }
  }

  private async createSampleFaulty(manager: any, stations: Station[], users: Record<string, User>, bikes: Bike[]) {
    const station = stations.find((s) => s.stationCode === 'ST003')!;
    const dispatcher = users[UserRole.DISPATCHER];
    const repairer = users[UserRole.REPAIRER];

    const faultyBike = bikes.find((b) => b.stationId === station.id) || bikes[0];

    const order = manager.create(DispatchOrder, {
      orderNo: 'DD202401150002',
      stationId: station.id,
      station,
      reportedStationCode: station.stationCode,
      requiredQuantity: 20,
      dispatchedQuantity: 20,
      dispatcherId: dispatcher.id,
      dispatcherName: dispatcher.name,
      status: DispatchStatus.IN_REPAIR,
      sampleType: DispatchSampleType.FAULTY,
      timeoutMinutes: 30,
      arrivedAt: new Date(Date.now() - 5400000),
      createdAt: new Date(Date.now() - 10800000),
    });
    const savedOrder = await manager.save(DispatchOrder, order);

    const repair = manager.create(RepairOrder, {
      repairNo: 'WX202401150001',
      dispatchOrderId: savedOrder.id,
      bikeId: faultyBike.id,
      bike: faultyBike,
      faultType: FaultType.BRAKE,
      faultDescription: '后刹车失灵，刹车线松动，需要调整并更换刹车片',
      evidenceImages: ['/images/evidence/brake1.jpg', '/images/evidence/brake2.jpg'],
      repairerId: repairer.id,
      repairerName: repairer.name,
      status: RepairStatus.IN_PROGRESS,
      createdAt: new Date(Date.now() - 3600000),
    });
    await manager.save(RepairOrder, repair);

    const historyNodes = [
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.ALERT, title: '缺车告警', description: '站点缺车，需补充 20 辆自行车', operatorName: '系统', createdAt: new Date(Date.now() - 10800000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.DISPATCH_ASSIGNED, title: '调度员已分配', description: `调度员：${dispatcher.name}，调度车辆数：20 辆`, operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 10500000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.DISPATCH_STARTED, title: '开始调度', description: '调度员已出发前往站点', operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 10200000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.ARRIVED, title: '调度到达', description: '调度车辆已到达站点，准备补车', operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 5400000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.FAULT_REPORTED, title: '发现故障', description: `故障类型：刹车故障\n故障描述：后刹车失灵，刹车线松动，需要调整并更换刹车片`, operatorId: repairer.id, operatorName: repairer.name, createdAt: new Date(Date.now() - 4800000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.REPAIR_STARTED, title: '开始维修', description: `维修员：${repairer.name}，开始处理故障`, operatorId: repairer.id, operatorName: repairer.name, createdAt: new Date(Date.now() - 3600000) },
    ];

    for (const node of historyNodes) {
      const hn = manager.create(HistoryNode, node);
      await manager.save(HistoryNode, hn);
    }
  }

  private async createSampleStationError(manager: any, users: Record<string, User>) {
    const order = manager.create(DispatchOrder, {
      orderNo: 'DD202401150003',
      reportedStationCode: 'ST999',
      requiredQuantity: 10,
      status: DispatchStatus.PENDING,
      sampleType: DispatchSampleType.STATION_ERROR,
      stationCodeError: true,
      stationCodeErrorMessage: '站点编号 ST999 不存在，请检查或重新绑定站点',
      timeoutMinutes: 30,
      remark: '上报站点编号错误，等待重新绑定',
      createdAt: new Date(Date.now() - 1800000),
    });
    const savedOrder = await manager.save(DispatchOrder, order);

    const historyNode = manager.create(HistoryNode, {
      dispatchOrderId: savedOrder.id,
      nodeType: NodeType.STATION_ERROR,
      title: '站点编号错误',
      description: `站点编号 ST999 不存在，请检查或重新绑定站点\n上报站点编号：ST999`,
      operatorName: '系统',
      createdAt: new Date(Date.now() - 1800000),
    });
    await manager.save(HistoryNode, historyNode);
  }

  private async createSampleTimeout(manager: any, stations: Station[], users: Record<string, User>, bikes: Bike[]) {
    const station = stations.find((s) => s.stationCode === 'ST005')!;
    const dispatcher = users[UserRole.DISPATCHER];

    const order = manager.create(DispatchOrder, {
      orderNo: 'DD202401150004',
      stationId: station.id,
      station,
      reportedStationCode: station.stationCode,
      requiredQuantity: 25,
      dispatchedQuantity: 0,
      dispatcherId: dispatcher.id,
      dispatcherName: dispatcher.name,
      status: DispatchStatus.DISPATCHING,
      sampleType: DispatchSampleType.TIMEOUT,
      timeoutMinutes: 5,
      remark: '调度超时预警样本',
      createdAt: new Date(Date.now() - 3600000),
    });
    const savedOrder = await manager.save(DispatchOrder, order);

    const historyNodes = [
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.ALERT, title: '缺车告警', description: '站点缺车，需补充 25 辆自行车', operatorName: '系统', createdAt: new Date(Date.now() - 3600000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.DISPATCH_ASSIGNED, title: '调度员已分配', description: `调度员：${dispatcher.name}，调度车辆数：25 辆`, operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 3300000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.DISPATCH_STARTED, title: '开始调度', description: '调度员已出发前往站点', operatorId: dispatcher.id, operatorName: dispatcher.name, createdAt: new Date(Date.now() - 3000000) },
      { dispatchOrderId: savedOrder.id, nodeType: NodeType.TIMEOUT, title: '调度超时', description: '调度已超过规定时间 5 分钟，请注意跟进', operatorName: '系统', createdAt: new Date(Date.now() - 600000) },
    ];

    for (const node of historyNodes) {
      const hn = manager.create(HistoryNode, node);
      await manager.save(HistoryNode, hn);
    }
  }
}
