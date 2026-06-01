import { Form, Link, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { requireRole } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "SOCIAL_WORKER"]);
  const formData = await request.formData();
  const applicationId = formData.get("applicationId") as string;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { items: true },
  });

  if (!application || application.status !== "APPROVED") {
    return json({ error: "申请不存在或未通过审批" }, { status: 400 });
  }

  const distNo = `DIST-${new Date().getFullYear()}-${String(await prisma.distribution.count() + 1).padStart(4, '0')}`;

  const distribution = await prisma.distribution.create({
    data: {
      distNo,
      applicationId,
      distributorId: user.id,
      items: {
        create: application.items.map((item) => ({
          materialId: item.materialId,
          quantity: item.approvedQty || item.requestedQty,
        })),
      },
    },
  });

  return redirect(`/distributions/${distribution.id}`);
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN", "SOCIAL_WORKER"]);

  const [searchParams] = await Promise.resolve([new URL(request.url).searchParams]);
  const applicationId = searchParams.get("applicationId");

  let application = null;
  if (applicationId) {
    application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        recipient: { select: { name: true } },
        items: { include: { material: true } },
      },
    });
  }

  const approvedApplications = await prisma.application.findMany({
    where: { status: "APPROVED" },
    include: { recipient: { select: { name: true } } },
  });

  return json({ user, application, approvedApplications, selectedApplicationId: applicationId });
}

export default function NewDistribution() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">创建发放单</h1>
          <Button variant="secondary" onClick={() => navigate("/distributions")}>
            取消
          </Button>
        </div>

        {data.application ? (
          <Form method="post">
            <input type="hidden" name="applicationId" value={data.application.id} />

            <Card>
              <Card.Header>
                <Card.Title>发放信息</Card.Title>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="申请编号" value={data.application.appNo} />
                  <InfoItem label="受助对象" value={data.application.recipient.name} />
                </div>
              </Card.Body>
            </Card>

            <Card className="mt-6">
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
                    {data.application.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.material.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.material.specs || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.material.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.approvedQty || item.requestedQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card.Body>
              <Card.Footer className="flex justify-end gap-4">
                <Button variant="secondary" type="button" onClick={() => navigate("/distributions")}>
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "创建中..." : "创建发放单"}
                </Button>
              </Card.Footer>
            </Card>
          </Form>
        ) : (
          <Card>
            <Card.Body>
              <p className="text-gray-500">请从已通过的申请详情页创建发放单</p>
              <div className="mt-4">
                <Link to="/applications" className="text-primary-600 hover:text-primary-700">
                  → 前往申请列表
                </Link>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
