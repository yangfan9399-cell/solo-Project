import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/visits";
import { db } from "~/lib/db.server";
import { VisitStatus, AnomalyType } from "@prisma/client";

export async function loader() {
  const visits = await db.visit.findMany({
    include: {
      parkingSpot: true,
      originalSpot: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: visits.length,
    pending: visits.filter((v) => v.status === VisitStatus.PENDING).length,
    checkedIn: visits.filter((v) => v.status === VisitStatus.CHECKED_IN).length,
    checkedOut: visits.filter((v) => v.status === VisitStatus.CHECKED_OUT).length,
    archived: visits.filter((v) => v.status === VisitStatus.ARCHIVED).length,
    anomaly: visits.filter((v) => v.anomalyType !== AnomalyType.NONE).length,
    plateMismatch: visits.filter((v) => v.anomalyType === AnomalyType.PLATE_MISMATCH).length,
    spotOccupied: visits.filter((v) => v.anomalyType === AnomalyType.SPOT_OCCUPIED).length,
    overstay: visits.filter((v) => v.anomalyType === AnomalyType.OVERSTAY).length,
  };

  return { visits, stats };
}

export function meta(): Route.MetaDescriptions {
  return [{ title: "访问记录 - 物业访客车位管理平台" }];
}

export default function Visits() {
  const { visits, stats } = useLoaderData<typeof loader>();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CHECKED_IN: "bg-green-100 text-green-800",
      CHECKED_OUT: "bg-gray-100 text-gray-800",
      ARCHIVED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "待入场",
      CHECKED_IN: "已入场",
      CHECKED_OUT: "已离场",
      ARCHIVED: "已归档",
      CANCELLED: "已取消",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                ← 返回首页
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">📋 访问记录</h1>
                <p className="text-sm text-gray-500">所有访客车辆记录列表</p>
              </div>
            </div>
            <Link to="/visits/new" className="btn btn-primary">
              + 新增预约
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">总计</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">待入场</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              <p className="text-xs text-gray-500">已入场</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.checkedOut}</p>
              <p className="text-xs text-gray-500">已离场</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.archived}</p>
              <p className="text-xs text-gray-500">已归档</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.plateMismatch}</p>
              <p className="text-xs text-gray-500">车牌不符</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overstay}</p>
              <p className="text-xs text-gray-500">超时</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      访客
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      车牌
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      车位
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      被访人
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      异常
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{visit.visitorName}</p>
                          <p className="text-xs text-gray-500">{visit.visitorPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono font-medium">
                            {visit.licensePlate}
                          </p>
                          {visit.licensePlate !== visit.originalPlate && (
                            <p className="text-xs text-orange-600">
                              原: {visit.originalPlate}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">
                            {visit.parkingSpot?.spotNumber || "-"}
                          </p>
                          {visit.parkingSpot?.id !== visit.originalSpot?.id && (
                            <p className="text-xs text-purple-600">已变更</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{visit.hostName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusColor(visit.status)}`}>
                          {getStatusLabel(visit.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {visit.anomalyType !== "NONE" ? (
                          <span
                            className={`badge ${
                              visit.anomalyType === "PLATE_MISMATCH"
                                ? "bg-orange-100 text-orange-800"
                                : visit.anomalyType === "SPOT_OCCUPIED"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {visit.anomalyType === "PLATE_MISMATCH"
                              ? "车牌不符"
                              : visit.anomalyType === "SPOT_OCCUPIED"
                              ? "车位占用"
                              : "超时"}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/visits/${visit.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
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
        </div>
      </main>
    </div>
  );
}
