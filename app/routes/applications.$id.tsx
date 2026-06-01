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

const approveSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  remark: z.string().optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireRole(request, ["MANAGER"]);
  const formData = await request.formData();

  const result = approveSchema.safeParse({
    status: formData.get("status"),
    remark: formData.get("remark"),
  });

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors, success: false }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id: params.id },
      data: {
        status: result.data.status,
        approvedAt: new Date(),
        approvedBy: user.id,
        approveRemark: result.data.remark,
      },
      include: { items: true },
    });

    if (result.data.status === "APPROVED") {
      for (const item of app.items) {
        await tx.stock.updateMany({
          where: { materialId: item.materialId },
          data: {
            reservedQty: { increment: item.approvedQty || item.requestedQty },
            availableQty: { decrement: item.approvedQty || item.requestedQty },
          },
        });
      }
    }
  });

  return redirect(`/applications/${params.id}`);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["SOCIAL_WORKER", "MANAGER"]);

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      recipient: true,
      applicant: { select: { name: true } },
      approver: { select: { name: true } },
      items: { include: { material: true } },
      distributions: {
        include: {
          distributor: { select: { name: true } },
          items: { include: { material: true } },
        },
      },
    },
  });

  if (!application) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ user, application });
}

export default function ApplicationDetail() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { application } = data;

  const canApprove = application.status === "PENDING" && data.user.role === "MANAGER";

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/applications" className="text-gray-500 hover:text-gray-700">
              ← 返回列表
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">申请详情</h1>
          </div>
          <div className="flex gap-3">
            {application.status === "APPROVED" && (
              <Link to={`/distributions/new?applicationId=${application.id}`}>
                <Button>创建发放单</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>申请信息</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="申请编号" value={application.appNo} />
                <InfoItem label="状态" value={<StatusBadge status={application.status} type="application" />} />
                <InfoItem label="申请标题" value={application.title} />
                <InfoItem label="申请人" value={application.applicant.name} />
                <InfoItem
                  label="申请时间"
                  value={format(new Date(application.appliedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                />
                {application.approvedAt && (
                  <InfoItem
                    label="审批时间"
                    value={format(new Date(application.approvedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                  />
                )}
                {application.approver && (
                  <InfoItem label="审批人" value={application.approver.name} />
                )}
              </div>
              {application.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">申请说明</label>
                  <p className="mt-1 text-gray-900">{application.description}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>受助对象信息</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">姓名</label>
                <p className="text-gray-900">{application.recipient.name}</p>
              </div>
              {application.recipient.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">联系电话</label>
                  <p className="text-gray-900">{application.recipient.phone}</p>
                </div>
              )}
              {application.recipient.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">地址</label>
                  <p className="text-gray-900">{application.recipient.address}</p>
                </div>
              )}
              {application.recipient.category && (
                <div>
                  <label className="text-sm font-medium text-gray-500">类别</label>
                  <p className="text-gray-900">{application.recipient.category}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>申请物资清单</Card.Title>
          </Card.Header>
          <Card.Body>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">物资名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">规格</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">单位</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">申请数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">审批数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {application.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.material.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.material.specs || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.material.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.requestedQty}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.approvedQty ?? (application.status === "PENDING" ? "待审批" : item.requestedQty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Body>
        </Card>

        {canApprove && (
          <Card>
            <Card.Header>
              <Card.Title>审批操作</Card.Title>
            </Card.Header>
            <Form method="post">
              <Card.Body className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    审批结果
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        value="APPROVED"
                        defaultChecked
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-green-600 font-medium">通过</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        value="REJECTED"
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-red-600 font-medium">驳回</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    审批备注
                  </label>
                  <textarea
                    name="remark"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入审批备注"
                  />
                </div>
              </Card.Body>
              <Card.Footer className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "提交审批"}
                </Button>
              </Card.Footer>
            </Form>
          </Card>
        )}

        {application.distributions.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title>发放记录</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-4">
              {application.distributions.map((dist) => (
                <div key={dist.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/distributions/${dist.id}`}
                        className="font-medium text-primary-600 hover:text-primary-900"
                      >
                        {dist.distNo}
                      </Link>
                      <StatusBadge status={dist.status} type="distribution" />
                    </div>
                    <span className="text-sm text-gray-500">
                      发放人: {dist.distributor.name}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500">物资</th>
                        <th className="px-3 py-2 text-left text-gray-500">数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dist.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.material.name}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
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
