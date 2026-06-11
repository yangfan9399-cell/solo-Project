import { prisma } from "./prisma.server";
import { SettlementStatus } from "~/types/enums";

export async function submitScheduleForApproval(
  scheduleId: string,
  operatorId: string
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("排课不存在");
  }

  if (schedule.status !== "DRAFT") {
    throw new Error("只有草稿状态的排课可以提交审核");
  }

  if (schedule.conflictType !== "NONE") {
    throw new Error("存在冲突的排课无法提交审核，请先调整时间");
  }

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      status: "SUBMITTED",
      historyNodes: {
        create: {
          status: "SUBMITTED",
          operatorId,
          note: "教务提交审核，等待校区主管审批",
        },
      },
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });
}

export async function approveSchedule(
  scheduleId: string,
  approverId: string,
  note?: string
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("排课不存在");
  }

  if (schedule.status !== "SUBMITTED") {
    throw new Error("只有已提交的排课可以审核");
  }

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      status: "APPROVED",
      approvals: {
        create: {
          approverId,
          status: "APPROVED",
          note: note || "校区主管审核通过，资源确认无误",
          approvedAt: new Date(),
        },
      },
      historyNodes: {
        create: {
          status: "APPROVED",
          operatorId: approverId,
          note: note || "校区主管审核通过，资源确认无误",
        },
      },
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });
}

export async function rejectSchedule(
  scheduleId: string,
  approverId: string,
  note: string
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("排课不存在");
  }

  if (schedule.status !== "SUBMITTED") {
    throw new Error("只有已提交的排课可以审核");
  }

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      status: "DRAFT",
      approvals: {
        create: {
          approverId,
          status: "DRAFT",
          note,
        },
      },
      historyNodes: {
        create: {
          status: "DRAFT",
          operatorId: approverId,
          note: `审核驳回：${note}`,
        },
      },
    },
  });
}

export async function teacherConfirmSchedule(
  scheduleId: string,
  teacherId: string
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("排课不存在");
  }

  if (schedule.status !== "APPROVED") {
    throw new Error("只有已审核通过的排课可以确认");
  }

  if (schedule.teacherId !== teacherId) {
    throw new Error("只有授课教师可以确认");
  }

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      status: "TEACHER_CONFIRMED",
      historyNodes: {
        create: {
          status: "TEACHER_CONFIRMED",
          operatorId: teacherId,
          note: "教师确认授课",
        },
      },
    },
    include: {
      course: true,
      teacher: true,
      classroom: true,
    },
  });
}

export async function teacherRejectSchedule(
  scheduleId: string,
  teacherId: string,
  note: string
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("排课不存在");
  }

  if (schedule.status !== "APPROVED") {
    throw new Error("只有已审核通过的排课可以拒绝");
  }

  if (schedule.teacherId !== teacherId) {
    throw new Error("只有授课教师可以拒绝");
  }

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      status: "TEACHER_REJECTED",
      historyNodes: {
        create: {
          status: "TEACHER_REJECTED",
          operatorId: teacherId,
          note: `教师拒绝授课：${note}`,
        },
      },
    },
  });
}

export async function markScheduleInProgress(
  scheduleId: string,
  operatorId: string
) {
  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      status: "IN_PROGRESS",
      historyNodes: {
        create: {
          status: "IN_PROGRESS",
          operatorId,
          note: "课程开始上课",
        },
      },
    },
  });
}

export async function completeSchedule(
  scheduleId: string,
  actualHours: number,
  operatorId: string
) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      course: true,
      teacher: true,
    },
  });

  if (!schedule) {
    throw new Error("排课不存在");
  }

  return prisma.$transaction(async (tx) => {
    const updatedSchedule = await tx.schedule.update({
      where: { id: scheduleId },
      data: {
        status: "COMPLETED",
        actualHours,
        historyNodes: {
          create: {
            status: "COMPLETED",
            operatorId,
            note: `课程完成，实际课时：${actualHours}小时`,
          },
        },
      },
    });

    const enrollments = await tx.courseEnrollment.findMany({
      where: { courseId: schedule.courseId },
    });

    for (const enrollment of enrollments) {
      await tx.attendance.upsert({
        where: {
          scheduleId_studentId: {
            scheduleId,
            studentId: enrollment.studentId,
          },
        },
        create: {
          scheduleId,
          studentId: enrollment.studentId,
          status: "PRESENT",
        },
        update: {},
      });
    }

    const hourlyRate = 200;
    const totalAmount = actualHours * hourlyRate;

    await tx.settlement.create({
      data: {
        scheduleId,
        teacherId: schedule.teacherId,
        totalHours: actualHours,
        hourlyRate,
        totalAmount,
        netAmount: totalAmount,
        status: "PENDING",
      },
    });

    return updatedSchedule;
  });
}

export async function markStudentLeave(
  scheduleId: string,
  studentId: string,
  reason: string,
  operatorId: string
) {
  const attendance = await prisma.attendance.update({
    where: {
      scheduleId_studentId: {
        scheduleId,
        studentId,
      },
    },
    data: {
      status: "LEAVE",
      leaveReason: reason,
      checkInTime: null,
      checkOutTime: null,
    },
  });

  await prisma.historyNode.create({
    data: {
      scheduleId,
      status: "COMPLETED",
      operatorId,
      note: `学生请假已记录`,
    },
  });

  return attendance;
}

export async function reviewSettlement(
  settlementId: string,
  reviewerId: string,
  status: SettlementStatus,
  note?: string
) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  });

  if (!settlement) {
    throw new Error("结算记录不存在");
  }

  const updateData: any = {
    status,
    reviewerId,
    reviewedAt: new Date(),
    note,
  };

  if (status === "PAID") {
    updateData.paidAt = new Date();
  }

  return prisma.$transaction(async (tx) => {
    const updatedSettlement = await tx.settlement.update({
      where: { id: settlementId },
      data: updateData,
    });

    if (status === "PAID") {
      await tx.schedule.update({
        where: { id: settlement.scheduleId },
        data: {
          status: "SETTLED",
          historyNodes: {
            create: {
              status: "SETTLED",
              operatorId: reviewerId,
              note: note || "财务结算完成，款项已支付",
            },
          },
        },
      });
    }

    return updatedSettlement;
  });
}
