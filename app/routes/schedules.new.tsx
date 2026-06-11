import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, Link } from "@remix-run/react";
import { useState } from "react";
import { prisma } from "~/utils/prisma.server";
import { createScheduleWithConflictCheck, findAvailableTimeSlots, checkScheduleConflicts, type AvailableSlot, type ConflictCheckResult } from "~/utils/scheduling.server";
import { formatTime } from "~/utils/format";
import { z } from "zod";

type ActionData =
  | { error: string; errors?: never; conflict?: never; availableSlots?: never; formData?: never; scheduleId?: never }
  | { errors: Record<string, string[]>; error?: never; conflict?: never; availableSlots?: never; formData?: never; scheduleId?: never }
  | {
      conflict: ConflictCheckResult | null;
      availableSlots: AvailableSlot[];
      formData: {
        courseId: string;
        teacherId: string;
        classroomId: string;
        startDate: string;
        startTime: string;
        endTime: string;
      };
      scheduleId?: string;
      error?: never;
      errors?: never;
    };

export const loader = async () => {
  const [courses, teachers, classrooms] = await Promise.all([
    prisma.course.findMany({ include: { campus: true } }),
    prisma.user.findMany({ where: { role: "TEACHER" } }),
    prisma.classroom.findMany({ include: { campus: true } }),
  ]);

  return json({ courses, teachers, classrooms });
};

const CreateScheduleSchema = z.object({
  courseId: z.string().min(1, "请选择课程"),
  teacherId: z.string().min(1, "请选择教师"),
  classroomId: z.string().min(1, "请选择教室"),
  startDate: z.string().min(1, "请选择日期"),
  startTime: z.string().min(1, "请选择开始时间"),
  endTime: z.string().min(1, "请选择结束时间"),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "check-conflict") {
    const courseId = formData.get("courseId") as string;
    const teacherId = formData.get("teacherId") as string;
    const classroomId = formData.get("classroomId") as string;
    const startDate = formData.get("startDate") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (!courseId || !teacherId || !classroomId || !startDate || !startTime || !endTime) {
      return json({ error: "请填写完整信息" }, { status: 400 });
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      return json({ error: "结束时间必须晚于开始时间" }, { status: 400 });
    }

    const conflict = await checkScheduleConflicts(teacherId, classroomId, startDateTime, endDateTime);

    let availableSlots: AvailableSlot[] = [];
    if (conflict.hasConflict) {
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);
      availableSlots = await findAvailableTimeSlots(
        teacherId,
        classroomId,
        startDateTime,
        durationMinutes
      );
    }

    return json({
      conflict: conflict.hasConflict ? conflict : null,
      availableSlots,
      formData: { courseId, teacherId, classroomId, startDate, startTime, endTime },
    });
  }

  if (intent === "create") {
    const result = CreateScheduleSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { courseId, teacherId, classroomId, startDate, startTime, endTime } = result.data;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    try {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return json({ error: "课程不存在" }, { status: 400 });
      }

      const { schedule, conflict } = await createScheduleWithConflictCheck({
        courseId,
        teacherId,
        classroomId,
        campusId: course.campusId,
        startTime: startDateTime,
        endTime: endDateTime,
        operatorId: "user-admin",
      });

      if (conflict.hasConflict) {
        const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);
        const availableSlots = await findAvailableTimeSlots(
          teacherId,
          classroomId,
          startDateTime,
          durationMinutes
        );
        return json({
          conflict,
          availableSlots,
          scheduleId: schedule.id,
          formData: { courseId, teacherId, classroomId, startDate, startTime, endTime },
        });
      }

      return redirect(`/schedules/${schedule.id}`);
    } catch (error) {
      return json({ error: (error as Error).message }, { status: 500 });
    }
  }

  return json({ error: "无效操作" }, { status: 400 });
};

export default function NewSchedule() {
  const { courses, teachers, classrooms } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);
  const filteredClassrooms = selectedCourseData
    ? classrooms.filter((cr) => cr.campusId === selectedCourseData.campusId)
    : classrooms;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新建排课</h1>
        <p className="mt-1 text-sm text-gray-500">
          创建新的课程排课，系统将自动检测教师和教室冲突
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <Form method="post" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">课程</label>
                  <select
                    name="courseId"
                    className="form-input"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    required
                  >
                    <option value="">请选择课程</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} - {course.campus.name}
                      </option>
                    ))}
                  </select>
                  {selectedCourseData && (
                    <p className="mt-1 text-xs text-gray-500">
                      时长：{selectedCourseData.duration}分钟 | 最大人数：{selectedCourseData.maxStudents}人
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">授课教师</label>
                  <select
                    name="teacherId"
                    className="form-input"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    required
                  >
                    <option value="">请选择教师</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">教室</label>
                  <select
                    name="classroomId"
                    className="form-input"
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    required
                  >
                    <option value="">请选择教室</option>
                    {filteredClassrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name} ({classroom.capacity}人) - {classroom.campus.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-input"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">开始时间</label>
                  <input
                    type="time"
                    name="startTime"
                    className="form-input"
                    defaultValue="09:00"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">结束时间</label>
                  <input
                    type="time"
                    name="endTime"
                    className="form-input"
                    defaultValue="10:30"
                    required
                  />
                </div>
              </div>

              {actionData && "error" in actionData && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{actionData.error}</p>
                </div>
              )}

              {actionData && "conflict" in actionData && actionData.conflict && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {actionData.conflict.type === "TEACHER_CONFLICT" ? "教师冲突" : "教室冲突"}
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{actionData.conflict.note}</p>
                        {"scheduleId" in actionData && actionData.scheduleId && (
                          <p className="mt-2">
                            <span className="font-medium">排课已保存为草稿，</span>
                            请调整时间后重新提交。
                            <Link
                              to={`/schedules/${actionData.scheduleId}`}
                              className="text-primary-600 hover:text-primary-800 font-medium ml-1"
                            >
                              查看详情 →
                            </Link>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {actionData && "availableSlots" in actionData && actionData.availableSlots.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-3">
                    推荐可选时段（当天）
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {actionData.availableSlots.slice(0, 6).map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        className="p-2 text-xs bg-white border border-blue-300 rounded hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          const dateInput = document.querySelector('input[name="startDate"]') as HTMLInputElement;
                          const startInput = document.querySelector('input[name="startTime"]') as HTMLInputElement;
                          const endInput = document.querySelector('input[name="endTime"]') as HTMLInputElement;
                          if (dateInput && startInput && endInput) {
                            const start = new Date(slot.startTime);
                            const end = new Date(slot.endTime);
                            startInput.value = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
                            endInput.value = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
                          }
                        }}
                      >
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-blue-600">
                    点击时段可自动填充到表单中
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  name="intent"
                  value="check-conflict"
                  className="btn btn-secondary"
                >
                  检测冲突
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="create"
                  className="btn btn-primary"
                >
                  创建排课
                </button>
              </div>
            </Form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              排课流程
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <span className="ml-3 text-sm text-gray-700">创建排课并检测冲突</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">
                  2
                </div>
                <span className="ml-3 text-sm text-gray-500">校区主管审核资源</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">
                  3
                </div>
                <span className="ml-3 text-sm text-gray-500">教师确认授课</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">
                  4
                </div>
                <span className="ml-3 text-sm text-gray-500">课程完成</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">
                  5
                </div>
                <span className="ml-3 text-sm text-gray-500">财务结算</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              冲突检测说明
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>系统会自动检测以下冲突：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="font-medium text-red-600">教师冲突</span>：同一教师在同时段有其他课程安排
                </li>
                <li>
                  <span className="font-medium text-orange-600">教室冲突</span>：同一教室在同时段被其他课程占用
                </li>
              </ul>
              <p className="mt-3">检测到冲突时，系统会：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>高亮显示冲突原因</li>
                <li>提供可选时段推荐</li>
                <li>阻止提交审核，直到冲突解决</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
