import { prisma } from "./prisma.server";
import { ConflictType, ScheduleStatus } from "~/types/enums";

export interface CampusStats {
  campusId: string;
  campusName: string;
  totalSchedules: number;
  completedSchedules: number;
  totalHours: number;
  totalRevenue: number;
}

export interface CourseStats {
  courseId: string;
  courseName: string;
  totalSchedules: number;
  completedSchedules: number;
  avgFillRate: number;
  totalHours: number;
}

export interface ConflictStats {
  type: typeof ConflictType[keyof typeof ConflictType];
  count: number;
  percentage: number;
}

export interface FillRateData {
  courseName: string;
  maxStudents: number;
  actualStudents: number;
  fillRate: number;
}

export async function getCampusStatistics(): Promise<CampusStats[]> {
  const campuses = await prisma.campus.findMany({
    include: {
      courses: {
        include: {
          schedules: true,
        },
      },
    },
  });

  return campuses.map((campus) => {
    const allSchedules = campus.courses.flatMap((c) => c.schedules);
    const completedSchedules = allSchedules.filter(
      (s) => s.status === ScheduleStatus.COMPLETED || s.status === ScheduleStatus.SETTLED
    );
    const totalHours = completedSchedules.reduce(
      (sum, s) => sum + (s.actualHours || 0),
      0
    );
    const totalRevenue = completedSchedules.reduce(
      (sum, s) => sum + (s.actualHours || 0) * 200,
      0
    );

    return {
      campusId: campus.id,
      campusName: campus.name,
      totalSchedules: allSchedules.length,
      completedSchedules: completedSchedules.length,
      totalHours,
      totalRevenue,
    };
  });
}

export async function getCourseStatistics(): Promise<CourseStats[]> {
  const courses = await prisma.course.findMany({
    include: {
      schedules: {
        where: {
          status: {
            notIn: [ScheduleStatus.DRAFT, ScheduleStatus.CANCELLED],
          },
        },
        include: {
          attendances: {
            where: {
              status: {
                notIn: ["LEAVE"],
              },
            },
          },
        },
      },
      courseEnrollments: true,
    },
  });

  return courses.map((course) => {
    const totalSchedules = course.schedules.length;
    const completedSchedulesArray = course.schedules.filter(
      (s) => s.status === ScheduleStatus.COMPLETED || s.status === ScheduleStatus.SETTLED
    );
    const completedSchedules = completedSchedulesArray.length;
    const totalHours = completedSchedulesArray.reduce(
      (sum, s) => sum + (s.actualHours || 0),
      0
    );

    const avgFillRate =
      completedSchedulesArray.length > 0
        ? completedSchedulesArray.reduce((sum, s) => {
            const presentCount = s.attendances.filter((a) => a.status === "PRESENT").length;
            return sum + (presentCount / course.maxStudents) * 100;
          }, 0) / completedSchedulesArray.length
        : 0;

    return {
      courseId: course.id,
      courseName: course.name,
      totalSchedules,
      completedSchedules,
      avgFillRate: Math.round(avgFillRate * 100) / 100,
      totalHours,
    };
  });
}

export async function getConflictStatistics(): Promise<ConflictStats[]> {
  const schedules = await prisma.schedule.findMany();

  const total = schedules.length;
  const teacherConflicts = schedules.filter(
    (s) => s.conflictType === ConflictType.TEACHER_CONFLICT
  ).length;
  const classroomConflicts = schedules.filter(
    (s) => s.conflictType === ConflictType.CLASSROOM_CONFLICT
  ).length;
  const noConflicts = schedules.filter(
    (s) => s.conflictType === ConflictType.NONE
  ).length;

  return [
    {
      type: ConflictType.NONE,
      count: noConflicts,
      percentage: total > 0 ? Math.round((noConflicts / total) * 10000) / 100 : 0,
    },
    {
      type: ConflictType.TEACHER_CONFLICT,
      count: teacherConflicts,
      percentage: total > 0 ? Math.round((teacherConflicts / total) * 10000) / 100 : 0,
    },
    {
      type: ConflictType.CLASSROOM_CONFLICT,
      count: classroomConflicts,
      percentage: total > 0 ? Math.round((classroomConflicts / total) * 10000) / 100 : 0,
    },
  ];
}

export async function getFillRateData(): Promise<FillRateData[]> {
  const courses = await prisma.course.findMany({
    include: {
      courseEnrollments: true,
      schedules: {
        where: {
          status: {
            in: [ScheduleStatus.COMPLETED, ScheduleStatus.SETTLED],
          },
        },
        take: 5,
      },
    },
  });

  return courses.map((course) => {
    const actualStudents = course.courseEnrollments.length;
    const fillRate = Math.round((actualStudents / course.maxStudents) * 10000) / 100;

    return {
      courseName: course.name,
      maxStudents: course.maxStudents,
      actualStudents,
      fillRate,
    };
  });
}

export async function getOverallStatistics() {
  const [totalSchedules, completedSchedules, pendingApprovals, pendingSettlements, totalConflicts] =
    await Promise.all([
      prisma.schedule.count(),
      prisma.schedule.count({
        where: { status: { in: [ScheduleStatus.COMPLETED, ScheduleStatus.SETTLED] } },
      }),
      prisma.schedule.count({
        where: { status: ScheduleStatus.SUBMITTED },
      }),
      prisma.settlement.count({
        where: { status: { in: ["PENDING", "REVIEWING"] } },
      }),
      prisma.schedule.count({
        where: { conflictType: { not: ConflictType.NONE } },
      }),
    ]);

  return {
    totalSchedules,
    completedSchedules,
    pendingApprovals,
    pendingSettlements,
    totalConflicts,
    completionRate:
      totalSchedules > 0
        ? Math.round((completedSchedules / totalSchedules) * 10000) / 100
        : 0,
  };
}
