import { Link, useLoaderData, Form } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { format } from "date-fns";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);
  const formData = await request.formData();
  const alertId = formData.get("alertId") as string;

  if (alertId) {
    await prisma.stockAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  return redirect("/stock");
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);

  const stock = await prisma.stock.findMany({
    orderBy: { material: { name: "asc" } },
    include: { material: true },
  });

  const alerts = await prisma.stockAlert.findMany({
    where: { isRead: false },
    include: { stock: { include: { material: true } } },
    orderBy: { createdAt: "desc" },
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
                库存预警 ({data.alerts.length})
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {alert.stock.material.name}
                        </span>
                        <span className="text-sm text-red-600 font-medium">
                          {alert.message}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>
                          当前可用: {alert.currentQty} / 预警阈值: {alert.threshold}
                        </span>
                        <span>
                          产生时间: {format(new Date(alert.createdAt), "yyyy-MM-dd HH:mm")}
                        </span>
                        {alert.stock.warehouseLocation && (
                          <span>仓库: {alert.stock.warehouseLocation}</span>
                        )}
                      </div>
                    </div>
                    <Form method="post" className="ml-4">
                      <input type="hidden" name="alertId" value={alert.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        标记已读
                      </Button>
                    </Form>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.stock.map((s) => {
                    const isLow = s.availableQty < s.minWarningQty;
                    return (
                      <tr key={s.id} className={isLow ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{s.material.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.material.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.material.specs || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.material.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.warehouseLocation || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{s.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{s.reservedQty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{s.availableQty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.minWarningQty}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLow ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ 库存不足
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              正常
                            </span>
                          )}
                        </td>
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
