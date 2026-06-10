import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { prisma } from "~/db/db.server";
import type { ApplicationWithRelations, Classroom } from "~/types";

export const loader: LoaderFunction = async ({ params }) => {
  const application = await prisma.borrowApplication.findUnique({
    where: { id: params.id },
    include: {
      classroom: { include: { campus: true } },
      history: { orderBy: { timestamp: "desc" } },
    },
  });

  if (!application) {
    throw new Response("申请不存在", { status: 404 });
  }

  if (application.status !== "PENDING") {
    throw new Response("该申请不在待审批状态", { status: 400 });
  }

  const conflict = await prisma.borrowApplication.findFirst({
    where: {
      classroomId: application.classroomId,
      id: { not: application.id },
      status: { notIn: ["REJECTED", "CANCELLED", "COMPLETED"] },
      OR: [{ startTime: { lt: application.endTime }, endTime: { gt: application.startTime } }],
    },
  });

  let alternatives: (Classroom & { campus: { name: string } })[] = [];
  if (conflict) {
    alternatives = await prisma.classroom.findMany({
      where: {
        campusId: application.classroom.campusId,
        id: { not: application.classroomId },
        type: application.classroom.type,
      },
      include: { campus: true },
    });

    const availableAlternatives: (Classroom & { campus: { name: string } })[] = [];
    for (const alt of alternatives) {
      const altConflict = await prisma.borrowApplication.findFirst({
        where: {
          classroomId: alt.id,
          status: { notIn: ["REJECTED", "CANCELLED", "COMPLETED"] },
          OR: [{ startTime: { lt: application.endTime }, endTime: { gt: application.startTime } }],
        },
      });
      if (!altConflict) {
        availableAlternatives.push(alt);
      }
    }
    alternatives = availableAlternatives;
  }

  return json({ application, conflict: !!conflict, alternatives });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const application = await prisma.borrowApplication.findUnique({
    where: { id: params.id },
    include: { classroom: true },
  });

  if (!application) {
    return json({ error: "申请不存在" }, { status: 404 });
  }

  if (intent === "approve") {
    const note = formData.get("note") as string;

    await prisma.borrowApplication.update({
      where: { id: params.id },
      data: { status: "APPROVED" },
    });

    await prisma.applicationHistory.create({
      data: {
        applicationId: params.id!,
        action: "APPLICATION_APPROVED",
        actor: "校区管理员",
        timestamp: new Date(),
        note: note || "审批通过",
      },
    });

    return redirect(`/applications/${params.id}`);
  }

  if (intent === "reject") {
    const note = formData.get("note") as string;

    await prisma.borrowApplication.update({
      where: { id: params.id },
      data: { status: "REJECTED" },
    });

    await prisma.applicationHistory.create({
      data: {
        applicationId: params.id!,
        action: "APPLICATION_REJECTED",
        actor: "校区管理员",
        timestamp: new Date(),
        note: note || "审批拒绝",
      },
    });

    return redirect(`/applications/${params.id}`);
  }

  return json({ error: "无效操作" }, { status: 400 });
};

export default function ApproveApplication() {
  const { application, conflict, alternatives } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [showAlternatives, setShowAlternatives] = useState(true);
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-primary-600 hover:text-primary-700 text-sm">
          ← 返回审批工作台
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">审批申请</h1>
        <p className="mt-2 text-gray-600">申请编号: {application.id}</p>
      </div>

      {conflict && (
        <div className="mb-6 bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-danger-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-danger-800">时间冲突警告</h3>
              <p className="mt-1 text-sm text-danger-700">
                该教室在选定时间段已被其他申请借用，审批将被阻断
              </p>
            </div>
          </div>
        </div>
      )}

      {conflict && alternatives.length > 0 && showAlternatives && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">可选替代教室</h3>
              <p className="mt-1 text-sm text-blue-700 mb-3">
                以下同校区同类型教室在此时段可用：
              </p>
              <div className="space-y-2">
                {alternatives.map((alt: Classroom & { campus: { name: string } }) => (
                  <div key={alt.id} className="bg-white rounded p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{alt.name}</p>
                        <p className="text-sm text-gray-600">{alt.campus.name}</p>
                      </div>
                      <Badge variant="success">可用</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div>
              <p className="text-sm text-gray-600">借用用途</p>
              <p className="font-medium text-gray-900">{application.purpose}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">审批操作</h3>
          </CardHeader>
          <Form method="post">
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  审批备注
                </label>
                <textarea
                  name="note"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入审批备注..."
                />
              </div>

              {conflict ? (
                <div className="space-y-3">
                  <Button
                    type="submit"
                    name="intent"
                    value="reject"
                    variant="danger"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    拒绝申请（时间冲突）
                  </Button>
                  <p className="text-sm text-center text-gray-500">
                    由于时间冲突，建议拒绝此申请并推荐替代教室
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    type="submit"
                    name="intent"
                    value="approve"
                    variant="success"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "处理中..." : "批准申请"}
                  </Button>
                  <Button
                    type="submit"
                    name="intent"
                    value="reject"
                    variant="danger"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    拒绝申请
                  </Button>
                </div>
              )}
            </CardBody>
          </Form>
        </Card>
      </div>
    </div>
  );
}
