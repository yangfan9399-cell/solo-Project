export const dynamic = "force-dynamic";

import { getOrderList } from "@/lib/data-service";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@/lib/types";
import type { OrderSummary } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { UserSwitcher } from "@/components/ui/UserSwitcher";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Settings,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default async function ProcessingDeskPage() {
  const [orders, user] = await Promise.all([
    getOrderList({ isArchived: false }),
    getCurrentUser(),
  ]);

  const myOrders = orders.filter((o: OrderSummary) => {
    if (user.role === "OPERATOR") {
      return ["PENDING_ACCEPT", "PROCESSING", "REVIEW_REJECTED"].includes(
        o.status
      );
    }
    if (user.role === "REVIEWER") {
      return o.status === "PENDING_REVIEW";
    }
    return true;
  });

  const pendingCount = myOrders.filter(
    (o: OrderSummary) => o.status === OrderStatus.PENDING_ACCEPT
  ).length;
  const processingCount = myOrders.filter(
    (o: OrderSummary) => o.status === OrderStatus.PROCESSING
  ).length;
  const reviewCount = myOrders.filter(
    (o: OrderSummary) => o.status === OrderStatus.PENDING_REVIEW
  ).length;
  const rejectedCount = myOrders.filter(
    (o: OrderSummary) => o.status === OrderStatus.REVIEW_REJECTED
  ).length;

  return (
    <div className="space-y-6">
      <UserSwitcher />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="w-7 h-7 mr-3 text-primary-600" />
          处理台
        </h1>
        <div className="text-sm text-gray-500">
          当前用户：{user.name}（{user.role === "OPERATOR" ? "经办人" : user.role === "REVIEWER" ? "复核人" : "管理员"}）
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">待受理</p>
              <p className="mt-1 text-3xl font-bold text-amber-700">{pendingCount}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">处理中</p>
              <p className="mt-1 text-3xl font-bold text-blue-700">{processingCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">待复核</p>
              <p className="mt-1 text-3xl font-bold text-purple-700">{reviewCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">已退回</p>
              <p className="mt-1 text-3xl font-bold text-red-700">{rejectedCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">待处理事项</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {myOrders.length} 条记录需要处理
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {myOrders.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无待处理事项</p>
            </div>
          ) : (
            myOrders.map((order: OrderSummary) => (
              <div
                key={order.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        {order.orderNo}
                      </span>
                      <StatusBadge status={order.status} />
                      <CategoryBadge category={order.sampleCategory} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {order.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {order.summary}
                    </p>
                    {order.blockReason && (
                      <div className="p-3 bg-red-50 rounded-md border border-red-200 mb-3">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-red-500">
                              需处理：
                            </span>
                            <span className="text-sm text-red-700 ml-1">
                              {order.blockReason}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>水库：{order.reservoirName}</span>
                      <span>闸门：{order.gateNo}</span>
                      <span>责任单位：{order.responsibleUnit}</span>
                      <span>创建时间：{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/orders/${order.id}?tab=process`}
                    className="btn btn-primary"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    立即处理
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
