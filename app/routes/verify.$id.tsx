import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link, useNavigation } from "@remix-run/react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { prisma } from "~/db/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const application = await prisma.borrowApplication.findUnique({
    where: { id: params.id },
    include: {
      classroom: { include: { campus: true } },
      handovers: true,
    },
  });

  if (!application) {
    throw new Response("申请不存在", { status: 404 });
  }

  if (application.status !== "RETURN_PENDING") {
    throw new Response("该申请不在待核验状态", { status: 400 });
  }

  return json({ application });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const verifierName = formData.get("verifierName") as string;
  const cleaningStatus = formData.get("cleaningStatus") as string;
  const abnormalReason = formData.get("abnormalReason") as string;
  const cleaningPhoto = formData.get("cleaningPhoto") as string;

  const application = await prisma.borrowApplication.findUnique({
    where: { id: params.id },
    include: { handovers: true },
  });

  if (!application) {
    return json({ error: "申请不存在" }, { status: 404 });
  }

  await prisma.returnVerification.create({
    data: {
      applicationId: params.id!,
      cleaningStatus: cleaningStatus,
      cleaningPhoto: cleaningPhoto || null,
      abnormalReason: abnormalReason || null,
      verifierName: verifierName,
      verifiedAt: new Date(),
    },
  });

  await prisma.borrowApplication.update({
    where: { id: params.id },
    data: { status: "COMPLETED" },
  });

  for (const handover of application.handovers) {
    await prisma.equipment.updateMany({
      where: { name: handover.equipmentName, classroomId: application.classroomId },
      data: { status: "AVAILABLE" },
    });
  }

  await prisma.applicationHistory.create({
    data: {
      applicationId: params.id!,
      action: "COMPLETED",
      actor: verifierName,
      timestamp: new Date(),
      note:
        abnormalReason
          ? `归还核验完成，异常: ${
              abnormalReason === "EQUIPMENT_LOST"
                ? "设备遗失"
                : abnormalReason === "CLEANING_FAILED"
                ? "清洁不合格"
                : abnormalReason
            }`
          : "归还核验完成",
    },
  });

  return redirect(`/applications/${params.id}`);
};

export default function VerifyApplication() {
  const { application } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/verify" className="text-primary-600 hover:text-primary-700 text-sm">
          ← 返回核验列表
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">归还核验</h1>
        <p className="mt-2 text-gray-600">申请编号: {application.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">申请信息</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">教室</p>
              <p className="font-medium text-gray-900">{application.classroom.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">校区</p>
              <p className="font-medium text-gray-900">{application.classroom.campus.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">申请人</p>
              <p className="font-medium text-gray-900">{application.applicantName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">借用时间</p>
              <p className="font-medium text-gray-900">
                {new Date(application.startTime).toLocaleString("zh-CN")}
                <br />
                至 {new Date(application.endTime).toLocaleString("zh-CN")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">交接设备清单</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {application.handovers.map((handover, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <span className="text-sm text-gray-900">{handover.equipmentName}</span>
                  <Badge variant="info">x{handover.quantity}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">设备核验</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {application.handovers.map((handover, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-900">{handover.equipmentName}</span>
                  <Badge variant="success">已归还</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">核验表单</h3>
        </CardHeader>
        <Form method="post">
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                核验人姓名
              </label>
              <input
                type="text"
                name="verifierName"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入核验人姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                清洁检查
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cleaningStatus"
                    value="PASSED"
                    required
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">合格</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cleaningStatus"
                    value="FAILED"
                    required
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-900">不合格</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                异常原因（可选）
              </label>
              <select
                name="abnormalReason"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">无异常</option>
                <option value="EQUIPMENT_LOST">设备遗失</option>
                <option value="CLEANING_FAILED">清洁不合格</option>
                <option value="DAMAGE">设备损坏</option>
                <option value="OTHER">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                清洁照片URL（可选）
              </label>
              <input
                type="text"
                name="cleaningPhoto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入照片URL"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "处理中..." : "确认核验"}
            </Button>
          </CardBody>
        </Form>
      </Card>
    </div>
  );
}
