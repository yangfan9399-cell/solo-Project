import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { registrations, projects, groups, participants, history } from "~/db/schema";
import { eq, count, sql, desc, inArray } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "数据复盘" }];
};

export const loader: LoaderFunction = async () => {
  const totalStats = await db
    .select({
      total: count(),
      qualified: sql<number>`sum(case when ${registrations.registrationStatus} = 'qualified' then 1 else 0 end)`,
      disqualified: sql<number>`sum(case when ${registrations.registrationStatus} = 'disqualified' then 1 else 0 end)`,
      checkedIn: sql<number>`sum(case when ${registrations.checkInStatus} in ('checked_in', 'late') then 1 else 0 end)`,
      wrongGroup: sql<number>`sum(case when ${registrations.checkInStatus} = 'wrong_group' then 1 else 0 end)`,
      late: sql<number>`sum(case when ${registrations.checkInStatus} = 'late' then 1 else 0 end)`,
    })
    .from(registrations);

  const byProject = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      total: count(registrations.id),
      qualified: sql<number>`sum(case when ${registrations.registrationStatus} = 'qualified' then 1 else 0 end)`,
      disqualified: sql<number>`sum(case when ${registrations.registrationStatus} = 'disqualified' then 1 else 0 end)`,
      checkedIn: sql<number>`sum(case when ${registrations.checkInStatus} in ('checked_in', 'late') then 1 else 0 end)`,
    })
    .from(registrations)
    .rightJoin(projects, eq(registrations.projectId, projects.id))
    .groupBy(projects.id, projects.name)
    .orderBy(projects.id);

  const byGroup = await db
    .select({
      groupId: groups.id,
      groupName: groups.name,
      projectName: projects.name,
      total: count(registrations.id),
      qualified: sql<number>`sum(case when ${registrations.registrationStatus} = 'qualified' then 1 else 0 end)`,
      checkedIn: sql<number>`sum(case when ${registrations.checkInStatus} in ('checked_in', 'late') then 1 else 0 end)`,
    })
    .from(registrations)
    .rightJoin(groups, eq(registrations.groupId, groups.id))
    .innerJoin(projects, eq(groups.projectId, projects.id))
    .groupBy(groups.id, groups.name, projects.name)
    .orderBy(projects.name, groups.id);

  const anomalyReasons = await db
    .select({
      action: history.action,
      count: count(history.id),
    })
    .from(history)
    .where(
      inArray(history.action, [
        "document_expired",
        "wrong_group_detected",
        "referee_rejected",
        "checkin_rejected",
        "withdrawn",
      ])
    )
    .groupBy(history.action)
    .orderBy(desc(count(history.id)));

  return {
    totalStats: totalStats[0],
    byProject,
    byGroup,
    anomalyReasons,
  };
};

export default function AnalyticsPage() {
  const { totalStats, byProject, byGroup, anomalyReasons } = useLoaderData<typeof loader>();
  const attendanceRate = totalStats.total
    ? Math.round((totalStats.checkedIn / totalStats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">数据复盘</h1>
              <p className="mt-1 text-purple-100">按项目、组别、异常原因聚合分析</p>
            </div>
            <Link to="/" className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">总报名人数</div>
            <div className="text-4xl font-bold text-gray-900">{totalStats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">资格通过</div>
            <div className="text-4xl font-bold text-green-600">{totalStats.qualified}</div>
            <div className="text-sm text-gray-500 mt-1">
              通过率: {totalStats.total ? Math.round((totalStats.qualified / totalStats.total) * 100) : 0}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">到场人数</div>
            <div className="text-4xl font-bold text-blue-600">{totalStats.checkedIn}</div>
            <div className="text-sm text-gray-500 mt-1">
              到场率: {attendanceRate}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">异常情况</div>
            <div className="text-4xl font-bold text-red-600">
              {totalStats.disqualified + totalStats.wrongGroup}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              组别错误: {totalStats.wrongGroup}, 迟到: {totalStats.late}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">按项目聚合</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    项目名称
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    报名数
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    资格通过
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    资格取消
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    已检录
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    到场率
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {byProject.map((project: any) => (
                  <tr key={project.projectId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {project.projectName}
                    </td>
                    <td className="px-6 py-4 text-center">{project.total}</td>
                    <td className="px-6 py-4 text-center text-green-600">{project.qualified}</td>
                    <td className="px-6 py-4 text-center text-red-600">{project.disqualified}</td>
                    <td className="px-6 py-4 text-center text-blue-600">{project.checkedIn}</td>
                    <td className="px-6 py-4 text-center">
                      {project.total
                        ? Math.round((Number(project.checkedIn) / Number(project.total)) * 100)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">按组别聚合</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    项目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    组别
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    报名数
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    资格通过
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    已检录
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    到场率
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {byGroup.map((group: any) => (
                  <tr key={group.groupId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {group.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{group.groupName}</td>
                    <td className="px-6 py-4 text-center">{group.total}</td>
                    <td className="px-6 py-4 text-center text-green-600">{group.qualified}</td>
                    <td className="px-6 py-4 text-center text-blue-600">{group.checkedIn}</td>
                    <td className="px-6 py-4 text-center">
                      {group.total
                        ? Math.round((Number(group.checkedIn) / Number(group.total)) * 100)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">异常原因分布</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anomalyReasons.map((anomaly: any) => (
                <div
                  key={anomaly.action}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      {getAnomalyLabel(anomaly.action)}
                    </span>
                    <span className="text-2xl font-bold text-red-600">{anomaly.count}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (Number(anomaly.count) / totalStats.total) * 100 * 2)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {anomalyReasons.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  暂无异常记录
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">到场率趋势</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">总体到场率</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                    style={{ width: `${attendanceRate}%` }}
                  >
                    {attendanceRate}%
                  </div>
                </div>
              </div>
              {byProject.map((project: any) => {
                const rate = project.total
                  ? Math.round((Number(project.checkedIn) / Number(project.total)) * 100)
                  : 0;
                return (
                  <div key={project.projectId} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600 truncate">{project.projectName}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                        style={{ width: `${rate}%` }}
                      >
                        {rate}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getAnomalyLabel(action: string) {
  const labels: Record<string, string> = {
    document_expired: "证件过期",
    wrong_group_detected: "组别错误",
    referee_rejected: "裁判驳回",
    checkin_rejected: "检录拒绝",
    withdrawn: "撤回报名",
  };
  return labels[action] || action;
}
