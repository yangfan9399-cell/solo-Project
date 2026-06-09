import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { differenceInDays, format } from "date-fns";
import { zhCN } from "date-fns/locale";

export const meta: MetaFunction = () => {
  return [{ title: "首页 - 商标续展管理系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  let whereClause: any = {};
  if (user.role === "CLIENT") {
    whereClause.clientId = user.id;
  } else if (user.role === "CONSULTANT") {
    whereClause.consultantId = user.id;
  } else if (user.role === "AGENT") {
    whereClause.OR = [
      { agentId: user.id },
      { status: { in: ["MATERIALS_UPLOADED", "MATERIALS_DEFICIENT", "EXPEDITED"] } },
    ];
  } else if (user.role === "SUPERVISOR") {
    whereClause.OR = [
      { supervisorId: user.id },
      { status: { in: ["SUBMITTED", "SUPERVISOR_REVIEW"] } },
    ];
  }

  const [totalCount, statusStats, expiringSoon, recentTrademarks] = await Promise.all([
    prisma.trademark.count({ where: whereClause }),
    prisma.trademark.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { status: true },
    }),
    prisma.trademark.findMany({
      where: {
        ...whereClause,
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        status: { not: "ARCHIVED" },
      },
      orderBy: { expiryDate: "asc" },
      take: 5,
      include: {
        client: { select: { name: true } },
      },
    }),
    prisma.trademark.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        client: { select: { name: true } },
      },
    }),
  ]);

  return json({
    user,
    totalCount,
    statusStats,
    expiringSoon,
    recentTrademarks,
    today: new Date().toISOString(),
  });
}

export default function Index() {
  const { user, totalCount, statusStats, expiringSoon, recentTrademarks } = useLoaderData<typeof loader>();

  const stats = [
    { label: "商标总数", value: totalCount, color: "bg-blue-500" },
    ...statusStats.map((stat) => ({
      label: getStatusLabel(stat.status),
      value: stat._count.status,
      color: getStatusColor(stat.status),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            欢迎回来，{user.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
          </p>
        </div>
        {user.role === "CONSULTANT" && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/trademarks/new"
              className="btn btn-primary"
            >
              登记新商标
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.slice(0, 8).map((stat, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`} />
              <p className="text-sm font-medium text-gray-500 truncate">
                {stat.label}
              </p>
            </div>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              即将到期（90天内）
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {expiringSoon.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                暂无即将到期的商标
              </div>
            ) : (
              expiringSoon.map((trademark) => {
                const daysLeft = differenceInDays(
                  new Date(trademark.expiryDate),
                  new Date()
                );
                const isUrgent = daysLeft <= 30;
                return (
                  <Link
                    key={trademark.id}
                    to={`/trademarks/${trademark.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {trademark.trademarkName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {trademark.trademarkNo} · {trademark.categoryName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${
                              isUrgent ? "text-red-600" : "text-yellow-600"
                            }`}
                          >
                            {daysLeft}天
                          </span>
                          <p className="text-xs text-gray-500">
                            {format(new Date(trademark.expiryDate), "yyyy-MM-dd")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              最近更新
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTrademarks.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                暂无商标记录
              </div>
            ) : (
              recentTrademarks.map((trademark) => (
                <Link
                  key={trademark.id}
                  to={`/trademarks/${trademark.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {trademark.trademarkName}
                        </p>
                        <p className="text-xs text-gray-500">
                          客户：{trademark.client.name}
                        </p>
                      </div>
                      <StatusBadge status={trademark.status} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "草稿",
    PENDING_UPLOAD: "待上传",
    MATERIALS_UPLOADED: "材料已上传",
    MATERIALS_DEFICIENT: "材料缺失",
    AGENT_APPROVED: "待递交",
    SUBMITTED: "已递交",
    SUPERVISOR_REVIEW: "复核中",
    ARCHIVED: "已归档",
    ABANDONED: "已放弃",
    EXPEDITED: "加急处理",
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-400",
    PENDING_UPLOAD: "bg-yellow-400",
    MATERIALS_UPLOADED: "bg-blue-400",
    MATERIALS_DEFICIENT: "bg-red-400",
    AGENT_APPROVED: "bg-green-400",
    SUBMITTED: "bg-purple-400",
    SUPERVISOR_REVIEW: "bg-indigo-400",
    ARCHIVED: "bg-green-600",
    ABANDONED: "bg-gray-500",
    EXPEDITED: "bg-red-600",
  };
  return colors[status] || "bg-gray-400";
}
