import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets,
  FileText,
  ClipboardList,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  Wrench,
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import type { DashboardData } from '../types';

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getDashboard();
        setData(response.data);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <EmptyState title="暂无数据" description="系统还没有数据" />;

  const stats = [
    {
      title: '水质检测',
      total: data.stats.waterQuality.total,
      abnormal: data.stats.waterQuality.abnormal,
      processing: data.stats.waterQuality.processing,
      icon: Droplets,
      color: 'bg-blue-500',
      link: '/water-quality',
    },
    {
      title: '报修单',
      total: data.stats.repairReports.total,
      pending: data.stats.repairReports.pending,
      inProgress: data.stats.repairReports.inProgress,
      icon: FileText,
      color: 'bg-orange-500',
      link: '/repair-reports',
    },
    {
      title: '工单',
      total: data.stats.workOrders.total,
      pending: data.stats.workOrders.pending,
      inProgress: data.stats.workOrders.inProgress,
      icon: ClipboardList,
      color: 'bg-yellow-500',
      link: '/work-orders',
    },
    {
      title: '抢修队',
      total: data.stats.teams.total,
      available: data.stats.teams.available,
      busy: data.stats.teams.busy,
      icon: Users,
      color: 'bg-green-500',
      link: '/work-orders',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">调度看板</h1>
        {data.stats.waterStops.active > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" />
            正在进行停水：{data.stats.waterStops.active} 起
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.link} className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={(`${stat.color} p-3 rounded-lg`)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stat.total}</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{stat.title}</h3>
              <div className="flex gap-4 text-sm">
                {'abnormal' in stat && (
                  <div className="flex items-center gap-1">
                    <span className="text-red-500">●</span>
                    <span className="text-gray-600">异常 {stat.abnormal}</span>
                  </div>
                )}
                {'pending' in stat && (
                  <div className="flex items-center gap-1">
                    <span className="text-orange-500">●</span>
                    <span className="text-gray-600">待处理 {stat.pending}</span>
                  </div>
                )}
                {'processing' in stat && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">●</span>
                    <span className="text-gray-600">处理中 {stat.processing}</span>
                  </div>
                )}
                {'inProgress' in stat && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">●</span>
                    <span className="text-gray-600">进行中 {stat.inProgress}</span>
                  </div>
                )}
                {'available' in stat && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-500">●</span>
                    <span className="text-gray-600">空闲 {stat.available}</span>
                  </div>
                )}
                {'busy' in stat && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">●</span>
                    <span className="text-gray-600">忙碌 {stat.busy}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">水质异常记录</h2>
          </div>
          <div className="p-6">
            {data.abnormalTests.length === 0 ? (
              <EmptyState title="暂无异常" description="水质检测全部正常" icon={CheckCircle} />
            ) : (
              <div className="space-y-4">
                {data.abnormalTests.map((test) => (
                  <Link
                    key={test.id}
                    to={`/water-quality/${test.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{test.location_name}</span>
                      <StatusBadge status={test.status} />
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div><span className="text-gray-500">pH: </span><span className={test.ph < 6.5 || test.ph > 8.5 ? 'text-red-600 font-medium' : ''}>{test.ph}</span></div>
                      <div><span className="text-gray-500">浊度: </span><span className={test.turbidity > 1.0 ? 'text-red-600 font-medium' : ''}>{test.turbidity}</span></div>
                      <div><span className="text-gray-500">余氯: </span><span className={test.residual_chlorine < 0.3 || test.residual_chlorine > 4.0 ? 'text-red-600 font-medium' : ''}>{test.residual_chlorine}</span></div>
                      <div><span className="text-gray-500">大肠菌群: </span><span className={test.coliform > 0 ? 'text-red-600 font-medium' : ''}>{test.coliform}</span></div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">检测日期：{test.test_date}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">最新报修单</h2>
          </div>
          <div className="p-6">
            {data.recentReports.length === 0 ? (
              <EmptyState title="暂无报修" description="没有新的报修单" icon={FileText} />
            ) : (
              <div className="space-y-4">
                {data.recentReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/repair-reports/${report.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{report.title}</span>
                      <div className="flex items-center gap-2">
                        <UrgencyBadge urgency={report.urgency} />
                        <StatusBadge status={report.status} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{report.location} - {report.address}</div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>联系人：{report.contact_name} {report.contact_phone}</span>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">正在进行的停水</h2>
          </div>
          <div className="p-6">
            {data.activeWaterStops.length === 0 ? (
              <EmptyState title="暂无停水" description="没有正在进行的停水" icon={Droplets} />
            ) : (
              <div className="space-y-4">
                {data.activeWaterStops.map((notice) => (
                  <div key={notice.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{notice.title}</span>
                      <StatusBadge status={notice.status} />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{notice.content}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {notice.start_time} - {notice.end_time}
                      </div>
                      <div>影响区域：{notice.affected_area}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">抢修队状态</h2>
          </div>
          <div className="p-6">
            {data.teamWorkloads.length === 0 ? (
              <EmptyState title="暂无抢修队" description="还没有注册抢修队" icon={Wrench} />
            ) : (
              <div className="space-y-3">
                {data.teamWorkloads.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{team.name}</div>
                      <div className="text-sm text-gray-500">负责区域：{team.area}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-gray-500">进行中工单：</span>
                        <span className="font-medium text-gray-900">{team.active_orders}</span>
                      </div>
                      <StatusBadge status={team.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
