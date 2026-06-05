import { PrismaClient, StaffRole, OrderSource, OrderStatus, AssignmentStatus, QualityResult, BadReviewReason } from '@prisma/client';
import prisma from '../src/lib/server/prisma.js';

async function main() {
  console.log('开始播种数据...');

  const staffs = await prisma.staff.createManyAndReturn({
    data: [
      { name: '张客服', phone: '13800138001', role: StaffRole.CUSTOMER_SERVICE, region: '朝阳区' },
      { name: '李客服', phone: '13800138002', role: StaffRole.CUSTOMER_SERVICE, region: '海淀区' },
      { name: '王阿姨', phone: '13800138003', role: StaffRole.CLEANER, region: '朝阳区' },
      { name: '赵阿姨', phone: '13800138004', role: StaffRole.CLEANER, region: '海淀区' },
      { name: '刘阿姨', phone: '13800138005', role: StaffRole.CLEANER, region: '西城区' },
      { name: '陈质检', phone: '13800138006', role: StaffRole.QUALITY_INSPECTOR, region: '朝阳区' },
      { name: '周质检', phone: '13800138007', role: StaffRole.QUALITY_INSPECTOR, region: '海淀区' },
    ]
  });
  console.log(`创建了 ${staffs.length} 个员工`);

  const customers = await prisma.customer.createManyAndReturn({
    data: [
      { name: '客户A', phone: '13900139001', address: '北京市朝阳区望京SOHO T1', region: '朝阳区' },
      { name: '客户B', phone: '13900139002', address: '北京市海淀区中关村大街1号', region: '海淀区' },
      { name: '客户C', phone: '13900139003', address: '北京市西城区金融街7号', region: '西城区' },
      { name: '客户D', phone: '13900139004', address: '北京市朝阳区国贸中心', region: '朝阳区' },
    ]
  });
  console.log(`创建了 ${customers.length} 个客户`);

  const csStaff = staffs.filter(s => s.role === StaffRole.CUSTOMER_SERVICE);
  const cleaners = staffs.filter(s => s.role === StaffRole.CLEANER);
  const inspectors = staffs.filter(s => s.role === StaffRole.QUALITY_INSPECTOR);

  const orders = await prisma.order.createManyAndReturn({
    data: [
      {
        orderNo: 'CS2024010001',
        customerId: customers[0].id,
        source: OrderSource.PHONE,
        serviceType: '日常保洁',
        serviceAddress: customers[0].address,
        region: customers[0].region,
        scheduledDate: new Date('2024-01-15T09:00:00'),
        scheduledHours: 4,
        estimatedPrice: 200,
        status: OrderStatus.ARCHIVED,
        createdBy: csStaff[0].id,
        reworkCount: 0
      },
      {
        orderNo: 'CS2024010002',
        customerId: customers[1].id,
        source: OrderSource.WECHAT,
        serviceType: '深度保洁',
        serviceAddress: customers[1].address,
        region: customers[1].region,
        scheduledDate: new Date('2024-01-16T10:00:00'),
        scheduledHours: 6,
        estimatedPrice: 360,
        status: OrderStatus.ARCHIVED,
        createdBy: csStaff[0].id,
        reworkCount: 0
      },
      {
        orderNo: 'CS2024010003',
        customerId: customers[2].id,
        source: OrderSource.APP,
        serviceType: '日常保洁',
        serviceAddress: customers[2].address,
        region: customers[2].region,
        scheduledDate: new Date('2024-01-17T08:00:00'),
        scheduledHours: 3,
        estimatedPrice: 150,
        status: OrderStatus.ARCHIVED,
        createdBy: csStaff[1].id,
        reworkCount: 1
      },
      {
        orderNo: 'CS2024010004',
        customerId: customers[3].id,
        source: OrderSource.REFERRAL,
        serviceType: '开荒保洁',
        serviceAddress: customers[3].address,
        region: customers[3].region,
        scheduledDate: new Date('2024-01-18T09:00:00'),
        scheduledHours: 8,
        estimatedPrice: 640,
        status: OrderStatus.COMPLETED,
        createdBy: csStaff[1].id,
        reworkCount: 0
      },
      {
        orderNo: 'CS2024010005',
        customerId: customers[0].id,
        source: OrderSource.PHONE,
        serviceType: '日常保洁',
        serviceAddress: customers[0].address,
        region: customers[0].region,
        scheduledDate: new Date('2024-01-20T14:00:00'),
        scheduledHours: 4,
        estimatedPrice: 200,
        status: OrderStatus.ASSIGNED,
        createdBy: csStaff[0].id,
        reworkCount: 0
      },
      {
        orderNo: 'CS2024010006',
        customerId: customers[1].id,
        source: OrderSource.WALK_IN,
        serviceType: '日常保洁',
        serviceAddress: customers[1].address,
        region: customers[1].region,
        scheduledDate: new Date('2024-01-21T09:00:00'),
        scheduledHours: 4,
        estimatedPrice: 200,
        status: OrderStatus.PENDING,
        createdBy: csStaff[1].id,
        reworkCount: 0
      },
    ]
  });
  console.log(`创建了 ${orders.length} 个订单`);

  await prisma.assignment.createMany({
    data: [
      {
        orderId: orders[0].id,
        cleanerId: cleaners[0].id,
        status: AssignmentStatus.ACTIVE,
        notes: '首次派工'
      },
      {
        orderId: orders[1].id,
        cleanerId: cleaners[1].id,
        status: AssignmentStatus.CANCELLED_LEAVE,
        reassignedAt: new Date('2024-01-15T16:00:00'),
        reassignedById: csStaff[0].id,
        reassignedToId: cleaners[2].id,
        reassignedReason: '阿姨请假，身体不适',
        notes: '赵阿姨感冒请假，改派刘阿姨'
      },
      {
        orderId: orders[1].id,
        cleanerId: cleaners[2].id,
        status: AssignmentStatus.ACTIVE,
        assignedAt: new Date('2024-01-15T16:30:00'),
        notes: '改派订单'
      },
      {
        orderId: orders[2].id,
        cleanerId: cleaners[1].id,
        status: AssignmentStatus.ACTIVE,
        notes: '首次派工'
      },
      {
        orderId: orders[3].id,
        cleanerId: cleaners[0].id,
        status: AssignmentStatus.ACTIVE,
        notes: '首次派工'
      },
      {
        orderId: orders[4].id,
        cleanerId: cleaners[1].id,
        status: AssignmentStatus.ACTIVE,
        notes: '首次派工'
      },
      {
        orderId: orders[5].id,
        cleanerId: cleaners[2].id,
        status: AssignmentStatus.REASSIGNED,
        reassignedAt: new Date('2024-01-20T10:00:00'),
        reassignedById: csStaff[1].id,
        reassignedToId: cleaners[0].id,
        reassignedReason: '客户要求更换阿姨',
        notes: '客户投诉后改派'
      },
      {
        orderId: orders[5].id,
        cleanerId: cleaners[0].id,
        status: AssignmentStatus.ACTIVE,
        assignedAt: new Date('2024-01-20T10:30:00'),
        notes: '改派后订单'
      },
    ]
  });
  console.log('创建了派工记录');

  await prisma.serviceFeedback.createMany({
    data: [
      {
        orderId: orders[0].id,
        actualStartTime: new Date('2024-01-15T09:00:00'),
        actualEndTime: new Date('2024-01-15T13:00:00'),
        actualHours: 4.0,
        serviceNotes: '已完成客厅、卧室、厨房、卫生间清洁，客户非常满意。地面光洁，厨房无油污。',
        photoEvidence: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
        customerRating: 5,
        customerComment: '服务很好，阿姨很专业！',
        badReviewReason: BadReviewReason.NOT_APPLICABLE,
        submittedAt: new Date('2024-01-15T13:30:00')
      },
      {
        orderId: orders[1].id,
        actualStartTime: new Date('2024-01-16T10:30:00'),
        actualEndTime: new Date('2024-01-16T16:30:00'),
        actualHours: 6.0,
        serviceNotes: '深度保洁完成，重点清洁了厨房油污和卫生间水垢，擦拭了所有家具表面。',
        photoEvidence: ['clean1.jpg', 'clean2.jpg'],
        customerRating: 4,
        customerComment: '整体满意，就是晚到了半小时',
        badReviewReason: BadReviewReason.NOT_APPLICABLE,
        submittedAt: new Date('2024-01-16T17:00:00')
      },
      {
        orderId: orders[2].id,
        actualStartTime: new Date('2024-01-17T08:00:00'),
        actualEndTime: new Date('2024-01-17T09:30:00'),
        actualHours: 1.5,
        serviceNotes: '完成了客厅清洁，客户说有急事让先走。',
        photoEvidence: ['room1.jpg'],
        customerRating: 2,
        customerComment: '服务时长不够，很多地方都没打扫！',
        badReviewReason: BadReviewReason.QUALITY,
        submittedAt: new Date('2024-01-17T10:00:00')
      },
      {
        orderId: orders[3].id,
        actualStartTime: new Date('2024-01-18T09:00:00'),
        actualEndTime: new Date('2024-01-18T16:00:00'),
        actualHours: 7.0,
        serviceNotes: '开荒保洁完成，新房整体清洁。',
        photoEvidence: ['new1.jpg', 'new2.jpg'],
        customerRating: 2,
        customerComment: '服务态度不好，干活不仔细！',
        badReviewReason: BadReviewReason.ATTITUDE,
        submittedAt: new Date('2024-01-18T16:30:00')
      },
    ]
  });
  console.log('创建了服务反馈');

  await prisma.qualityCheck.createMany({
    data: [
      {
        orderId: orders[0].id,
        inspectorId: inspectors[0].id,
        result: QualityResult.PASSED,
        actualHours: 4.0,
        hoursDeficit: 0,
        notes: '服务时长充足，质量合格，照片证据齐全。客户好评。',
        needsRework: false,
        checkedAt: new Date('2024-01-15T18:00:00')
      },
      {
        orderId: orders[1].id,
        inspectorId: inspectors[1].id,
        result: QualityResult.PASSED,
        actualHours: 6.0,
        hoursDeficit: 0,
        notes: '阿姨请假改派后正常完成，服务时长符合要求，客户反馈尚可。',
        needsRework: false,
        checkedAt: new Date('2024-01-16T19:00:00')
      },
      {
        orderId: orders[2].id,
        inspectorId: inspectors[0].id,
        result: QualityResult.REJECTED,
        actualHours: 1.5,
        hoursDeficit: 1.5,
        notes: '服务时长严重不足，客户差评。需要返工或安排补偿。',
        needsRework: true,
        reworkReason: '服务时长不足1.5小时，客户投诉',
        checkedAt: new Date('2024-01-17T20:00:00')
      },
      {
        orderId: orders[3].id,
        inspectorId: inspectors[1].id,
        result: QualityResult.COMPENSATION,
        actualHours: 7.0,
        hoursDeficit: 1.0,
        notes: '客户因服务态度给差评，协商给予部分退款补偿。',
        compensation: 100,
        needsRework: false,
        checkedAt: new Date('2024-01-19T10:00:00')
      },
    ]
  });
  console.log('创建了质检记录');

  console.log('数据播种完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
