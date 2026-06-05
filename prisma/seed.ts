import { PrismaClient, BookingStatus, ConflictType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.flowRecord.deleteMany();
  await prisma.costAllocation.deleteMany();
  await prisma.bookingEquipment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.meetingRoom.deleteMany();
  await prisma.department.deleteMany();

  const departments = await Promise.all([
    prisma.department.create({ data: { name: '技术研发部' } }),
    prisma.department.create({ data: { name: '市场营销部' } }),
    prisma.department.create({ data: { name: '人力资源部' } }),
    prisma.department.create({ data: { name: '财务部' } }),
    prisma.department.create({ data: { name: '产品运营部' } }),
  ]);

  const [techDept, marketingDept, hrDept, financeDept, productDept] = departments;

  const room1 = await prisma.meetingRoom.create({
    data: {
      name: '创新厅',
      floor: 3,
      capacity: 20,
      hourlyRate: 200,
      equipments: {
        create: [
          { name: '投影仪' },
          { name: '白板' },
          { name: '视频会议系统' },
        ],
      },
    },
  });

  const room2 = await prisma.meetingRoom.create({
    data: {
      name: '协作室',
      floor: 5,
      capacity: 10,
      hourlyRate: 150,
      equipments: {
        create: [
          { name: '投影仪' },
          { name: '白板' },
        ],
      },
    },
  });

  const room3 = await prisma.meetingRoom.create({
    data: {
      name: '董事会议室',
      floor: 10,
      capacity: 30,
      hourlyRate: 500,
      equipments: {
        create: [
          { name: '投影仪' },
          { name: '视频会议系统' },
          { name: '音响系统' },
          { name: '电子白板' },
        ],
      },
    },
  });

  const room4 = await prisma.meetingRoom.create({
    data: {
      name: '头脑风暴室',
      floor: 5,
      capacity: 8,
      hourlyRate: 100,
      equipments: {
        create: [{ name: '白板' }],
      },
    },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tomorrow9am = new Date(today);
  tomorrow9am.setDate(today.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  const tomorrow11am = new Date(tomorrow9am);
  tomorrow11am.setHours(11, 0, 0, 0);

  const tomorrow2pm = new Date(tomorrow9am);
  tomorrow2pm.setHours(14, 0, 0, 0);

  const tomorrow4pm = new Date(tomorrow9am);
  tomorrow4pm.setHours(16, 0, 0, 0);

  const dayAfter10am = new Date(today);
  dayAfter10am.setDate(today.getDate() + 2);
  dayAfter10am.setHours(10, 0, 0, 0);

  const dayAfter12pm = new Date(dayAfter10am);
  dayAfter12pm.setHours(12, 0, 0, 0);

  const nextWeek9am = new Date(today);
  nextWeek9am.setDate(today.getDate() + 7);
  nextWeek9am.setHours(9, 0, 0, 0);

  const nextWeek1pm = new Date(nextWeek9am);
  nextWeek1pm.setHours(13, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      title: 'Q3产品规划会议',
      meetingRoomId: room1.id,
      departmentId: productDept.id,
      startTime: tomorrow9am,
      endTime: tomorrow11am,
      status: BookingStatus.CONFIRMED,
      conflictType: ConflictType.NONE,
      totalCost: 400,
      applicant: '张晓明',
      applicantRole: Role.ADMIN,
      equipmentNotes: '需要使用投影仪和视频会议系统',
      bookingEquipments: {
        create: [
          { name: '投影仪', available: true },
          { name: '视频会议系统', available: true },
        ],
      },
      costAllocations: {
        create: [
          {
            departmentId: productDept.id,
            amount: 400,
            percentage: 100,
            confirmed: true,
            confirmedAt: new Date(),
            confirmedBy: '李总监',
          },
        ],
      },
      flowRecords: {
        create: [
          {
            action: '创建预订',
            operator: '张晓明',
            role: Role.ADMIN,
            remark: '行政经办人提交预订申请',
            createdAt: new Date(Date.now() - 86400000),
          },
          {
            action: '费用确认',
            operator: '李总监',
            role: Role.DEPARTMENT_HEAD,
            remark: '费用分摊确认通过',
            createdAt: new Date(Date.now() - 43200000),
          },
          {
            action: '确认预订',
            operator: '王复核',
            role: Role.REVIEWER,
            remark: '复核通过，预订已确认',
            createdAt: new Date(Date.now() - 3600000),
          },
        ],
      },
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      title: '技术架构评审会',
      meetingRoomId: room1.id,
      departmentId: techDept.id,
      startTime: tomorrow9am,
      endTime: new Date(tomorrow9am.getTime() + 3 * 60 * 60 * 1000),
      status: BookingStatus.CONFLICT,
      conflictType: ConflictType.TIME_OVERLAP,
      conflictReason: '与"Q3产品规划会议"时间重叠，该会议室9:00-11:00已被预订',
      totalCost: 600,
      applicant: '刘工程师',
      applicantRole: Role.ADMIN,
      equipmentNotes: '需要投影仪和白板',
      bookingEquipments: {
        create: [
          { name: '投影仪', available: true },
          { name: '白板', available: true },
        ],
      },
      costAllocations: {
        create: [
          {
            departmentId: techDept.id,
            amount: 600,
            percentage: 100,
            confirmed: false,
          },
        ],
      },
      flowRecords: {
        create: [
          {
            action: '创建预订',
            operator: '刘工程师',
            role: Role.ADMIN,
            remark: '行政经办人提交预订申请',
            createdAt: new Date(Date.now() - 7200000),
          },
          {
            action: '冲突检测',
            operator: '系统',
            role: Role.ADMIN,
            remark: '检测到时间重叠冲突',
            createdAt: new Date(Date.now() - 7100000),
          },
        ],
      },
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      title: '大客户演示会',
      meetingRoomId: room4.id,
      departmentId: marketingDept.id,
      startTime: tomorrow2pm,
      endTime: tomorrow4pm,
      status: BookingStatus.CONFLICT,
      conflictType: ConflictType.EQUIPMENT_MISSING,
      conflictReason: '头脑风暴室缺少投影仪设备，无法满足客户演示需求',
      totalCost: 200,
      applicant: '陈经理',
      applicantRole: Role.ADMIN,
      equipmentNotes: '必须使用投影仪进行产品演示',
      bookingEquipments: {
        create: [
          { name: '投影仪', available: false },
        ],
      },
      costAllocations: {
        create: [
          {
            departmentId: marketingDept.id,
            amount: 200,
            percentage: 100,
            confirmed: true,
            confirmedAt: new Date(),
            confirmedBy: '市场总监',
          },
        ],
      },
      flowRecords: {
        create: [
          {
            action: '创建预订',
            operator: '陈经理',
            role: Role.ADMIN,
            remark: '行政经办人提交预订申请',
            createdAt: new Date(Date.now() - 10800000),
          },
          {
            action: '设备检查',
            operator: '王复核',
            role: Role.REVIEWER,
            remark: '该会议室无投影仪，设备不满足需求',
            createdAt: new Date(Date.now() - 7200000),
          },
        ],
      },
    },
  });

  const booking4 = await prisma.booking.create({
    data: {
      title: '跨部门项目协调会',
      meetingRoomId: room2.id,
      departmentId: techDept.id,
      startTime: dayAfter10am,
      endTime: dayAfter12pm,
      status: BookingStatus.CONFLICT,
      conflictType: ConflictType.COST_ALLOCATION_MISMATCH,
      conflictReason: '费用分摊比例总和为90%，不足100%，请检查各部门分摊比例',
      totalCost: 300,
      applicant: '周主管',
      applicantRole: Role.ADMIN,
      equipmentNotes: '需要投影仪',
      bookingEquipments: {
        create: [
          { name: '投影仪', available: true },
        ],
      },
      costAllocations: {
        create: [
          {
            departmentId: techDept.id,
            amount: 150,
            percentage: 50,
            confirmed: true,
            confirmedAt: new Date(),
            confirmedBy: '技术总监',
          },
          {
            departmentId: productDept.id,
            amount: 120,
            percentage: 40,
            confirmed: false,
          },
        ],
      },
      flowRecords: {
        create: [
          {
            action: '创建预订',
            operator: '周主管',
            role: Role.ADMIN,
            remark: '行政经办人提交预订申请',
            createdAt: new Date(Date.now() - 14400000),
          },
          {
            action: '费用复核',
            operator: '王复核',
            role: Role.REVIEWER,
            remark: '分摊比例不匹配，总和不足100%',
            createdAt: new Date(Date.now() - 3600000),
          },
        ],
      },
    },
  });

  const booking5 = await prisma.booking.create({
    data: {
      title: '新员工入职培训',
      meetingRoomId: room3.id,
      departmentId: hrDept.id,
      startTime: nextWeek9am,
      endTime: nextWeek1pm,
      status: BookingStatus.PENDING,
      conflictType: ConflictType.NONE,
      totalCost: 2000,
      applicant: 'HR专员',
      applicantRole: Role.ADMIN,
      equipmentNotes: '需要全部设备',
      bookingEquipments: {
        create: [
          { name: '投影仪', available: true },
          { name: '视频会议系统', available: true },
          { name: '音响系统', available: true },
          { name: '电子白板', available: true },
        ],
      },
      costAllocations: {
        create: [
          {
            departmentId: hrDept.id,
            amount: 2000,
            percentage: 100,
            confirmed: false,
          },
        ],
      },
      flowRecords: {
        create: [
          {
            action: '创建预订',
            operator: 'HR专员',
            role: Role.ADMIN,
            remark: '行政经办人提交预订申请',
            createdAt: new Date(Date.now() - 1800000),
          },
        ],
      },
    },
  });

  console.log('种子数据创建完成:');
  console.log(`  - 部门: ${departments.length} 个`);
  console.log(`  - 会议室: 4 个`);
  console.log(`  - 预订记录: 5 个`);
  console.log(`    1. 正常预订: ${booking1.title}`);
  console.log(`    2. 时间重叠: ${booking2.title}`);
  console.log(`    3. 设备缺失: ${booking3.title}`);
  console.log(`    4. 分摊不匹配: ${booking4.title}`);
  console.log(`    5. 待确认: ${booking5.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
