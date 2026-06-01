import { useState } from "react";
import { Form, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

const stockInSchema = z.object({
  warehouseLocation: z.string().min(1, "请选择仓库位置"),
  remark: z.string().optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN"]);
  const formData = await request.formData();

  const result = stockInSchema.safeParse({
    warehouseLocation: formData.get("warehouseLocation"),
    remark: formData.get("remark"),
  });

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors, success: false }, { status: 400 });
  }

  const entryNo = `IN-${new Date().getFullYear()}-${String(await prisma.stockEntry.count() + 1).padStart(4, '0')}`;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.donationBatch.findUnique({
      where: { id: params.id },
      include: { materials: true },
    });

    if (!batch) throw new Error("批次不存在");

    const entry = await tx.stockEntry.create({
      data: {
        entryNo,
        batchId: params.id!,
        entryBy: user.id,
        remark: result.data.remark,
        items: {
          create: batch.materials.map((m) => ({
            donationMaterialId: m.id,
            materialId: m.materialId,
            quantity: m.quantity,
            warehouseLocation: result.data.warehouseLocation,
          })),
        },
      },
    });

    for (const m of batch.materials) {
      await tx.stock.upsert({
        where: {
          materialId_warehouseLocation: {
            materialId: m.materialId,
            warehouseLocation: result.data.warehouseLocation,
          },
        },
        update: {
          quantity: { increment: m.quantity },
          availableQty: { increment: m.quantity },
        },
        create: {
          materialId: m.materialId,
          quantity: m.quantity,
          availableQty: m.quantity,
          minWarningQty: 20,
          warehouseLocation: result.data.warehouseLocation,
        },
      });
    }

    await tx.donationBatch.update({
      where: { id: params.id },
      data: { status: "STORED" },
    });
  });

  return redirect(`/donations/${params.id}`);
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN"]);
  const batch = await prisma.donationBatch.findUnique({
    where: { id: params.id },
    include: {
      materials: { include: { material: true } },
    },
  });

  if (!batch || batch.status !== "APPROVED") {
    throw redirect(`/donations/${params.id}`);
  }

  return json({ user, batch });
}

export default function StockIn() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";
  const [warehouseLocation, setWarehouseLocation] = useState("A区");

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">仓储入库</h1>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            取消
          </Button>
        </div>

        <Form method="post">
          <Card>
            <Card.Header>
              <Card.Title>入库信息</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    批次编号
                  </label>
                  <p className="text-gray-900">{data.batch.batchNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    捐赠方
                  </label>
                  <p className="text-gray-900">{data.batch.donorName}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  仓库位置 <span className="text-red-500">*</span>
                </label>
                <select
                  name="warehouseLocation"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="A区">A区仓库</option>
                  <option value="B区">B区仓库</option>
                  <option value="C区">C区仓库</option>
                  <option value="D区">D区仓库</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  name="remark"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="入库备注说明"
                />
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-6">
            <Card.Header>
              <Card.Title>入库物资清单</Card.Title>
            </Card.Header>
            <Card.Body>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">物资名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">规格</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">单位</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">入库数量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.batch.materials.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{m.material.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.material.specs || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.material.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{m.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Body>
            <Card.Footer className="flex justify-end gap-4">
              <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "入库中..." : "确认入库"}
              </Button>
            </Card.Footer>
          </Card>
        </Form>
      </div>
    </AppLayout>
  );
}
