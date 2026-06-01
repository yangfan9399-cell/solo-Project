import { useState } from "react";
import { Form, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { requireRole } from "../../../.server/session.server";
import { prisma } from "../../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

const donationSchema = z.object({
  donorName: z.string().min(1, "捐赠方名称不能为空"),
  donorPhone: z.string().optional(),
  donorEmail: z.string().email().optional().or(z.literal("")),
  description: z.string().optional(),
  materials: z.array(
    z.object({
      materialId: z.string().min(1, "请选择物资"),
      quantity: z.coerce.number().min(1, "数量必须大于0"),
      unitPrice: z.coerce.number().min(0, "单价不能为负"),
      remark: z.string().optional(),
    })
  ).min(1, "至少添加一种物资"),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);

  const formData = await request.formData();
  const materialsData = JSON.parse(formData.get("materials") as string || "[]");

  const result = donationSchema.safeParse({
    donorName: formData.get("donorName"),
    donorPhone: formData.get("donorPhone"),
    donorEmail: formData.get("donorEmail"),
    description: formData.get("description"),
    materials: materialsData,
  });

  if (!result.success) {
    return json({
      errors: result.error.flatten(),
      success: false,
    }, { status: 400 });
  }

  const batchNo = `DON-${new Date().getFullYear()}-${String(await prisma.donationBatch.count() + 1).padStart(4, '0')}`;
  
  const totalItems = result.data.materials.reduce((sum, m) => sum + m.quantity, 0);
  const totalValue = result.data.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);

  await prisma.donationBatch.create({
    data: {
      batchNo,
      donorName: result.data.donorName,
      donorPhone: result.data.donorPhone,
      donorEmail: result.data.donorEmail || null,
      description: result.data.description,
      createdBy: user.id,
      totalItems,
      totalValue,
      materials: {
        create: result.data.materials.map(m => ({
          materialId: m.materialId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          remark: m.remark,
        })),
      },
    },
  });

  return redirect("/donations");
}

export async function loader({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "MANAGER"]);
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  });
  return json({ user, materials });
}

interface MaterialForm {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  remark: string;
}

export default function NewDonation() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const [materials, setMaterials] = useState<MaterialForm[]>([
    { id: "1", materialId: "", quantity: 1, unitPrice: 0, remark: "" },
  ]);

  const addMaterial = () => {
    setMaterials([...materials, {
      id: Date.now().toString(),
      materialId: "",
      quantity: 1,
      unitPrice: 0,
      remark: "",
    }]);
  };

  const removeMaterial = (id: string) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const updateMaterial = (id: string, field: keyof MaterialForm, value: any) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">新建捐赠批次</h1>
          <Button variant="secondary" onClick={() => navigate("/donations")}>
            取消
          </Button>
        </div>

        <Form method="post">
          <input
            type="hidden"
            name="materials"
            value={JSON.stringify(materials.filter(m => m.materialId))}
          />

          <Card>
            <Card.Header>
              <Card.Title>基本信息</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    捐赠方名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="donorName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入捐赠方名称"
                  />
                  {actionData?.errors?.fieldErrors.donorName && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.fieldErrors.donorName[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系电话
                  </label>
                  <input
                    type="text"
                    name="donorPhone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入联系电话"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    name="donorEmail"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入电子邮箱"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注说明
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入备注说明"
                />
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-6">
            <Card.Header className="flex items-center justify-between">
              <Card.Title>物资清单</Card.Title>
              <Button type="button" size="sm" onClick={addMaterial}>
                + 添加物资
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {materials.map((m, index) => (
                  <div key={m.id} className="flex gap-4 items-end pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        物资名称 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={m.materialId}
                        onChange={(e) => updateMaterial(m.id, "materialId", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">请选择物资</option>
                        {data.materials.map((mat) => (
                          <option key={mat.id} value={mat.id}>
                            {mat.name} ({mat.specs || mat.unit})
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
                        value={m.quantity}
                        onChange={(e) => updateMaterial(m.id, "quantity", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        单价(元)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={m.unitPrice}
                        onChange={(e) => updateMaterial(m.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        备注
                      </label>
                      <input
                        type="text"
                        value={m.remark}
                        onChange={(e) => updateMaterial(m.id, "remark", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="备注说明"
                      />
                    </div>
                    {materials.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeMaterial(m.id)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
            <Card.Footer className="flex justify-end gap-4">
              <Button variant="secondary" type="button" onClick={() => navigate("/donations")}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交"}
              </Button>
            </Card.Footer>
          </Card>
        </Form>
      </div>
    </AppLayout>
  );
}
