export const dynamic = "force-dynamic";

import Link from "next/link";
import { getOrderList, getDashboardStats } from "@/lib/data-service";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { UserSwitcher } from "@/components/ui/UserSwitcher";
import { formatDate } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  Settings,
  Eye,
  CheckCircle2,
  XCircle,
  Archive,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowRight,
} from "lucide-react";
import {
  SampleCategory,
  OrderStatus,
  SAMPLE_CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/lib/types";
import type { OrderSummary } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;
  const [stats, allOrders] = await Promise.all([
    getDashboardStats(),
    getOrderList(),
  ]);

  const activeFilter = params.status || params.category || "all";

  const filteredOrders = params.status
    ? allOrders.filter((o) => o.status === params.status)
    : params.category
    ? allOrders.filter((o) => o.sampleCategory === params.category)
    : allOrders;

  const categoryColors: Record<SampleCategory, { color: string; bg: string }> = {
    NORMAL_CLOSE: { color: "text-green-600", bg: "bg-green-100" },
    MISSING_MATERIAL: { color: "text-red-600", bg: "bg-red-100" },
    INCONSISTENT_PARTY: { color: "text-orange-600", bg: "bg-orange-100" },
    REVIEW_REJECTED: { color: "text-rose-600", bg: "bg-rose-100" },
  };

  return (
    <div className="space-y-6">
      <UserSwitcher />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <LayoutDashboard className="w-7 h-7 mr-3 text-primary-600" />
          复盘统计看板
        </h1>
      </div>

      <div className="grid grid-cols-7 gap-4">
        <StatCard
          title="总数"
          value={stats.total}
          icon={BarChart3}
          color="text-gray-600"
          bgColor="bg-gray-100"
          onClick={() => (window.location.href = "/dashboard")}
          isActive={activeFilter === "all"}
        />
        <StatCard
          title="待受理"
          value={stats.pending}
          icon={Clock}
          color="text-amber-600"
          bgColor="bg-amber-100"
          onClick={() => (window.location.href = "/dashboard?status=PENDING_ACCEPT")}
          isActive={activeFilter === "PENDING_ACCEPT"}
        />
        <StatCard
          title="处理中"
          value={stats.processing}
          icon={Settings}
          color="text-blue-600"
          bgColor="bg-blue-100"
          onClick={() => (window.location.href = "/dashboard?status=PROCESSING")}
          isActive={activeFilter === "PROCESSING"}
        />
        <StatCard
          title="待复核"
          value={stats.reviewing}
          icon={Eye}
          color="text-purple-600"
          bgColor="bg-purple-100"
          onClick={() => (window.location.href = "/dashboard?status=PENDING_REVIEW")}
          isActive={activeFilter === "PENDING_REVIEW"}
        />
        <StatCard
          title="已通过"
          value={stats.approved}
          icon={CheckCircle2}
          color="text-green-600"
          bgColor="bg-green-100"
          onClick={() => (window.location.href = "/dashboard?status=REVIEW_APPROVED")}
          isActive={activeFilter === "REVIEW_APPROVED"}
        />
        <StatCard
          title="已退回"
          value={stats.rejected}
          icon={XCircle}
          color="text-red-600"
          bgColor="bg-red-100"
          onClick={() => (window.location.href = "/dashboard?status=REVIEW_REJECTED")}
          isActive={activeFilter === "REVIEW_REJECTED"}
        />
        <StatCard
          title="已归档"
          value={stats.archived}
          icon={Archive}
          color="text-gray-600"
          bgColor="bg-gray-100"
          onClick={() => (window.location.href = "/dashboard?status=ARCHIVED")}
          isActive={activeFilter === "ARCHIVED"}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-primary-600" />
              样本类别分布
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {(Object.entries(stats.byCategory) as [SampleCategory, number][]).map(
                ([category, count]) => {
                  const colors = categoryColors[category];
                  const percentage =
                    stats.total > 0
                      ? ((count / stats.total) * 100).toFixed(1)
                      : "0";
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/dashboard?category=${category}`}
                          className={`flex items-center space-x-2 hover:underline ${colors.color}`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full ${colors.bg}`}
                          />
                          <span className="font-medium">
                            {SAMPLE_CATEGORY_LABELS[category]}
                          </span>
                        </Link>
                        <span className="text-sm text-gray-500">
                          {count} 条 ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colors.bg.replace(
                            "100",
                            "500"
                          )}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
              月度趋势
            </h2>
          </div>
          <div className="card-body">
            {stats.byMonth.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无数据
              </div>
            ) : (
              <div className="flex items-end justify-between h-40 space-x-2">
                {stats.byMonth.map((item) => (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                      style={{
                        height: `${Math.max(
                          (item.count /
                            Math.max(...stats.byMonth.map((m) => m.count))) *
                            120,
                          4
                        )}px`,
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-2">
                      {item.month}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              异常记录分析
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {activeFilter === "all"
                ? `所有记录 - 共 ${filteredOrders.length} 条`
                : params.status
                ? `${STATUS_LABELS[params.status as OrderStatus]} - 共 ${filteredOrders.length} 条`
                : `${
                    SAMPLE_CATEGORY_LABELS[params.category as SampleCategory]
                  } - 共 ${filteredOrders.length} 条`}
            </p>
          </div>
          <Link href="/" className="text-sm text-primary-600 hover:text-primary-700">
            查看完整列表 →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无符合条件的记录
            </div>
          ) : (
            filteredOrders.slice(0, 10).map((order: OrderSummary) => (
              <div
                key={order.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        {order.orderNo}
                      </span>
                      <StatusBadge status={order.status} />
                      <CategoryBadge category={order.sampleCategory} />
                      {order.blockReason && (
                        <span className="badge bg-red-100 text-red-700">
                          有阻断
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {order.title}
                    </h3>
                    {order.blockReason && (
                      <div className="mt-2 text-sm">
                        <span className="text-red-600 font-medium">
                          阻断原因：
                        </span>
                        <span className="text-red-700">{order.blockReason}</span>
                      </div>
                    )}
                    {order.remedyPath && (
                      <div className="mt-1 text-sm">
                        <span className="text-amber-600 font-medium">
                          补救路径：
                        </span>
                        <span className="text-amber-700">{order.remedyPath}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>水库：{order.reservoirName}</span>
                      <span>闸门：{order.gateNo}</span>
                      <span>更新：{formatDate(order.updatedAt)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="btn btn-secondary"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    钻取详情
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
