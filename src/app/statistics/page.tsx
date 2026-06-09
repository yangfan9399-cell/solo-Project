import { getStatistics } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { AnomalyType } from "../../types/enums";
import { anomalyTypeLabels } from "../../types/enums";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const stats = await getStatistics();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">复盘统计</h1>
        <p className="text-gray-600">
          按科室、病种、异常类型和住院天数多维度分析
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500">总住院病例</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalHospitalizations}
          </div>
          <div className="text-xs text-gray-400 mt-1">例</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500">在院治疗</div>
          <div className="text-3xl font-bold text-primary-600 mt-2">
            {stats.inTreatment}
          </div>
          <div className="text-xs text-gray-400 mt-1">例</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500">已出院</div>
          <div className="text-3xl font-bold text-success-600 mt-2">
            {stats.discharged}
          </div>
          <div className="text-xs text-gray-400 mt-1">例</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm text-gray-500">累计营收</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-xs text-gray-400 mt-1">已结算</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">按科室统计</h2>
          <div className="space-y-4">
            {stats.byDepartment.map((dept, index) => {
              const maxRevenue = Math.max(...stats.byDepartment.map((d) => d.revenue), 1);
              const percentage = (dept.revenue / maxRevenue) * 100;
              return (
                <div key={dept.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{dept.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {dept.count} 例
                      </div>
                      <div className="text-xs text-primary-600">
                        {formatCurrency(dept.revenue)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">按病种统计</h2>
          <div className="space-y-3">
            {stats.byDisease.map((disease, index) => {
              const maxCount = Math.max(...stats.byDisease.map((d) => d.count), 1);
              const percentage = (disease.count / maxCount) * 100;
              return (
                <div key={disease.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{disease.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {disease.count} 例
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">按异常类型统计</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.byAnomalyType.map((item) => {
              const type = item.name as AnomalyType;
              const label = anomalyTypeLabels[type] || item.name;
              const colorMap: Record<string, string> = {
                [AnomalyType.NONE]: "bg-success-100 text-success-700",
                [AnomalyType.MEDICATION_MISSED]: "bg-warning-100 text-warning-700",
                [AnomalyType.NURSING_ABNORMAL]: "bg-danger-100 text-danger-700",
                [AnomalyType.FEE_DISPUTE]: "bg-amber-100 text-amber-700",
              };
              const bgMap: Record<string, string> = {
                [AnomalyType.NONE]: "bg-success-500",
                [AnomalyType.MEDICATION_MISSED]: "bg-warning-500",
                [AnomalyType.NURSING_ABNORMAL]: "bg-danger-500",
                [AnomalyType.FEE_DISPUTE]: "bg-amber-500",
              };
              return (
                <div
                  key={item.name}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div
                    className={`text-xs px-2 py-1 rounded-full inline-block ${
                      colorMap[type] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {label}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {item.count}
                  </div>
                  <div className="text-xs text-gray-500">例</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">异常率: </span>
              <span className="text-danger-600 font-bold">
                {(
                  ((stats.totalHospitalizations -
                    (stats.byAnomalyType.find((a) => a.name === AnomalyType.NONE)
                      ?.count || 0)) /
                    stats.totalHospitalizations) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              含用药漏记、护理异常、费用异议
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            住院天数分布
          </h2>
          <div className="space-y-4">
            {stats.byStayDays.map((item, index) => {
              const maxCount = Math.max(
                ...stats.byStayDays.map((d) => d.count),
                1
              );
              const percentage = (item.count / maxCount) * 100;
              const colors = [
                "bg-success-500",
                "bg-primary-500",
                "bg-amber-500",
                "bg-warning-500",
                "bg-danger-500",
              ];
              return (
                <div key={item.range}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700 font-medium">
                      {item.range}
                    </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {item.count} 例
                    </span>
                  </div>
                  <div className="w-full h-6 bg-gray-100 rounded-md overflow-hidden">
                    <div
                      className={`h-full ${colors[index % colors.length]} rounded-md flex items-center justify-end pr-2 transition-all`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                      {percentage > 20 && (
                        <span className="text-xs text-white font-medium">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">平均住院天数</span>
              <span className="text-xl font-bold text-primary-600">
                {stats.averageStayDays.toFixed(1)} 天
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">复盘摘要</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-blue-900 mb-1">科室分布</div>
            <p className="text-xs text-blue-700">
              内科病例最多，共{" "}
              {stats.byDepartment.find((d) => d.name === "内科")?.count || 0} 例，
              占总病例数的{" "}
              {(
                ((stats.byDepartment.find((d) => d.name === "内科")?.count ||
                  0) /
                  stats.totalHospitalizations) *
                100
              ).toFixed(0)}
              %
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-sm font-medium text-amber-900 mb-1">异常情况</div>
            <p className="text-xs text-amber-700">
              用药漏记{" "}
              {stats.byAnomalyType.find(
                (a) => a.name === AnomalyType.MEDICATION_MISSED
              )?.count || 0}{" "}
              例，护理异常{" "}
              {stats.byAnomalyType.find(
                (a) => a.name === AnomalyType.NURSING_ABNORMAL
              )?.count || 0}{" "}
              例，费用异议{" "}
              {stats.byAnomalyType.find(
                (a) => a.name === AnomalyType.FEE_DISPUTE
              )?.count || 0}{" "}
              例
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="text-sm font-medium text-green-900 mb-1">住院周期</div>
            <p className="text-xs text-green-700">
              平均住院 {stats.averageStayDays.toFixed(1)} 天，
              {stats.byStayDays.find((d) => d.range === "3-7天")?.count || 0} 例
              病例住院天数在3-7天之间
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
