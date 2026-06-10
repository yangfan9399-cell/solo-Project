import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge, StatusBadge } from "~/components/ui/Badge";
import { prisma } from "~/db/db.server";

export const loader: LoaderFunction = async () => {
  const [campuses, applications] = await Promise.all([
    prisma.campus.findMany({ include: { classrooms: true } }),
    prisma.borrowApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        classroom: { include: { campus: true } },
        verification: true,
      },
    }),
  ]);

  return json({ campuses, applications });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const classroomId = parseInt(formData.get("classroomId") as string);
    const applicantName = formData.get("applicantName") as string;
    const startTime = new Date(formData.get("startTime") as string);
    const endTime = new Date(formData.get("endTime") as string);
    const purpose = formData.get("purpose") as string;

    const conflict = await prisma.borrowApplication.findFirst({
      where: {
        classroomId,
        status: { notIn: ["REJECTED", "CANCELLED", "COMPLETED"] },
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (conflict) {
      return json({ error: "时间冲突，该教室在此时段已被借用" }, { status: 400 });
    }

    const application = await prisma.borrowApplication.create({
      data: {
        classroomId,
        applicantName,
        startTime,
        endTime,
        purpose,
        status: "PENDING",
      },
    });

    await prisma.applicationHistory.create({
      data: {
        applicationId: application.id,
        action: "APPLICATION_SUBMITTED",
        actor: applicantName,
        timestamp: new Date(),
        note: "提交借用申请",
      },
    });

    return redirect(`/applications/${application.id}`);
  }

  return json({ error: "无效操作" }, { status: 400 });
};

export default function Applications() {
  const { campuses, applications } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [selectedCampus, setSelectedCampus] = useState<number | null>(null);
  const isSubmitting = navigation.state === "submitting";

  const filteredApplications = applications.filter((app) => {
    if (!selectedCampus) return true;
    return app.classroom.campusId === selectedCampus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">申请管理</h1>
        <p className="mt-2 text-gray-600">提交和管理教室借用申请</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">提交新申请</h2>
            </CardHeader>
            <Form method="post">
              <input type="hidden" name="intent" value="create" />
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    申请人姓名
                  </label>
                  <input
                    type="text"
                    name="applicantName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="请输入姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    校区
                  </label>
                  <select
                    onChange={(e) => setSelectedCampus(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">选择校区</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    教室
                  </label>
                  <select
                    name="classroomId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">选择教室</option>
                    {selectedCampus &&
                      campuses
                        .find((c) => c.id === selectedCampus)
                        ?.classrooms.map((classroom) => (
                          <option key={classroom.id} value={classroom.id}>
                            {classroom.name} ({classroom.type}, {classroom.capacity}人)
                          </option>
                        ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    借用用途
                  </label>
                  <textarea
                    name="purpose"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="请简述借用用途..."
                  />
                </div>
              </CardBody>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "提交中..." : "提交申请"}
                </Button>
              </CardFooter>
            </Form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">申请列表</h2>
                <select
                  value={selectedCampus || ""}
                  onChange={(e) => setSelectedCampus(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">全部校区</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <a
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.classroom.name}</h3>
                        <p className="text-sm text-gray-600">{app.classroom.campus.name}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>申请人: {app.applicantName}</p>
                      <p>用途: {app.purpose}</p>
                      <p className="col-span-2">
                        时间: {new Date(app.startTime).toLocaleString("zh-CN")} -{" "}
                        {new Date(app.endTime).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    {app.verification?.abnormalReason && (
                      <div className="mt-2">
                        <Badge variant="danger">
                          异常:{" "}
                          {app.verification.abnormalReason === "EQUIPMENT_LOST"
                            ? "设备遗失"
                            : app.verification.abnormalReason === "CLEANING_FAILED"
                            ? "清洁不合格"
                            : app.verification.abnormalReason}
                        </Badge>
                      </div>
                    )}
                  </a>
                ))}
                {filteredApplications.length === 0 && (
                  <p className="text-center text-gray-500 py-8">暂无申请记录</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
