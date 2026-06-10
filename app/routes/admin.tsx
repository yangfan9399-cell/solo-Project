import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Badge, StatusBadge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import type { ApplicationWithRelations } from "~/types";

export const loader: LoaderFunction = async () => {
  const { prisma } = await import("~/db/db.server");

  const pendingApplications = await prisma.borrowApplication.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      classroom: { include: { campus: true } },
    },
  });

  return json({ pendingApplications });
};

export default function Admin() {
  const { pendingApplications } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">审批工作台</h1>
        <p className="mt-2 text-gray-600">管理待审批的教室借用申请</p>
      </div>

      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                共 <span className="font-semibold">{pendingApplications.length}</span> 个待审批申请
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {pendingApplications.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无待审批申请</h3>
                <p className="mt-1 text-sm text-gray-500">所有申请都已处理完毕</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          pendingApplications.map((app: ApplicationWithRelations) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{app.classroom.name}</h3>
                    <p className="text-sm text-gray-600">{app.classroom.campus.name}</p>
                  </div>
                  <Badge variant="warning">待审批</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">申请人</p>
                    <p className="font-medium text-gray-900">{app.applicantName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">教室类型</p>
                    <p className="font-medium text-gray-900">{app.classroom.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">容纳人数</p>
                    <p className="font-medium text-gray-900">{app.classroom.capacity}人</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">申请时间</p>
                    <p className="font-medium text-gray-900">
                      {new Date(app.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">借用时间</p>
                    <p className="font-medium text-gray-900">
                      {new Date(app.startTime).toLocaleString("zh-CN")} -{" "}
                      {new Date(app.endTime).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">借用用途</p>
                    <p className="font-medium text-gray-900">{app.purpose}</p>
                  </div>
                </div>
              </CardBody>
              <CardBody className="border-t">
                <Link to={`/admin/approve/${app.id}`}>
                  <Button variant="primary" className="w-full">
                    审批此申请
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
