"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Plus,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  defectStatusLabels,
  defectStatusColors,
  defectLevelLabels,
  defectLevelColors,
  deviceTypeLabels,
  formatDate,
  cn,
} from "@/lib/utils";
import type { Defect } from "@/lib/mock-data";

interface DefectWithDetails extends Defect {
  stationName?: string;
  deviceName?: string;
  inspectorName?: string;
  assigneeName?: string;
}

export default function DefectsPage() {
  const { currentUser } = useAuth();
  const [defects, setDefects] = useState<DefectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    stationId: "",
    deviceType: "",
    defectLevel: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    processing: 0,
    pendingReview: 0,
    accepted: 0,
  });

  useEffect(() => {
    fetchDefects();
  }, [filters, currentUser]);

  const fetchDefects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.stationId) params.set("stationId", filters.stationId);
      if (filters.deviceType) params.set("deviceType", filters.deviceType);
      if (filters.defectLevel) params.set("defectLevel", filters.defectLevel);

      if (currentUser?.role === "inspector") {
        params.set("inspectorId", String(currentUser.id));
      } else if (currentUser?.role === "maintenance_worker") {
        params.set("assigneeId", String(currentUser.id));
      }

      const res = await fetch(`/api/defects?${params.toString()}`);
      const data = await res.json();
      setDefects(data);

      const statsRes = await fetch("/api/statistics");
      const statsData = await statsRes.json();
      setStats({
        total: statsData.total,
        registered: statsData.byStatus.registered || 0,
        processing:
          (statsData.byStatus.processing || 0) +
          (statsData.byStatus.assigned || 0) +
          (statsData.byStatus.awaiting_parts || 0),
        pendingReview: statsData.byStatus.pending_review || 0,
        accepted: statsData.byStatus.accepted || 0,
      });
    } catch (error) {
      console.error("获取缺陷列表失败", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "全部缺陷",
      value: stats.total,
      icon: AlertTriangle,
      color: "bg-blue-50 text-blue-600",
      bgColor: "bg-blue-500",
    },
    {
      title: "待分派",
      value: stats.registered,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
      bgColor: "bg-yellow-500",
    },
    {
      title: "处理中",
      value: stats.processing,
      icon: Zap,
      color: "bg-purple-50 text-purple-600",
      bgColor: "bg-purple-500",
    },
    {
      title: "待验收",
      value: stats.pendingReview,
      icon: Filter,
      color: "bg-orange-50 text-orange-600",
      bgColor: "bg-orange-500",
    },
    {
      title: "已完成",
      value: stats.accepted,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      bgColor: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">缺陷管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看和管理光伏电站巡检缺陷
          </p>
        </div>
        {currentUser?.role === "inspector" && (
          <Link
            href="/defects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            登记缺陷
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${card.bgColor}`}
                ></span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="text-sm text-gray-500">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">筛选:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          >
            <option value="">全部状态</option>
            {Object.entries(defectStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.defectLevel}
            onChange={(e) =>
              setFilters({ ...filters, defectLevel: e.target.value })
            }
            className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          >
            <option value="">全部等级</option>
            {Object.entries(defectLevelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.deviceType}
            onChange={(e) =>
              setFilters({ ...filters, deviceType: e.target.value })
            }
            className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          >
            <option value="">全部设备类型</option>
            {Object.entries(deviceTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  缺陷编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  电站
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  设备类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  等级
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  负责人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登记时间
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : defects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    暂无缺陷数据
                  </td>
                </tr>
              ) : (
                defects.map((defect) => (
                  <tr
                    key={defect.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-gray-900">
                        {defect.defectNo}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {defect.title}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {defect.deviceName}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {defect.stationName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {deviceTypeLabels[defect.deviceType]}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          defectLevelColors[defect.defectLevel]
                        )}
                      >
                        {defectLevelLabels[defect.defectLevel]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          defectStatusColors[defect.status]
                        )}
                      >
                        {defectStatusLabels[defect.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {defect.assigneeName || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(defect.registeredAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/defects/${defect.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                      >
                        查看
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
