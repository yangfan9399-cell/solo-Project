import { useState } from "react";
import { Form, useLoaderData, useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

const applicationSchema = z.object({
  recipientId: z.string().min(1, "请选择受助对象"),
  title: z.string().min(1, "申请标题不能为空"),
  description: z.string().optional(),
  items: z.array(
    z.object({
      materialId: z.string().min(1, "请选择物资"),
      requestedQty: z.coerce.number().min(1, "数量必须大于0"),
    })
  ).min(1, "至少添加一种物资"),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["SOCIAL_WORKER", "MANAGER"]);
  const formData = await request.formData();
  const itemsData = JSON.parse(formData.get("items") as string || "[]");

  const result = applicationSchema.safeParse({
    recipientId: formData.get("recipientId"),
    title: formData.get("title"),
    description: formData.get("description"),
    items: itemsData,
  });

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors, success: false }, { status: 400 });
  }

  const appNo = `APP-${new Date().getFullYear()}-${String(await prisma.application.count() + 1).padStart(4, '0')}`;

  await prisma.application.create({
    data: {
      appNo,
      recipientId: result.data.recipientId,
      applicantId: user.id,
      title: result.data.title,
      description: result.data.description,
      items: {
        create: result.data.items.map((item) => ({
          materialId: item.materialId,
          requestedQty: item.requestedQty,
        })),
      },
    },
  });

  return redirect("/applications");
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["SOCIAL_WORKER", "MANAGER"]);

  const [recipients, materials, stock] = await Promise.all([
    prisma.recipient.findMany({ orderBy: { name: "asc" } }),
    prisma.material.findMany({ orderBy: { name: "asc" } }),
    prisma.stock.findMany({
      include: { material: true },
      where: { availableQty: { gt: 0 } },
    }),
  ]);

  return json({ user, recipients, materials, stock });
}

interface ApplicationItem {
  id: string;
  materialId: string;
  requestedQty: number;
}

export default function NewApplication() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const [items, setItems] = useState<ApplicationItem[]>([
    { id: "1", materialId: "", requestedQty: 1 },
  ]);
  const [recipientId, setRecipientId] = useState(searchParams.get("recipientId") || "");

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), materialId: "", requestedQty: 1 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ApplicationItem, value: any) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const getAvailableQty = (materialId: string) => {
    const s = data.stock.find((st) => st.materialId === materialId);
    return s?.availableQty || 0;
  };

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">新建发放申请</h1>
          <Button variant="secondary" onClick={() => navigate("/applications")}>
            取消
          </Button>
        </div>

        <Form method="post">
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(items.filter((i) => i.materialId))}
          />

          <Card>
            <Card.Body className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    受助对象 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="recipientId"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择受助对象</option>
                    {data.recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.category ? `(${r.category})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    申请标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入申请标题"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  申请说明
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入申请说明"
                />
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-6">
            <Card.Header className="flex items-center justify-between">
              <Card.Title>申请物资清单</Card.Title>
              <Button type="button" size="sm" onClick={addItem}>
                + 添加物资
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex gap-4 items-end pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        物资名称 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.materialId}
                        onChange={(e) => updateItem(item.id, "materialId", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">请选择物资</option>
                        {data.stock.map((s) => (
                          <option key={s.materialId} value={s.materialId}>
                            {s.material.name} (库存: {s.availableQty})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        数量 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={getAvailableQty(item.materialId)}
                        value={item.requestedQty}
                        onChange={(e) => updateItem(item.id, "requestedQty", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
            <Card.Footer className="flex justify-end gap-4">
              <Button variant="secondary" type="button" onClick={() => navigate("/applications")}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交申请"}
              </Button>
            </Card.Footer>
          </Card>
        </Form>
      </div>
    </AppLayout>
  );
}
