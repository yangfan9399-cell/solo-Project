import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";

export const loader: LoaderFunction = async () => {
  const { prisma } = await import("~/db/db.server");

  const returnPendingApplications = await prisma.borrowApplication.findMany({
    where: { status: "RETURN_PENDING" },
    orderBy: { endTime: "asc" },
    include: {
      classroom: { include: { campus: true } },
      handovers: true,
    },
  });

  return json({ returnPendingApplications });
};

export default function Verify() {
  const { returnPendingApplications } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">归还核验</h1>
        <p className="mt-2 text-gray-600">核验教室归还和设备状态</p>
      </div>

      <div className="mb-6">
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-warning-700">
                共 <span className="font-semibold">{returnPendingApplications.length}</span>{" "}
                个待核验申请
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {returnPendingApplications.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无待核验申请</h3>
                <p className="mt-1 text-sm text-gray-500">所有归还已完成核验</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          returnPendingApplications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{app.classroom.name}</h3>
                    <p className="text-sm text-gray-600">{app.classroom.campus.name}</p>
                  </div>
                  <Badge variant="warning">待归还核验</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">申请人</p>
                    <p className="font-medium text-gray-900">{app.applicantName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">借用时间</p>
                    <p className="font-medium text-gray-900">
                      {new Date(app.startTime).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">交接设备</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {app.handovers.map((handover, idx) => (
                        <Badge key={idx} variant="info">
                          {handover.equipmentName} x{handover.quantity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardBody>
              <CardBody className="border-t">
                <Link to={`/verify/${app.id}`}>
                  <button className="w-full bg-success-600 text-white px-4 py-2 rounded-lg hover:bg-success-700 transition-colors text-sm font-medium">
                    进行归还核验
                  </button>
                </Link>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
