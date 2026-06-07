import type {
  Order,
  Customer,
  Cleaner,
  User,
  Photo,
  Complaint,
  Rework,
  Compensation,
  CompensationRule,
  OrderLog,
} from './schema';
import {
  orderStatusEnum,
  serviceTypeEnum,
  roleEnum,
  reworkReasonEnum,
  compensationRuleTypeEnum,
} from './schema';

let orderCounter = 1000;
const nextOrderNo = () => `BJ${Date.now().toString().slice(-6)}${orderCounter++}`;

let idCounter = 1;
const nextId = () => idCounter++;

function now() {
  return new Date();
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

function hoursLater(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

export const mockUsers: User[] = [
  { id: 1, name: '张客服', phone: '13800000001', role: 'customer_service', avatar: null as any, createdAt: daysAgo(30) },
  { id: 2, name: '李保洁', phone: '13800000002', role: 'cleaner', avatar: null as any, createdAt: daysAgo(30) },
  { id: 3, name: '王保洁', phone: '13800000003', role: 'cleaner', avatar: null as any, createdAt: daysAgo(25) },
  { id: 4, name: '赵质检', phone: '13800000004', role: 'inspector', avatar: null as any, createdAt: daysAgo(20) },
  { id: 5, name: '刘主管', phone: '13800000005', role: 'supervisor', avatar: null as any, createdAt: daysAgo(40) },
];

export const mockCustomers: Customer[] = [
  { id: 1, name: '陈女士', phone: '13900000001', address: '北京市朝阳区建国路88号SOHO现代城A座1201', city: '北京', district: '朝阳区', createdAt: daysAgo(60) },
  { id: 2, name: '王先生', phone: '13900000002', address: '北京市海淀区中关村大街1号海龙大厦15层', city: '北京', district: '海淀区', createdAt: daysAgo(50) },
  { id: 3, name: '李女士', phone: '13900000003', address: '上海市浦东新区陆家嘴环路168号', city: '上海', district: '浦东新区', createdAt: daysAgo(45) },
  { id: 4, name: '张先生', phone: '13900000004', address: '广州市天河区天河路385号太古汇', city: '广州', district: '天河区', createdAt: daysAgo(35) },
  { id: 5, name: '刘女士', phone: '13900000005', address: '深圳市南山区科技园南路腾讯大厦', city: '深圳', district: '南山区', createdAt: daysAgo(28) },
];

export const mockCleaners: Cleaner[] = [
  { id: 1, userId: 2, name: '李保洁', phone: '13800000002', level: 'senior', city: '北京', rating: '4.8', createdAt: daysAgo(90) },
  { id: 2, userId: 3, name: '王保洁', phone: '13800000003', level: 'junior', city: '北京', rating: '4.5', createdAt: daysAgo(60) },
  { id: 3, userId: 0 as any, name: '陈保洁', phone: '13800000006', level: 'mid', city: '上海', rating: '4.6', createdAt: daysAgo(70) },
  { id: 4, userId: 0 as any, name: '赵保洁', phone: '13800000007', level: 'senior', city: '广州', rating: '4.9', createdAt: daysAgo(80) },
];

export const mockCompensationRules: CompensationRule[] = [
  { id: 1, type: 'item_damage', name: '物品损坏赔付', description: '因保洁员操作不当导致客户物品损坏，按物品价值的一定比例赔付', baseAmount: '200.00', multiplier: '1.00', isActive: true, createdAt: daysAgo(100) },
  { id: 2, type: 'rework_timeout', name: '返工超时赔付', description: '返工未在规定时间内完成，按小时赔付', baseAmount: '50.00', multiplier: '1.00', isActive: true, createdAt: daysAgo(100) },
  { id: 3, type: 'customer_complaint', name: '客户投诉赔付', description: '客户有效投诉，给予一定金额补偿', baseAmount: '100.00', multiplier: '1.00', isActive: true, createdAt: daysAgo(100) },
  { id: 4, type: 'photo_missing', name: '照片缺失处罚', description: '完成照片缺失，扣除保洁员相应金额', baseAmount: '30.00', multiplier: '1.00', isActive: true, createdAt: daysAgo(100) },
];

let mockOrders: Order[] = [];
let mockPhotos: Photo[] = [];
let mockComplaints: Complaint[] = [];
let mockReworks: Rework[] = [];
let mockCompensations: Compensation[] = [];
let mockOrderLogs: OrderLog[] = [];

function createOrderLog(orderId: number, action: string, description: string, operatorId: number, operatorName: string, fromStatus: string | null, toStatus: string | null, createdAt: Date) {
  return {
    id: nextId(),
    orderId,
    action,
    description,
    operatorId,
    operatorName,
    fromStatus: fromStatus as any,
    toStatus: toStatus as any,
    createdAt,
  };
}

function initMockData() {
  if (mockOrders.length > 0) return;

  const orders: Order[] = [
    {
      id: 1,
      orderNo: 'BJ20240601001',
      customerId: 1,
      cleanerId: 1,
      serviceType: 'daily_cleaning',
      city: '北京',
      address: '北京市朝阳区建国路88号SOHO现代城A座1201',
      scheduledTime: daysAgo(3),
      duration: 120,
      price: '199.00',
      status: 'inspection_passed',
      remark: '日常保洁，重点清洁厨房和卫生间',
      assignedBy: 1,
      assignedAt: daysAgo(4),
      completedAt: daysAgo(3),
      inspectedBy: 4,
      inspectedAt: daysAgo(2),
      inspectionRemark: '验收通过，保洁质量良好',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(2),
    },
    {
      id: 2,
      orderNo: 'BJ20240602002',
      customerId: 2,
      cleanerId: 2,
      serviceType: 'deep_cleaning',
      city: '北京',
      address: '北京市海淀区中关村大街1号海龙大厦15层',
      scheduledTime: daysAgo(2),
      duration: 240,
      price: '399.00',
      status: 'inspection_failed',
      remark: '深度保洁，办公室全面清洁',
      assignedBy: 1,
      assignedAt: daysAgo(3),
      completedAt: daysAgo(1),
      inspectedBy: 4,
      inspectedAt: hoursAgo(12),
      inspectionRemark: '验收不通过：完成照片缺失，无法确认保洁质量',
      createdAt: daysAgo(4),
      updatedAt: hoursAgo(12),
    },
    {
      id: 3,
      orderNo: 'BJ20240603003',
      customerId: 3,
      cleanerId: 3,
      serviceType: 'move_in_out',
      city: '上海',
      address: '上海市浦东新区陆家嘴环路168号',
      scheduledTime: daysAgo(5),
      duration: 360,
      price: '799.00',
      status: 'compensation_pending',
      remark: '入住保洁，客户反映有物品损坏',
      assignedBy: 1,
      assignedAt: daysAgo(6),
      completedAt: daysAgo(5),
      inspectedBy: 4,
      inspectedAt: daysAgo(4),
      inspectionRemark: '发现客户花瓶破损，疑似保洁过程中碰倒',
      createdAt: daysAgo(7),
      updatedAt: daysAgo(1),
    },
    {
      id: 4,
      orderNo: 'BJ20240604004',
      customerId: 4,
      cleanerId: 4,
      serviceType: 'kitchen_cleaning',
      city: '广州',
      address: '广州市天河区天河路385号太古汇',
      scheduledTime: daysAgo(1),
      duration: 180,
      price: '299.00',
      status: 'rework_timeout',
      remark: '厨房专项清洁',
      assignedBy: 1,
      assignedAt: daysAgo(2),
      completedAt: hoursAgo(36),
      inspectedBy: 4,
      inspectedAt: hoursAgo(30),
      inspectionRemark: '厨房油烟清理不彻底，需要返工',
      createdAt: daysAgo(3),
      updatedAt: hoursAgo(2),
    },
    {
      id: 5,
      orderNo: 'BJ20240605005',
      customerId: 5,
      cleanerId: 1,
      serviceType: 'office_cleaning',
      city: '深圳',
      address: '深圳市南山区科技园南路腾讯大厦',
      scheduledTime: hoursLater(24),
      duration: 180,
      price: '499.00',
      status: 'assigned',
      remark: '办公室日常保洁',
      assignedBy: 1,
      assignedAt: hoursAgo(2),
      completedAt: null as any,
      inspectedBy: null as any,
      inspectedAt: null as any,
      inspectionRemark: null as any,
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(2),
    },
    {
      id: 6,
      orderNo: 'BJ20240606006',
      customerId: 1,
      cleanerId: null as any,
      serviceType: 'bathroom_cleaning',
      city: '北京',
      address: '北京市朝阳区建国路88号SOHO现代城A座1201',
      scheduledTime: hoursLater(48),
      duration: 90,
      price: '149.00',
      status: 'pending',
      remark: '卫生间深度清洁',
      assignedBy: null as any,
      assignedAt: null as any,
      completedAt: null as any,
      inspectedBy: null as any,
      inspectedAt: null as any,
      inspectionRemark: null as any,
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
    },
    {
      id: 7,
      orderNo: 'BJ20240607007',
      customerId: 2,
      cleanerId: 2,
      serviceType: 'daily_cleaning',
      city: '北京',
      address: '北京市海淀区中关村大街1号海龙大厦15层',
      scheduledTime: hoursAgo(6),
      duration: 120,
      price: '199.00',
      status: 'completed',
      remark: '日常保洁',
      assignedBy: 1,
      assignedAt: hoursAgo(10),
      completedAt: hoursAgo(1),
      inspectedBy: null as any,
      inspectedAt: null as any,
      inspectionRemark: null as any,
      createdAt: hoursAgo(12),
      updatedAt: hoursAgo(1),
    },
    {
      id: 8,
      orderNo: 'BJ20240608008',
      customerId: 3,
      cleanerId: 3,
      serviceType: 'deep_cleaning',
      city: '上海',
      address: '上海市浦东新区陆家嘴环路168号',
      scheduledTime: daysAgo(7),
      duration: 240,
      price: '399.00',
      status: 'closed',
      remark: '深度保洁',
      assignedBy: 1,
      assignedAt: daysAgo(8),
      completedAt: daysAgo(7),
      inspectedBy: 4,
      inspectedAt: daysAgo(6),
      inspectionRemark: '验收通过',
      createdAt: daysAgo(9),
      updatedAt: daysAgo(6),
    },
    {
      id: 9,
      orderNo: 'BJ20240609009',
      customerId: 4,
      cleanerId: 4,
      serviceType: 'daily_cleaning',
      city: '广州',
      address: '广州市天河区天河路385号太古汇',
      scheduledTime: daysAgo(10),
      duration: 120,
      price: '199.00',
      status: 'compensation_approved',
      remark: '客户投诉保洁质量差',
      assignedBy: 1,
      assignedAt: daysAgo(11),
      completedAt: daysAgo(10),
      inspectedBy: 4,
      inspectedAt: daysAgo(9),
      inspectionRemark: '保洁质量不达标，多处未清洁干净',
      createdAt: daysAgo(12),
      updatedAt: daysAgo(5),
    },
    {
      id: 10,
      orderNo: 'BJ20240610010',
      customerId: 5,
      cleanerId: 1,
      serviceType: 'move_in_out',
      city: '深圳',
      address: '深圳市南山区科技园南路腾讯大厦',
      scheduledTime: daysAgo(2),
      duration: 360,
      price: '799.00',
      status: 'rework',
      remark: '搬入保洁',
      assignedBy: 1,
      assignedAt: daysAgo(3),
      completedAt: daysAgo(2),
      inspectedBy: 4,
      inspectedAt: daysAgo(1),
      inspectionRemark: '窗户玻璃清洁不彻底，需要返工',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
    },
  ];

  mockOrders = orders;
  idCounter = 11;

  mockPhotos = [
    { id: 1, orderId: 1, url: 'https://picsum.photos/seed/clean1/400/300', type: 'completion', uploadedBy: 2, createdAt: daysAgo(3) },
    { id: 2, orderId: 1, url: 'https://picsum.photos/seed/clean2/400/300', type: 'completion', uploadedBy: 2, createdAt: daysAgo(3) },
    { id: 3, orderId: 1, url: 'https://picsum.photos/seed/clean3/400/300', type: 'completion', uploadedBy: 2, createdAt: daysAgo(3) },
    { id: 4, orderId: 3, url: 'https://picsum.photos/seed/clean4/400/300', type: 'completion', uploadedBy: 3, createdAt: daysAgo(5) },
    { id: 5, orderId: 3, url: 'https://picsum.photos/seed/damage1/400/300', type: 'evidence', uploadedBy: 4, createdAt: daysAgo(4) },
    { id: 6, orderId: 3, url: 'https://picsum.photos/seed/damage2/400/300', type: 'evidence', uploadedBy: 4, createdAt: daysAgo(4) },
    { id: 7, orderId: 4, url: 'https://picsum.photos/seed/clean5/400/300', type: 'completion', uploadedBy: 4, createdAt: hoursAgo(36) },
    { id: 8, orderId: 7, url: 'https://picsum.photos/seed/clean6/400/300', type: 'completion', uploadedBy: 2, createdAt: hoursAgo(1) },
    { id: 9, orderId: 7, url: 'https://picsum.photos/seed/clean7/400/300', type: 'completion', uploadedBy: 2, createdAt: hoursAgo(1) },
    { id: 10, orderId: 8, url: 'https://picsum.photos/seed/clean8/400/300', type: 'completion', uploadedBy: 3, createdAt: daysAgo(7) },
    { id: 11, orderId: 9, url: 'https://picsum.photos/seed/clean9/400/300', type: 'completion', uploadedBy: 4, createdAt: daysAgo(10) },
    { id: 12, orderId: 10, url: 'https://picsum.photos/seed/clean10/400/300', type: 'completion', uploadedBy: 2, createdAt: daysAgo(2) },
  ];

  mockComplaints = [
    { id: 1, orderId: 3, title: '花瓶破损', description: '保洁过程中不慎碰倒客户的花瓶，造成损坏。花瓶为客户心爱之物，价值约500元。', evidencePhotos: [
      'https://picsum.photos/seed/damage1/400/300',
      'https://picsum.photos/seed/damage2/400/300',
    ] as any, raisedBy: 4, createdAt: daysAgo(4) },
    { id: 2, orderId: 9, title: '保洁质量差', description: '客户反映多处未清洁干净，墙角有灰尘，地板有水渍。', evidencePhotos: [] as any, raisedBy: 4, createdAt: daysAgo(9) },
  ];

  mockReworks = [
    { id: 1, orderId: 4, reason: 'poor_quality', description: '厨房油烟清理不彻底，抽油烟机表面仍有油污', deadline: hoursAgo(4), assignedCleanerId: 4, completedAt: null as any, isTimeout: true, createdBy: 4, createdAt: hoursAgo(28) },
    { id: 2, orderId: 10, reason: 'poor_quality', description: '窗户玻璃清洁不彻底，有水痕', deadline: hoursLater(20), assignedCleanerId: 1, completedAt: null as any, isTimeout: false, createdBy: 4, createdAt: daysAgo(1) },
  ];

  mockCompensations = [
    { id: 1, orderId: 9, amount: '100.00', reason: '保洁质量不达标，客户投诉', ruleType: 'customer_complaint', status: 'approved', reviewedBy: 5, reviewedAt: daysAgo(5), reviewRemark: '情况属实，同意赔付', createdAt: daysAgo(8) },
    { id: 2, orderId: 3, amount: '300.00', reason: '物品损坏赔付（花瓶）', ruleType: 'item_damage', status: 'pending', reviewedBy: null as any, reviewedAt: null as any, reviewRemark: null as any, createdAt: daysAgo(3) },
  ];

  mockOrderLogs = [
    createOrderLog(1, '创建订单', '客户下单：日常保洁', 1, '张客服', null, 'pending', daysAgo(5)),
    createOrderLog(1, '派单', '指派李保洁', 1, '张客服', 'pending', 'assigned', daysAgo(4)),
    createOrderLog(1, '开始服务', '保洁员开始服务', 2, '李保洁', 'assigned', 'in_progress', daysAgo(3)),
    createOrderLog(1, '提交完成', '保洁员提交完成记录和照片', 2, '李保洁', 'in_progress', 'completed', daysAgo(3)),
    createOrderLog(1, '验收通过', '质检员复核通过', 4, '赵质检', 'completed', 'inspection_passed', daysAgo(2)),

    createOrderLog(2, '创建订单', '客户下单：深度保洁', 1, '张客服', null, 'pending', daysAgo(4)),
    createOrderLog(2, '派单', '指派王保洁', 1, '张客服', 'pending', 'assigned', daysAgo(3)),
    createOrderLog(2, '开始服务', '保洁员开始服务', 3, '王保洁', 'assigned', 'in_progress', daysAgo(2)),
    createOrderLog(2, '提交完成', '保洁员提交完成（无照片）', 3, '王保洁', 'in_progress', 'completed', daysAgo(1)),
    createOrderLog(2, '验收不通过', '完成照片缺失，不予通过', 4, '赵质检', 'completed', 'inspection_failed', hoursAgo(12)),

    createOrderLog(3, '创建订单', '客户下单：入住保洁', 1, '张客服', null, 'pending', daysAgo(7)),
    createOrderLog(3, '派单', '指派陈保洁', 1, '张客服', 'pending', 'assigned', daysAgo(6)),
    createOrderLog(3, '开始服务', '保洁员开始服务', 3, '陈保洁', 'assigned', 'in_progress', daysAgo(5)),
    createOrderLog(3, '提交完成', '保洁员提交完成记录', 3, '陈保洁', 'in_progress', 'completed', daysAgo(5)),
    createOrderLog(3, '验收发现问题', '发现物品损坏，进入赔付流程', 4, '赵质检', 'completed', 'compensation_pending', daysAgo(4)),

    createOrderLog(4, '创建订单', '客户下单：厨房清洁', 1, '张客服', null, 'pending', daysAgo(3)),
    createOrderLog(4, '派单', '指派赵保洁', 1, '张客服', 'pending', 'assigned', daysAgo(2)),
    createOrderLog(4, '开始服务', '保洁员开始服务', 4, '赵保洁', 'assigned', 'in_progress', hoursAgo(36)),
    createOrderLog(4, '提交完成', '保洁员提交完成记录', 4, '赵保洁', 'in_progress', 'completed', hoursAgo(36)),
    createOrderLog(4, '验收不通过', '厨房清洁不彻底，需返工', 4, '赵质检', 'completed', 'rework', hoursAgo(28)),
    createOrderLog(4, '返工超时', '返工未在规定时间内完成', 4, '赵质检', 'rework', 'rework_timeout', hoursAgo(2)),

    createOrderLog(10, '创建订单', '客户下单：搬入保洁', 1, '张客服', null, 'pending', daysAgo(4)),
    createOrderLog(10, '派单', '指派李保洁', 1, '张客服', 'pending', 'assigned', daysAgo(3)),
    createOrderLog(10, '开始服务', '保洁员开始服务', 2, '李保洁', 'assigned', 'in_progress', daysAgo(2)),
    createOrderLog(10, '提交完成', '保洁员提交完成记录', 2, '李保洁', 'in_progress', 'completed', daysAgo(2)),
    createOrderLog(10, '验收不通过', '窗户清洁不彻底，需返工', 4, '赵质检', 'completed', 'rework', daysAgo(1)),
  ];
}

initMockData();

export function getOrders() {
  return [...mockOrders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getOrderById(id: number) {
  return mockOrders.find(o => o.id === id);
}

export function getOrderPhotos(orderId: number) {
  return mockPhotos.filter(p => p.orderId === orderId);
}

export function getOrderComplaint(orderId: number) {
  return mockComplaints.find(c => c.orderId === orderId);
}

export function getOrderRework(orderId: number) {
  return mockReworks.find(r => r.orderId === orderId);
}

export function getOrderCompensation(orderId: number) {
  return mockCompensations.find(c => c.orderId === orderId);
}

export function getOrderLogs(orderId: number) {
  return mockOrderLogs.filter(l => l.orderId === orderId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getCustomerById(id: number) {
  return mockCustomers.find(c => c.id === id);
}

export function getCleanerById(id: number) {
  return mockCleaners.find(c => c.id === id);
}

export function getCompensationRules() {
  return [...mockCompensationRules];
}

export function assignOrder(orderId: number, cleanerId: number, operatorId: number, operatorName: string) {
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) return null;

  order.cleanerId = cleanerId;
  order.status = 'assigned';
  order.assignedBy = operatorId;
  order.assignedAt = now();
  order.updatedAt = now();

  mockOrderLogs.push(createOrderLog(
    orderId,
    '派单',
    `指派保洁员`,
    operatorId,
    operatorName,
    'pending',
    'assigned',
    now()
  ));

  return order;
}

export function completeOrder(orderId: number, operatorId: number, operatorName: string, photos?: string[]) {
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) return null;

  order.status = 'completed';
  order.completedAt = now();
  order.updatedAt = now();

  mockOrderLogs.push(createOrderLog(
    orderId,
    '提交完成',
    '保洁员提交完成记录',
    operatorId,
    operatorName,
    'in_progress',
    'completed',
    now()
  ));

  if (photos && photos.length > 0) {
    photos.forEach(url => {
      mockPhotos.push({
        id: nextId(),
        orderId,
        url,
        type: 'completion',
        uploadedBy: operatorId,
        createdAt: now(),
      });
    });
  }

  return order;
}

export function inspectOrder(orderId: number, passed: boolean, remark: string, operatorId: number, operatorName: string) {
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) return null;

  const photos = getOrderPhotos(orderId).filter(p => p.type === 'completion');
  if (!passed && photos.length === 0) {
    order.status = 'inspection_failed';
    order.inspectionRemark = remark || '完成照片缺失，不予通过';
  } else if (passed) {
    order.status = 'inspection_passed';
    order.inspectionRemark = remark;
  } else {
    order.status = 'inspection_failed';
    order.inspectionRemark = remark;
  }

  order.inspectedBy = operatorId;
  order.inspectedAt = now();
  order.updatedAt = now();

  mockOrderLogs.push(createOrderLog(
    orderId,
    passed ? '验收通过' : '验收不通过',
    remark,
    operatorId,
    operatorName,
    'completed',
    passed ? 'inspection_passed' : 'inspection_failed',
    now()
  ));

  return order;
}

export function createRework(orderId: number, reason: string, description: string, deadlineHours: number, cleanerId: number, operatorId: number, operatorName: string) {
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) return null;

  order.status = 'rework';
  order.updatedAt = now();

  const rework = {
    id: nextId(),
    orderId,
    reason: reason as any,
    description,
    deadline: hoursLater(deadlineHours),
    assignedCleanerId: cleanerId,
    completedAt: null as any,
    isTimeout: false,
    createdBy: operatorId,
    createdAt: now(),
  };

  mockReworks.push(rework);

  mockOrderLogs.push(createOrderLog(
    orderId,
    '创建返工',
    description,
    operatorId,
    operatorName,
    'inspection_failed',
    'rework',
    now()
  ));

  return rework;
}

export function completeRework(reworkId: number) {
  const rework = mockReworks.find(r => r.id === reworkId);
  if (!rework) return null;

  rework.completedAt = now();

  const order = mockOrders.find(o => o.id === rework.orderId);
  if (order) {
    order.status = 'rework_completed';
    order.updatedAt = now();

    mockOrderLogs.push(createOrderLog(
      rework.orderId,
      '返工完成',
      '返工已完成，等待复核',
      rework.assignedCleanerId,
      '保洁员',
      'rework',
      'rework_completed',
      now()
    ));
  }

  return rework;
}

export function createCompensation(orderId: number, amount: string, reason: string, ruleType: string, operatorId: number, operatorName: string) {
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) return null;

  order.status = 'compensation_pending';
  order.updatedAt = now();

  const compensation = {
    id: nextId(),
    orderId,
    amount,
    reason,
    ruleType: ruleType as any,
    status: 'pending',
    reviewedBy: null as any,
    reviewedAt: null as any,
    reviewRemark: null as any,
    createdAt: now(),
  };

  mockCompensations.push(compensation);

  mockOrderLogs.push(createOrderLog(
    orderId,
    '创建赔付申请',
    `${reason}，金额：${amount}元`,
    operatorId,
    operatorName,
    order.status,
    'compensation_pending',
    now()
  ));

  return compensation;
}

export function reviewCompensation(compensationId: number, approved: boolean, remark: string, operatorId: number, operatorName: string) {
  const compensation = mockCompensations.find(c => c.id === compensationId);
  if (!compensation) return null;

  compensation.status = approved ? 'approved' : 'rejected';
  compensation.reviewedBy = operatorId;
  compensation.reviewedAt = now();
  compensation.reviewRemark = remark;

  const order = mockOrders.find(o => o.id === compensation.orderId);
  if (order) {
    order.status = approved ? 'compensation_approved' : 'closed';
    order.updatedAt = now();

    mockOrderLogs.push(createOrderLog(
      compensation.orderId,
      approved ? '赔付批准' : '赔付拒绝',
      remark,
      operatorId,
      operatorName,
      'compensation_pending',
      approved ? 'compensation_approved' : 'closed',
      now()
    ));
  }

  return compensation;
}

export function getStatistics() {
  const orders = getOrders();

  const byServiceType: Record<string, { count: number; totalPrice: string; reworkCount: number }> = {};
  const byCity: Record<string, { count: number; totalPrice: string }> = {};
  const byReworkReason: Record<string, number> = {};
  let totalCompensation = 0;
  let compensationCount = 0;

  orders.forEach(order => {
    if (!byServiceType[order.serviceType]) {
      byServiceType[order.serviceType] = { count: 0, totalPrice: '0.00', reworkCount: 0 };
    }
    byServiceType[order.serviceType].count++;
    byServiceType[order.serviceType].totalPrice = (parseFloat(byServiceType[order.serviceType].totalPrice) + parseFloat(order.price as string)).toFixed(2);

    if (order.status === 'rework' || order.status === 'rework_completed' || order.status === 'rework_timeout') {
      byServiceType[order.serviceType].reworkCount++;
    }

    if (!byCity[order.city]) {
      byCity[order.city] = { count: 0, totalPrice: '0.00' };
    }
    byCity[order.city].count++;
    byCity[order.city].totalPrice = (parseFloat(byCity[order.city].totalPrice) + parseFloat(order.price as string)).toFixed(2);
  });

  mockReworks.forEach(rework => {
    if (!byReworkReason[rework.reason]) {
      byReworkReason[rework.reason] = 0;
    }
    byReworkReason[rework.reason]++;
  });

  mockCompensations.forEach(comp => {
    if (comp.status === 'approved' || comp.status === 'pending') {
      totalCompensation += parseFloat(comp.amount as string);
      compensationCount++;
    }
  });

  return {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'inspection_passed' || o.status === 'closed' || o.status === 'compensation_approved').length,
    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'assigned').length,
    reworkOrders: orders.filter(o => o.status === 'rework' || o.status === 'rework_completed' || o.status === 'rework_timeout').length,
    totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.price as string), 0).toFixed(2),
    totalCompensation: totalCompensation.toFixed(2),
    compensationCount,
    byServiceType,
    byCity,
    byReworkReason,
  };
}

export function getUsers() {
  return [...mockUsers];
}

export function getCleaners() {
  return [...mockCleaners];
}
