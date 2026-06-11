import { PrismaClient } from "@prisma/client";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const Role = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  FINANCE: "FINANCE",
  CAMPUS_DIRECTOR: "CAMPUS_DIRECTOR",
};

const ScheduleStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  TEACHER_CONFIRMED: "TEACHER_CONFIRMED",
  TEACHER_REJECTED: "TEACHER_REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  SETTLED: "SETTLED",
};

const ConflictType = {
  TEACHER_CONFLICT: "TEACHER_CONFLICT",
  CLASSROOM_CONFLICT: "CLASSROOM_CONFLICT",
  NONE: "NONE",
};

const SettlementStatus = {
  PENDING: "PENDING",
  REVIEWING: "REVIEWING",
  APPROVED: "APPROVED",
  PAID: "PAID",
};

const AttendanceStatus = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
};

async function main() {
  console.log("开始种子数据初始化...");

  const campus1 = await prisma.campus.upsert({
    where: { id: "campus-001" },
    update: {},
    create: {
      id: "campus-001",
      name: "朝阳校区",
      address: "北京市朝阳区建国路88号",
    },
  });

  const campus2 = await prisma.campus.upsert({
    where: { id: "campus-002" },
    update: {},
    create: {
      id: "campus-002",
      name: "海淀校区",
      address: "北京市海淀区中关村大街1号",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      id: "user-admin",
      name: "系统管理员",
      email: "admin@school.com",
      role: Role.ADMIN,
    },
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher1@school.com" },
    update: {},
    create: {
      id: "user-teacher1",
      name: "张老师",
      email: "teacher1@school.com",
      role: Role.TEACHER,
      campusId: campus1.id,
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher2@school.com" },
    update: {},
    create: {
      id: "user-teacher2",
      name: "李老师",
      email: "teacher2@school.com",
      role: Role.TEACHER,
      campusId: campus1.id,
    },
  });

  const teacher3 = await prisma.user.upsert({
    where: { email: "teacher3@school.com" },
    update: {},
    create: {
      id: "user-teacher3",
      name: "王老师",
      email: "teacher3@school.com",
      role: Role.TEACHER,
      campusId: campus2.id,
    },
  });

  const director1 = await prisma.user.upsert({
    where: { email: "director1@school.com" },
    update: {},
    create: {
      id: "user-director1",
      name: "刘主管",
      email: "director1@school.com",
      role: Role.CAMPUS_DIRECTOR,
      campusId: campus1.id,
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: "finance@school.com" },
    update: {},
    create: {
      id: "user-finance",
      name: "陈财务",
      email: "finance@school.com",
      role: Role.FINANCE,
    },
  });

  const course1 = await prisma.course.upsert({
    where: { id: "course-001" },
    update: {},
    create: {
      id: "course-001",
      name: "小学数学思维训练",
      description: "针对3-6年级学生的数学思维提升课程",
      duration: 90,
      price: 180,
      maxStudents: 15,
      campusId: campus1.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: "course-002" },
    update: {},
    create: {
      id: "course-002",
      name: "初中英语强化班",
      description: "初中英语语法、阅读、写作综合提升",
      duration: 120,
      price: 240,
      maxStudents: 20,
      campusId: campus1.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: "course-003" },
    update: {},
    create: {
      id: "course-003",
      name: "高中物理竞赛班",
      description: "高中物理奥赛辅导课程",
      duration: 150,
      price: 360,
      maxStudents: 12,
      campusId: campus2.id,
    },
  });

  const classroom1 = await prisma.classroom.upsert({
    where: { id: "classroom-001" },
    update: {},
    create: {
      id: "classroom-001",
      name: "A101教室",
      capacity: 20,
      campusId: campus1.id,
    },
  });

  const classroom2 = await prisma.classroom.upsert({
    where: { id: "classroom-002" },
    update: {},
    create: {
      id: "classroom-002",
      name: "A102教室",
      capacity: 25,
      campusId: campus1.id,
    },
  });

  const classroom3 = await prisma.classroom.upsert({
    where: { id: "classroom-003" },
    update: {},
    create: {
      id: "classroom-003",
      name: "B201教室",
      capacity: 15,
      campusId: campus2.id,
    },
  });

  const students = [];
  for (let i = 1; i <= 20; i++) {
    const student = await prisma.student.upsert({
      where: { id: `student-${String(i).padStart(3, "0")}` },
      update: {},
      create: {
        id: `student-${String(i).padStart(3, "0")}`,
        name: `学生${i}`,
        phone: `138${String(10000000 + i).slice(-8)}`,
        email: `student${i}@example.com`,
      },
    });
    students.push(student);
  }

  for (let i = 0; i < 10; i++) {
    await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: course1.id,
          studentId: students[i].id,
        },
      },
      update: {},
      create: {
        courseId: course1.id,
        studentId: students[i].id,
      },
    });
  }

  for (let i = 5; i < 15; i++) {
    await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: course2.id,
          studentId: students[i].id,
        },
      },
      update: {},
      create: {
        courseId: course2.id,
        studentId: students[i].id,
      },
    });
  }

  for (let i = 10; i < 18; i++) {
    await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: course3.id,
          studentId: students[i].id,
        },
      },
      update: {},
      create: {
        courseId: course3.id,
        studentId: students[i].id,
      },
    });
  }

  const baseDate = startOfDay(addDays(new Date(), -7));

  const normalSchedule = await prisma.schedule.upsert({
    where: { id: "schedule-normal" },
    update: {},
    create: {
      id: "schedule-normal",
      courseId: course1.id,
      teacherId: teacher1.id,
      classroomId: classroom1.id,
      campusId: campus1.id,
      startTime: setMinutes(setHours(baseDate, 9), 0),
      endTime: setMinutes(setHours(baseDate, 10), 30),
      status: ScheduleStatus.SETTLED,
      conflictType: ConflictType.NONE,
      actualHours: 1.5,
    },
  });

  await prisma.historyNode.createMany({
    data: [
      { scheduleId: normalSchedule.id, status: ScheduleStatus.DRAFT, operatorId: admin.id, note: "教务创建排课" },
      { scheduleId: normalSchedule.id, status: ScheduleStatus.SUBMITTED, operatorId: admin.id, note: "教务提交审核" },
      { scheduleId: normalSchedule.id, status: ScheduleStatus.APPROVED, operatorId: director1.id, note: "校区主管审核通过，资源确认" },
      { scheduleId: normalSchedule.id, status: ScheduleStatus.TEACHER_CONFIRMED, operatorId: teacher1.id, note: "教师确认授课" },
      { scheduleId: normalSchedule.id, status: ScheduleStatus.COMPLETED, operatorId: teacher1.id, note: "课程正常完成" },
      { scheduleId: normalSchedule.id, status: ScheduleStatus.SETTLED, operatorId: finance.id, note: "财务结算完成" },
    ],
  });

  for (let i = 0; i < 10; i++) {
    await prisma.attendance.upsert({
      where: {
        scheduleId_studentId: {
          scheduleId: normalSchedule.id,
          studentId: students[i].id,
        },
      },
      update: {},
      create: {
        scheduleId: normalSchedule.id,
        studentId: students[i].id,
        status: AttendanceStatus.PRESENT,
        checkInTime: setMinutes(setHours(baseDate, 8), 55),
        checkOutTime: setMinutes(setHours(baseDate, 10), 35),
      },
    });
  }

  await prisma.settlement.upsert({
    where: { scheduleId: normalSchedule.id },
    update: {},
    create: {
      scheduleId: normalSchedule.id,
      teacherId: teacher1.id,
      totalHours: 1.5,
      hourlyRate: 200,
      totalAmount: 300,
      netAmount: 300,
      status: SettlementStatus.PAID,
      reviewerId: finance.id,
      reviewedAt: addDays(baseDate, 2),
      paidAt: addDays(baseDate, 3),
      note: "正常结算",
    },
  });

  const teacherConflictDate = addDays(baseDate, 1);
  const teacherConflictSchedule = await prisma.schedule.upsert({
    where: { id: "schedule-teacher-conflict" },
    update: {},
    create: {
      id: "schedule-teacher-conflict",
      courseId: course2.id,
      teacherId: teacher1.id,
      classroomId: classroom2.id,
      campusId: campus1.id,
      startTime: setMinutes(setHours(teacherConflictDate, 9), 0),
      endTime: setMinutes(setHours(teacherConflictDate, 11), 0),
      status: ScheduleStatus.DRAFT,
      conflictType: ConflictType.TEACHER_CONFLICT,
      conflictNote: "教师张老师在此时段已有课程安排（小学数学思维训练）",
    },
  });

  await prisma.historyNode.createMany({
    data: [
      { scheduleId: teacherConflictSchedule.id, status: ScheduleStatus.DRAFT, operatorId: admin.id, note: "教务创建排课" },
    ],
  });

  await prisma.schedule.upsert({
    where: { id: "schedule-conflicting-teacher" },
    update: {},
    create: {
      id: "schedule-conflicting-teacher",
      courseId: course1.id,
      teacherId: teacher1.id,
      classroomId: classroom1.id,
      campusId: campus1.id,
      startTime: setMinutes(setHours(teacherConflictDate, 8), 30),
      endTime: setMinutes(setHours(teacherConflictDate, 10), 0),
      status: ScheduleStatus.TEACHER_CONFIRMED,
      conflictType: ConflictType.NONE,
    },
  });

  const classroomConflictDate = addDays(baseDate, 2);
  const classroomConflictSchedule = await prisma.schedule.upsert({
    where: { id: "schedule-classroom-conflict" },
    update: {},
    create: {
      id: "schedule-classroom-conflict",
      courseId: course3.id,
      teacherId: teacher3.id,
      classroomId: classroom1.id,
      campusId: campus1.id,
      startTime: setMinutes(setHours(classroomConflictDate, 14), 0),
      endTime: setMinutes(setHours(classroomConflictDate, 16), 30),
      status: ScheduleStatus.DRAFT,
      conflictType: ConflictType.CLASSROOM_CONFLICT,
      conflictNote: "A101教室在此时段已被占用（初中英语强化班）",
    },
  });

  await prisma.historyNode.createMany({
    data: [
      { scheduleId: classroomConflictSchedule.id, status: ScheduleStatus.DRAFT, operatorId: admin.id, note: "教务创建排课" },
    ],
  });

  await prisma.schedule.upsert({
    where: { id: "schedule-conflicting-classroom" },
    update: {},
    create: {
      id: "schedule-conflicting-classroom",
      courseId: course2.id,
      teacherId: teacher2.id,
      classroomId: classroom1.id,
      campusId: campus1.id,
      startTime: setMinutes(setHours(classroomConflictDate, 13), 30),
      endTime: setMinutes(setHours(classroomConflictDate, 15), 30),
      status: ScheduleStatus.APPROVED,
      conflictType: ConflictType.NONE,
    },
  });

  const leaveScheduleDate = addDays(baseDate, 3);
  const leaveSchedule = await prisma.schedule.upsert({
    where: { id: "schedule-student-leave" },
    update: {},
    create: {
      id: "schedule-student-leave",
      courseId: course2.id,
      teacherId: teacher2.id,
      classroomId: classroom2.id,
      campusId: campus1.id,
      startTime: setMinutes(setHours(leaveScheduleDate, 9), 0),
      endTime: setMinutes(setHours(leaveScheduleDate, 11), 0),
      status: ScheduleStatus.COMPLETED,
      conflictType: ConflictType.NONE,
      actualHours: 2.0,
    },
  });

  await prisma.historyNode.createMany({
    data: [
      { scheduleId: leaveSchedule.id, status: ScheduleStatus.DRAFT, operatorId: admin.id, note: "教务创建排课" },
      { scheduleId: leaveSchedule.id, status: ScheduleStatus.SUBMITTED, operatorId: admin.id, note: "教务提交审核" },
      { scheduleId: leaveSchedule.id, status: ScheduleStatus.APPROVED, operatorId: director1.id, note: "校区主管审核通过" },
      { scheduleId: leaveSchedule.id, status: ScheduleStatus.TEACHER_CONFIRMED, operatorId: teacher2.id, note: "教师确认授课" },
      { scheduleId: leaveSchedule.id, status: ScheduleStatus.COMPLETED, operatorId: teacher2.id, note: "课程完成，含学生请假" },
    ],
  });

  for (let i = 5; i < 15; i++) {
    const isLeave = i === 7 || i === 10;
    await prisma.attendance.upsert({
      where: {
        scheduleId_studentId: {
          scheduleId: leaveSchedule.id,
          studentId: students[i].id,
        },
      },
      update: {},
      create: {
        scheduleId: leaveSchedule.id,
        studentId: students[i].id,
        status: isLeave ? AttendanceStatus.LEAVE : AttendanceStatus.PRESENT,
        checkInTime: isLeave ? null : setMinutes(setHours(leaveScheduleDate, 8), 50),
        checkOutTime: isLeave ? null : setMinutes(setHours(leaveScheduleDate, 11), 5),
        leaveReason: isLeave ? "身体不适，请假一天" : null,
      },
    });
  }

  const pendingScheduleDate = addDays(baseDate, 5);
  const pendingSchedule = await prisma.schedule.upsert({
    where: { id: "schedule-pending-approval" },
    update: {},
    create: {
      id: "schedule-pending-approval",
      courseId: course3.id,
      teacherId: teacher3.id,
      classroomId: classroom3.id,
      campusId: campus2.id,
      startTime: setMinutes(setHours(pendingScheduleDate, 14), 0),
      endTime: setMinutes(setHours(pendingScheduleDate, 16), 30),
      status: ScheduleStatus.SUBMITTED,
      conflictType: ConflictType.NONE,
    },
  });

  await prisma.historyNode.createMany({
    data: [
      { scheduleId: pendingSchedule.id, status: ScheduleStatus.DRAFT, operatorId: admin.id, note: "教务创建排课" },
      { scheduleId: pendingSchedule.id, status: ScheduleStatus.SUBMITTED, operatorId: admin.id, note: "教务提交审核，等待校区主管审批" },
    ],
  });

  const inProgressDate = addDays(baseDate, 1);
  await prisma.schedule.upsert({
    where: { id: "schedule-in-progress" },
    update: {},
    create: {
      id: "schedule-in-progress",
      courseId: course3.id,
      teacherId: teacher3.id,
      classroomId: classroom3.id,
      campusId: campus2.id,
      startTime: setMinutes(setHours(inProgressDate, 10), 0),
      endTime: setMinutes(setHours(inProgressDate, 12), 30),
      status: ScheduleStatus.IN_PROGRESS,
      conflictType: ConflictType.NONE,
    },
  });

  console.log("种子数据初始化完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
