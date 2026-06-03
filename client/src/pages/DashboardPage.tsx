import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import StatusBadge from '../components/common/StatusBadge';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats, ShootingTask, Reservation, EquipmentStatus } from '../types';
import { formatDateTime, formatRelativeTime } from '../utils/format';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, bgClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 ${bgClass} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

interface ActivityItem {
  id: number;
  type: 'task' | 'reservation';
  title: string;
  time: string;
  status: string;
  user?: string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || '加载失败');
      }
    } catch (e) {
      setError('网络请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="仪表盘" subtitle="概览数据统计" />
        <div className="p-8">
          <Loading text="加载数据中..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="仪表盘" subtitle="概览数据统计" />
        <div className="p-8">
          <ErrorState message={error} onRetry={fetchStats} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="仪表盘" subtitle="概览数据统计" />
        <div className="p-8">
          <EmptyState title="暂无数据" description="仪表盘数据加载中，请稍后再试" />
        </div>
      </div>
    );
  }

  const equipmentStatusData: { status: EquipmentStatus; count: number; label: string }[] = [
    { status: 'available' as EquipmentStatus, count: stats.equipment.available, label: STATUS_LABELS.available },
    { status: 'in_use' as EquipmentStatus, count: stats.equipment.in_use, label: STATUS_LABELS.in_use },
    { status: 'maintenance' as EquipmentStatus, count: stats.equipment.maintenance, label: STATUS_LABELS.maintenance },
    { status: 'damaged' as EquipmentStatus, count: stats.equipment.damaged, label: STATUS_LABELS.damaged },
    { status: 'scrapped' as EquipmentStatus, count: stats.equipment.scrapped, label: STATUS_LABELS.scrapped },
  ].filter(item => item.count > 0);

  const activities: ActivityItem[] = [
    ...stats.recent_tasks.map((task: ShootingTask) => ({
      id: task.id,
      type: 'task' as const,
      title: `任务「${task.title}」${STATUS_LABELS[task.status] || task.status}`,
      time: task.created_at,
      status: task.status,
      user: task.reporter_name,
    })),
    ...stats.pending_approvals.map((res: Reservation) => ({
      id: res.id + 10000,
      type: 'reservation' as const,
      title: `预约「${res.equipment_name}」${STATUS_LABELS[res.status] || res.status}`,
      time: res.created_at,
      status: res.status,
      user: res.requester_name,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  const maxEquipmentCount = Math.max(...equipmentStatusData.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="仪表盘" subtitle="概览数据统计" />
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <StatCard
            title="设备总数"
            value={stats.equipment.total}
            icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}
            colorClass="text-gray-900"
            bgClass="bg-blue-50"
          />
          <StatCard
            title="可用设备"
            value={stats.equipment.available}
            icon={<svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            colorClass="text-green-600"
            bgClass="bg-green-50"
          />
          <StatCard
            title="任务总数"
            value={stats.tasks.total}
            icon={<svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
          />
          <StatCard
            title="待审批预约"
            value={stats.reservations.pending}
            icon={<svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            colorClass="text-yellow-600"
            bgClass="bg-yellow-50"
          />
          <StatCard
            title="借用中素材卡"
            value={stats.media_cards.in_use}
            icon={<svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
            colorClass="text-indigo-600"
            bgClass="bg-indigo-50"
          />
          <StatCard
            title="待处理逾期"
            value={stats.overdue.pending}
            icon={<svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            colorClass="text-red-600"
            bgClass="bg-red-50"
          />
          <StatCard
            title="待处理损坏"
            value={stats.damage_reports.pending}
            icon={<svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            colorClass="text-orange-600"
            bgClass="bg-orange-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">最近任务</h2>
            {stats.recent_tasks.length === 0 ? (
              <EmptyState title="暂无任务" description="还没有创建任何任务" />
            ) : (
              <div className="space-y-3">
                {stats.recent_tasks.map((task: ShootingTask) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900 truncate">{task.title}</p>
                        <StatusBadge status={task.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{task.task_no}</span>
                        <span>{task.reporter_name}</span>
                        <span>{formatRelativeTime(task.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">待审批预约</h2>
            {stats.pending_approvals.length === 0 ? (
              <EmptyState title="暂无待审批" description="目前没有需要审批的预约" />
            ) : (
              <div className="space-y-3">
                {stats.pending_approvals.map((res: Reservation) => (
                  <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900 truncate">{res.equipment_name}</p>
                        <StatusBadge status={res.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{res.requester_name}</span>
                        <span>{formatDateTime(res.expected_pickup_time)}</span>
                      </div>
                      {res.task_title && (
                        <p className="text-sm text-gray-500 mt-1">关联任务：{res.task_title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">设备状态分布</h2>
            {equipmentStatusData.length === 0 ? (
              <EmptyState title="暂无设备数据" description="还没有添加任何设备" />
            ) : (
              <div className="space-y-4">
                {equipmentStatusData.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[item.status]?.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-300'}`} />
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-sm text-gray-500">{item.count} 台</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${STATUS_COLORS[item.status]?.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-300'}`}
                        style={{ width: `${(item.count / maxEquipmentCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  <span className="text-sm font-medium text-gray-700">设备总数</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.equipment.total} 台</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
            {activities.length === 0 ? (
              <EmptyState title="暂无活动" description="最近没有相关活动记录" />
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-start gap-4 pl-10">
                      <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${activity.type === 'task' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${activity.type === 'task' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {activity.type === 'task' ? '任务' : '预约'}
                          </span>
                          <p className="text-sm text-gray-900">{activity.title}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {activity.user && <span>{activity.user}</span>}
                          <span>{formatRelativeTime(activity.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
