"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Building2,
  Cpu,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
  Zap,
} from "lucide-react";
import {
  defectLevelLabels,
  defectStatusLabels,
  formatDuration,
  cn,
} from "@/lib/utils";

interface Statistics {
  total: number;
  byStatus: Record<string, number>;
  byStation: { name: string; count: number; affectedPower: number }[];
  byDeviceType: { label: string; count: number }[];
  byLevel: { label: string; count: number }[];
  avgDuration: number;
  closedCount: number;
}

interface DurationStat {
  range: string;
  label: string;
  count: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [durationStats, setDurationStats] = useState<DurationStat[]>([]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/statistics");
      const data = await res.json();
      setStats(data);

      const mockDurationStats: DurationStat[] = [
        { range: "0-1d", label: "1天内", count: 2 },
        { range: "1-3d", label: "1-3天", count: 3 },
        { range: "3-7d", label: "3-7天", count: 1 },
        { range: "7d+", label: "7天以上", count: 1 },
      ];
      setDurationStats(mockDurationStats);
    } catch (error) {
      console.error("获取统计数据失败", error);
    } finally {
      setLoading(false);
    }
  };

  const maxStationCount = Math.max(
    ...(stats?.byStation.map((s) => s.count) || [1])
  );
  const maxDeviceCount = Math.max(
    ...(stats?.byDeviceType.map((d) => d.count) || [1])
  );
  const maxLevelCount = Math.max(
    ...(stats?.byLevel.map((l) => l.count) || [1])
  );
  const maxDurationCount = Math.max(
    ...(durationStats.map((d) => d.count) || [1])
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">复盘分析</h1>
        <p className="mt-1 text-sm text-gray-500">
          多维度统计分析缺陷数据，优化运维效率
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-50 p-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              总计
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.total || 0}
            </p>
            <p className="text-sm text-gray-500">缺陷总数</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-green-50 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              已完成
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.byStatus.accepted || 0}
            </p>
            <p className="text-sm text-gray-500">已消缺数量</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-orange-50 p-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              效率
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(stats?.avgDuration)}
            </p>
            <p className="text-sm text-gray-500">平均消缺时长</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-purple-50 p-2">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              影响
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.byStation.reduce((sum, s) => sum + s.affectedPower, 0).toFixed(2) || 0}{" "}
              kW
            </p>
            <p className="text-sm text-gray-500">累计影响功率</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">按电站统计</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.byStation.map((station, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {station.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {station.count} 件 · {station.affectedPower.toFixed(2)} kW
                    </span>
                  </div>
                  <div className="h-6 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                      style={{
                        width: `${(station.count / maxStationCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">按设备类型统计</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.byDeviceType.map((type, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {type.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {type.count} 件
                    </span>
                  </div>
                  <div className="h-6 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        index === 0 && "bg-gradient-to-r from-blue-400 to-blue-600",
                        index === 1 && "bg-gradient-to-r from-green-400 to-green-600",
                        index === 2 && "bg-gradient-to-r from-purple-400 to-purple-600",
                        index === 3 && "bg-gradient-to-r from-pink-400 to-pink-600"
                      )}
                      style={{
                        width: `${(type.count / maxDeviceCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">按缺陷等级统计</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {stats?.byLevel.map((level, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {level.label}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        index === 0 && "text-red-600",
                        index === 1 && "text-orange-600",
                        index === 2 && "text-yellow-600",
                        index === 3 && "text-gray-600"
                      )}
                    >
                      {level.count}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        index === 0 && "bg-red-500",
                        index === 1 && "bg-orange-500",
                        index === 2 && "bg-yellow-500",
                        index === 3 && "bg-gray-500"
                      )}
                      style={{
                        width: `${(level.count / maxLevelCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">消缺时长分布</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between gap-2 h-48">
              {durationStats.map((stat, index) => (
                <div key={index} className="flex flex-1 flex-col items-center">
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    {stat.count}
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-cyan-300 transition-all"
                    style={{
                      height: `${(stat.count / maxDurationCount) * 100}%`,
                      minHeight: "8px",
                    }}
                  />
                  <div className="mt-2 text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">状态分布</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {stats &&
              Object.entries(stats.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      status === "registered" && "bg-blue-500",
                      status === "assigned" && "bg-yellow-500",
                      status === "processing" && "bg-purple-500",
                      status === "pending_review" && "bg-orange-500",
                      status === "awaiting_parts" && "bg-gray-500",
                      status === "accepted" && "bg-green-500",
                      status === "rejected" && "bg-red-500",
                      status === "false_positive" && "bg-slate-500"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {defectStatusLabels[status]}
                    </p>
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
