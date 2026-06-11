import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import { formatDateTimeRange, getStatusBadgeClass, getStatusText, getConflictTypeText } from "~/utils/format";
import { ScheduleStatus, ConflictType } from "~/types/enums";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const conflict = url.searchParams.get("conflict");

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (conflict) {
    where.conflictType = conflict;
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      course: true,
      teacher: true,
      classroom: true,
      settlement: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const statusFilters = Object.values(ScheduleStatus);
  const conflictFilters = Object.values(ConflictType);

  return json({ schedules, statusFilters, conflictFilters, currentStatus: status, currentConflict: conflict });
};

export default function SchedulesIndex() {
  const { schedules, statusFilters, conflictFilters, currentStatus, currentConflict } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">排课管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理所有课程排课，查看冲突和审批状态
          </p>
        </div>
        <Link to="/schedules/new" className="btn btn-primary">
          + 新建排课
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-600 mr-2 self-center">状态筛选：</span>
          <button
            className={`btn btn-sm ${!currentStatus ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("status");
              setSearchParams(params);
            }}
          >
            全部
          </button>
          {statusFilters.map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${currentStatus === status ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("status", status);
                setSearchParams(params);
              }}
            >
              {getStatusText(status)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-600 mr-2 self-center">冲突类型：</span>
          <button
            className={`btn btn-sm ${!currentConflict ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("conflict");
              setSearchParams(params);
            }}
          >
            全部
          </button>
          {conflictFilters.map((type) => (
            <button
              key={type}
              className={`btn btn-sm ${currentConflict === type ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("conflict", type);
                setSearchParams(params);
              }}
            >
              {getConflictTypeText(type)}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  课程名称
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  授课教师
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  教室
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  时间
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  状态
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  冲突
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  实际课时
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  className={schedule.conflictType !== "NONE" ? "bg-red-50" : ""}
                >
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {schedule.course.name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {schedule.course.description}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {schedule.teacher.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {schedule.classroom.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDateTimeRange(schedule.startTime, schedule.endTime)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <span className={`badge ${getStatusBadgeClass(schedule.status)}`}>
                      {getStatusText(schedule.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    {schedule.conflictType !== "NONE" ? (
                      <div>
                        <span className="badge badge-conflict">
                          {getConflictTypeText(schedule.conflictType)}
                        </span>
                        {schedule.conflictNote && (
                          <p className="mt-1 text-xs text-red-600">
                            {schedule.conflictNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-draft">无冲突</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {schedule.actualHours ? `${schedule.actualHours}h` : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <Link
                      to={`/schedules/${schedule.id}`}
                      className="text-primary-600 hover:text-primary-900 font-medium"
                    >
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
