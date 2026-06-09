import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/lib/actions/analytics-actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, AlertTriangle, Clock, MapPin, Package, Gavel } from "lucide-react";

const COLORS = [
  "#0c8ee7",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">统计复盘</h1>
        <p className="text-slate-500 mt-1">
          按口岸、商品类别、异常类型和检测耗时的数据聚合分析
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center">
            <MapPin className="w-5 h-5 text-customs-600 mr-2" />
            <h2 className="font-semibold text-slate-800">按口岸分布</h2>
          </div>
          <div className="p-5 h-80">
            {data.byPort.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byPort} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="port"
                    stroke="#94a3b8"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#0c8ee7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center">
            <Package className="w-5 h-5 text-customs-600 mr-2" />
            <h2 className="font-semibold text-slate-800">按商品类别分布</h2>
          </div>
          <div className="p-5 h-80">
            {data.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center">
            <AlertTriangle className="w-5 h-5 text-customs-600 mr-2" />
            <h2 className="font-semibold text-slate-800">异常类型分布</h2>
          </div>
          <div className="p-5 h-80">
            {data.byAbnormalType.filter((d) => d.count > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byAbnormalType.filter((d) => d.count > 0)}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ label, count }) => `${label}: ${count}`}
                  >
                    {data.byAbnormalType
                      .filter((d) => d.count > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center">
            <Clock className="w-5 h-5 text-customs-600 mr-2" />
            <h2 className="font-semibold text-slate-800">检测耗时统计</h2>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <p className="text-sm text-slate-500">平均检测耗时</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {data.timeStats.avgDuration}{" "}
                <span className="text-base font-normal text-slate-500">小时</span>
              </p>
            </div>
            <div className="h-48">
              {data.timeStats.samples.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeStats.samples}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="sampleNo"
                      stroke="#94a3b8"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      formatter={(value: number) => [`${value} 小时`, "检测耗时"]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center">
          <Gavel className="w-5 h-5 text-customs-600 mr-2" />
          <h2 className="font-semibold text-slate-800">处置结论分布</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["RELEASE", "DETAIN", "RE_TEST", "APPEAL"].map((type, idx) => {
              const disposal = data.disposalStats.find((d) => d.type === type);
              const labels: Record<string, string> = {
                RELEASE: "合格放行",
                DETAIN: "扣留",
                RE_TEST: "补检",
                APPEAL: "复议",
              };
              const colors = [
                "bg-green-50 border-green-200 text-green-700",
                "bg-red-50 border-red-200 text-red-700",
                "bg-yellow-50 border-yellow-200 text-yellow-700",
                "bg-purple-50 border-purple-200 text-purple-700",
              ];
              return (
                <div
                  key={type}
                  className={`p-4 rounded-xl border ${colors[idx]}`}
                >
                  <p className="text-sm font-medium">{labels[type]}</p>
                  <p className="text-2xl font-bold mt-1">
                    {disposal?.count || 0}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center">
          <BarChart3 className="w-5 h-5 text-customs-600 mr-2" />
          <h2 className="font-semibold text-slate-800">异常类型明细</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.byAbnormalType.map((item, idx) => (
              <div
                key={item.type}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                </div>
                <p className="text-xl font-bold text-slate-800 mt-2">
                  {item.count}
                  <span className="text-sm font-normal text-slate-500 ml-1">
                    件
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">暂无数据</p>
      </div>
    </div>
  );
}
