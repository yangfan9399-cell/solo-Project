import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import type { ApplicationWithRelations, Campus, Classroom, ReturnVerification } from "~/types";

interface CampusUsage {
  campus: string;
  usage: number;
}

interface TypeStat {
  type: string;
  count: number;
}

interface AbnormalStat {
  reason: string;
  count: number;
}

export const loader: LoaderFunction = async () => {
  const { prisma } = await import("~/db/db.server");

  const [
    totalApplications,
    completedApplications,
    campusStats,
    classroomTypeStats,
    abnormalStats,
    recentCompleted,
  ] = await Promise.all([
    prisma.borrowApplication.count(),
    prisma.borrowApplication.count({ where: { status: "COMPLETED" } }),
    prisma.borrowApplication.groupBy({
      by: ["classroomId"],
      _count: { id: true },
      where: { status: "COMPLETED" },
    }),
    prisma.borrowApplication.findMany({
      where: { status: "COMPLETED" },
      include: { classroom: true },
    }),
    prisma.returnVerification.findMany({
      where: { abnormalReason: { not: null } },
    }),
    prisma.borrowApplication.findMany({
      where: { status: "COMPLETED" },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        classroom: { include: { campus: true } },
        verification: true,
      },
    }),
  ]);

  const campusMap = new Map<number, number>();
  for (const stat of campusStats) {
    campusMap.set(stat.classroomId, stat._count.id);
  }

  const campuses = await prisma.campus.findMany({
    include: {
      classrooms: true,
    },
  });

  const campusUsage: CampusUsage[] = campuses.map((campus: Campus & { classrooms: Classroom[] }) => {
    const totalUsage = campus.classrooms.reduce((sum: number, room: Classroom) => {
      return sum + (campusMap.get(room.id) || 0);
    }, 0);
    return {
      campus: campus.name,
      usage: totalUsage,
    };
  });

  const classroomTypeMap = new Map<string, number>();
  for (const app of classroomTypeStats) {
    const type = app.classroom.type;
    classroomTypeMap.set(type, (classroomTypeMap.get(type) || 0) + 1);
  }

  const abnormalMap = new Map<string, number>();
  for (const ab of abnormalStats) {
    const reason = (ab as ReturnVerification).abnormalReason || "未知";
    abnormalMap.set(reason, (abnormalMap.get(reason) || 0) + 1);
  }

  const usageRate = totalApplications > 0 ? (completedApplications / totalApplications) * 100 : 0;

  return json({
    stats: {
      total: totalApplications,
      completed: completedApplications,
      usageRate: usageRate.toFixed(1),
      abnormal: abnormalStats.length,
    },
    campusUsage,
    classroomTypeStats: Array.from(classroomTypeMap.entries()).map(([type, count]): TypeStat => ({
      type,
      count,
    })),
    abnormalStats: Array.from(abnormalMap.entries()).map(([reason, count]): AbnormalStat => ({
      reason,
      count,
    })),
    recentCompleted,
  });
};

export default function Stats() {
  const { stats, campusUsage, classroomTypeStats, abnormalStats, recentCompleted } =
    useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">统计报表</h1>
        <p className="mt-2 text-gray-600">教室借用系统使用统计分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">总申请数</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">已完成</p>
            <p className="text-3xl font-bold text-success-600 mt-2">{stats.completed}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">完成率</p>
            <p className="text-3xl font-bold text-primary-600 mt-2">{stats.usageRate}%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-600">异常记录</p>
            <p className="text-3xl font-bold text-danger-600 mt-2">{stats.abnormal}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">按校区使用统计</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {campusUsage.map((item: CampusUsage) => (
                <div key={item.campus}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.campus}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.usage}次</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((item.usage / Math.max(...campusUsage.map((c: CampusUsage) => c.usage), 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">按教室类型统计</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {classroomTypeStats.map((item: TypeStat) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-500 mr-3" />
                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900 mr-2">
                      {item.count}
                    </span>
                    <Badge variant="primary">次</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">异常原因分析</h3>
          </CardHeader>
          <CardBody>
            {abnormalStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无异常记录</p>
            ) : (
              <div className="space-y-4">
                {abnormalStats.map((item: AbnormalStat) => (
                  <div key={item.reason} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-danger-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700">
                        {item.reason === "EQUIPMENT_LOST"
                          ? "设备遗失"
                          : item.reason === "CLEANING_FAILED"
                          ? "清洁不合格"
                          : item.reason === "DAMAGE"
                          ? "设备损坏"
                          : item.reason}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-semibold text-danger-600 mr-2">
                        {item.count}
                      </span>
                      <Badge variant="danger">次</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">最近完成记录</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {recentCompleted.map((app: ApplicationWithRelations) => (
                <div key={app.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{app.classroom.name}</span>
                    {app.verification?.abnormalReason ? (
                      <Badge variant="danger">
                        {app.verification.abnormalReason === "EQUIPMENT_LOST"
                          ? "设备遗失"
                          : app.verification.abnormalReason === "CLEANING_FAILED"
                          ? "清洁不合格"
                          : "异常"}
                      </Badge>
                    ) : (
                      <Badge variant="success">正常</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {app.applicantName} -{" "}
                    {new Date(app.endTime).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
