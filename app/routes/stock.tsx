import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);

  const stock = await prisma.stock.findMany({
    orderBy: { material: { name: "asc" } },
    include: { material: true },
  });

  const alerts = await prisma.stockAlert.findMany({
    where: { isRead: false },
    include: { stock: { include: { material: true } } },
  });

  return json({ user, stock, alerts });
}

export default function Stock() {
  const data = useLoaderData<typeof loader>();

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">库存管理</h1>

        {data.alerts.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2 text-red-600">
                <span>⚠️</span>
                库存预警
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                {data.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{alert.stock.material.name}</span>
                      <span className="text-gray-500 ml-2">
                        当前库存: {alert.currentQty} / 预警值: {alert.threshold}
                      </span>
                    </div>
                    <span className="text-sm text-red-600">{alert.message}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        <Card>
          {data.stock.length === 0 ? (
            <EmptyState
              title="暂无库存数据"
              description="捐赠物资入库后将在这里显示"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物资名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">规格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">总库存</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">已预留</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">可用</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">预警值</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.stock.map((s) => {
                    const isLow = s.availableQty < s.minWarningQty;
                    return (
                      <tr key={s.id} className={isLow ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{s.material.name}</span>
                          {isLow && <span className="ml-2 text-red-500 text-xs">⚠️ 库存不足</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.material.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.material.specs || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.material.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.warehouseLocation || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{s.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{s.reservedQty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{s.availableQty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.minWarningQty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
