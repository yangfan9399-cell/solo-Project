import { Form, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

const exceptionSchema = z.object({
  type: z.enum(["QUALITY_ISSUE", "QUANTITY_MISMATCH", "DAMAGE", "LOSS", "OTHER"]),
  title: z.string().min(1, "标题不能为空"),
  description: z.string().min(1, "描述不能为空"),
  relatedBatchId: z.string().optional(),
  relatedDistId: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);
  const formData = await request.formData();

  const result = exceptionSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    relatedBatchId: formData.get("relatedBatchId") || undefined,
    relatedDistId: formData.get("relatedDistId") || undefined,
  });

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors, success: false }, { status: 400 });
  }

  const exceptionNo = `EXC-${new Date().getFullYear()}-${String(await prisma.exceptionRecord.count() + 1).padStart(4, '0')}`;

  await prisma.exceptionRecord.create({
    data: {
      exceptionNo,
      type: result.data.type,
      title: result.data.title,
      description: result.data.description,
      relatedBatchId: result.data.relatedBatchId,
      relatedDistId: result.data.relatedDistId,
      reportedBy: user.id,
    },
  });

  return redirect("/exceptions");
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);

  const [batches, distributions] = await Promise.all([
    prisma.donationBatch.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.distribution.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return json({ user, batches, distributions });
}

export default function NewException() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const typeOptions = [
    { value: "QUALITY_ISSUE", label: "质量问题" },
    { value: "QUANTITY_MISMATCH", label: "数量不符" },
    { value: "DAMAGE", label: "损坏" },
    { value: "LOSS", label: "丢失" },
    { value: "OTHER", label: "其他" },
  ];

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">新建异常记录</h1>
          <Button variant="secondary" onClick={() => navigate("/exceptions")}>
            取消
          </Button>
        </div>

        <Form method="post">
          <Card>
            <Card.Body className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    异常类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择异常类型</option>
                    {typeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    关联捐赠批次
                  </label>
                  <select
                    name="relatedBatchId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">无</option>
                    {data.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchNo} - {b.donorName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  异常标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入异常标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  异常描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请详细描述异常情况"
                />
              </div>
            </Card.Body>
            <Card.Footer className="flex justify-end gap-4">
              <Button variant="secondary" type="button" onClick={() => navigate("/exceptions")}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交异常记录"}
              </Button>
            </Card.Footer>
          </Card>
        </Form>
      </div>
    </AppLayout>
  );
}
