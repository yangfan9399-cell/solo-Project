import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["SOCIAL_WORKER", "MANAGER"]);

  const recipients = await prisma.recipient.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  return json({ user, recipients });
}

export default function Recipients() {
  const data = useLoaderData<typeof loader>();

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">受助对象管理</h1>
          <Link to="/recipients/new">
            <Button>新建受助对象</Button>
          </Link>
        </div>

        <Card>
          {data.recipients.length === 0 ? (
            <EmptyState
              title="暂无受助对象"
              description="点击上方按钮添加新的受助对象"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系电话</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请次数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">认证状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recipients.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{r.name}</div>
                        {r.idCard && (
                          <div className="text-sm text-gray-500">{r.idCard}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.phone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.category || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r._count.applications} 次
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {r.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            已认证
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            待认证
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/recipients/${r.id}`}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          查看
                        </Link>
                        <Link
                          to={`/applications/new?recipientId=${r.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          申请
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
