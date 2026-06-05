import { useLoaderData } from "react-router";
import { useState, useEffect, lazy, Suspense } from "react";
import { getStatistics, getPermits } from "~/lib/services";
import { CONSTRUCTION_TYPES } from "~/lib/utils";

export const loader = async () => {
  const stats = await getStatistics();
  const permits = await getPermits();
  return { stats, permits };
};

const TYPE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

const ANOMALY_COLORS = {
  NONE: "#22c55e",
  DOCUMENT_MISSING: "#f59e0b",
  AREA_CONFLICT: "#ef4444",
  SAFETY_BRIEFING_FAILED: "#f97316",
  OVERSTAY: "#8b5cf6",
};

const ANOMALY_LABELS: Record<string, string> = {
  NONE: "无异常",
  DOCUMENT_MISSING: "证件缺失",
  AREA_CONFLICT: "区域冲突",
  SAFETY_BRIEFING_FAILED: "安全交底未通过",
  OVERSTAY: "超时滞留",
};

export default function Statistics() {
  const { stats, permits } = useLoaderData<typeof loader>();
  const [recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    import("recharts").then((mod) => {
      setRecharts(mod);
    });
  }, []);

  const typeData = Object.entries(stats.byType).map(([key, value]) => ({
    name: CONSTRUCTION_TYPES.find((t) => t.value === key)?.label || key,
    value,
  }));

  const areaData = Object.entries(stats.byArea).map(([name, value]) => ({
    name,
    value,
  }));

  const anomalyData = Object.entries(stats.byAnomaly).map(([key, value]) => ({
    name: ANOMALY_LABELS[key] || key,
    value,
    color: ANOMALY_COLORS[key as keyof typeof ANOMALY_COLORS] || "#64748b",
  }));

  const stayData = stats.stayDurationDistribution.map((item) => ({
    name: item.range,
    count: item.count,
  }));

  const anomalyRate = stats.totalPermits > 0
    ? ((stats.anomalyCount / stats.totalPermits) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">复盘统计</h1>
        <p className="text-slate-500 mt-1">按施工类型、区域、异常原因和滞留时长聚合分析</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="总许可数"
          value={stats.totalPermits}
          icon="📋"
          color="primary"
        />
        <StatCard
          label="已完成"
          value={stats.completedPermits}
          icon="✅"
          color="success"
        />
        <StatCard
          label="异常单"
          value={stats.anomalyCount}
          icon="⚠️"
          color="danger"
          subtitle={`异常率 ${anomalyRate}%`}
        />
        <StatCard
          label="平均滞留"
          value={`${stats.avgStayHours}h`}
          icon="⏱️"
          color="warning"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">按施工类型分布</h2>
          <div className="h-72">
            {recharts ? (
              <TypeChart data={typeData} recharts={recharts} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">加载中...</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">按施工区域分布</h2>
          <div className="h-72">
            {recharts ? (
              <AreaChartComp data={areaData} recharts={recharts} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">加载中...</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">异常原因分布</h2>
          <div className="h-72 flex items-center justify-center">
            {recharts ? (
              <AnomalyChart data={anomalyData} recharts={recharts} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">加载中...</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">滞留时长分布</h2>
          <div className="h-72">
            {recharts ? (
              <StayChart data={stayData} recharts={recharts} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">加载中...</div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">异常记录明细</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  许可编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  施工队
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  异常类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  异常原因
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  滞留时长
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {permits
                .filter((p) => p.anomalyType && p.anomalyType !== "NONE")
                .map((permit) => (
                  <tr key={permit.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-primary-600">
                      {permit.permitNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      施工队 #{permit.teamId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          permit.anomalyType === "DOCUMENT_MISSING"
                            ? "bg-warning-100 text-warning-800"
                            : permit.anomalyType === "AREA_CONFLICT"
                            ? "bg-danger-100 text-danger-800"
                            : permit.anomalyType === "SAFETY_BRIEFING_FAILED"
                            ? "bg-orange-100 text-orange-800"
                            : permit.anomalyType === "OVERSTAY"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {ANOMALY_LABELS[permit.anomalyType || ""] || permit.anomalyType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                      {permit.anomalyReason || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{permit.status}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {permit.stayDurationHours ? `${permit.stayDurationHours}小时` : "-"}
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

function TypeChart({ data, recharts }: { data: { name: string; value: number }[]; recharts: any }) {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
  } = recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function AreaChartComp({ data, recharts }: { data: { name: string; value: number }[]; recharts: any }) {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } = recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" height={60} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AnomalyChart({ data, recharts }: { data: { name: string; value: number; color: string }[]; recharts: any }) {
  const {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } = recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          fontSize={12}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function StayChart({ data, recharts }: { data: { name: string; count: number }[]; recharts: any }) {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } = recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "from-primary-500 to-primary-600",
    success: "from-success-500 to-success-600",
    warning: "from-warning-500 to-warning-600",
    danger: "from-danger-500 to-danger-600",
  };

  return (
    <div className="card p-5 relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color] || colorClasses.primary}`}
      ></div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
