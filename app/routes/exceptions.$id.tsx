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
import { exceptionTypeLabels, exceptionStatusLabels } from "~/utils/labels";

type ExceptionStatus = "OPEN" | "PROCESSING" | "RESOLVED" | "CLOSED";

const processSchema = z.object({
  status: z.enum(["PROCESSING", "RESOLVED", "CLOSED"]),
  resolution: z.string().optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);
  const formData = await request.formData();

  const result = processSchema.safeParse({
    status: formData.get("status"),
    resolution: formData.get("resolution"),
  });

  if (!result.success) {
    return json({ errors: result.error.flatten(), success: false }, { status: 400 });
  }

  await prisma.exceptionRecord.update({
    where: { id: params.id },
    data: {
      status: result.data.status,
      processedBy: user.id,
      processedAt: new Date(),
      resolution: result.data.resolution,
    },
  });

  return redirect(`/exceptions/${params.id}`);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);

  const exception = await prisma.exceptionRecord.findUnique({
    where: { id: params.id },
    include: {
      reporter: { select: { name: true } },
      processor: { select: { name: true } },
      batch: { select: { id: true, batchNo: true, donorName: true } },
      distribution: { select: { id: true, distNo: true } },
    },
  });

  if (!exception) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ user, exception });
}

export default function ExceptionDetail() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { exception } = data;

  const canProcess = exception.status !== "CLOSED";

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/exceptions" className="text-gray-500 hover:text-gray-700">
            ← 返回列表
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">异常详情</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>基本信息</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="异常编号" value={exception.exceptionNo} />
                <InfoItem label="状态" value={<StatusBadge status={exception.status} type="exception" />} />
                <InfoItem label="异常类型" value={exceptionTypeLabels[exception.type] || exception.type} />
                <InfoItem label="报告人" value={exception.reporter.name} />
                <InfoItem
                  label="报告时间"
                  value={format(new Date(exception.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                />
                {exception.processedAt && (
                  <InfoItem
                    label="处理时间"
                    value={format(new Date(exception.processedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                  />
                )}
                {exception.processor && (
                  <InfoItem label="处理人" value={exception.processor.name} />
                )}
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">异常标题</label>
                <p className="mt-1 text-gray-900 font-medium">{exception.title}</p>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">异常描述</label>
                <p className="mt-1 text-gray-900">{exception.description}</p>
              </div>
              {exception.resolution && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">处理结果</label>
                  <p className="mt-1 text-gray-900">{exception.resolution}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>关联信息</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-3">
              {exception.batch ? (
                <div>
                  <label className="text-sm font-medium text-gray-500">关联捐赠批次</label>
                  <p className="mt-1">
                    <Link
                      to={`/donations/${exception.batch.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {exception.batch.batchNo}
                    </Link>
                  </p>
                  <p className="text-sm text-gray-500">{exception.batch.donorName}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">无关联批次</p>
              )}
              {exception.distribution && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">关联发放单</label>
                  <p className="mt-1">
                    <Link
                      to={`/distributions/${exception.distribution.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {exception.distribution.distNo}
                    </Link>
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {canProcess && (
          <Card>
            <Card.Header>
              <Card.Title>处理异常</Card.Title>
            </Card.Header>
            <Form method="post">
              <Card.Body className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    处理状态
                  </label>
                  <div className="flex gap-4">
                    {(["PROCESSING", "RESOLVED", "CLOSED"] as ExceptionStatus[]).map((s) => (
                      <label key={s} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          defaultChecked={exception.status === s}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <StatusBadge status={s} type="exception" />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    处理结果
                  </label>
                  <textarea
                    name="resolution"
                    rows={3}
                    defaultValue={exception.resolution || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入处理结果说明"
                  />
                </div>
              </Card.Body>
              <Card.Footer className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "提交中..." : "提交处理结果"}
                </Button>
              </Card.Footer>
            </Form>
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
