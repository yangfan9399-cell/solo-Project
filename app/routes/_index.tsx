import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getOverallStatistics, getCampusStatistics } from "~/utils/statistics.server";
import { formatCurrency, formatPercent } from "~/utils/format";

export const loader = async () => {
  const [overall, campusStats] = await Promise.all([
    getOverallStatistics(),
    getCampusStatistics(),
  ]);
  return json({ overall, campusStats });
};

export default function Index() {
  const { overall, campusStats } = useLoaderData<typeof loader>();

  const stats = [
    {
      label: "总排课数",
      value: overall.totalSchedules,
      color: "bg-blue-500",
    },
    {
      label: "已完成",
      value: overall.completedSchedules,
      color: "bg-green-500",
    },
    {
      label: "待审核",
      value: overall.pendingApprovals,
      color: "bg-yellow-500",
    },
    {
      label: "待结算",
      value: overall.pendingSettlements,
      color: "bg-purple-500",
    },
    {
      label: "冲突排课",
      value: overall.totalConflicts,
      color: "bg-red-500",
    },
    {
      label: "完成率",
      value: formatPercent(overall.completionRate),
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          课程排课冲突处理与课时结算系统
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          一站式管理课程排课、冲突检测、审批流程与课时结算
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            校区统计
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    校区
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排课数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    已完成
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总课时
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    营收
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campusStats.map((campus) => (
                  <tr key={campus.campusId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campus.campusName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {campus.totalSchedules}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {campus.completedSchedules}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {campus.totalHours}h
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(campus.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            业务流程说明
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">教务提交排课</p>
                <p className="text-xs text-gray-500">
                  创建排课，系统自动检测教师和教室冲突
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 font-semibold text-sm">2</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">校区主管审核</p>
                <p className="text-xs text-gray-500">
                  审核资源配置，确认或驳回排课申请
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-sm">3</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">教师确认授课</p>
                <p className="text-xs text-gray-500">
                  教师确认授课时间，开始上课
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">4</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">财务复核结算</p>
                <p className="text-xs text-gray-500">
                  核对实际课时，完成费用结算支付
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          预置样本数据说明
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span className="font-medium text-green-800">正常结算</span>
            </div>
            <p className="mt-2 text-sm text-green-700">
              完整流程：排课→审核→确认→完成→结算
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span className="font-medium text-red-800">教师冲突</span>
            </div>
            <p className="mt-2 text-sm text-red-700">
              教师在同时段已有安排，系统提示可选时段
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              <span className="font-medium text-orange-800">教室冲突</span>
            </div>
            <p className="mt-2 text-sm text-orange-700">
              教室在同时段已被占用，系统提示冲突原因
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span className="font-medium text-blue-800">学生请假</span>
            </div>
            <p className="mt-2 text-sm text-blue-700">
              记录学生请假情况，考勤与结算联动
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
