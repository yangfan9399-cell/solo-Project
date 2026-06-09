import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { StatusBadge } from "~/components/StatusBadge";
import { format } from "date-fns";

export const meta: MetaFunction = () => {
  return [{ title: "数据复盘 - 商标续展管理系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireRole(request, ["CONSULTANT", "AGENT", "SUPERVISOR"]);

  const [totalStats, byClient, byCategory, byStatus, cycleStats, expeditedStats] = await Promise.all([
    prisma.trademark.aggregate({
      _count: { id: true },
      _avg: {},
    }),
    prisma.trademark.groupBy({
      by: ["clientId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.trademark.groupBy({
      by: ["category", "categoryName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.trademark.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM "expiryDate") as year,
        COUNT(*) as count
      FROM "Trademark"
      WHERE "expiryDate" >= NOW() - INTERVAL '5 years'
      GROUP BY EXTRACT(YEAR FROM "expiryDate")
      ORDER BY year DESC
      LIMIT 10
    ` as Promise<{ year: number; count: number }[]>,
    prisma.trademark.aggregate({
      _count: { id: true },
      where: { isExpedited: true },
    }),
  ]);

  const clients = await prisma.user.findMany({
    where: {
      id: { in: byClient.map((c) => c.clientId) },
    },
    select: { id: true, name: true },
  });

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  return json({
    totalCount: totalStats._count.id,
    byClient: byClient.map((c) => ({
      clientId: c.clientId,
      clientName: clientMap.get(c.clientId) || "未知",
      count: c._count.id,
    })),
    byCategory: byCategory.map((c) => ({
      category: c.category,
      categoryName: c.categoryName,
      count: c._count.id,
    })),
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
    cycleStats,
    expeditedCount: expeditedStats._count.id,
    archivedCount: byStatus.find((s) => s.status === "ARCHIVED")?._count.status || 0,
    abandonedCount: byStatus.find((s) => s.status === "ABANDONED")?._count.status || 0,
  });
}

export default function Analytics() {
  const {
    totalCount,
    byClient,
    byCategory,
    byStatus,
    cycleStats,
    expeditedCount,
    archivedCount,
    abandonedCount,
  } = useLoaderData<typeof loader>();

  const successRate = totalCount > 0
    ? ((archivedCount / totalCount) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
          数据复盘
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          商标续展业务统计分析
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-500">商标总数</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {totalCount}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-500">已完成归档</p>
          <p className="mt-1 text-3xl font-semibold text-green-600">
            {archivedCount}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-500">客户放弃</p>
          <p className="mt-1 text-3xl font-semibold text-gray-500">
            {abandonedCount}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-gray-500">加急处理</p>
          <p className="mt-1 text-3xl font-semibold text-red-600">
            {expeditedCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              按客户聚合（TOP 10）
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-3">
              {byClient.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无数据</p>
              ) : (
                byClient.map((item, index) => (
                  <div key={item.clientId} className="flex items-center">
                    <span className="w-6 text-sm text-gray-500">
                      {index + 1}
                    </span>
                    <div className="flex-1 ml-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {item.clientName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.count} 件
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(item.count / totalCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              按商标类别聚合（TOP 10）
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-3">
              {byCategory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无数据</p>
              ) : (
                byCategory.map((item, index) => (
                  <div key={item.category} className="flex items-center">
                    <span className="w-6 text-sm text-gray-500">
                      {index + 1}
                    </span>
                    <div className="flex-1 ml-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          第{item.category}类 - {item.categoryName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.count} 件
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${(item.count / totalCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              状态分布
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-3">
              {byStatus.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无数据</p>
              ) : (
                byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <StatusBadge status={item.status as any} />
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(item.count / totalCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              续展周期分布
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-3">
              {cycleStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无数据</p>
              ) : (
                cycleStats.map((item: any) => (
                  <div key={item.year} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {item.year}年
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((Number(item.count) / totalCount) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {Number(item.count)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            关键指标
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                完成率
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {successRate}%
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                加急占比
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {totalCount > 0 ? ((expeditedCount / totalCount) * 100).toFixed(1) : 0}%
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                放弃率
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-600">
                {totalCount > 0 ? ((abandonedCount / totalCount) * 100).toFixed(1) : 0}%
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                客户数量
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">
                {byClient.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
