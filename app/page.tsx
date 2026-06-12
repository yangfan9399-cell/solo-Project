export const dynamic = "force-dynamic";

import Link from "next/link";
import { getOrderList } from "@/lib/data-service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { UserSwitcher } from "@/components/ui/UserSwitcher";
import { formatDate, formatDecimal, getStatusBgColor } from "@/lib/utils";
import {
  Search,
  Filter,
  Eye,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { OrderStatus, SampleCategory } from "@/lib/types";

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    isArchived?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const filters: any = {};
  if (params.status) filters.status = params.status as OrderStatus;
  if (params.category) filters.category = params.category as SampleCategory;
  if (params.isArchived !== undefined)
    filters.isArchived = params.isArchived === "true";
  if (params.search) filters.search = params.search;

  const orders = await getOrderList(filters);

  return (
    <div className="space-y-6">
      <UserSwitcher />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">调度指令列表</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <form>
              <input
                type="text"
                name="search"
                placeholder="搜索指令编号、标题..."
                defaultValue={params.search}
                className="input pl-10 w-80"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">筛选</span>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              全部
            </Link>
            {Object.entries({
              PENDING_ACCEPT: "待受理",
              PROCESSING: "处理中",
              PENDING_REVIEW: "待复核",
              REVIEW_APPROVED: "已通过",
              REVIEW_REJECTED: "已退回",
              ARCHIVED: "已归档",
            }).map(([key, label]) => (
              <Link
                key={key}
                href={{
                  pathname: "/",
                  query: { ...params, status: key },
                }}
                className={`text-sm px-3 py-1 rounded-md ${
                  params.status === key
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`card p-6 border-l-4 ${getStatusBgColor(
              order.status
            )} transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-mono text-gray-500">
                    {order.orderNo}
                  </span>
                  <StatusBadge status={order.status} />
                  <CategoryBadge category={order.sampleCategory} />
                  {order.isArchived && (
                    <span className="badge bg-gray-200 text-gray-700">
                      已归档
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {order.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{order.summary}</p>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">水库/闸门：</span>
                    <span className="text-gray-900 font-medium">
                      {order.reservoirName} {order.gateNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">责任单位：</span>
                    <span className="text-gray-900">
                      {order.responsibleUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">责任人：</span>
                    <span className="text-gray-900">
                      {order.responsiblePerson}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">创建时间：</span>
                    <span className="text-gray-900">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                {order.conclusion && (
                  <div className="mt-4 p-3 bg-white rounded-md border">
                    <div className="flex items-start space-x-2">
                      {order.blockReason ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          结论
                        </span>
                        <p className="text-sm text-gray-700">{order.conclusion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {order.blockReason && (
                  <div className="mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-red-500 uppercase">
                          阻断原因
                        </span>
                        <p className="text-sm text-red-700">
                          {order.blockReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end space-y-2 ml-6">
                <Link
                  href={`/orders/${order.id}`}
                  className="btn btn-primary"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  查看详情
                </Link>
                <Link
                  href={`/orders/${order.id}?tab=process`}
                  className="btn btn-secondary"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  进入处理
                </Link>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="card p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无符合条件的调度指令</p>
          </div>
        )}
      </div>
    </div>
  );
}
