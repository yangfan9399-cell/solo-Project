import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let usePrisma = false;
let prisma: any = null;

try {
  const { PrismaClient, BookingStatus, ConflictType, Role } = require('@prisma/client');
  prisma = new PrismaClient();
  usePrisma = true;
  console.log('PrismaClient loaded successfully');
} catch (error) {
  console.log('PrismaClient not available, using memory mode');
  usePrisma = false;
}

type BookingStatusType = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'ARCHIVED' | 'CONFLICT';
type ConflictTypeType = 'TIME_OVERLAP' | 'EQUIPMENT_MISSING' | 'COST_ALLOCATION_MISMATCH' | 'NONE';
type RoleType = 'ADMIN' | 'DEPARTMENT_HEAD' | 'REVIEWER';

interface Department {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
}

interface MeetingRoom {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  hourlyRate: number;
  equipments: Equipment[];
}

interface BookingEquipment {
  id: string;
  name: string;
  available: boolean;
}

interface CostAllocation {
  id: string;
  departmentId: string;
  department?: Department;
  amount: number;
  percentage: number;
  confirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
}

interface FlowRecord {
  id: string;
  action: string;
  operator: string;
  role: string;
  remark?: string;
  createdAt: string;
}

interface Booking {
  id: string;
  title: string;
  meetingRoomId: string;
  meetingRoom?: MeetingRoom;
  departmentId: string;
  department?: Department;
  startTime: string;
  endTime: string;
  status: string;
  conflictType: string;
  conflictReason?: string;
  totalCost: number;
  applicant: string;
  applicantRole: string;
  equipmentNotes?: string;
  bookingEquipments: BookingEquipment[];
  costAllocations: CostAllocation[];
  flowRecords: FlowRecord[];
  createdAt: string;
}

const departments: Department[] = [
  { id: 'dept-1', name: '技术研发部' },
  { id: 'dept-2', name: '市场营销部' },
  { id: 'dept-3', name: '人力资源部' },
  { id: 'dept-4', name: '财务部' },
  { id: 'dept-5', name: '产品运营部' },
];

const meetingRooms: MeetingRoom[] = [
  {
    id: 'room-1',
    name: '创新厅',
    floor: 3,
    capacity: 20,
    hourlyRate: 200,
    equipments: [
      { id: 'eq-1', name: '投影仪' },
      { id: 'eq-2', name: '白板' },
      { id: 'eq-3', name: '视频会议系统' },
    ],
  },
  {
    id: 'room-2',
    name: '协作室',
    floor: 5,
    capacity: 10,
    hourlyRate: 150,
    equipments: [
      { id: 'eq-4', name: '投影仪' },
      { id: 'eq-5', name: '白板' },
    ],
  },
  {
    id: 'room-3',
    name: '董事会议室',
    floor: 10,
    capacity: 30,
    hourlyRate: 500,
    equipments: [
      { id: 'eq-6', name: '投影仪' },
      { id: 'eq-7', name: '视频会议系统' },
      { id: 'eq-8', name: '音响系统' },
      { id: 'eq-9', name: '电子白板' },
    ],
  },
  {
    id: 'room-4',
    name: '头脑风暴室',
    floor: 5,
    capacity: 8,
    hourlyRate: 100,
    equipments: [
      { id: 'eq-10', name: '白板' },
    ],
  },
];

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

let bookings: Booking[] = [
  {
    id: 'booking-1',
    title: 'Q3产品规划会议',
    meetingRoomId: 'room-1',
    meetingRoom: meetingRooms[0],
    departmentId: 'dept-5',
    department: departments[4],
    startTime: tomorrow9am.toISOString(),
    endTime: tomorrow11am.toISOString(),
    status: 'CONFIRMED',
    conflictType: 'NONE',
    totalCost: 400,
    applicant: '张晓明',
    applicantRole: 'ADMIN',
    equipmentNotes: '需要使用投影仪和视频会议系统',
    bookingEquipments: [
      { id: 'be-1', name: '投影仪', available: true },
      { id: 'be-2', name: '视频会议系统', available: true },
    ],
    costAllocations: [
      {
        id: 'cost-1',
        departmentId: 'dept-5',
        department: departments[4],
        amount: 400,
        percentage: 100,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedBy: '李总监',
      },
    ],
    flowRecords: [
      {
        id: 'flow-1',
        action: '创建预订',
        operator: '张晓明',
        role: 'ADMIN',
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'flow-2',
        action: '费用确认',
        operator: '李总监',
        role: 'DEPARTMENT_HEAD',
        remark: '费用分摊确认通过',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'flow-3',
        action: '确认预订',
        operator: '王复核',
        role: 'REVIEWER',
        remark: '复核通过，预订已确认',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'booking-2',
    title: '技术架构评审会',
    meetingRoomId: 'room-1',
    meetingRoom: meetingRooms[0],
    departmentId: 'dept-1',
    department: departments[0],
    startTime: tomorrow9am.toISOString(),
    endTime: new Date(tomorrow9am.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    status: 'CONFLICT',
    conflictType: 'TIME_OVERLAP',
    conflictReason: '与"Q3产品规划会议"时间重叠，该会议室9:00-11:00已被预订',
    totalCost: 600,
    applicant: '刘工程师',
    applicantRole: 'ADMIN',
    equipmentNotes: '需要投影仪和白板',
    bookingEquipments: [
      { id: 'be-3', name: '投影仪', available: true },
      { id: 'be-4', name: '白板', available: true },
    ],
    costAllocations: [
      {
        id: 'cost-2',
        departmentId: 'dept-1',
        department: departments[0],
        amount: 600,
        percentage: 100,
        confirmed: false,
      },
    ],
    flowRecords: [
      {
        id: 'flow-4',
        action: '创建预订',
        operator: '刘工程师',
        role: 'ADMIN',
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'flow-5',
        action: '冲突检测',
        operator: '系统',
        role: 'ADMIN',
        remark: '检测到时间重叠冲突',
        createdAt: new Date(Date.now() - 7100000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'booking-3',
    title: '大客户演示会',
    meetingRoomId: 'room-4',
    meetingRoom: meetingRooms[3],
    departmentId: 'dept-2',
    department: departments[1],
    startTime: tomorrow2pm.toISOString(),
    endTime: tomorrow4pm.toISOString(),
    status: 'CONFLICT',
    conflictType: 'EQUIPMENT_MISSING',
    conflictReason: '头脑风暴室缺少投影仪设备，无法满足客户演示需求',
    totalCost: 200,
    applicant: '陈经理',
    applicantRole: 'ADMIN',
    equipmentNotes: '必须使用投影仪进行产品演示',
    bookingEquipments: [
      { id: 'be-5', name: '投影仪', available: false },
    ],
    costAllocations: [
      {
        id: 'cost-3',
        departmentId: 'dept-2',
        department: departments[1],
        amount: 200,
        percentage: 100,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedBy: '市场总监',
      },
    ],
    flowRecords: [
      {
        id: 'flow-6',
        action: '创建预订',
        operator: '陈经理',
        role: 'ADMIN',
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: 'flow-7',
        action: '设备检查',
        operator: '王复核',
        role: 'REVIEWER',
        remark: '该会议室无投影仪，设备不满足需求',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'booking-4',
    title: '跨部门项目协调会',
    meetingRoomId: 'room-2',
    meetingRoom: meetingRooms[1],
    departmentId: 'dept-1',
    department: departments[0],
    startTime: dayAfter10am.toISOString(),
    endTime: dayAfter12pm.toISOString(),
    status: 'CONFLICT',
    conflictType: 'COST_ALLOCATION_MISMATCH',
    conflictReason: '费用分摊比例总和为90%，不足100%，请检查各部门分摊比例',
    totalCost: 300,
    applicant: '周主管',
    applicantRole: 'ADMIN',
    equipmentNotes: '需要投影仪',
    bookingEquipments: [
      { id: 'be-6', name: '投影仪', available: true },
    ],
    costAllocations: [
      {
        id: 'cost-4',
        departmentId: 'dept-1',
        department: departments[0],
        amount: 150,
        percentage: 50,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedBy: '技术总监',
      },
      {
        id: 'cost-5',
        departmentId: 'dept-5',
        department: departments[4],
        amount: 120,
        percentage: 40,
        confirmed: false,
      },
    ],
    flowRecords: [
      {
        id: 'flow-8',
        action: '创建预订',
        operator: '周主管',
        role: 'ADMIN',
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: 'flow-9',
        action: '费用复核',
        operator: '王复核',
        role: 'REVIEWER',
        remark: '分摊比例不匹配，总和不足100%',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'booking-5',
    title: '新员工入职培训',
    meetingRoomId: 'room-3',
    meetingRoom: meetingRooms[2],
    departmentId: 'dept-3',
    department: departments[2],
    startTime: nextWeek9am.toISOString(),
    endTime: nextWeek1pm.toISOString(),
    status: 'PENDING',
    conflictType: 'NONE',
    totalCost: 2000,
    applicant: 'HR专员',
    applicantRole: 'ADMIN',
    equipmentNotes: '需要全部设备',
    bookingEquipments: [
      { id: 'be-7', name: '投影仪', available: true },
      { id: 'be-8', name: '视频会议系统', available: true },
      { id: 'be-9', name: '音响系统', available: true },
      { id: 'be-10', name: '电子白板', available: true },
    ],
    costAllocations: [
      {
        id: 'cost-6',
        departmentId: 'dept-3',
        department: departments[2],
        amount: 2000,
        percentage: 100,
        confirmed: false,
      },
    ],
    flowRecords: [
      {
        id: 'flow-10',
        action: '创建预订',
        operator: 'HR专员',
        role: 'ADMIN',
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

let bookingCounter = 6;
let flowCounter = 11;
let costCounter = 7;
let beCounter = 11;

function getBookingById(id: string): Booking | undefined {
  return bookings.find(b => b.id === id);
}

function addFlowRecord(bookingId: string, action: string, operator: string, role: string, remark?: string) {
  const booking = getBookingById(bookingId);
  if (booking) {
    booking.flowRecords.push({
      id: `flow-${flowCounter++}`,
      action,
      operator,
      role,
      remark,
      createdAt: new Date().toISOString(),
    });
  }
}

async function getPrismaBookingWithRelations(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      meetingRoom: {
        include: {
          equipments: true,
        },
      },
      department: true,
      costAllocations: {
        include: {
          department: true,
        },
      },
      bookingEquipments: true,
      flowRecords: true,
    },
  });
}

async function getAllPrismaBookingsWithRelations() {
  return prisma.booking.findMany({
    include: {
      meetingRoom: {
        include: {
          equipments: true,
        },
      },
      department: true,
      costAllocations: {
        include: {
          department: true,
        },
      },
      bookingEquipments: true,
      flowRecords: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

app.get('/api/health', async (req, res) => {
  if (usePrisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', message: 'Meeting Room Booking API is running (PostgreSQL mode)', mode: 'prisma' });
    } catch (error) {
      res.json({ status: 'ok', message: 'Meeting Room Booking API is running (PostgreSQL mode - database connection may be limited)', mode: 'prisma' });
    }
  } else {
    res.json({ status: 'ok', message: 'Meeting Room Booking API is running (memory mode)', mode: 'memory' });
  }
});

app.get('/api/departments', async (req, res) => {
  if (usePrisma) {
    try {
      const depts = await prisma.department.findMany({
        orderBy: { name: 'asc' },
      });
      res.json(depts);
    } catch (error) {
      res.json(departments);
    }
  } else {
    res.json(departments);
  }
});

app.get('/api/meeting-rooms', async (req, res) => {
  if (usePrisma) {
    try {
      const rooms = await prisma.meetingRoom.findMany({
        include: {
          equipments: true,
        },
        orderBy: { floor: 'asc' },
      });
      res.json(rooms);
    } catch (error) {
      res.json(meetingRooms);
    }
  } else {
    res.json(meetingRooms);
  }
});

app.get('/api/bookings', async (req, res) => {
  if (usePrisma) {
    try {
      const bookingsData = await getAllPrismaBookingsWithRelations();
      res.json(bookingsData);
    } catch (error) {
      res.json(bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  } else {
    res.json(bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  if (usePrisma) {
    try {
      const booking = await getPrismaBookingWithRelations(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      res.json(booking);
    } catch (error) {
      const booking = getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      res.json(booking);
    }
  } else {
    const booking = getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  }
});

app.get('/api/check-conflict', async (req, res) => {
  const { meetingRoomId, startTime, endTime, excludeBookingId } = req.query;
  
  const start = new Date(startTime as string);
  const end = new Date(endTime as string);
  
  if (usePrisma) {
    try {
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          meetingRoomId: meetingRoomId as string,
          id: excludeBookingId ? { not: excludeBookingId as string } : undefined,
          status: {
            notIn: ['CANCELLED', 'REJECTED', 'ARCHIVED'],
          },
          OR: [
            {
              startTime: {
                lt: end,
              },
              endTime: {
                gt: start,
              },
            },
          ],
        },
        include: {
          department: true,
        },
      });

      if (conflictingBooking) {
        res.json({
          hasConflict: true,
          type: 'TIME_OVERLAP',
          reason: `与"${conflictingBooking.title}"时间重叠，该会议室已被${conflictingBooking.department?.name || '其他部门'}预订`,
          conflictingBooking,
        });
      } else {
        res.json({ hasConflict: false, type: 'NONE', reason: '' });
      }
      return;
    } catch (error) {
      // Fall through to memory mode
    }
  }
  
  const conflictingBooking = bookings.find((b) => {
    if (b.meetingRoomId !== meetingRoomId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
    
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    
    return (start.getTime() < bEnd && end.getTime() > bStart);
  });

  if (conflictingBooking) {
    res.json({
      hasConflict: true,
      type: 'TIME_OVERLAP',
      reason: `与"${conflictingBooking.title}"时间重叠，该会议室已被${conflictingBooking.department?.name || '其他部门'}预订`,
      conflictingBooking,
    });
  } else {
    res.json({ hasConflict: false, type: 'NONE', reason: '' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const {
    title,
    meetingRoomId,
    departmentId,
    startTime,
    endTime,
    totalCost,
    applicant,
    equipmentNotes,
    selectedEquipments,
    costAllocations: allocations,
    conflictType,
    conflictReason,
    equipmentWarnings,
  } = req.body;

  if (usePrisma) {
    try {
      const { BookingStatus, ConflictType, Role } = require('@prisma/client');
      const newBooking = await prisma.booking.create({
        data: {
          title,
          meetingRoomId,
          departmentId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          totalCost,
          applicant,
          applicantRole: Role.ADMIN,
          equipmentNotes,
          status: conflictType && conflictType !== 'NONE' ? BookingStatus.CONFLICT : BookingStatus.PENDING,
          conflictType: conflictType || ConflictType.NONE,
          conflictReason,
          bookingEquipments: {
            create: selectedEquipments.map((eq: string) => ({
              name: eq,
              available: !equipmentWarnings?.includes(eq),
            })),
          },
          costAllocations: {
            create: allocations.map((alloc: any) => ({
              departmentId: alloc.departmentId,
              amount: alloc.amount,
              percentage: alloc.percentage,
              confirmed: false,
            })),
          },
          flowRecords: {
            create: {
              action: '创建预订',
              operator: applicant,
              role: Role.ADMIN,
              remark: '行政经办人提交预订申请',
            },
          },
        },
        include: {
          meetingRoom: {
            include: {
              equipments: true,
            },
          },
          department: true,
          costAllocations: {
            include: {
              department: true,
            },
          },
          bookingEquipments: true,
          flowRecords: true,
        },
      });

      if (conflictType && conflictType !== 'NONE') {
        await prisma.flowRecord.create({
          data: {
            bookingId: newBooking.id,
            action: '冲突检测',
            operator: '系统',
            role: Role.ADMIN,
            remark: conflictReason || '检测到预订冲突',
          },
        });
      }

      res.status(201).json(newBooking);
      return;
    } catch (error) {
      // Fall through to memory mode
    }
  }

  const room = meetingRooms.find(r => r.id === meetingRoomId);
  const dept = departments.find(d => d.id === departmentId);

  const newBooking: Booking = {
    id: `booking-${bookingCounter++}`,
    title,
    meetingRoomId,
    meetingRoom: room,
    departmentId,
    department: dept,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    status: conflictType && conflictType !== 'NONE' ? 'CONFLICT' : 'PENDING',
    conflictType: conflictType || 'NONE',
    conflictReason,
    totalCost,
    applicant,
    applicantRole: 'ADMIN',
    equipmentNotes,
    bookingEquipments: selectedEquipments.map((eq: string) => ({
      id: `be-${beCounter++}`,
      name: eq,
      available: !equipmentWarnings?.includes(eq),
    })),
    costAllocations: allocations.map((alloc: any) => ({
      id: `cost-${costCounter++}`,
      departmentId: alloc.departmentId,
      department: departments.find(d => d.id === alloc.departmentId),
      amount: alloc.amount,
      percentage: alloc.percentage,
      confirmed: false,
    })),
    flowRecords: [
      {
        id: `flow-${flowCounter++}`,
        action: '创建预订',
        operator: applicant,
        role: 'ADMIN',
        remark: '行政经办人提交预订申请',
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  if (conflictType && conflictType !== 'NONE') {
    addFlowRecord(newBooking.id, '冲突检测', '系统', 'ADMIN', conflictReason || '检测到预订冲突');
  }

  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id/confirm-cost', async (req, res) => {
  const { id } = req.params;
  const { allocationId, confirmedBy } = req.body;

  if (usePrisma) {
    try {
      const { Role } = require('@prisma/client');
      const allocation = await prisma.costAllocation.findUnique({
        where: { id: allocationId },
      });

      if (!allocation) {
        return res.status(404).json({ error: 'Cost allocation not found' });
      }

      await prisma.costAllocation.update({
        where: { id: allocationId },
        data: {
          confirmed: true,
          confirmedAt: new Date(),
          confirmedBy,
        },
      });

      await prisma.flowRecord.create({
        data: {
          bookingId: id,
          action: '费用确认',
          operator: confirmedBy,
          role: Role.DEPARTMENT_HEAD,
          remark: '费用分摊已确认',
        },
      });

      const booking = await getPrismaBookingWithRelations(id);
      res.json(booking);
      return;
    } catch (error) {
      // Fall through to memory mode
    }
  }

  const booking = getBookingById(id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const allocation = booking.costAllocations.find(a => a.id === allocationId);
  if (allocation) {
    allocation.confirmed = true;
    allocation.confirmedAt = new Date().toISOString();
    allocation.confirmedBy = confirmedBy;
  }

  addFlowRecord(id, '费用确认', confirmedBy, 'DEPARTMENT_HEAD', '费用分摊已确认');
  res.json(booking);
});

app.put('/api/bookings/:id/confirm', async (req, res) => {
  const { id } = req.params;

  if (usePrisma) {
    try {
      const { BookingStatus, Role } = require('@prisma/client');
      await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });

      await prisma.flowRecord.create({
        data: {
          bookingId: id,
          action: '确认预订',
          operator: '王复核',
          role: Role.REVIEWER,
          remark: '复核通过，预订已确认',
        },
      });

      const booking = await getPrismaBookingWithRelations(id);
      res.json(booking);
      return;
    } catch (error) {
      // Fall through to memory mode
    }
  }

  const booking = getBookingById(id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'CONFIRMED';
  addFlowRecord(id, '确认预订', '王复核', 'REVIEWER', '复核通过，预订已确认');
  res.json(booking);
});

app.put('/api/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;

  if (usePrisma) {
    try {
      const { BookingStatus, Role } = require('@prisma/client');
      await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.REJECTED,
        },
      });

      await prisma.flowRecord.create({
        data: {
          bookingId: id,
          action: '拒绝预订',
          operator: '王复核',
          role: Role.REVIEWER,
          remark: '预订申请被拒绝',
        },
      });

      const booking = await getPrismaBookingWithRelations(id);
      res.json(booking);
      return;
    } catch (error) {
      // Fall through to memory mode
    }
  }

  const booking = getBookingById(id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'REJECTED';
  addFlowRecord(id, '拒绝预订', '王复核', 'REVIEWER', '预订申请被拒绝');
  res.json(booking);
});

app.put('/api/bookings/:id/resolve-conflict', async (req, res) => {
  const { id } = req.params;
  const { newMeetingRoomId, newStartTime, newEndTime } = req.body;

  if (usePrisma) {
    try {
      const { BookingStatus, ConflictType, Role } = require('@prisma/client');
      const updateData: any = {
        status: BookingStatus.PENDING,
        conflictType: ConflictType.NONE,
        conflictReason: null,
      };

      let remark = '';

      if (newMeetingRoomId) {
        updateData.meetingRoomId = newMeetingRoomId;
        const room = await prisma.meetingRoom.findUnique({
          where: { id: newMeetingRoomId },
        });
        remark = `更换会议室为 ${room?.name}`;
      }

      if (newStartTime && newEndTime) {
        updateData.startTime = new Date(newStartTime);
        updateData.endTime = new Date(newEndTime);
        remark = `调整时间为 ${new Date(newStartTime).toLocaleString()} - ${new Date(newEndTime).toLocaleTimeString()}`;

        if (newMeetingRoomId) {
          const room = await prisma.meetingRoom.findUnique({
            where: { id: newMeetingRoomId },
          });
          const hours = (new Date(newEndTime).getTime() - new Date(newStartTime).getTime()) / (1000 * 60 * 60);
          updateData.totalCost = hours * (room?.hourlyRate || 0);
        }
      }

      await prisma.booking.update({
        where: { id },
        data: updateData,
      });

      await prisma.flowRecord.create({
        data: {
          bookingId: id,
          action: '解决冲突',
          operator: '王复核',
          role: Role.REVIEWER,
          remark,
        },
      });

      const booking = await getPrismaBookingWithRelations(id);
      res.json(booking);
      return;
    } catch (error) {
      // Fall through to memory mode
    }
  }

  const booking = getBookingById(id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  let remark = '';
  if (newMeetingRoomId) {
    const room = meetingRooms.find(r => r.id === newMeetingRoomId);
    booking.meetingRoomId = newMeetingRoomId;
    booking.meetingRoom = room;
    remark = `更换会议室为 ${room?.name}`;
  }
  if (newStartTime && newEndTime) {
    booking.startTime = new Date(newStartTime).toISOString();
    booking.endTime = new Date(newEndTime).toISOString();
    remark = `调整时间为 ${new Date(newStartTime).toLocaleString()} - ${new Date(newEndTime).toLocaleTimeString()}`;
    
    if (newMeetingRoomId) {
      const room = meetingRooms.find(r => r.id === newMeetingRoomId);
      const hours = (new Date(newEndTime).getTime() - new Date(newStartTime).getTime()) / (1000 * 60 * 60);
      booking.totalCost = hours * (room?.hourlyRate || 0);
    }
  }

  booking.status = 'PENDING';
  booking.conflictType = 'NONE';
  booking.conflictReason = undefined;

  addFlowRecord(id, '解决冲突', '王复核', 'REVIEWER', remark);
  res.json(booking);
});

app.put('/api/bookings/:id/archive', async (req, res) => {
  const { id } = req.params;

  if (usePrisma) {
    try {
      const { BookingStatus, Role } = require('@prisma/client');
      await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.ARCHIVED,
        },
      });

      await prisma.flowRecord.create({
        data: {
          bookingId: id,
          action: '归档',
          operator: '王复核',
          role: Role.REVIEWER,
          remark: '预订记录已归档',
        },
      });

      const booking = await getPrismaBookingWithRelations(id);
      res.json(booking);
      return;
    } catch (error) {
      // Fall through to memory mode
    }
  }

  const booking = getBookingById(id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'ARCHIVED';
  addFlowRecord(id, '归档', '王复核', 'REVIEWER', '预订记录已归档');
  res.json(booking);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} (${usePrisma ? 'PostgreSQL mode with fallback' : 'memory mode'})`);
});
