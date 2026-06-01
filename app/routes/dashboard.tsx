import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUser } from "../../.server/session.server";
import { prisma } from "../../.server/db.server";
import { AppLayout } from "~/components/layout/AppLayout";
import { Card } from "~/components/ui/Card";
import { StatusBadge } from "~/components/ui/StatusBadge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const stats = await Promise.all([
    prisma.donationBatch.count(),
    prisma.application.count(),
    prisma.stock.aggregate({
      _sum: { quantity: true },
    }),
    prisma.recipient.count(),
    prisma.donationBatch.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { recipient: { select: { name: true } } },
    }),
    prisma.exceptionRecord.findMany({
      where: { status: { in: ["OPEN", "PROCESSING"] } },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return json({
    user,
    stats: {
      donationCount: stats[0],
      applicationCount: stats[1],
      stockCount: stats[2]._sum.quantity || 0,
      recipientCount: stats[3],
    },
    recentDonations: stats[4],
    recentApplications: stats[5],
    pendingExceptions: stats[6],
  });
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  return (
    <AppLayout user={data.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-500">
            {format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="捐赠批次"
            value={data.stats.donationCount}
            icon="📦"
            color="bg-blue-500"
            link="/donations"
          />
          <StatCard
            title="发放申请"
            value={data.stats.applicationCount}
            icon="📝"
            color="bg-purple-500"
            link="/applications"
          />
          <StatCard
            title="库存总数"
            value={data.stats.stockCount}
            icon="🏪"
            color="bg-green-500"
            link="/stock"
          />
          <StatCard
            title="受助对象"
            value={data.stats.recipientCount}
            icon="👥"
            color="bg-orange-500"
            link="/recipients"
          />
        </div>

        {data.pendingExceptions.length > 0 && (
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                待处理异常
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {data.pendingExceptions.map((exc) => (
                  <Link
                    key={exc.id}
                    to={`/exceptions/${exc.id}`}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={exc.status} type="exception" />
                      <span className="text-gray-900 font-medium">{exc.title}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(exc.createdAt), "MM-dd HH:mm")}
                    </span>
                  </Link>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header className="flex items-center justify-between">
              <Card.Title>最近捐赠</Card.Title>
              <Link
                to="/donations"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                查看全部 →
              </Link>
            </Card.Header>
            <Card.Body>
              {data.recentDonations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无捐赠记录</p>
              ) : (
                <div className="space-y-3">
                  {data.recentDonations.map((batch) => (
                    <Link
                      key={batch.id}
                      to={`/donations/${batch.id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{batch.batchNo}</p>
                        <p className="text-sm text-gray-500">{batch.donorName}</p>
                      </div>
                      <StatusBadge status={batch.status} type="donation" />
                    </Link>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="flex items-center justify-between">
              <Card.Title>最近申请</Card.Title>
              <Link
                to="/applications"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                查看全部 →
              </Link>
            </Card.Header>
            <Card.Body>
              {data.recentApplications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无申请记录</p>
              ) : (
                <div className="space-y-3">
                  {data.recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      to={`/applications/${app.id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{app.title}</p>
                        <p className="text-sm text-gray-500">申请人: {app.recipient.name}</p>
                      </div>
                      <StatusBadge status={app.status} type="application" />
                    </Link>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, icon, color, link }: { 
  title: string; 
  value: number; 
  icon: string; 
  color: string;
  link: string;
}) {
  return (
    <Link to={link}>
      <Card className="hover:shadow-lg transition-shadow">
        <Card.Body className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`w-14 h-14 ${color} rounded-lg flex items-center justify-center text-2xl`}>
            {icon}
          </div>
        </Card.Body>
      </Card>
    </Link>
  );
}
