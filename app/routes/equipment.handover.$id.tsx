import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { prisma } from "~/db/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const application = await prisma.borrowApplication.findUnique({
    where: { id: params.id },
    include: {
      classroom: { include: { campus: true } },
    },
  });

  if (!application) {
    throw new Response("申请不存在", { status: 404 });
  }

  if (application.status !== "APPROVED") {
    throw new Response("该申请不在待交接状态", { status: 400 });
  }

  const equipment = await prisma.equipment.findMany({
    where: { classroomId: application.classroomId },
  });

  return json({ application, equipment });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const handlerName = formData.get("handlerName") as string;

  const application = await prisma.borrowApplication.findUnique({
    where: { id: params.id },
    include: { classroom: true },
  });

  if (!application) {
    return json({ error: "申请不存在" }, { status: 404 });
  }

  const equipment = await prisma.equipment.findMany({
    where: { classroomId: application.classroomId },
  });

  const selectedEquipment = equipment.filter((eq) =>
    formData.get(`equipment_${eq.id}`) === "on"
  );

  if (selectedEquipment.length === 0) {
    return json({ error: "请至少选择一个设备进行交接" }, { status: 400 });
  }

  for (const eq of selectedEquipment) {
    const quantity = parseInt(formData.get(`quantity_${eq.id}`) as string) || eq.quantity;
    await prisma.equipmentHandover.create({
      data: {
        applicationId: params.id!,
        equipmentName: eq.name,
        quantity: quantity,
        handoverTime: new Date(),
        handlerName: handlerName,
      },
    });

    await prisma.equipment.update({
      where: { id: eq.id },
      data: { status: "IN_USE" },
    });
  }

  await prisma.borrowApplication.update({
    where: { id: params.id },
    data: { status: "IN_USE" },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId: params.id!,
      action: "EQUIPMENT_HANDED_OVER",
      actor: handlerName,
      timestamp: new Date(),
      note: `交接设备: ${selectedEquipment.map((e) => e.name).join(", ")}`,
    },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId: params.id!,
      action: "IN_USE",
      actor: "系统",
      timestamp: new Date(),
      note: "设备已交接，开始使用",
    },
  });

  return redirect(`/applications/${params.id}`);
};

export default function EquipmentHandover() {
  const { application, equipment } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [selectedEquipment, setSelectedEquipment] = useState<Record<number, boolean>>({});
  const isSubmitting = navigation.state === "submitting";

  const toggleEquipment = (id: number) => {
    setSelectedEquipment((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/equipment" className="text-primary-600 hover:text-primary-700 text-sm">
          ← 返回设备管理
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">设备交接</h1>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">设备清单</h3>
          </CardHeader>
          <Form method="post">
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  交接人姓名
                </label>
                <input
                  type="text"
                  name="handlerName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入交接人姓名"
                />
              </div>

              <div className="space-y-3">
                {equipment.map((eq) => (
                  <div
                    key={eq.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedEquipment[eq.id]
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id={`equipment_${eq.id}`}
                          name={`equipment_${eq.id}`}
                          checked={!!selectedEquipment[eq.id]}
                          onChange={() => toggleEquipment(eq.id)}
                          className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label
                          htmlFor={`equipment_${eq.id}`}
                          className="ml-3 block cursor-pointer"
                        >
                          <span className="font-medium text-gray-900">{eq.name}</span>
                          <p className="text-sm text-gray-600">数量: {eq.quantity}</p>
                        </label>
                      </div>
                      {selectedEquipment[eq.id] && (
                        <div className="flex items-center">
                          <label className="text-sm text-gray-600 mr-2">交接数量:</label>
                          <input
                            type="number"
                            name={`quantity_${eq.id}`}
                            min="1"
                            max={eq.quantity}
                            defaultValue={eq.quantity}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "处理中..." : "确认交接"}
              </Button>
            </CardBody>
          </Form>
        </Card>
      </div>
    </div>
  );
}
