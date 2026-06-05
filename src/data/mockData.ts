import { Department, MeetingRoom, Booking, BookingStatus, ConflictType, Role } from '../types';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const departments: Department[] = [
  { id: 'dept-1', name: '技术研发部', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-2', name: '市场营销部', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-3', name: '人力资源部', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-4', name: '财务部', createdAt: new Date(), updatedAt: new Date() },
  { id: 'dept-5', name: '产品运营部', createdAt: new Date(), updatedAt: new Date() },
];

export const meetingRooms: MeetingRoom[] = [
  {
    id: 'room-1',
    name: '创新厅',
    floor: 3,
    capacity: 20,
    hourlyRate: 200,
    equipments: [
      { id: 'eq-1', name: '投影仪', meetingRoomId: 'room-1', createdAt: new Date(), updatedAt: new Date() },
      { id: 'eq-2', name: '白板', meetingRoomId: 'room-1', createdAt: new Date(), updatedAt: new Date() },
      { id: 'eq-3', name: '视频会议系统', meetingRoomId: 'room-1', createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'room-2',
    name: '协作室',
    floor: 5,
    capacity: 10,
    hourlyRate: 150,
    equipments: [
      { id: 'eq-4', name: '投影仪', meetingRoomId: 'room-2', createdAt: new Date(), updatedAt: new Date() },
      { id: 'eq-5', name: '白板', meetingRoomId: 'room-2', createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'room-3',
    name: '董事会议室',
    floor: 10,
    capacity: 30,
    hourlyRate: 500,
    equipments: [
      { id: 'eq-6', name: '投影仪', meetingRoomId: 'room-3', createdAt: new Date(), updatedAt: new Date() },
      { id: 'eq-7', name: '视频会议系统', meetingRoomId: 'room-3', createdAt: new Date(), updatedAt: new Date() },
      { id: 'eq-8', name: '音响系统', meetingRoomId: 'room-3', createdAt: new Date(), updatedAt: new Date() },
      { id: 'eq-9', name: '电子白板', meetingRoomId: 'room-3', createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'room-4',
    name: '头脑风暴室',
    floor: 5,
    capacity: 8,
    hourlyRate: 100,
    equipments: [
      { id: 'eq-10', name: '白板', meetingRoomId: 'room-4', createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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

export const bookings: Booking[] = [
  {
    id: 'booking-1',
    title: 'Q3产品规划会议',
    meetingRoomId: 'room-1',
    meetingRoom: meetingRooms[0],
    departmentId: 'dept-5',
    department: departments[4],
    startTime: tomorrow9am,
    endTime: tomorrow11am,
    status: BookingStatus.CONFIRMED,
    conflictType: ConflictType.NONE,
    totalCost: 400,
    applicant: '张晓明',
    applicantRole: Role.ADMIN,
    equipmentNotes: '需要使用投影仪和视频会议系统',
    costAllocations: [
      {
        id: 'cost-1',
        bookingId: 'booking-1',
        departmentId: 'dept-5',
        department: departments[4],
        amount: 400,
        percentage: 100,
        confirmed: true,
        confirmedAt: new Date(),
        confirmedBy: '李总监',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    flowRecords: [
      {
        id: 'flow-1',
        bookingId: 'booking-1',
        action: '创建预订',
        operator: '张晓明',
        role: Role.ADMIN,
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'flow-2',
        bookingId: 'booking-1',
        action: '费用确认',
        operator: '李总监',
        role: Role.DEPARTMENT_HEAD,
        remark: '费用分摊确认通过',
        createdAt: new Date(Date.now() - 43200000),
      },
      {
        id: 'flow-3',
        bookingId: 'booking-1',
        action: '确认预订',
        operator: '王复核',
        role: Role.REVIEWER,
        remark: '复核通过，预订已确认',
        createdAt: new Date(Date.now() - 3600000),
      },
    ],
    bookingEquipments: [
      { id: 'be-1', bookingId: 'booking-1', name: '投影仪', available: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'be-2', bookingId: 'booking-1', name: '视频会议系统', available: true, createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'booking-2',
    title: '技术架构评审会',
    meetingRoomId: 'room-1',
    meetingRoom: meetingRooms[0],
    departmentId: 'dept-1',
    department: departments[0],
    startTime: tomorrow9am,
    endTime: new Date(tomorrow9am.getTime() + 3 * 60 * 60 * 1000),
    status: BookingStatus.CONFLICT,
    conflictType: ConflictType.TIME_OVERLAP,
    conflictReason: '与"Q3产品规划会议"时间重叠，该会议室9:00-11:00已被预订',
    totalCost: 600,
    applicant: '刘工程师',
    applicantRole: Role.ADMIN,
    equipmentNotes: '需要投影仪和白板',
    costAllocations: [
      {
        id: 'cost-2',
        bookingId: 'booking-2',
        departmentId: 'dept-1',
        department: departments[0],
        amount: 600,
        percentage: 100,
        confirmed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    flowRecords: [
      {
        id: 'flow-4',
        bookingId: 'booking-2',
        action: '创建预订',
        operator: '刘工程师',
        role: Role.ADMIN,
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        id: 'flow-5',
        bookingId: 'booking-2',
        action: '冲突检测',
        operator: '系统',
        role: Role.ADMIN,
        remark: '检测到时间重叠冲突',
        createdAt: new Date(Date.now() - 7100000),
      },
    ],
    bookingEquipments: [
      { id: 'be-3', bookingId: 'booking-2', name: '投影仪', available: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'be-4', bookingId: 'booking-2', name: '白板', available: true, createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'booking-3',
    title: '大客户演示会',
    meetingRoomId: 'room-4',
    meetingRoom: meetingRooms[3],
    departmentId: 'dept-2',
    department: departments[1],
    startTime: tomorrow2pm,
    endTime: tomorrow4pm,
    status: BookingStatus.CONFLICT,
    conflictType: ConflictType.EQUIPMENT_MISSING,
    conflictReason: '头脑风暴室缺少投影仪设备，无法满足客户演示需求',
    totalCost: 200,
    applicant: '陈经理',
    applicantRole: Role.ADMIN,
    equipmentNotes: '必须使用投影仪进行产品演示',
    costAllocations: [
      {
        id: 'cost-3',
        bookingId: 'booking-3',
        departmentId: 'dept-2',
        department: departments[1],
        amount: 200,
        percentage: 100,
        confirmed: true,
        confirmedAt: new Date(),
        confirmedBy: '市场总监',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    flowRecords: [
      {
        id: 'flow-6',
        bookingId: 'booking-3',
        action: '创建预订',
        operator: '陈经理',
        role: Role.ADMIN,
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 10800000),
      },
      {
        id: 'flow-7',
        bookingId: 'booking-3',
        action: '设备检查',
        operator: '王复核',
        role: Role.REVIEWER,
        remark: '该会议室无投影仪，设备不满足需求',
        createdAt: new Date(Date.now() - 7200000),
      },
    ],
    bookingEquipments: [
      { id: 'be-5', bookingId: 'booking-3', name: '投影仪', available: false, createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'booking-4',
    title: '跨部门项目协调会',
    meetingRoomId: 'room-2',
    meetingRoom: meetingRooms[1],
    departmentId: 'dept-1',
    department: departments[0],
    startTime: dayAfter10am,
    endTime: dayAfter12pm,
    status: BookingStatus.CONFLICT,
    conflictType: ConflictType.COST_ALLOCATION_MISMATCH,
    conflictReason: '费用分摊比例总和为90%，不足100%，请检查各部门分摊比例',
    totalCost: 300,
    applicant: '周主管',
    applicantRole: Role.ADMIN,
    equipmentNotes: '需要投影仪',
    costAllocations: [
      {
        id: 'cost-4',
        bookingId: 'booking-4',
        departmentId: 'dept-1',
        department: departments[0],
        amount: 150,
        percentage: 50,
        confirmed: true,
        confirmedAt: new Date(),
        confirmedBy: '技术总监',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cost-5',
        bookingId: 'booking-4',
        departmentId: 'dept-5',
        department: departments[4],
        amount: 120,
        percentage: 40,
        confirmed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    flowRecords: [
      {
        id: 'flow-8',
        bookingId: 'booking-4',
        action: '创建预订',
        operator: '周主管',
        role: Role.ADMIN,
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 14400000),
      },
      {
        id: 'flow-9',
        bookingId: 'booking-4',
        action: '费用复核',
        operator: '王复核',
        role: Role.REVIEWER,
        remark: '分摊比例不匹配，总和不足100%',
        createdAt: new Date(Date.now() - 3600000),
      },
    ],
    bookingEquipments: [
      { id: 'be-6', bookingId: 'booking-4', name: '投影仪', available: true, createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'booking-5',
    title: '新员工入职培训',
    meetingRoomId: 'room-3',
    meetingRoom: meetingRooms[2],
    departmentId: 'dept-3',
    department: departments[2],
    startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    status: BookingStatus.PENDING,
    conflictType: ConflictType.NONE,
    totalCost: 2000,
    applicant: 'HR专员',
    applicantRole: Role.ADMIN,
    equipmentNotes: '需要全部设备',
    costAllocations: [
      {
        id: 'cost-6',
        bookingId: 'booking-5',
        departmentId: 'dept-3',
        department: departments[2],
        amount: 2000,
        percentage: 100,
        confirmed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    flowRecords: [
      {
        id: 'flow-10',
        bookingId: 'booking-5',
        action: '创建预订',
        operator: 'HR专员',
        role: Role.ADMIN,
        remark: '行政经办人提交预订申请',
        createdAt: new Date(Date.now() - 1800000),
      },
    ],
    bookingEquipments: [
      { id: 'be-7', bookingId: 'booking-5', name: '投影仪', available: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'be-8', bookingId: 'booking-5', name: '视频会议系统', available: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'be-9', bookingId: 'booking-5', name: '音响系统', available: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'be-10', bookingId: 'booking-5', name: '电子白板', available: true, createdAt: new Date(), updatedAt: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
