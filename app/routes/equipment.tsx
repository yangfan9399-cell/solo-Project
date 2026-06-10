import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";

export const loader: LoaderFunction = async () => {
  const { prisma } = await import("~/db/db.server");

  const approvedApplications = await prisma.borrowApplication.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    include: {
      classroom: { include: { campus: true } },
      handovers: true,
    },
  });

  const equipment = await prisma.equipment.findMany({
    include: { classroom: { include: { campus: true } } },
    orderBy: { classroom: { name: "asc" } },
  });

  return json({ approvedApplications, equipment });
};

export default function Equipment() {
  const { approvedApplications, equipment } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">设备管理</h1>
        <p className="mt-2 text-gray-600">管理教室设备和交接流程</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">待设备交接</h2>
          </CardHeader>
          <CardBody>
            {approvedApplications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无待交接申请</p>
            ) : (
              <div className="space-y-4">
                {approvedApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.classroom.name}</h3>
                        <p className="text-sm text-gray-600">{app.classroom.campus.name}</p>
                      </div>
                      <Badge variant="info">待交接</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <p>申请人: {app.applicantName}</p>
                      <p>
                        时间: {new Date(app.startTime).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <Link to={`/equipment/handover/${app.id}`}>
                      <button className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                        进行设备交接
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">设备列表</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {equipment.map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{eq.name}</p>
                    <p className="text-sm text-gray-600">
                      {eq.classroom.name} - {eq.classroom.campus.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        eq.status === "AVAILABLE"
                          ? "success"
                          : eq.status === "IN_USE"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {eq.status === "AVAILABLE"
                        ? "可用"
                        : eq.status === "IN_USE"
                        ? "使用中"
                        : "维护中"}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">数量: {eq.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
