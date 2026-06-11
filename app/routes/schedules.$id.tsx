import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import {
  submitScheduleForApproval,
  approveSchedule,
  rejectSchedule,
  teacherConfirmSchedule,
  teacherRejectSchedule,
  markScheduleInProgress,
  completeSchedule,
  markStudentLeave,
  reviewSettlement,
} from "~/utils/workflow.server";
import {
  formatDateTime,
  formatDateTimeRange,
  formatTime,
  formatCurrency,
  getStatusBadgeClass,
  getStatusText,
  getConflictTypeText,
  getAttendanceStatusText,
  getSettlementStatusText,
  getRoleText,
} from "~/utils/format";
import { ScheduleStatus, SettlementStatus } from "~/types/enums";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: params.id },
    include: {
      course: {
        include: {
          campus: true,
          courseEnrollments: {
            include: {
              student: true,
            },
          },
        },
      },
      teacher: true,
      classroom: true,
      attendances: {
        include: {
          student: true,
        },
      },
      settlement: {
        include: {
          reviewer: true,
        },
      },
      historyNodes: {
        include: {
          operator: true,
        },
        orderBy: { createdAt: "asc" },
      },
      approvals: {
        include: {
          approver: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new Response("排课不存在", { status: 404 });
  }

  return json({ schedule });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const scheduleId = params.id!;

  try {
    switch (intent) {
      case "submit":
        await submitScheduleForApproval(scheduleId, "user-admin");
        return redirect(`/schedules/${scheduleId}`);

      case "approve":
        await approveSchedule(scheduleId, "user-director1");
        return redirect(`/schedules/${scheduleId}`);

      case "reject": {
        const note = formData.get("note") as string;
        await rejectSchedule(scheduleId, "user-director1", note);
        return redirect(`/schedules/${scheduleId}`);
      }

      case "teacher-confirm":
        await teacherConfirmSchedule(scheduleId, formData.get("teacherId") as string);
        return redirect(`/schedules/${scheduleId}`);

      case "teacher-reject": {
        const note = formData.get("note") as string;
        await teacherRejectSchedule(scheduleId, formData.get("teacherId") as string, note);
        return redirect(`/schedules/${scheduleId}`);
      }

      case "start-class":
        await markScheduleInProgress(scheduleId, "user-teacher1");
        return redirect(`/schedules/${scheduleId}`);

      case "complete": {
        const actualHours = parseFloat(formData.get("actualHours") as string);
        await completeSchedule(scheduleId, actualHours, "user-teacher1");
        return redirect(`/schedules/${scheduleId}`);
      }

      case "mark-leave": {
        const studentId = formData.get("studentId") as string;
        const reason = formData.get("reason") as string;
        await markStudentLeave(scheduleId, studentId, reason, "user-admin");
        return redirect(`/schedules/${scheduleId}`);
      }

      case "review-settlement": {
        const settlementId = formData.get("settlementId") as string;
        const status = formData.get("status") as SettlementStatus;
        const note = formData.get("note") as string;
        await reviewSettlement(settlementId, "user-finance", status, note);
        return redirect(`/schedules/${scheduleId}`);
      }

      default:
        return json({ error: "无效操作" }, { status: 400 });
    }
  } catch (error) {
    return json({ error: (error as Error).message }, { status: 400 });
  }
};

export default function ScheduleDetail() {
  const { schedule } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const canSubmit = schedule.status === "DRAFT" && schedule.conflictType === "NONE";
  const canApprove = schedule.status === "SUBMITTED";
  const canTeacherConfirm = schedule.status === "APPROVED";
  const canStartClass = schedule.status === "TEACHER_CONFIRMED";
  const canComplete = schedule.status === "IN_PROGRESS";
  const canReviewSettlement = schedule.settlement && schedule.settlement.status === "PENDING";
  const canPaySettlement = schedule.settlement && (schedule.settlement.status === "APPROVED" || schedule.settlement.status === "REVIEWING");

  const enrolledStudents = schedule.course.courseEnrollments.map((e) => e.student);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {schedule.course.name}
            </h1>
            <span className={`badge ${getStatusBadgeClass(schedule.status)}`}>
              {getStatusText(schedule.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {schedule.course.campus.name} | {schedule.course.description}
          </p>
        </div>
        <div className="flex space-x-2">
          {canSubmit && (
            <Form method="post">
              <button
                type="submit"
                name="intent"
                value="submit"
                className="btn btn-primary"
              >
                提交审核
              </button>
            </Form>
          )}
          {canApprove && (
            <>
              <Form method="post">
                <button
                  type="submit"
                  name="intent"
                  value="approve"
                  className="btn btn-success"
                >
                  审核通过
                </button>
              </Form>
              <Form method="post">
                <input type="hidden" name="note" value="资源配置需要调整" />
                <button
                  type="submit"
                  name="intent"
                  value="reject"
                  className="btn btn-danger"
                >
                  驳回
                </button>
              </Form>
            </>
          )}
          {canTeacherConfirm && (
            <>
              <Form method="post">
                <input type="hidden" name="teacherId" value={schedule.teacherId} />
                <button
                  type="submit"
                  name="intent"
                  value="teacher-confirm"
                  className="btn btn-success"
                >
                  确认授课
                </button>
              </Form>
              <Form method="post">
                <input type="hidden" name="teacherId" value={schedule.teacherId} />
                <input type="hidden" name="note" value="时间安排冲突" />
                <button
                  type="submit"
                  name="intent"
                  value="teacher-reject"
                  className="btn btn-danger"
                >
                  拒绝授课
                </button>
              </Form>
            </>
          )}
          {canStartClass && (
            <Form method="post">
              <button
                type="submit"
                name="intent"
                value="start-class"
                className="btn btn-primary"
              >
                开始上课
              </button>
            </Form>
          )}
          {canComplete && (
            <Form method="post" className="flex space-x-2">
              <input
                type="number"
                name="actualHours"
                step="0.5"
                min="0.5"
                defaultValue={schedule.actualHours || (schedule.course.duration / 60)}
                className="form-input w-24"
                placeholder="课时"
                required
              />
              <button
                type="submit"
                name="intent"
                value="complete"
                className="btn btn-success"
              >
                完成课程
              </button>
            </Form>
          )}
        </div>
      </div>

      {actionData?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{actionData.error}</p>
        </div>
      )}

      {schedule.conflictType !== "NONE" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="badge badge-conflict mr-2">
              {getConflictTypeText(schedule.conflictType)}
            </span>
            <span className="text-sm text-red-700">{schedule.conflictNote}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              基本信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">课程名称</p>
                <p className="font-medium">{schedule.course.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">所属校区</p>
                <p className="font-medium">{schedule.course.campus.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">授课教师</p>
                <p className="font-medium">{schedule.teacher.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">上课教室</p>
                <p className="font-medium">
                  {schedule.classroom.name} ({schedule.classroom.capacity}人)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">上课时间</p>
                <p className="font-medium">
                  {formatDateTimeRange(schedule.startTime, schedule.endTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">计划课时</p>
                <p className="font-medium">{schedule.course.duration / 60} 小时</p>
              </div>
              {schedule.actualHours && (
                <div>
                  <p className="text-sm text-gray-500">实际课时</p>
                  <p className="font-medium text-green-600">
                    {schedule.actualHours} 小时
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">课程定价</p>
                <p className="font-medium">
                  {formatCurrency(schedule.course.price)}/课时
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              学生名单 ({enrolledStudents.length}/{schedule.course.maxStudents}人)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      姓名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      联系电话
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      出勤状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      签到时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enrolledStudents.map((student) => {
                    const attendance = schedule.attendances.find(
                      (a) => a.studentId === student.id
                    );
                    return (
                      <tr key={student.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {student.phone}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {attendance ? (
                            <span
                              className={`badge ${
                                attendance.status === "PRESENT"
                                  ? "badge-completed"
                                  : attendance.status === "LEAVE"
                                  ? "badge-leave"
                                  : "badge-conflict"
                              }`}
                            >
                              {getAttendanceStatusText(attendance.status)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">未记录</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {attendance?.checkInTime
                            ? formatTime(attendance.checkInTime)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {(schedule.status === "IN_PROGRESS" || schedule.status === "COMPLETED") &&
                            attendance?.status !== "LEAVE" && (
                              <Form method="post" className="inline">
                                <input
                                  type="hidden"
                                  name="studentId"
                                  value={student.id}
                                />
                                <input
                                  type="hidden"
                                  name="reason"
                                  value="身体不适"
                                />
                                <button
                                  type="submit"
                                  name="intent"
                                  value="mark-leave"
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  标记请假
                                </button>
                              </Form>
                            )}
                          {attendance?.status === "LEAVE" && attendance.leaveReason && (
                            <p className="text-xs text-orange-600 mt-1">
                              {attendance.leaveReason}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {schedule.settlement && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                课时结算
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">结算状态</p>
                  <p className="font-medium">
                    <span
                      className={`badge ${
                        schedule.settlement.status === "PAID"
                          ? "badge-settled"
                          : schedule.settlement.status === "APPROVED"
                          ? "badge-approved"
                          : "badge-submitted"
                      }`}
                    >
                      {getSettlementStatusText(schedule.settlement.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">授课教师</p>
                  <p className="font-medium">{schedule.teacher.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">实际课时</p>
                  <p className="font-medium">{schedule.settlement.totalHours} 小时</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">课时费率</p>
                  <p className="font-medium">
                    {formatCurrency(schedule.settlement.hourlyRate)}/小时
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">应发金额</p>
                  <p className="font-medium text-lg text-green-600">
                    {formatCurrency(schedule.settlement.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">实发金额</p>
                  <p className="font-medium text-lg text-blue-600">
                    {formatCurrency(schedule.settlement.netAmount)}
                  </p>
                </div>
              </div>

              {schedule.settlement.reviewer && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    复核人：{schedule.settlement.reviewer.name}（
                    {getRoleText(schedule.settlement.reviewer.role)}）
                  </p>
                  {schedule.settlement.reviewedAt && (
                    <p className="text-sm text-gray-500">
                      复核时间：{formatDateTime(schedule.settlement.reviewedAt)}
                    </p>
                  )}
                  {schedule.settlement.paidAt && (
                    <p className="text-sm text-gray-500">
                      支付时间：{formatDateTime(schedule.settlement.paidAt)}
                    </p>
                  )}
                </div>
              )}

              {canReviewSettlement && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Form method="post" className="flex space-x-2">
                    <input
                      type="hidden"
                      name="settlementId"
                      value={schedule.settlement.id}
                    />
                    <input
                      type="hidden"
                      name="status"
                      value="APPROVED"
                    />
                    <input
                      type="hidden"
                      name="note"
                      value="财务复核通过，课时确认无误"
                    />
                    <button
                      type="submit"
                      name="intent"
                      value="review-settlement"
                      className="btn btn-primary"
                    >
                      复核通过
                    </button>
                  </Form>
                </div>
              )}

              {canPaySettlement && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Form method="post" className="flex space-x-2">
                    <input
                      type="hidden"
                      name="settlementId"
                      value={schedule.settlement.id}
                    />
                    <input
                      type="hidden"
                      name="status"
                      value="PAID"
                    />
                    <input
                      type="hidden"
                      name="note"
                      value="财务已支付，结算完成"
                    />
                    <button
                      type="submit"
                      name="intent"
                      value="review-settlement"
                      className="btn btn-success"
                    >
                      确认支付
                    </button>
                  </Form>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              审批流程
            </h2>
            <div className="timeline">
              {[
                {
                  step: "教务创建排课",
                  status: "DRAFT" as ScheduleStatus,
                  icon: "📝",
                },
                {
                  step: "提交审核",
                  status: "SUBMITTED" as ScheduleStatus,
                  icon: "📤",
                },
                {
                  step: "校区主管审核",
                  status: "APPROVED" as ScheduleStatus,
                  icon: "✅",
                },
                {
                  step: "教师确认授课",
                  status: "TEACHER_CONFIRMED" as ScheduleStatus,
                  icon: "👨‍🏫",
                },
                {
                  step: "课程进行中",
                  status: "IN_PROGRESS" as ScheduleStatus,
                  icon: "⏰",
                },
                {
                  step: "课程完成",
                  status: "COMPLETED" as ScheduleStatus,
                  icon: "🎓",
                },
                {
                  step: "财务结算",
                  status: "SETTLED" as ScheduleStatus,
                  icon: "💰",
                },
              ].map((step, index) => {
                const node = schedule.historyNodes.find(
                  (n) => n.status === step.status
                );
                const isCompleted = node !== undefined;
                const isCurrent =
                  !isCompleted &&
                  index > 0 &&
                  schedule.historyNodes.some(
                    (n) =>
                      n.status ===
                      [
                        "DRAFT",
                        "SUBMITTED",
                        "APPROVED",
                        "TEACHER_CONFIRMED",
                        "IN_PROGRESS",
                        "COMPLETED",
                        "SETTLED",
                      ][index - 1]
                  );

                return (
                  <div key={step.status} className="timeline-item">
                    <div
                      className={`timeline-dot ${
                        isCompleted
                          ? "bg-green-500"
                          : isCurrent
                          ? "bg-primary-500 animate-pulse"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{step.icon}</span>
                      <span
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "text-green-700"
                            : isCurrent
                            ? "text-primary-700"
                            : "text-gray-400"
                        }`}
                      >
                        {step.step}
                      </span>
                    </div>
                    {node && (
                      <>
                        <p className="timeline-date">
                          {formatDateTime(node.createdAt)}
                        </p>
                        <p className="timeline-content">{node.note}</p>
                        {node.operator && (
                          <p className="text-xs text-gray-500 mt-1">
                            操作人：{node.operator.name}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              历史记录
            </h2>
            <div className="space-y-3">
              {schedule.historyNodes
                .slice()
                .reverse()
                .map((node) => (
                  <div
                    key={node.id}
                    className="pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`badge ${getStatusBadgeClass(node.status)}`}
                      >
                        {getStatusText(node.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(node.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{node.note}</p>
                    {node.operator && (
                      <p className="text-xs text-gray-500 mt-1">
                        {node.operator.name} · {getRoleText(node.operator.role)}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
