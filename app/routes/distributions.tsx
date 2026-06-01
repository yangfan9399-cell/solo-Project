import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { EmptyState } from "~/components/ui/EmptyState";
import { format } from "date-fns";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "SOCIAL_WORKER"]);

  const distributions = await prisma.distribution.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      application: { include: { recipient: { select: { name: true } } } },
      distributor: { select: { name: true } },
    },
  });

  return json({ user, distributions });
}

export default function Distributions() {
  const data = useLoaderData<typeof loader>();

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">发放管理</h1>
        </div>

        <Card>
          {data.distributions.length === 0 ? (
            <EmptyState
              title="暂无发放记录"
              description="从已通过的申请中创建发放单"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发放编号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">受助对象</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">发放人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.distributions.map((dist) => (
                    <tr key={dist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/distributions/${dist.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          {dist.distNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dist.application.recipient.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dist.distributor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(dist.createdAt), "yyyy-MM-dd")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={dist.status} type="distribution" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/distributions/${dist.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          查看
                        </Link>
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
