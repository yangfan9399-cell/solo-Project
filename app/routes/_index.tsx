import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/_index";
import { db } from "~/lib/db.server";
import { AnomalyType, VisitStatus } from "@prisma/client";

export async function loader() {
  const [stats, recentVisits] = await Promise.all([
    db.visit.groupBy({
      by: ["status", "anomalyType"],
      _count: true,
    }),
    db.visit.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { parkingSpot: true },
    }),
  ]);

  const totalVisits = stats.reduce((sum, s) => sum + s._count, 0);
  const pendingCount = stats.filter(s => s.status === VisitStatus.PENDING).reduce((sum, s) => sum + s._count, 0);
  const checkedInCount = stats.filter(s => s.status === VisitStatus.CHECKED_IN).reduce((sum, s) => sum + s._count, 0);
  const anomalyCount = stats.filter(s => s.anomalyType !== AnomalyType.NONE).reduce((sum, s) => sum + s._count, 0);
  const plateMismatchCount = stats.filter(s => s.anomalyType === AnomalyType.PLATE_MISMATCH).reduce((sum, s) => sum + s._count, 0);
  const spotOccupiedCount = stats.filter(s => s.anomalyType === AnomalyType.SPOT_OCCUPIED).reduce((sum, s) => sum + s._count, 0);
  const overstayCount = stats.filter(s => s.anomalyType === AnomalyType.OVERSTAY).reduce((sum, s) => sum + s._count, 0);

  return {
    stats: {
      total: totalVisits,
      pending: pendingCount,
      checkedIn: checkedInCount,
      anomaly: anomalyCount,
      plateMismatch: plateMismatchCount,
      spotOccupied: spotOccupiedCount,
      overstay: overstayCount,
    },
    recentVisits,
  };
}

export function meta(): Route.MetaDescriptions {
  return [{ title: "首页 - 物业访客车位管理平台" }];
}

export default function Index() {
  const { stats, recentVisits } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏢 物业访客车位登记与放行核验平台
              </h1>
              <p className="text-sm text-gray-500 mt-1">访客车辆从预约登记到离场核验的全流程管理</p>
            </div>
            <div className="flex gap-3">
              <Link to="/gate" className="btn btn-primary">
                门岗放行
              </Link>
              <Link to="/property" className="btn btn-secondary">
                物业复核
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总访问记录</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待入场</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">在场车辆</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.checkedIn}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚗</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">异常记录</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.anomaly}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">异常类型统计</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                <span className="text-3xl">🔢</span>
                <div>
                  <p className="text-sm text-gray-600">车牌不一致</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.plateMismatch}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                <span className="text-3xl">🅿️</span>
                <div>
                  <p className="text-sm text-gray-600">车位被占用</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.spotOccupied}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                <span className="text-3xl">⏰</span>
                <div>
                  <p className="text-sm text-gray-600">超时未离场</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overstay}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">最近访问记录</h2>
              <Link to="/visits" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部 →
              </Link>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {recentVisits.map((visit) => (
                  <Link
                    key={visit.id}
                    to={`/visits/${visit.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">🚙</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{visit.visitorName}</p>
                        <p className="text-sm text-gray-500">{visit.licensePlate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={visit.status} anomaly={visit.anomalyType} />
                      <p className="text-xs text-gray-400 mt-1">
                        {visit.parkingSpot?.spotNumber || "未分配"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">快速操作</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <Link
                  to="/visits/new"
                  className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-3xl">📝</span>
                  <div>
                    <p className="font-medium text-blue-900">预约登记</p>
                    <p className="text-sm text-blue-600">新建访客车辆预约</p>
                  </div>
                </Link>
                <Link
                  to="/gate"
                  className="flex items-center gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <span className="text-3xl">🚪</span>
                  <div>
                    <p className="font-medium text-green-900">门岗放行</p>
                    <p className="text-sm text-green-600">入场核验与异常处理</p>
                  </div>
                </Link>
                <Link
                  to="/property"
                  className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-3xl">🔍</span>
                  <div>
                    <p className="font-medium text-purple-900">物业复核</p>
                    <p className="text-sm text-purple-600">离场确认与追踪管理</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status, anomaly }: { status: string; anomaly: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CHECKED_IN: "bg-green-100 text-green-800",
    CHECKED_OUT: "bg-gray-100 text-gray-800",
    ARCHIVED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const labels: Record<string, string> = {
    PENDING: "待入场",
    CHECKED_IN: "已入场",
    CHECKED_OUT: "已离场",
    ARCHIVED: "已归档",
    CANCELLED: "已取消",
  };

  const anomalyColors: Record<string, string> = {
    PLATE_MISMATCH: "bg-orange-100 text-orange-800",
    SPOT_OCCUPIED: "bg-purple-100 text-purple-800",
    OVERSTAY: "bg-red-100 text-red-800",
    OTHER: "bg-pink-100 text-pink-800",
  };

  const anomalyLabels: Record<string, string> = {
    PLATE_MISMATCH: "车牌不一致",
    SPOT_OCCUPIED: "车位占用",
    OVERSTAY: "超时",
    OTHER: "其他异常",
  };

  return (
    <div className="flex gap-1">
      <span className={`badge ${colors[status]}`}>{labels[status]}</span>
      {anomaly !== "NONE" && (
        <span className={`badge ${anomalyColors[anomaly]}`}>
          {anomalyLabels[anomaly]}
        </span>
      )}
    </div>
  );
}
