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
import { StatusBadge } from "~/components/ui/StatusBadge";
import type { InspectionResult } from "@prisma/client";

const inspectionSchema = z.object({
  result: z.enum(["PASSED", "FAILED", "PARTIAL"]),
  remark: z.string().optional(),
  items: z.array(
    z.object({
      materialId: z.string(),
      quantity: z.coerce.number(),
      qualifiedQty: z.coerce.number(),
      result: z.enum(["PASSED", "FAILED", "PARTIAL"]),
    })
  ),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN"]);
  const formData = await request.formData();
  const itemsData = JSON.parse(formData.get("items") as string || "[]");

  const result = inspectionSchema.safeParse({
    result: formData.get("result"),
    remark: formData.get("remark"),
    items: itemsData,
  });

  if (!result.success) {
    return json({ errors: result.error.flatten(), success: false }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const inspection = await tx.inspection.create({
      data: {
        batchId: params.id!,
        inspectorId: user.id,
        result: result.data.result as InspectionResult,
        remark: result.data.remark,
        items: {
          create: result.data.items.map((item: any) => ({
            donationMaterialId: item.materialId,
            quantity: item.quantity,
            qualifiedQty: item.qualifiedQty,
            result: item.result,
          })),
        },
      },
    });

    const newStatus = result.data.result === "FAILED" ? "REJECTED" : 
                     result.data.result === "PASSED" ? "APPROVED" : "APPROVED";
    
    await tx.donationBatch.update({
      where: { id: params.id },
      data: { status: newStatus },
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

  if (!batch || batch.status !== "PENDING") {
    throw redirect(`/donations/${params.id}`);
  }

  return json({ user, batch });
}

interface InspectionItem {
  materialId: string;
  quantity: number;
  qualifiedQty: number;
  result: InspectionResult;
}

export default function InspectDonation() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const [overallResult, setOverallResult] = useState<InspectionResult>("PASSED");
  const [items, setItems] = useState<InspectionItem[]>(
    data.batch.materials.map((m) => ({
      materialId: m.id,
      quantity: m.quantity,
      qualifiedQty: m.quantity,
      result: "PASSED" as InspectionResult,
    }))
  );

  const updateItem = (materialId: string, field: keyof InspectionItem, value: any) => {
    setItems(items.map((item) =>
      item.materialId === materialId ? { ...item, [field]: value } : item
    ));
  };

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">物资质检</h1>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            取消
          </Button>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>{data.batch.batchNo} - {data.batch.donorName}</Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-gray-500 mb-4">对捐赠物资进行质量检验，确认合格后入库</p>
          </Card.Body>
        </Card>

        <Form method="post">
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          
          <Card>
            <Card.Header>
              <Card.Title>质检明细</Card.Title>
            </Card.Header>
            <Card.Body>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">物资名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">送检数量</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">合格数量</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">质检结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const material = data.batch.materials.find((m) => m.id === item.materialId);
                    return (
                      <tr key={item.materialId}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {material?.material.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.qualifiedQty}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0;
                              const result: InspectionResult = 
                                qty === 0 ? "FAILED" : 
                                qty < item.quantity ? "PARTIAL" : "PASSED";
                              updateItem(item.materialId, "qualifiedQty", qty);
                              updateItem(item.materialId, "result", result);
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.result} type="inspection" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card.Body>
          </Card>

          <Card className="mt-6">
            <Card.Header>
              <Card.Title>质检结论</Card.Title>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  整体质检结果
                </label>
                <div className="flex gap-4">
                  {(["PASSED", "PARTIAL", "FAILED"] as InspectionResult[]).map((r) => (
                    <label key={r} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="result"
                        value={r}
                        checked={overallResult === r}
                        onChange={() => setOverallResult(r)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <StatusBadge status={r} type="inspection" />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  质检备注
                </label>
                <textarea
                  name="remark"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入质检备注说明"
                />
              </div>
            </Card.Body>
            <Card.Footer className="flex justify-end gap-4">
              <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交质检结果"}
              </Button>
            </Card.Footer>
          </Card>
        </Form>
      </div>
    </AppLayout>
  );
}
