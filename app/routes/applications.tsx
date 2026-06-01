import { Link, useLoaderData } from "@remix-run/react";
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

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["SOCIAL_WORKER", "MANAGER"]);

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      recipient: { select: { name: true } },
      applicant: { select: { name: true } },
    },
  });

  return json({ user, applications });
}

export default function Applications() {
  const data = useLoaderData<typeof loader>();

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">发放申请</h1>
          <Link to="/applications/new">
            <Button>新建申请</Button>
          </Link>
        </div>

        <Card>
          {data.applications.length === 0 ? (
            <EmptyState
              title="暂无申请记录"
              description="点击上方按钮创建新的发放申请"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请编号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">受助对象</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/applications/${app.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          {app.appNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.recipient.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.applicant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(app.appliedAt), "yyyy-MM-dd")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={app.status} type="application" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/applications/${app.id}`}
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
