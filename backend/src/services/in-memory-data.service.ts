import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Station,
  StationStatus,
  Bike,
  BikeStatus,
  User,
  UserRole,
  DispatchOrder,
  DispatchStatus,
  DispatchSampleType,
  RepairOrder,
  FaultType,
  RepairStatus,
  HistoryNode,
  NodeType,
} from '../entities';

@Injectable()
export class InMemoryDataService implements OnModuleInit {
  stations: Station[] = [];
  bikes: Bike[] = [];
  users: User[] = [];
  dispatchOrders: DispatchOrder[] = [];
  repairOrders: RepairOrder[] = [];
  historyNodes: HistoryNode[] = [];

  private stationIdCounter = 1;
  private bikeIdCounter = 1;
  private userIdCounter = 1;
  private dispatchIdCounter = 1;
  private repairIdCounter = 1;
  private historyIdCounter = 1;

  private genId(prefix: string, counter: number): string {
    return `${prefix}-${String(counter).padStart(8, '0')}`;
  }

  onModuleInit() {
    this.seedData();
    console.log('内存数据初始化完成');
  }

  private seedData() {
    this.createStations();
    this.createBikes();
    this.createUsers();
    this.createSampleNormal();
    this.createSampleFaulty();
    this.createSampleStationError();
    this.createSampleTimeout();
  }

  private createStations() {
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

    const now = new Date();
    for (const data of stationsData) {
      const station: Station = {
        id: this.genId('station', this.stationIdCounter++),
        ...data,
        bikes: [],
        dispatchOrders: [],
        createdAt: now,
        updatedAt: now,
      } as Station;
      this.stations.push(station);
    }
  }

  private createBikes() {
    let bikeIndex = 1;
    const now = new Date();

    for (const station of this.stations) {
      for (let i = 0; i < station.currentBikes; i++) {
        const bikeCode = `B${String(bikeIndex).padStart(5, '0')}`;
        const bike: Bike = {
          id: this.genId('bike', this.bikeIdCounter++),
          bikeCode,
          status: BikeStatus.NORMAL,
          model: i % 3 === 0 ? '标准版' : i % 3 === 1 ? '助力版' : '儿童版',
          mileage: Math.floor(Math.random() * 5000),
          stationId: station.id,
          station,
          createdAt: now,
          updatedAt: now,
        };
        this.bikes.push(bike);
        station.bikes?.push(bike);
        bikeIndex++;
      }
    }

    for (let i = 0; i < 20; i++) {
      const bikeCode = `B${String(bikeIndex).padStart(5, '0')}`;
      const bike: Bike = {
        id: this.genId('bike', this.bikeIdCounter++),
        bikeCode,
        status: BikeStatus.IN_TRANSIT,
        model: '标准版',
        mileage: Math.floor(Math.random() * 3000),
        stationId: undefined,
        station: undefined,
        createdAt: now,
        updatedAt: now,
      };
      this.bikes.push(bike);
      bikeIndex++;
    }
  }

  private createUsers() {
    const usersData = [
      { username: 'dispatcher01', name: '张调度', role: UserRole.DISPATCHER, phone: '13800000001' },
      { username: 'dispatcher02', name: '李调度', role: UserRole.DISPATCHER, phone: '13800000002' },
      { username: 'repairer01', name: '王维修', role: UserRole.REPAIRER, phone: '13900000001' },
      { username: 'repairer02', name: '赵维修', role: UserRole.REPAIRER, phone: '13900000002' },
      { username: 'reviewer01', name: '陈复核', role: UserRole.REVIEWER, phone: '13700000001' },
      { username: 'admin', name: '系统管理员', role: UserRole.ADMIN, phone: '13600000001' },
    ];

    const now = new Date();
    for (const data of usersData) {
      const user: User = {
        id: this.genId('user', this.userIdCounter++),
        ...data,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      this.users.push(user);
    }
  }

  private addHistoryNode(dispatchOrderId: string, nodeType: NodeType, title: string, description: string, operatorId?: string, operatorName?: string): HistoryNode {
    const node = {
      id: this.genId('history', this.historyIdCounter++),
      dispatchOrderId,
      nodeType,
      title,
      description,
      operatorId,
      operatorName,
      extraData: undefined,
      dispatchOrder: undefined,
      createdAt: new Date(),
    } as unknown as HistoryNode;
    this.historyNodes.push(node);
    return node;
  }

  private createSampleNormal() {
    const station = this.stations.find((s) => s.stationCode === 'ST001')!;
    const dispatcher = this.users.find((u) => u.role === UserRole.DISPATCHER)!;
    const reviewer = this.users.find((u) => u.role === UserRole.REVIEWER)!;

    const order: DispatchOrder = {
      id: this.genId('dispatch', this.dispatchIdCounter++),
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
      updatedAt: new Date(Date.now() - 1800000),
      historyNodes: [],
    } as DispatchOrder;

    this.dispatchOrders.push(order);

    const times = [
      [NodeType.ALERT, '缺车告警', '站点缺车，需补充 15 辆自行车', null, '系统', -7200000],
      [NodeType.DISPATCH_ASSIGNED, '调度员已分配', `调度员：${dispatcher.name}，调度车辆数：15 辆`, dispatcher.id, dispatcher.name, -7000000],
      [NodeType.DISPATCH_STARTED, '开始调度', '调度员已出发前往站点', dispatcher.id, dispatcher.name, -6800000],
      [NodeType.ARRIVED, '调度到达', '调度车辆已到达站点，准备补车', dispatcher.id, dispatcher.name, -3600000],
      [NodeType.PENDING_REVIEW, '补车完成，待复核', '已完成补车 15 辆，等待复核人确认', dispatcher.id, dispatcher.name, -2400000],
      [NodeType.REVIEW_PASSED, '复核通过，已归档', '复核人确认站点已恢复正常，调度单归档', reviewer.id, reviewer.name, -1800000],
    ] as const;

    for (const [nodeType, title, desc, opId, opName, offset] of times) {
      const node = this.addHistoryNode(order.id, nodeType, title, desc, opId || undefined, opName);
      node.createdAt = new Date(Date.now() + offset);
      order.historyNodes?.push(node);
    }
  }

  private createSampleFaulty() {
    const station = this.stations.find((s) => s.stationCode === 'ST003')!;
    const dispatcher = this.users.find((u) => u.role === UserRole.DISPATCHER)!;
    const repairer = this.users.find((u) => u.role === UserRole.REPAIRER)!;

    const faultyBike = this.bikes.find((b) => b.stationId === station.id) || this.bikes[0];

    const order: DispatchOrder = {
      id: this.genId('dispatch', this.dispatchIdCounter++),
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
      updatedAt: new Date(Date.now() - 3600000),
      historyNodes: [],
    } as DispatchOrder;

    this.dispatchOrders.push(order);

    const repair: RepairOrder = {
      id: this.genId('repair', this.repairIdCounter++),
      repairNo: 'WX202401150001',
      dispatchOrderId: order.id,
      dispatchOrder: order,
      bikeId: faultyBike.id,
      bike: faultyBike,
      faultType: FaultType.BRAKE,
      faultDescription: '后刹车失灵，刹车线松动，需要调整并更换刹车片',
      evidenceImages: ['/images/evidence/brake1.jpg', '/images/evidence/brake2.jpg'],
      repairerId: repairer.id,
      repairerName: repairer.name,
      status: RepairStatus.IN_PROGRESS,
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3000000),
    } as RepairOrder;

    this.repairOrders.push(repair);
    order.repairOrder = repair;

    const times = [
      [NodeType.ALERT, '缺车告警', '站点缺车，需补充 20 辆自行车', null, '系统', -10800000],
      [NodeType.DISPATCH_ASSIGNED, '调度员已分配', `调度员：${dispatcher.name}，调度车辆数：20 辆`, dispatcher.id, dispatcher.name, -10500000],
      [NodeType.DISPATCH_STARTED, '开始调度', '调度员已出发前往站点', dispatcher.id, dispatcher.name, -10200000],
      [NodeType.ARRIVED, '调度到达', '调度车辆已到达站点，准备补车', dispatcher.id, dispatcher.name, -5400000],
      [NodeType.FAULT_REPORTED, '发现故障', `故障类型：刹车故障\n故障描述：后刹车失灵，刹车线松动，需要调整并更换刹车片`, repairer.id, repairer.name, -4800000],
      [NodeType.REPAIR_STARTED, '开始维修', `维修员：${repairer.name}，开始处理故障`, repairer.id, repairer.name, -3600000],
    ] as const;

    for (const [nodeType, title, desc, opId, opName, offset] of times) {
      const node = this.addHistoryNode(order.id, nodeType, title, desc, opId || undefined, opName);
      node.createdAt = new Date(Date.now() + offset);
      order.historyNodes?.push(node);
    }
  }

  private createSampleStationError() {
    const order: DispatchOrder = {
      id: this.genId('dispatch', this.dispatchIdCounter++),
      orderNo: 'DD202401150003',
      reportedStationCode: 'ST999',
      requiredQuantity: 10,
      status: DispatchStatus.CANCELLED,
      sampleType: DispatchSampleType.STATION_ERROR,
      stationCodeError: true,
      stationCodeErrorMessage: '站点编号 ST999 不存在，请检查或重新绑定站点',
      timeoutMinutes: 30,
      remark: '上报站点编号错误，等待重新绑定',
      createdAt: new Date(Date.now() - 1800000),
      updatedAt: new Date(Date.now() - 1800000),
      historyNodes: [],
    } as DispatchOrder;

    this.dispatchOrders.push(order);

    const node = this.addHistoryNode(
      order.id,
      NodeType.STATION_ERROR,
      '站点编号错误',
      `站点编号 ST999 不存在，请检查或重新绑定站点\n上报站点编号：ST999`,
      undefined,
      '系统'
    );
    node.createdAt = new Date(Date.now() - 1800000);
    order.historyNodes?.push(node);
  }

  private createSampleTimeout() {
    const station = this.stations.find((s) => s.stationCode === 'ST005')!;
    const dispatcher = this.users.find((u) => u.role === UserRole.DISPATCHER)!;

    const order: DispatchOrder = {
      id: this.genId('dispatch', this.dispatchIdCounter++),
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
      updatedAt: new Date(Date.now() - 600000),
      historyNodes: [],
    } as DispatchOrder;

    this.dispatchOrders.push(order);

    const times = [
      [NodeType.ALERT, '缺车告警', '站点缺车，需补充 25 辆自行车', null, '系统', -3600000],
      [NodeType.DISPATCH_ASSIGNED, '调度员已分配', `调度员：${dispatcher.name}，调度车辆数：25 辆`, dispatcher.id, dispatcher.name, -3300000],
      [NodeType.DISPATCH_STARTED, '开始调度', '调度员已出发前往站点', dispatcher.id, dispatcher.name, -3000000],
      [NodeType.TIMEOUT, '调度超时', '调度已超过规定时间 5 分钟，请注意跟进', null, '系统', -600000],
    ] as const;

    for (const [nodeType, title, desc, opId, opName, offset] of times) {
      const node = this.addHistoryNode(order.id, nodeType, title, desc, opId || undefined, opName);
      node.createdAt = new Date(Date.now() + offset);
      order.historyNodes?.push(node);
    }
  }
}
