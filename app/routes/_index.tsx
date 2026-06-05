import { Link, useLoaderData } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { requireUser } from '~/utils/session.server';
import type { Hazard, User } from '@prisma/client';

type HazardWithRelations = Hazard & {
  reporter: User;
  assignee: User | null;
  _count: { photos: number };
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status');

  let where: any = {
    NOT: { status: 'ARCHIVED' as any },
  };

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (user.role === 'PROPERTY_MANAGER') {
    where.assigneeId = user.id;
  }

  const hazards = await prisma.hazard.findMany({
    where,
    include: {
      reporter: true,
      assignee: true,
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const archivedHazards = await prisma.hazard.findMany({
    where: { status: 'ARCHIVED' as any },
    include: {
      reporter: true,
      assignee: true,
      _count: { select: { photos: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  const stats = {
    total: hazards.length,
    reported: hazards.filter((h) => h.status === 'REPORTED').length,
    inProgress: hazards.filter((h) => ['ASSIGNED', 'IN_PROGRESS'].includes(h.status)).length,
    submitted: hazards.filter((h) => h.status === 'SUBMITTED').length,
    passed: hazards.filter((h) => h.status === 'PASSED').length,
  };

  return json({ user, hazards, archivedHazards, stats });
};

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    REPORTED: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    SUBMITTED: 'bg-orange-100 text-orange-800',
    PASSED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    REPORTED: '已登记',
    ASSIGNED: '已派发',
    IN_PROGRESS: '整改中',
    SUBMITTED: '待验收',
    PASSED: '已通过',
    REJECTED: '需重改',
    ARCHIVED: '已归档',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}

function getLevelBadge(level: string) {
  const styles: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    CRITICAL: '紧急',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export default function Index() {
  const { user, hazards, archivedHazards, stats } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">隐患处理工作台</h1>
          <p className="text-gray-500">欢迎回来，{user.name}</p>
        </div>
        {user.role === 'INSPECTOR' && (
          <Link
            to="/hazards/new"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            + 登记隐患
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">待派发</p>
          <p className="text-2xl font-bold text-gray-800">{stats.reported}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">整改中</p>
          <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">待验收</p>
          <p className="text-2xl font-bold text-gray-800">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">已通过</p>
          <p className="text-2xl font-bold text-gray-800">{stats.passed}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">隐患列表</h2>
              <div className="flex gap-2">
                {['REPORTED', 'ASSIGNED', 'SUBMITTED', 'REJECTED'].map((status) => (
                  <Link
                    key={status}
                    to={`/?status=${status}`}
                    className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                  >
                    {getStatusBadge(status)}
                  </Link>
                ))}
                <Link
                  to="/"
                  className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                >
                  全部
                </Link>
              </div>
            </div>
            <div className="divide-y">
              {hazards.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  暂无隐患记录
                </div>
              ) : (
                hazards.map((hazard: HazardWithRelations) => (
                  <Link
                    key={hazard.id}
                    to={`/hazards/${hazard.id}`}
                    className="block p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-800">{hazard.title}</h3>
                          {getStatusBadge(hazard.status)}
                          {getLevelBadge(hazard.level)}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{hazard.location}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>来源: {hazard.source}</span>
                          <span>登记人: {hazard.reporter.name}</span>
                          <span>照片: {hazard._count.photos}张</span>
                          {hazard.assignee && (
                            <span>责任人: {hazard.assignee.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(hazard.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">快捷操作</h2>
            </div>
            <div className="p-4 space-y-3">
              {user.role === 'INSPECTOR' && (
                <Link
                  to="/hazards/new"
                  className="block w-full text-center bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg transition"
                >
                  登记新隐患
                </Link>
              )}
              {user.role === 'FIRE_VERIFIER' && (
                <Link
                  to="/?status=REPORTED"
                  className="block w-full text-center bg-yellow-50 text-yellow-600 hover:bg-yellow-100 py-2 rounded-lg transition"
                >
                  派发隐患 ({stats.reported})
                </Link>
              )}
              {(user.role === 'FIRE_VERIFIER' || user.role === 'PROPERTY_MANAGER') && (
                <Link
                  to="/?status=SUBMITTED"
                  className="block w-full text-center bg-orange-50 text-orange-600 hover:bg-orange-100 py-2 rounded-lg transition"
                >
                  待验收 ({stats.submitted})
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">最近归档</h2>
            </div>
            <div className="divide-y">
              {archivedHazards.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  暂无归档记录
                </div>
              ) : (
                archivedHazards.map((hazard: HazardWithRelations) => (
                  <Link
                    key={hazard.id}
                    to={`/hazards/${hazard.id}`}
                    className="block p-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 truncate flex-1">
                        {hazard.title}
                      </span>
                      {getStatusBadge(hazard.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{hazard.location}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">操作指南</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• 巡检员：登记隐患，上传现场照片</li>
              <li>• 物业：接收任务，提交整改材料</li>
              <li>• 消防：派发任务，审核验收归档</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
