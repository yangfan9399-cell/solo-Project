import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { format } from "date-fns";
import { donationStatusLabels } from "~/utils/labels";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");

  const where = statusFilter ? { status: statusFilter as any } : {};

  const donations = await prisma.donationBatch.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      _count: {
        select: { materials: true },
      },
    },
  });

  return json({ user, donations, statusFilter });
}

export default function Donations() {
  const data = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {data.statusFilter
              ? donationStatusLabels[data.statusFilter as keyof typeof donationStatusLabels] || "捐赠批次管理"
              : "捐赠批次管理"}
          </h1>
          <div className="flex gap-3">
            <select
              value={data.statusFilter || ""}
              onChange={(e) => {
                const val = e.target.value;
                setSearchParams(val ? { status: val } : {});
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部状态</option>
              <option value="PENDING">待接收</option>
              <option value="INSPECTING">质检中</option>
              <option value="APPROVED">已质检</option>
              <option value="REJECTED">质检不通过</option>
              <option value="STORED">已入库</option>
            </select>
            <Link to="/donations/new">
              <Button>新建捐赠批次</Button>
            </Link>
          </div>
        </div>

        <Card>
          {data.donations.length === 0 ? (
            <EmptyState
              title="暂无捐赠批次"
              description="点击上方按钮创建新的捐赠批次"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      批次编号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      捐赠方
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      物资种类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      总数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      总价值
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.donations.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/donations/${batch.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          {batch.batchNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {batch.donorName}
                        </div>
                        {batch.donorPhone && (
                          <div className="text-sm text-gray-500">
                            {batch.donorPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {batch._count.materials} 种
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {batch.totalItems} 件
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ¥{batch.totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={batch.status} type="donation" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/donations/${batch.id}`}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          查看
                        </Link>
                        {batch.status === "PENDING" && (
                          <Link
                            to={`/donations/${batch.id}/inspect`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            质检
                          </Link>
                        )}
                        {batch.status === "APPROVED" && (
                          <Link
                            to={`/donations/${batch.id}/stock-in`}
                            className="text-green-600 hover:text-green-900"
                          >
                            入库
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
