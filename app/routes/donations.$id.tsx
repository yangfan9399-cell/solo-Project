import { Link, useLoaderData, useParams } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Button } from "~/components/ui/Button";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);

  const batch = await prisma.donationBatch.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true } },
      materials: {
        include: {
          material: true,
        },
      },
      inspections: {
        include: {
          inspector: { select: { name: true } },
          items: {
            include: {
              donationMaterial: {
                include: { material: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      stockEntries: {
        include: {
          user: { select: { name: true } },
          items: {
            include: { material: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!batch) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ user, batch });
}

export default function DonationDetail() {
  const data = useLoaderData<typeof loader>();
  const { batch } = data;

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/donations" className="text-gray-500 hover:text-gray-700">
              ← 返回列表
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              捐赠批次详情
            </h1>
          </div>
          <div className="flex gap-3">
            {batch.status === "PENDING" && (
              <Link to={`/donations/${batch.id}/inspect`}>
                <Button>开始质检</Button>
              </Link>
            )}
            {batch.status === "APPROVED" && (
              <Link to={`/donations/${batch.id}/stock-in`}>
                <Button>入库</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>基本信息</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="批次编号" value={batch.batchNo} />
                <InfoItem label="状态" value={<StatusBadge status={batch.status} type="donation" />} />
                <InfoItem label="捐赠方" value={batch.donorName} />
                <InfoItem label="联系电话" value={batch.donorPhone || "-"} />
                <InfoItem label="电子邮箱" value={batch.donorEmail || "-"} />
                <InfoItem label="物资总数" value={`${batch.totalItems} 件`} />
                <InfoItem label="总价值" value={`¥${batch.totalValue.toFixed(2)}`} />
                <InfoItem label="登记人" value={batch.user.name} />
                <InfoItem
                  label="登记时间"
                  value={format(new Date(batch.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                />
                <InfoItem
                  label="收捐时间"
                  value={format(new Date(batch.receivedAt), "yyyy年MM月dd日", { locale: zhCN })}
                />
              </div>
              {batch.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">备注说明</label>
                  <p className="mt-1 text-gray-900">{batch.description}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>操作记录</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-3">
              <TimelineItem
                icon="📝"
                title="创建批次"
                time={format(new Date(batch.createdAt), "yyyy-MM-dd HH:mm")}
                user={batch.user.name}
              />
              {batch.inspections.map((ins) => (
                <TimelineItem
                  key={ins.id}
                  icon="✅"
                  title={`质检: ${ins.result === "PASSED" ? "通过" : ins.result === "FAILED" ? "不通过" : "部分合格"}`}
                  time={format(new Date(ins.inspectionDate), "yyyy-MM-dd HH:mm")}
                  user={ins.inspector.name}
                />
              ))}
              {batch.stockEntries.map((entry) => (
                <TimelineItem
                  key={entry.id}
                  icon="📥"
                  title="入库完成"
                  time={format(new Date(entry.entryDate), "yyyy-MM-dd HH:mm")}
                  user={entry.user.name}
                />
              ))}
            </Card.Body>
          </Card>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>物资清单</Card.Title>
          </Card.Header>
          <Card.Body>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">物资名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">规格</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单价</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">小计</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {batch.materials.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{m.material.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.material.specs || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.material.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{m.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">¥{m.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">¥{(m.quantity * m.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.remark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Body>
        </Card>

        {batch.inspections.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>质检记录</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-6">
              {batch.inspections.map((ins) => (
                <div key={ins.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={ins.result} type="inspection" />
                        <span className="text-sm text-gray-500">
                          {ins.inspector.name} 于 {format(new Date(ins.inspectionDate), "yyyy-MM-dd HH:mm")} 质检
                        </span>
                      </div>
                      {ins.remark && (
                        <p className="mt-2 text-sm text-gray-600">{ins.remark}</p>
                      )}
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">物资</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">送检数量</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">合格数量</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">结果</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ins.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-sm">{item.donationMaterial.material.name}</td>
                          <td className="px-3 py-2 text-sm">{item.quantity}</td>
                          <td className="px-3 py-2 text-sm">{item.qualifiedQty}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={item.result} type="inspection" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </Card.Body>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function TimelineItem({ icon, title, time, user }: { 
  icon: string; 
  title: string; 
  time: string; 
  user: string 
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-xl">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{user} · {time}</p>
      </div>
    </div>
  );
}
