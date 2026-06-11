import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  getCampusStatistics,
  getCourseStatistics,
  getConflictStatistics,
  getFillRateData,
  getOverallStatistics,
} from "~/utils/statistics.server";
import {
  formatCurrency,
  formatPercent,
  getConflictTypeText,
} from "~/utils/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const loader = async () => {
  const [overall, campusStats, courseStats, conflictStats, fillRateData] =
    await Promise.all([
      getOverallStatistics(),
      getCampusStatistics(),
      getCourseStatistics(),
      getConflictStatistics(),
      getFillRateData(),
    ]);

  return json({ overall, campusStats, courseStats, conflictStats, fillRateData });
};

const COLORS = ["#10B981", "#EF4444", "#F59E0B"];

export default function Statistics() {
  const { overall, campusStats, courseStats, conflictStats, fillRateData } =
    useLoaderData<typeof loader>();

  const pieData = conflictStats.map((item) => ({
    name: getConflictTypeText(item.type),
    value: item.count,
    percentage: item.percentage,
  }));

  const campusBarData = campusStats.map((item) => ({
    name: item.campusName,
    排课数: item.totalSchedules,
    已完成: item.completedSchedules,
    总课时: item.totalHours,
  }));

  const fillRateBarData = fillRateData.map((item) => ({
    name: item.courseName,
    满班率: item.fillRate,
    招生人数: item.actualStudents,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
        <p className="mt-1 text-sm text-gray-500">
          多维度数据分析，帮助优化排课资源配置
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card">
          <p className="text-sm font-medium text-gray-500">总排课数</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {overall.totalSchedules}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">已完成</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {overall.completedSchedules}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">完成率</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {formatPercent(overall.completionRate)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">待审核</p>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {overall.pendingApprovals}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">冲突总数</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {overall.totalConflicts}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            校区统计
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campusBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="排课数" fill="#3B82F6" />
                <Bar dataKey="已完成" fill="#10B981" />
                <Bar dataKey="总课时" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    校区
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    排课数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    已完成
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    总课时
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
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
            冲突原因分布
          </h2>
          <div className="flex items-center justify-center h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) =>
                    `${name}: ${percentage}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}节 (${
                      conflictStats.find((c) => getConflictTypeText(c.type) === name)
                        ?.percentage
                    }%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {conflictStats.map((item, index) => (
              <div
                key={item.type}
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: `${COLORS[index]}15` }}
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: COLORS[index] }}
                ></div>
                <p className="text-sm font-medium text-gray-900">
                  {getConflictTypeText(item.type)}
                </p>
                <p className="text-2xl font-bold" style={{ color: COLORS[index] }}>
                  {item.count}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPercent(item.percentage)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            课程统计
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    课程名称
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    排课数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    已完成
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    平均满班率
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    总课时
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courseStats.map((course) => (
                  <tr key={course.courseId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {course.courseName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {course.totalSchedules}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {course.completedSchedules}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min(course.avgFillRate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatPercent(course.avgFillRate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {course.totalHours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            满班率分析
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fillRateBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "满班率" ? `${value}%` : `${value}人`,
                    name,
                  ]}
                />
                <Legend />
                <Bar dataKey="满班率" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {fillRateData.map((item) => (
              <div
                key={item.courseName}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.courseName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.actualStudents}/{item.maxStudents}人
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-3">
                    <div
                      className={`h-2.5 rounded-full ${
                        item.fillRate >= 90
                          ? "bg-green-500"
                          : item.fillRate >= 70
                          ? "bg-blue-500"
                          : item.fillRate >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(item.fillRate, 100)}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      item.fillRate >= 90
                        ? "text-green-600"
                        : item.fillRate >= 70
                        ? "text-blue-600"
                        : item.fillRate >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercent(item.fillRate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          数据洞察
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <p className="text-sm font-medium text-blue-900">系统利用率</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatPercent(overall.completionRate)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-blue-700">
              整体排课完成率良好，课程执行效率高
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">👨‍🎓</span>
              <div>
                <p className="text-sm font-medium text-green-900">平均满班率</p>
                <p className="text-lg font-bold text-green-600">
                  {formatPercent(
                    fillRateData.reduce((sum, item) => sum + item.fillRate, 0) /
                      fillRateData.length
                  )}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-green-700">
              课程招生情况良好，资源利用充分
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="text-sm font-medium text-orange-900">冲突率</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatPercent(
                    (overall.totalConflicts / overall.totalSchedules) * 100
                  )}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-orange-700">
              建议优化排课时间，减少资源冲突
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
