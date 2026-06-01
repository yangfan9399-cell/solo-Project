import { Link, useLoaderData, Form, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { Button } from "~/components/ui/Button";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { DistributionStatus } from "@prisma/client";

const statusSchema = z.object({
  status: z.enum(["SHIPPED", "DELIVERED", "SIGNED"]),
  signedBy: z.string().optional(),
  signRemark: z.string().optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "SOCIAL_WORKER"]);
  const formData = await request.formData();

  const result = statusSchema.safeParse({
    status: formData.get("status"),
    signedBy: formData.get("signedBy"),
    signRemark: formData.get("signRemark"),
  });

  if (!result.success) {
    return json({ errors: result.error.flatten(), success: false }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const updateData: any = { status: result.data.status };

    if (result.data.status === "SHIPPED") {
      updateData.shippedAt = new Date();
    } else if (result.data.status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    } else if (result.data.status === "SIGNED") {
      updateData.signedAt = new Date();
      updateData.signedBy = result.data.signedBy;
      updateData.signRemark = result.data.signRemark;

      const dist = await tx.distribution.findUnique({
        where: { id: params.id },
        include: { items: true, application: true },
      });

      if (dist) {
        for (const item of dist.items) {
          await tx.stock.updateMany({
            where: { materialId: item.materialId },
            data: {
              quantity: { decrement: item.quantity },
              reservedQty: { decrement: item.quantity },
            },
          });
        }

        await tx.application.update({
          where: { id: dist.applicationId },
          data: { status: "DISTRIBUTED" },
        });
      }
    }

    await tx.distribution.update({
      where: { id: params.id },
      data: updateData,
    });
  });

  return redirect(`/distributions/${params.id}`);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "SOCIAL_WORKER"]);

  const distribution = await prisma.distribution.findUnique({
    where: { id: params.id },
    include: {
      application: { include: { recipient: true } },
      distributor: { select: { name: true } },
      items: { include: { material: true } },
    },
  });

  if (!distribution) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ user, distribution });
}

export default function DistributionDetail() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { distribution } = data;

  const nextStatus = getNextStatus(distribution.status);

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/distributions" className="text-gray-500 hover:text-gray-700">
            ← 返回列表
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">发放详情</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>发放信息</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="发放编号" value={distribution.distNo} />
                <InfoItem label="状态" value={<StatusBadge status={distribution.status} type="distribution" />} />
                <InfoItem label="发放人" value={distribution.distributor.name} />
                <InfoItem label="创建时间" value={format(new Date(distribution.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })} />
                {distribution.shippedAt && (
                  <InfoItem label="出库时间" value={format(new Date(distribution.shippedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })} />
                )}
                {distribution.deliveredAt && (
                  <InfoItem label="送达时间" value={format(new Date(distribution.deliveredAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })} />
                )}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>签收信息</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-3">
              {distribution.signedAt ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">签收人</label>
                    <p className="text-gray-900">{distribution.signedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">签收时间</label>
                    <p className="text-gray-900">
                      {format(new Date(distribution.signedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                    </p>
                  </div>
                  {distribution.signRemark && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">签收备注</label>
                      <p className="text-gray-900">{distribution.signRemark}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm">尚未签收</p>
              )}
            </Card.Body>
          </Card>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>受助对象信息</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="姓名" value={distribution.application.recipient.name} />
              <InfoItem label="电话" value={distribution.application.recipient.phone || "-"} />
              <InfoItem label="地址" value={distribution.application.recipient.address || "-"} />
              <InfoItem label="类别" value={distribution.application.recipient.category || "-"} />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>发放物资清单</Card.Title>
          </Card.Header>
          <Card.Body>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">物资名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">规格</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">单位</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">发放数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {distribution.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.material.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.material.specs || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.material.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Body>
        </Card>

        {nextStatus && (
          <Card>
            <Card.Header>
              <Card.Title>状态流转</Card.Title>
            </Card.Header>
            <Form method="post">
              <input type="hidden" name="status" value={nextStatus} />
              <Card.Body className="space-y-4">
                <p className="text-gray-600">
                  当前状态：<StatusBadge status={distribution.status} type="distribution" />
                </p>
                <p className="text-gray-600">
                  下一步操作：<span className="font-medium text-primary-600">{getStatusLabel(nextStatus)}</span>
                </p>
                {nextStatus === "SIGNED" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        签收人 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="signedBy"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="请输入签收人姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        签收备注
                      </label>
                      <textarea
                        name="signRemark"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="签收备注说明"
                      />
                    </div>
                  </>
                )}
              </Card.Body>
              <Card.Footer className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : `确认${getStatusLabel(nextStatus)}`}
                </Button>
              </Card.Footer>
            </Form>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function getNextStatus(status: DistributionStatus): DistributionStatus | null {
  const flow: Record<DistributionStatus, DistributionStatus | null> = {
    PREPARING: "SHIPPED",
    SHIPPED: "DELIVERED",
    DELIVERED: "SIGNED",
    SIGNED: null,
    CANCELLED: null,
  };
  return flow[status];
}

function getStatusLabel(status: DistributionStatus): string {
  const labels: Record<DistributionStatus, string> = {
    PREPARING: "准备中",
    SHIPPED: "出库",
    DELIVERED: "送达",
    SIGNED: "签收",
    CANCELLED: "取消",
  };
  return labels[status];
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
