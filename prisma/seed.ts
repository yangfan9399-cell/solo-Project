import { PrismaClient, VisitStatus, AnomalyType, SourceType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  await prisma.releaseEvidence.deleteMany();
  await prisma.changeLog.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.parkingSpot.deleteMany();
  await prisma.user.deleteMany();

  const spots = await prisma.parkingSpot.createManyAndReturn({
    data: [
      { spotNumber: 'A-001', floor: 'B1', zone: 'A区', isAvailable: true },
      { spotNumber: 'A-002', floor: 'B1', zone: 'A区', isAvailable: false },
      { spotNumber: 'A-003', floor: 'B1', zone: 'A区', isAvailable: true },
      { spotNumber: 'B-001', floor: 'B1', zone: 'B区', isAvailable: true },
      { spotNumber: 'B-002', floor: 'B1', zone: 'B区', isAvailable: true },
      { spotNumber: 'B-003', floor: 'B1', zone: 'B区', isAvailable: false },
      { spotNumber: 'C-001', floor: 'B2', zone: 'C区', isAvailable: true },
      { spotNumber: 'C-002', floor: 'B2', zone: 'C区', isAvailable: true },
    ],
  });

  const spotMap = new Map(spots.map(s => [s.spotNumber, s]));

  await prisma.user.createMany({
    data: [
      { username: 'guard1', name: '张保安', role: Role.GATE_GUARD, password: '123456' },
      { username: 'property1', name: '李物业', role: Role.PROPERTY, password: '123456' },
      { username: 'admin', name: '管理员', role: Role.ADMIN, password: 'admin' },
    ],
  });

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const normalVisit = await prisma.visit.create({
    data: {
      visitorName: '王正常',
      visitorPhone: '13800138001',
      visitorCompany: '科技有限公司',
      licensePlate: '京A12345',
      originalPlate: '京A12345',
      parkingSpotId: spotMap.get('A-001')?.id,
      originalSpotId: spotMap.get('A-001')?.id,
      visitDate: today,
      startTime: new Date(today.setHours(9, 0, 0, 0)),
      endTime: new Date(today.setHours(17, 0, 0, 0)),
      actualCheckIn: new Date(today.setHours(9, 15, 0, 0)),
      actualCheckOut: new Date(today.setHours(16, 30, 0, 0)),
      status: VisitStatus.CHECKED_OUT,
      source: SourceType.WECHAT,
      hostName: '赵主管',
      hostPhone: '13900139001',
      hostDepartment: '技术部',
      purpose: '商务洽谈',
      anomalyType: AnomalyType.NONE,
      isArchived: false,
      evidences: {
        create: {
          type: 'ENTRY_PHOTO',
          description: '入场照片',
          capturedBy: 'guard1',
        },
      },
      changeLogs: {
        create: [
          {
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'CHECKED_IN',
            changedBy: '张保安',
            note: '门岗确认入场',
          },
          {
            fieldName: 'status',
            oldValue: 'CHECKED_IN',
            newValue: 'CHECKED_OUT',
            changedBy: '李物业',
            note: '确认离场，车位已释放',
          },
        ],
      },
    },
    include: { changeLogs: true, evidences: true },
  });

  const plateMismatchVisit = await prisma.visit.create({
    data: {
      visitorName: '刘车牌',
      visitorPhone: '13800138002',
      visitorCompany: '贸易公司',
      licensePlate: '京B67890',
      originalPlate: '京B67899',
      parkingSpotId: spotMap.get('B-001')?.id,
      originalSpotId: spotMap.get('B-001')?.id,
      visitDate: today,
      startTime: new Date(today.setHours(10, 0, 0, 0)),
      endTime: new Date(today.setHours(18, 0, 0, 0)),
      actualCheckIn: new Date(today.setHours(10, 20, 0, 0)),
      status: VisitStatus.CHECKED_IN,
      source: SourceType.APP,
      hostName: '陈经理',
      hostPhone: '13900139002',
      hostDepartment: '销售部',
      purpose: '客户拜访',
      anomalyType: AnomalyType.PLATE_MISMATCH,
      anomalyNote: '实际车牌与预约不符，预约为京B67899，实际为京B67890，已电话确认车主',
      isArchived: false,
      evidences: {
        create: {
          type: 'PLATE_PHOTO',
          description: '实际车牌照片',
          capturedBy: 'guard1',
        },
      },
      changeLogs: {
        create: [
          {
            fieldName: 'licensePlate',
            oldValue: '京B67899',
            newValue: '京B67890',
            changedBy: '张保安',
            note: '车牌不一致，已核实修改',
          },
          {
            fieldName: 'anomalyType',
            oldValue: 'NONE',
            newValue: 'PLATE_MISMATCH',
            changedBy: '张保安',
            note: '记录车牌不一致异常',
          },
          {
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'CHECKED_IN',
            changedBy: '张保安',
            note: '异常后确认入场',
          },
        ],
      },
    },
    include: { changeLogs: true, evidences: true },
  });

  const spotOccupiedVisit = await prisma.visit.create({
    data: {
      visitorName: '孙车位',
      visitorPhone: '13800138003',
      licensePlate: '京C11111',
      originalPlate: '京C11111',
      parkingSpotId: spotMap.get('C-001')?.id,
      originalSpotId: spotMap.get('A-002')?.id,
      visitDate: today,
      startTime: new Date(today.setHours(14, 0, 0, 0)),
      endTime: new Date(today.setHours(20, 0, 0, 0)),
      actualCheckIn: new Date(today.setHours(14, 10, 0, 0)),
      status: VisitStatus.CHECKED_IN,
      source: SourceType.PHONE,
      hostName: '周总监',
      hostPhone: '13900139003',
      hostDepartment: '行政部',
      purpose: '面试',
      anomalyType: AnomalyType.SPOT_OCCUPIED,
      anomalyNote: '预约车位A-002被占用，已协调更换为C-001',
      isArchived: false,
      changeLogs: {
        create: [
          {
            fieldName: 'parkingSpotId',
            oldValue: spotMap.get('A-002')?.spotNumber,
            newValue: spotMap.get('C-001')?.spotNumber,
            changedBy: '李物业',
            note: '原车位被占用，协调更换车位',
          },
          {
            fieldName: 'anomalyType',
            oldValue: 'NONE',
            newValue: 'SPOT_OCCUPIED',
            changedBy: '李物业',
            note: '记录车位被占用异常',
          },
          {
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'CHECKED_IN',
            changedBy: '张保安',
            note: '更换车位后入场',
          },
        ],
      },
    },
    include: { changeLogs: true },
  });

  const overstayVisit = await prisma.visit.create({
    data: {
      visitorName: '钱超时',
      visitorPhone: '13800138004',
      licensePlate: '京D22222',
      originalPlate: '京D22222',
      parkingSpotId: spotMap.get('A-003')?.id,
      originalSpotId: spotMap.get('A-003')?.id,
      visitDate: yesterday,
      startTime: new Date(yesterday.setHours(8, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(12, 0, 0, 0)),
      actualCheckIn: new Date(yesterday.setHours(8, 30, 0, 0)),
      status: VisitStatus.CHECKED_IN,
      source: SourceType.ONSITE,
      hostName: '吴助理',
      hostPhone: '13900139004',
      purpose: '临时访问',
      anomalyType: AnomalyType.OVERSTAY,
      anomalyNote: '预约12:00离场，已超时，需要追踪确认',
      isArchived: false,
      changeLogs: {
        create: [
          {
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'CHECKED_IN',
            changedBy: '张保安',
            note: '正常入场',
          },
          {
            fieldName: 'anomalyType',
            oldValue: 'NONE',
            newValue: 'OVERSTAY',
            changedBy: '李物业',
            note: '超时未离场，发起追踪',
          },
        ],
      },
    },
    include: { changeLogs: true },
  });

  const pendingVisit = await prisma.visit.create({
    data: {
      visitorName: '冯待访',
      visitorPhone: '13800138005',
      visitorCompany: '设计工作室',
      licensePlate: '京E33333',
      originalPlate: '京E33333',
      parkingSpotId: spotMap.get('C-002')?.id,
      originalSpotId: spotMap.get('C-002')?.id,
      visitDate: tomorrow,
      startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(12, 0, 0, 0)),
      status: VisitStatus.PENDING,
      source: SourceType.WECHAT,
      hostName: '郑经理',
      hostPhone: '13900139005',
      hostDepartment: '市场部',
      purpose: '项目对接',
      anomalyType: AnomalyType.NONE,
      isArchived: false,
    },
  });

  const archivedVisit = await prisma.visit.create({
    data: {
      visitorName: '已归档',
      visitorPhone: '13800138999',
      licensePlate: '京Z99999',
      originalPlate: '京Z99999',
      parkingSpotId: spotMap.get('B-002')?.id,
      originalSpotId: spotMap.get('B-002')?.id,
      visitDate: yesterday,
      startTime: new Date(yesterday.setHours(10, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(16, 0, 0, 0)),
      actualCheckIn: new Date(yesterday.setHours(10, 15, 0, 0)),
      actualCheckOut: new Date(yesterday.setHours(15, 45, 0, 0)),
      status: VisitStatus.ARCHIVED,
      source: SourceType.WECHAT,
      hostName: '归档人',
      hostPhone: '13900139999',
      purpose: '历史记录',
      anomalyType: AnomalyType.NONE,
      isArchived: true,
      changeLogs: {
        create: [
          {
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'CHECKED_IN',
            changedBy: '张保安',
            note: '入场',
          },
          {
            fieldName: 'status',
            oldValue: 'CHECKED_IN',
            newValue: 'CHECKED_OUT',
            changedBy: '李物业',
            note: '离场',
          },
          {
            fieldName: 'status',
            oldValue: 'CHECKED_OUT',
            newValue: 'ARCHIVED',
            changedBy: '管理员',
            note: '系统自动归档',
          },
        ],
      },
    },
    include: { changeLogs: true },
  });

  console.log('种子数据创建完成!');
  console.log('正常访问:', normalVisit.id);
  console.log('车牌不一致:', plateMismatchVisit.id);
  console.log('车位被占用:', spotOccupiedVisit.id);
  console.log('超时未离场:', overstayVisit.id);
  console.log('待访问:', pendingVisit.id);
  console.log('已归档:', archivedVisit.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
