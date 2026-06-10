import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { prisma } from "~/db/db.server";
import type { ApplicationWithRelations } from "~/types";

export const loader: LoaderFunction = async () => {
  const [
    pendingCount,
    approvedCount,
    inUseCount,
    returnPendingCount,
    completedCount,
    abnormalCount,
    recentApplications,
  ] = await Promise.all([
    prisma.borrowApplication.count({ where: { status: "PENDING" } }),
    prisma.borrowApplication.count({ where: { status: "APPROVED" } }),
    prisma.borrowApplication.count({ where: { status: "IN_USE" } }),
    prisma.borrowApplication.count({ where: { status: "RETURN_PENDING" } }),
    prisma.borrowApplication.count({ where: { status: "COMPLETED" } }),
    prisma.returnVerification.count({ where: { abnormalReason: { not: null } } }),
    prisma.borrowApplication.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        classroom: { include: { campus: true } },
      },
    }),
  ]);

  return json({
    stats: {
      pending: pendingCount,
      approved: approvedCount,
      inUse: inUseCount,
      returnPending: returnPendingCount,
      completed: completedCount,
      abnormal: abnormalCount,
    },
    recentApplications,
  });
};

export default function Index() {
  const { stats, recentApplications } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
        <p className="mt-2 text-gray-600">查看教室借用系统的整体运行状态</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card hover className="animate-fade-in stagger-1">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待审批</p>
                <p className="text-3xl font-bold text-warning-600 mt-2">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="animate-fade-in stagger-2">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">使用中</p>
                <p className="text-3xl font-bold text-info-600 mt-2">{stats.inUse}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="animate-fade-in stagger-3">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待归还</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">{stats.returnPending}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="animate-fade-in stagger-4">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">异常记录</p>
                <p className="text-3xl font-bold text-danger-600 mt-2">{stats.abnormal}</p>
              </div>
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">最近申请</h2>
              <Link
                to="/applications"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                查看全部 →
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {recentApplications.map((app: ApplicationWithRelations) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{app.classroom.name}</span>
                    <Badge
                      variant={
                        app.status === "COMPLETED"
                          ? "success"
                          : app.status === "IN_USE"
                          ? "info"
                          : app.status === "PENDING"
                          ? "warning"
                          : "default"
                      }
                    >
                      {app.status === "PENDING"
                        ? "待审批"
                        : app.status === "COMPLETED"
                        ? "已完成"
                        : app.status === "IN_USE"
                        ? "使用中"
                        : app.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>申请人: {app.applicantName}</p>
                    <p>
                      时间: {new Date(app.startTime).toLocaleString("zh-CN")} -{" "}
                      {new Date(app.endTime).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </Link>
              ))}
              {recentApplications.length === 0 && (
                <p className="text-center text-gray-500 py-8">暂无申请记录</p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">快捷操作</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/applications"
                className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <svg className="w-8 h-8 text-primary-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium text-gray-900">提交申请</span>
              </Link>
              <Link
                to="/admin"
                className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <svg className="w-8 h-8 text-primary-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">审批工作台</span>
              </Link>
              <Link
                to="/equipment"
                className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <svg className="w-8 h-8 text-primary-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">设备管理</span>
              </Link>
              <Link
                to="/stats"
                className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <svg className="w-8 h-8 text-primary-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">统计报表</span>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
