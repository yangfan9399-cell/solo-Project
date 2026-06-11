import { prisma } from "./prisma.server";
import { ConflictType } from "~/types/enums";
import { addMinutes, isBefore, isAfter } from "date-fns";

export interface ConflictCheckResult {
  hasConflict: boolean;
  type: typeof ConflictType[keyof typeof ConflictType];
  note?: string;
  conflictingSchedule?: {
    id: string;
    courseName: string;
    startTime: Date;
    endTime: Date;
  };
}

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  teacherId: string;
  teacherName: string;
  classroomId: string;
  classroomName: string;
}

function checkTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2);
}

export async function checkTeacherConflict(
  teacherId: string,
  startTime: Date,
  endTime: Date,
  excludeScheduleId?: string
): Promise<ConflictCheckResult> {
  const existingSchedules = await prisma.schedule.findMany({
    where: {
      teacherId,
      id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      status: {
        in: ["SUBMITTED", "APPROVED", "TEACHER_CONFIRMED", "IN_PROGRESS", "COMPLETED"],
      },
    },
    include: {
      course: true,
    },
  });

  for (const schedule of existingSchedules) {
    if (checkTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
      return {
        hasConflict: true,
        type: "TEACHER_CONFLICT",
        note: `教师在此时段已有课程安排：${schedule.course.name}（${formatDateTime(schedule.startTime)} - ${formatTime(schedule.endTime)}）`,
        conflictingSchedule: {
          id: schedule.id,
          courseName: schedule.course.name,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      };
    }
  }

  return { hasConflict: false, type: "NONE" };
}

export async function checkClassroomConflict(
  classroomId: string,
  startTime: Date,
  endTime: Date,
  excludeScheduleId?: string
): Promise<ConflictCheckResult> {
  const existingSchedules = await prisma.schedule.findMany({
    where: {
      classroomId,
      id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
      status: {
        in: ["SUBMITTED", "APPROVED", "TEACHER_CONFIRMED", "IN_PROGRESS", "COMPLETED"],
      },
    },
    include: {
      course: true,
    },
  });

  for (const schedule of existingSchedules) {
    if (checkTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
      return {
        hasConflict: true,
        type: "CLASSROOM_CONFLICT",
        note: `教室在此时段已被占用：${schedule.course.name}（${formatDateTime(schedule.startTime)} - ${formatTime(schedule.endTime)}）`,
        conflictingSchedule: {
          id: schedule.id,
          courseName: schedule.course.name,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      };
    }
  }

  return { hasConflict: false, type: "NONE" };
}

export async function checkScheduleConflicts(
  teacherId: string,
  classroomId: string,
  startTime: Date,
  endTime: Date,
  excludeScheduleId?: string
): Promise<ConflictCheckResult> {
  const teacherConflict = await checkTeacherConflict(
    teacherId,
    startTime,
    endTime,
    excludeScheduleId
  );
  if (teacherConflict.hasConflict) {
    return teacherConflict;
  }

  const classroomConflict = await checkClassroomConflict(
    classroomId,
    startTime,
    endTime,
    excludeScheduleId
  );
  if (classroomConflict.hasConflict) {
    return classroomConflict;
  }

  return { hasConflict: false, type: "NONE" };
}

export async function findAvailableTimeSlots(
  teacherId: string,
  classroomId: string,
  preferredDate: Date,
  durationMinutes: number
): Promise<AvailableSlot[]> {
  const slots: AvailableSlot[] = [];
  const workingHoursStart = 8;
  const workingHoursEnd = 20;

  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });

  if (!teacher || !classroom) {
    return slots;
  }

  const dayStart = new Date(preferredDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const existingTeacherSchedules = await prisma.schedule.findMany({
    where: {
      teacherId,
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
      status: {
        in: ["SUBMITTED", "APPROVED", "TEACHER_CONFIRMED", "IN_PROGRESS", "COMPLETED"],
      },
    },
    orderBy: { startTime: "asc" },
  });

  const existingClassroomSchedules = await prisma.schedule.findMany({
    where: {
      classroomId,
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
      status: {
        in: ["SUBMITTED", "APPROVED", "TEACHER_CONFIRMED", "IN_PROGRESS", "COMPLETED"],
      },
    },
    orderBy: { startTime: "asc" },
  });

  const allBusySlots = [
    ...existingTeacherSchedules.map((s) => ({ start: s.startTime, end: s.endTime })),
    ...existingClassroomSchedules.map((s) => ({ start: s.startTime, end: s.endTime })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  let currentTime = new Date(dayStart);
  currentTime.setHours(workingHoursStart, 0, 0, 0);

  for (const busy of allBusySlots) {
    const slotEnd = addMinutes(currentTime, durationMinutes);

    if (slotEnd <= busy.start && slotEnd.getHours() <= workingHoursEnd) {
      slots.push({
        startTime: new Date(currentTime),
        endTime: slotEnd,
        teacherId,
        teacherName: teacher.name,
        classroomId,
        classroomName: classroom.name,
      });
    }

    if (isAfter(busy.end, currentTime)) {
      currentTime = new Date(busy.end);
    }
  }

  while (currentTime.getHours() < workingHoursEnd) {
    const slotEnd = addMinutes(currentTime, durationMinutes);
    if (slotEnd.getHours() <= workingHoursEnd) {
      slots.push({
        startTime: new Date(currentTime),
        endTime: slotEnd,
        teacherId,
        teacherName: teacher.name,
        classroomId,
        classroomName: classroom.name,
      });
    }
    currentTime = addMinutes(currentTime, durationMinutes);
  }

  return slots;
}

export async function createScheduleWithConflictCheck(data: {
  courseId: string;
  teacherId: string;
  classroomId: string;
  campusId: string;
  startTime: Date;
  endTime: Date;
  operatorId: string;
}) {
  const conflict = await checkScheduleConflicts(
    data.teacherId,
    data.classroomId,
    data.startTime,
    data.endTime
  );

  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
  });

  if (!course) {
    throw new Error("课程不存在");
  }

  const schedule = await prisma.schedule.create({
    data: {
      courseId: data.courseId,
      teacherId: data.teacherId,
      classroomId: data.classroomId,
      campusId: data.campusId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: "DRAFT",
      conflictType: conflict.type,
      conflictNote: conflict.note,
      historyNodes: {
        create: {
          status: "DRAFT",
          operatorId: data.operatorId,
          note: conflict.hasConflict
            ? `教务创建排课，存在${conflict.type === "TEACHER_CONFLICT" ? "教师" : "教室"}冲突`
            : "教务创建排课",
        },
      },
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });

  return { schedule, conflict };
}

function formatDateTime(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatTime(date: Date): string {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}
