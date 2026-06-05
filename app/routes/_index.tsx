import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/db";
import { registrations, participants, projects, groups, history } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDateTime, getStatusColor, getStatusLabel } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "体育场馆赛事报名与资格检录系统" },
    { name: "description", content: "体育赛事报名、资格审核、检录管理系统" },
  ];
};

export const loader: LoaderFunction = async () => {
  const allRegistrations = await db
    .select({
      id: registrations.id,
      registrationStatus: registrations.registrationStatus,
      checkInStatus: registrations.checkInStatus,
      registeredAt: registrations.registeredAt,
      participantName: participants.name,
      projectName: projects.name,
      groupName: groups.name,
    })
    .from(registrations)
    .innerJoin(participants, eq(registrations.participantId, participants.id))
    .innerJoin(projects, eq(registrations.projectId, projects.id))
    .innerJoin(groups, eq(registrations.groupId, groups.id))
    .orderBy(desc(registrations.registeredAt))
    .limit(20);

  const stats = {
    total: allRegistrations.length,
    qualified: allRegistrations.filter((r) => r.registrationStatus === "qualified").length,
    disqualified: allRegistrations.filter((r) => r.registrationStatus === "disqualified").length,
    checkedIn: allRegistrations.filter((r) => r.checkInStatus === "checked_in" || r.checkInStatus === "late").length,
  };

  return { registrations: allRegistrations, stats };
};

export default function Index() {
  const { registrations: regs, stats } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">体育场馆赛事报名与资格检录系统</h1>
          <p className="mt-2 text-indigo-100">参赛者报名 · 资格审核 · 检录管理 · 成绩归档</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600">总报名人数</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">{stats.qualified}</div>
            <div className="text-gray-600">资格通过</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-red-600">{stats.disqualified}</div>
            <div className="text-gray-600">资格取消</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.checkedIn}</div>
            <div className="text-gray-600">已检录</div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Link
            to="/review"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            资格审核工作台
          </Link>
          <Link
            to="/checkin"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            检录工作台
          </Link>
          <Link
            to="/analytics"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            数据复盘
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">报名列表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    参赛者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    项目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    组别
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    资格状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    检录状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    报名时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {regs.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {reg.participantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {reg.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {reg.groupName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.registrationStatus)}`}>
                        {getStatusLabel(reg.registrationStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.checkInStatus)}`}>
                        {getStatusLabel(reg.checkInStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                      {formatDateTime(reg.registeredAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/registration/${reg.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
