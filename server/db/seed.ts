import { useDb } from './index';
import {
  users,
  customers,
  cleaners,
  orders,
  photos,
  complaints,
  reworks,
  compensations,
  compensationRules,
  orderLogs,
} from './schema';
import { eq, sql } from 'drizzle-orm';

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

function hoursLater(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

async function seed() {
  const db = useDb();

  console.log('🌱 Seeding database...');

  console.log('  → Cleaning existing data...');
  await db.delete(orderLogs);
  await db.delete(compensations);
  await db.delete(reworks);
  await db.delete(complaints);
  await db.delete(photos);
  await db.delete(orders);
  await db.delete(cleaners);
  await db.delete(customers);
  await db.delete(users);
  await db.delete(compensationRules);

  console.log('  → Resetting sequences...');
  await db.execute(sql`
    SELECT setval('users_id_seq', 1, false);
    SELECT setval('customers_id_seq', 1, false);
    SELECT setval('cleaners_id_seq', 1, false);
    SELECT setval('orders_id_seq', 1, false);
    SELECT setval('photos_id_seq', 1, false);
    SELECT setval('complaints_id_seq', 1, false);
    SELECT setval('reworks_id_seq', 1, false);
    SELECT setval('compensations_id_seq', 1, false);
    SELECT setval('compensation_rules_id_seq', 1, false);
    SELECT setval('order_logs_id_seq', 1, false);
  `);

  console.log('  → Inserting users...');
  const [user1] = await db.insert(users).values({
    name: '张客服',
    phone: '13800000001',
    role: 'customer_service',
    createdAt: daysAgo(30),
  }).returning();

  const [user2] = await db.insert(users).values({
    name: '李保洁',
    phone: '13800000002',
    role: 'cleaner',
    createdAt: daysAgo(30),
  }).returning();

  const [user3] = await db.insert(users).values({
    name: '王保洁',
    phone: '13800000003',
    role: 'cleaner',
    createdAt: daysAgo(25),
  }).returning();

  const [user4] = await db.insert(users).values({
    name: '赵质检',
    phone: '13800000004',
    role: 'inspector',
    createdAt: daysAgo(20),
  }).returning();

  const [user5] = await db.insert(users).values({
    name: '刘主管',
    phone: '13800000005',
    role: 'supervisor',
    createdAt: daysAgo(40),
  }).returning();

  const [user6] = await db.insert(users).values({
    name: '陈保洁',
    phone: '13800000006',
    role: 'cleaner',
    createdAt: daysAgo(70),
  }).returning();

  const [user7] = await db.insert(users).values({
    name: '赵保洁',
    phone: '13800000007',
    role: 'cleaner',
    createdAt: daysAgo(80),
  }).returning();

  console.log('  → Inserting customers...');
  const [cust1] = await db.insert(customers).values({
    name: '陈女士',
    phone: '13900000001',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201',
    city: '北京',
    district: '朝阳区',
    createdAt: daysAgo(60),
  }).returning();

  const [cust2] = await db.insert(customers).values({
    name: '王先生',
    phone: '13900000002',
    address: '北京市海淀区中关村大街1号海龙大厦15层',
    city: '北京',
    district: '海淀区',
    createdAt: daysAgo(50),
  }).returning();

  const [cust3] = await db.insert(customers).values({
    name: '李女士',
    phone: '13900000003',
    address: '上海市浦东新区陆家嘴环路168号',
    city: '上海',
    district: '浦东新区',
    createdAt: daysAgo(45),
  }).returning();

  const [cust4] = await db.insert(customers).values({
    name: '张先生',
    phone: '13900000004',
    address: '广州市天河区天河路385号太古汇',
    city: '广州',
    district: '天河区',
    createdAt: daysAgo(35),
  }).returning();

  const [cust5] = await db.insert(customers).values({
    name: '刘女士',
    phone: '13900000005',
    address: '深圳市南山区科技园南路腾讯大厦',
    city: '深圳',
    district: '南山区',
    createdAt: daysAgo(28),
  }).returning();

  console.log('  → Inserting cleaners...');
  const [cleaner1] = await db.insert(cleaners).values({
    userId: user2.id,
    name: '李保洁',
    phone: '13800000002',
    level: 'senior',
    city: '北京',
    rating: '4.8',
    createdAt: daysAgo(90),
  }).returning();

  const [cleaner2] = await db.insert(cleaners).values({
    userId: user3.id,
    name: '王保洁',
    phone: '13800000003',
    level: 'junior',
    city: '北京',
    rating: '4.5',
    createdAt: daysAgo(60),
  }).returning();

  const [cleaner3] = await db.insert(cleaners).values({
    userId: user6.id,
    name: '陈保洁',
    phone: '13800000006',
    level: 'mid',
    city: '上海',
    rating: '4.6',
    createdAt: daysAgo(70),
  }).returning();

  const [cleaner4] = await db.insert(cleaners).values({
    userId: user7.id,
    name: '赵保洁',
    phone: '13800000007',
    level: 'senior',
    city: '广州',
    rating: '4.9',
    createdAt: daysAgo(80),
  }).returning();

  console.log('  → Inserting compensation rules...');
  await db.insert(compensationRules).values([
    {
      type: 'item_damage',
      name: '物品损坏赔付',
      description: '因保洁员操作不当导致客户物品损坏，按物品价值的一定比例赔付',
      baseAmount: '200.00',
      multiplier: '1.00',
      isActive: true,
      createdAt: daysAgo(100),
    },
    {
      type: 'rework_timeout',
      name: '返工超时赔付',
      description: '返工未在规定时间内完成，按小时赔付',
      baseAmount: '50.00',
      multiplier: '1.00',
      isActive: true,
      createdAt: daysAgo(100),
    },
    {
      type: 'customer_complaint',
      name: '客户投诉赔付',
      description: '客户有效投诉，给予一定金额补偿',
      baseAmount: '100.00',
      multiplier: '1.00',
      isActive: true,
      createdAt: daysAgo(100),
    },
    {
      type: 'photo_missing',
      name: '照片缺失处罚',
      description: '完成照片缺失，扣除保洁员相应金额',
      baseAmount: '30.00',
      multiplier: '1.00',
      isActive: true,
      createdAt: daysAgo(100),
    },
  ]);

  console.log('  → Inserting orders...');

  const [order1] = await db.insert(orders).values({
    orderNo: 'BJ20240601001',
    customerId: cust1.id,
    cleanerId: cleaner1.id,
    serviceType: 'daily_cleaning',
    city: '北京',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201',
    scheduledTime: daysAgo(3),
    duration: 120,
    price: '199.00',
    status: 'inspection_passed',
    remark: '日常保洁，重点清洁厨房和卫生间',
    assignedBy: user1.id,
    assignedAt: daysAgo(4),
    completedAt: daysAgo(3),
    inspectedBy: user4.id,
    inspectedAt: daysAgo(2),
    inspectionRemark: '验收通过，保洁质量良好',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
  }).returning();

  const [order2] = await db.insert(orders).values({
    orderNo: 'BJ20240602002',
    customerId: cust2.id,
    cleanerId: cleaner2.id,
    serviceType: 'deep_cleaning',
    city: '北京',
    address: '北京市海淀区中关村大街1号海龙大厦15层',
    scheduledTime: daysAgo(2),
    duration: 240,
    price: '399.00',
    status: 'inspection_failed',
    remark: '深度保洁，办公室全面清洁',
    assignedBy: user1.id,
    assignedAt: daysAgo(3),
    completedAt: daysAgo(1),
    inspectedBy: user4.id,
    inspectedAt: hoursAgo(12),
    inspectionRemark: '验收不通过：完成照片缺失，无法确认保洁质量',
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(12),
  }).returning();

  const [order3] = await db.insert(orders).values({
    orderNo: 'BJ20240603003',
    customerId: cust3.id,
    cleanerId: cleaner3.id,
    serviceType: 'move_in_out',
    city: '上海',
    address: '上海市浦东新区陆家嘴环路168号',
    scheduledTime: daysAgo(5),
    duration: 360,
    price: '799.00',
    status: 'compensation_pending',
    remark: '入住保洁，客户反映有物品损坏',
    assignedBy: user1.id,
    assignedAt: daysAgo(6),
    completedAt: daysAgo(5),
    inspectedBy: user4.id,
    inspectedAt: daysAgo(4),
    inspectionRemark: '发现客户花瓶破损，疑似保洁过程中碰倒',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  }).returning();

  const [order4] = await db.insert(orders).values({
    orderNo: 'BJ20240604004',
    customerId: cust4.id,
    cleanerId: cleaner4.id,
    serviceType: 'kitchen_cleaning',
    city: '广州',
    address: '广州市天河区天河路385号太古汇',
    scheduledTime: daysAgo(1),
    duration: 180,
    price: '299.00',
    status: 'rework_timeout',
    remark: '厨房专项清洁',
    assignedBy: user1.id,
    assignedAt: daysAgo(2),
    completedAt: hoursAgo(36),
    inspectedBy: user4.id,
    inspectedAt: hoursAgo(30),
    inspectionRemark: '厨房油烟清理不彻底，需要返工',
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(2),
  }).returning();

  const [order5] = await db.insert(orders).values({
    orderNo: 'BJ20240605005',
    customerId: cust5.id,
    cleanerId: cleaner1.id,
    serviceType: 'office_cleaning',
    city: '深圳',
    address: '深圳市南山区科技园南路腾讯大厦',
    scheduledTime: hoursLater(24),
    duration: 180,
    price: '499.00',
    status: 'assigned',
    remark: '办公室日常保洁',
    assignedBy: user1.id,
    assignedAt: hoursAgo(2),
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(2),
  }).returning();

  const [order6] = await db.insert(orders).values({
    orderNo: 'BJ20240606006',
    customerId: cust1.id,
    serviceType: 'bathroom_cleaning',
    city: '北京',
    address: '北京市朝阳区建国路88号SOHO现代城A座1201',
    scheduledTime: hoursLater(48),
    duration: 90,
    price: '149.00',
    status: 'pending',
    remark: '卫生间深度清洁',
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  }).returning();

  const [order7] = await db.insert(orders).values({
    orderNo: 'BJ20240607007',
    customerId: cust2.id,
    cleanerId: cleaner2.id,
    serviceType: 'daily_cleaning',
    city: '北京',
    address: '北京市海淀区中关村大街1号海龙大厦15层',
    scheduledTime: hoursAgo(6),
    duration: 120,
    price: '199.00',
    status: 'completed',
    remark: '日常保洁',
    assignedBy: user1.id,
    assignedAt: hoursAgo(10),
    completedAt: hoursAgo(1),
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(1),
  }).returning();

  const [order8] = await db.insert(orders).values({
    orderNo: 'BJ20240608008',
    customerId: cust3.id,
    cleanerId: cleaner3.id,
    serviceType: 'deep_cleaning',
    city: '上海',
    address: '上海市浦东新区陆家嘴环路168号',
    scheduledTime: daysAgo(7),
    duration: 240,
    price: '399.00',
    status: 'closed',
    remark: '深度保洁',
    assignedBy: user1.id,
    assignedAt: daysAgo(8),
    completedAt: daysAgo(7),
    inspectedBy: user4.id,
    inspectedAt: daysAgo(6),
    inspectionRemark: '验收通过',
    createdAt: daysAgo(9),
    updatedAt: daysAgo(6),
  }).returning();

  const [order9] = await db.insert(orders).values({
    orderNo: 'BJ20240609009',
    customerId: cust4.id,
    cleanerId: cleaner4.id,
    serviceType: 'daily_cleaning',
    city: '广州',
    address: '广州市天河区天河路385号太古汇',
    scheduledTime: daysAgo(10),
    duration: 120,
    price: '199.00',
    status: 'compensation_approved',
    remark: '客户投诉保洁质量差',
    assignedBy: user1.id,
    assignedAt: daysAgo(11),
    completedAt: daysAgo(10),
    inspectedBy: user4.id,
    inspectedAt: daysAgo(9),
    inspectionRemark: '保洁质量不达标，多处未清洁干净',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(5),
  }).returning();

  const [order10] = await db.insert(orders).values({
    orderNo: 'BJ20240610010',
    customerId: cust5.id,
    cleanerId: cleaner1.id,
    serviceType: 'move_in_out',
    city: '深圳',
    address: '深圳市南山区科技园南路腾讯大厦',
    scheduledTime: daysAgo(2),
    duration: 360,
    price: '799.00',
    status: 'rework',
    remark: '搬入保洁',
    assignedBy: user1.id,
    assignedAt: daysAgo(3),
    completedAt: daysAgo(2),
    inspectedBy: user4.id,
    inspectedAt: daysAgo(1),
    inspectionRemark: '窗户玻璃清洁不彻底，需要返工',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
  }).returning();

  console.log('  → Inserting photos...');
  await db.insert(photos).values([
    { orderId: order1.id, url: 'https://picsum.photos/seed/clean1/400/300', type: 'completion', uploadedBy: user2.id, createdAt: daysAgo(3) },
    { orderId: order1.id, url: 'https://picsum.photos/seed/clean2/400/300', type: 'completion', uploadedBy: user2.id, createdAt: daysAgo(3) },
    { orderId: order1.id, url: 'https://picsum.photos/seed/clean3/400/300', type: 'completion', uploadedBy: user2.id, createdAt: daysAgo(3) },
    { orderId: order3.id, url: 'https://picsum.photos/seed/clean4/400/300', type: 'completion', uploadedBy: user6.id, createdAt: daysAgo(5) },
    { orderId: order3.id, url: 'https://picsum.photos/seed/damage1/400/300', type: 'evidence', uploadedBy: user4.id, createdAt: daysAgo(4) },
    { orderId: order3.id, url: 'https://picsum.photos/seed/damage2/400/300', type: 'evidence', uploadedBy: user4.id, createdAt: daysAgo(4) },
    { orderId: order4.id, url: 'https://picsum.photos/seed/clean5/400/300', type: 'completion', uploadedBy: user7.id, createdAt: hoursAgo(36) },
    { orderId: order7.id, url: 'https://picsum.photos/seed/clean6/400/300', type: 'completion', uploadedBy: user3.id, createdAt: hoursAgo(1) },
    { orderId: order7.id, url: 'https://picsum.photos/seed/clean7/400/300', type: 'completion', uploadedBy: user3.id, createdAt: hoursAgo(1) },
    { orderId: order8.id, url: 'https://picsum.photos/seed/clean8/400/300', type: 'completion', uploadedBy: user6.id, createdAt: daysAgo(7) },
    { orderId: order9.id, url: 'https://picsum.photos/seed/clean9/400/300', type: 'completion', uploadedBy: user7.id, createdAt: daysAgo(10) },
    { orderId: order10.id, url: 'https://picsum.photos/seed/clean10/400/300', type: 'completion', uploadedBy: user2.id, createdAt: daysAgo(2) },
  ]);

  console.log('  → Inserting complaints...');
  await db.insert(complaints).values([
    {
      orderId: order3.id,
      title: '花瓶破损',
      description: '保洁过程中不慎碰倒客户的花瓶，造成损坏。花瓶为客户心爱之物，价值约500元。',
      evidencePhotos: ['https://picsum.photos/seed/damage1/400/300', 'https://picsum.photos/seed/damage2/400/300'],
      raisedBy: user4.id,
      createdAt: daysAgo(4),
    },
    {
      orderId: order9.id,
      title: '保洁质量差',
      description: '客户反映多处未清洁干净，墙角有灰尘，地板有水渍。',
      evidencePhotos: [],
      raisedBy: user4.id,
      createdAt: daysAgo(9),
    },
  ]);

  console.log('  → Inserting reworks...');
  const [rework1] = await db.insert(reworks).values({
    orderId: order4.id,
    reason: 'poor_quality',
    description: '厨房油烟清理不彻底，抽油烟机表面仍有油污',
    deadline: hoursAgo(4),
    assignedCleanerId: cleaner4.id,
    isTimeout: true,
    createdBy: user4.id,
    createdAt: hoursAgo(28),
  }).returning();

  const [rework2] = await db.insert(reworks).values({
    orderId: order10.id,
    reason: 'poor_quality',
    description: '窗户玻璃清洁不彻底，有水痕',
    deadline: hoursLater(20),
    assignedCleanerId: cleaner1.id,
    isTimeout: false,
    createdBy: user4.id,
    createdAt: daysAgo(1),
  }).returning();

  console.log('  → Inserting compensations...');
  await db.insert(compensations).values([
    {
      orderId: order9.id,
      amount: '100.00',
      reason: '保洁质量不达标，客户投诉',
      ruleType: 'customer_complaint',
      status: 'approved',
      reviewedBy: user5.id,
      reviewedAt: daysAgo(5),
      reviewRemark: '情况属实，同意赔付',
      createdAt: daysAgo(8),
    },
    {
      orderId: order3.id,
      amount: '300.00',
      reason: '物品损坏赔付（花瓶）',
      ruleType: 'item_damage',
      status: 'pending',
      createdAt: daysAgo(3),
    },
  ]);

  console.log('  → Inserting order logs...');

  const logEntries = [
    { orderId: order1.id, action: '创建订单', description: '客户下单：日常保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: null as any, toStatus: 'pending' as const, createdAt: daysAgo(5) },
    { orderId: order1.id, action: '派单', description: '指派李保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: 'pending' as const, toStatus: 'assigned' as const, createdAt: daysAgo(4) },
    { orderId: order1.id, action: '开始服务', description: '保洁员开始服务', operatorId: user2.id, operatorName: '李保洁', fromStatus: 'assigned' as const, toStatus: 'in_progress' as const, createdAt: daysAgo(3) },
    { orderId: order1.id, action: '提交完成', description: '保洁员提交完成记录和照片', operatorId: user2.id, operatorName: '李保洁', fromStatus: 'in_progress' as const, toStatus: 'completed' as const, createdAt: daysAgo(3) },
    { orderId: order1.id, action: '验收通过', description: '质检员复核通过', operatorId: user4.id, operatorName: '赵质检', fromStatus: 'completed' as const, toStatus: 'inspection_passed' as const, createdAt: daysAgo(2) },

    { orderId: order2.id, action: '创建订单', description: '客户下单：深度保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: null as any, toStatus: 'pending' as const, createdAt: daysAgo(4) },
    { orderId: order2.id, action: '派单', description: '指派王保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: 'pending' as const, toStatus: 'assigned' as const, createdAt: daysAgo(3) },
    { orderId: order2.id, action: '开始服务', description: '保洁员开始服务', operatorId: user3.id, operatorName: '王保洁', fromStatus: 'assigned' as const, toStatus: 'in_progress' as const, createdAt: daysAgo(2) },
    { orderId: order2.id, action: '提交完成', description: '保洁员提交完成（无照片）', operatorId: user3.id, operatorName: '王保洁', fromStatus: 'in_progress' as const, toStatus: 'completed' as const, createdAt: daysAgo(1) },
    { orderId: order2.id, action: '验收不通过', description: '完成照片缺失，不予通过', operatorId: user4.id, operatorName: '赵质检', fromStatus: 'completed' as const, toStatus: 'inspection_failed' as const, createdAt: hoursAgo(12) },

    { orderId: order3.id, action: '创建订单', description: '客户下单：入住保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: null as any, toStatus: 'pending' as const, createdAt: daysAgo(7) },
    { orderId: order3.id, action: '派单', description: '指派陈保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: 'pending' as const, toStatus: 'assigned' as const, createdAt: daysAgo(6) },
    { orderId: order3.id, action: '开始服务', description: '保洁员开始服务', operatorId: user6.id, operatorName: '陈保洁', fromStatus: 'assigned' as const, toStatus: 'in_progress' as const, createdAt: daysAgo(5) },
    { orderId: order3.id, action: '提交完成', description: '保洁员提交完成记录', operatorId: user6.id, operatorName: '陈保洁', fromStatus: 'in_progress' as const, toStatus: 'completed' as const, createdAt: daysAgo(5) },
    { orderId: order3.id, action: '验收发现问题', description: '发现物品损坏，进入赔付流程', operatorId: user4.id, operatorName: '赵质检', fromStatus: 'completed' as const, toStatus: 'compensation_pending' as const, createdAt: daysAgo(4) },

    { orderId: order4.id, action: '创建订单', description: '客户下单：厨房清洁', operatorId: user1.id, operatorName: '张客服', fromStatus: null as any, toStatus: 'pending' as const, createdAt: daysAgo(3) },
    { orderId: order4.id, action: '派单', description: '指派赵保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: 'pending' as const, toStatus: 'assigned' as const, createdAt: daysAgo(2) },
    { orderId: order4.id, action: '开始服务', description: '保洁员开始服务', operatorId: user7.id, operatorName: '赵保洁', fromStatus: 'assigned' as const, toStatus: 'in_progress' as const, createdAt: hoursAgo(36) },
    { orderId: order4.id, action: '提交完成', description: '保洁员提交完成记录', operatorId: user7.id, operatorName: '赵保洁', fromStatus: 'in_progress' as const, toStatus: 'completed' as const, createdAt: hoursAgo(36) },
    { orderId: order4.id, action: '验收不通过', description: '厨房清洁不彻底，需返工', operatorId: user4.id, operatorName: '赵质检', fromStatus: 'completed' as const, toStatus: 'rework' as const, createdAt: hoursAgo(28) },
    { orderId: order4.id, action: '返工超时', description: '返工未在规定时间内完成', operatorId: user4.id, operatorName: '赵质检', fromStatus: 'rework' as const, toStatus: 'rework_timeout' as const, createdAt: hoursAgo(2) },

    { orderId: order10.id, action: '创建订单', description: '客户下单：搬入保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: null as any, toStatus: 'pending' as const, createdAt: daysAgo(4) },
    { orderId: order10.id, action: '派单', description: '指派李保洁', operatorId: user1.id, operatorName: '张客服', fromStatus: 'pending' as const, toStatus: 'assigned' as const, createdAt: daysAgo(3) },
    { orderId: order10.id, action: '开始服务', description: '保洁员开始服务', operatorId: user2.id, operatorName: '李保洁', fromStatus: 'assigned' as const, toStatus: 'in_progress' as const, createdAt: daysAgo(2) },
    { orderId: order10.id, action: '提交完成', description: '保洁员提交完成记录', operatorId: user2.id, operatorName: '李保洁', fromStatus: 'in_progress' as const, toStatus: 'completed' as const, createdAt: daysAgo(2) },
    { orderId: order10.id, action: '验收不通过', description: '窗户清洁不彻底，需返工', operatorId: user4.id, operatorName: '赵质检', fromStatus: 'completed' as const, toStatus: 'rework' as const, createdAt: daysAgo(1) },
  ];

  for (const entry of logEntries) {
    await db.insert(orderLogs).values(entry);
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
