import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import StatusBadge from './StatusBadge';

interface StatsData {
  totalAppointments: number;
  pendingCount: number;
  approvedCount: number;
  checkedInCount: number;
  timeoutCount: number;
  blacklistCount: number;
  todayCount: number;
  recentAppointments: Array<{
    id: number;
    visitor_name: string;
    purpose: string;
    visitee_name: string;
    status: string;
    expected_arrival: string;
    created_at: string;
  }>;
  timeoutVisitors: Array<{
    id: number;
    visitor_name: string;
    visitee_name: string;
    expected_leave: string;
    check_in_time: string;
  }>;
  unreadNotifications: number;
}

const statCards = [
  { key: 'todayCount' as const, label: '今日预约', icon: '📅', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'pendingCount' as const, label: '待审批', icon: '⏳', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { key: 'checkedInCount' as const, label: '已签到', icon: '✅', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'timeoutCount' as const, label: '超时未离', icon: '⚠️', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'blacklistCount' as const, label: '黑名单数', icon: '🚫', color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function Dashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('获取统计数据失败');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="加载统计数据..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <EmptyState title="暂无数据" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.key} className={`rounded-lg border p-4 ${card.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-3xl font-bold">{data[card.key]}</span>
            </div>
            <p className="mt-2 text-sm font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">最近预约</h2>
          {data.recentAppointments.length === 0 ? (
            <EmptyState title="暂无预约记录" description="目前没有最近的预约" icon="📋" />
          ) : (
            <div className="space-y-3">
              {data.recentAppointments.map((apt) => (
                <a
                  key={apt.id}
                  href={`/appointments/${apt.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{apt.visitor_name}</span>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
                    <span>{apt.purpose}</span>
                    <span>被访人: {apt.visitee_name || '-'}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(apt.expected_arrival).toLocaleString('zh-CN')}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            超时预警
            {data.timeoutVisitors.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                {data.timeoutVisitors.length}
              </span>
            )}
          </h2>
          {data.timeoutVisitors.length === 0 ? (
            <EmptyState title="暂无超时记录" description="所有访客都已按时签退" icon="🎉" />
          ) : (
            <div className="space-y-3">
              {data.timeoutVisitors.map((v) => (
                <a
                  key={v.id}
                  href={`/appointments/${v.id}`}
                  className="block p-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-orange-800">{v.visitor_name}</span>
                    <StatusBadge status="timeout" />
                  </div>
                  <div className="mt-1 text-sm text-orange-600">
                    被访人: {v.visitee_name || '-'}
                  </div>
                  <div className="mt-1 text-xs text-orange-500">
                    应离时间: {new Date(v.expected_leave).toLocaleString('zh-CN')}
                  </div>
                  <div className="mt-1 text-xs text-orange-400">
                    签到时间: {v.check_in_time ? new Date(v.check_in_time).toLocaleString('zh-CN') : '-'}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
