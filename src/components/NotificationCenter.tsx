import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

interface Notification {
  id: number;
  appointment_id: number | null;
  user_id: number | null;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

const typeConfig: Record<string, { label: string; icon: string; className: string }> = {
  approval: { label: '审批通知', icon: '📝', className: 'bg-blue-50 border-blue-200' },
  check_in: { label: '签到通知', icon: '✅', className: 'bg-green-50 border-green-200' },
  check_out: { label: '签退通知', icon: '🚪', className: 'bg-gray-50 border-gray-200' },
  timeout: { label: '超时提醒', icon: '⚠️', className: 'bg-orange-50 border-orange-200' },
};

interface NotificationCenterProps {
  showUserFilter?: boolean;
  compact?: boolean;
}

export default function NotificationCenter({ showUserFilter = true, compact = false }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterRead, setFilterRead] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterUser) params.append('user_id', filterUser);
      if (filterRead !== '') params.append('is_read', filterRead);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) throw new Error('获取通知列表失败');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('获取用户列表失败', err);
    }
  };

  const markAsRead = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('标记已读失败');
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!filterUser) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true, user_id: parseInt(filterUser) }),
      });
      if (!res.ok) throw new Error('标记全部已读失败');
      setNotifications(prev => prev.map(n => n.user_id === parseInt(filterUser) ? { ...n, is_read: 1 } : n));
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, [filterUser, filterRead]);

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  if (loading) return <LoadingSpinner text="加载通知列表..." />;
  if (error) return <ErrorState message={error} onRetry={fetchNotifications} />;

  return (
    <div className={compact ? '' : 'space-y-4'}>
      <div className="flex flex-wrap items-center gap-3">
        {showUserFilter && (
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部用户</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === 'admin' ? '管理员' : u.role === 'security' ? '安保' : '员工'})
              </option>
            ))}
          </select>
        )}
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="0">未读</option>
          <option value="1">已读</option>
        </select>
        {filterUser && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={actionLoading}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? '处理中...' : `全部标记已读 (${unreadCount})`}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="暂无通知" description="目前没有任何通知消息" icon="🔔" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || { label: n.type, icon: '📬', className: 'bg-gray-50 border-gray-200' };
            return (
              <div
                key={n.id}
                className={`p-4 rounded-lg border ${config.className} ${n.is_read === 0 ? 'ring-2 ring-blue-300' : 'opacity-75'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.icon}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${n.is_read === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {config.label}
                      </span>
                      {n.is_read === 0 && (
                        <span className="inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">{n.title}</h4>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(n.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {n.is_read === 0 && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        disabled={actionLoading}
                        className="text-xs px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        标记已读
                      </button>
                    )}
                    {n.appointment_id && (
                      <a
                        href={`/appointments/${n.appointment_id}`}
                        className="text-xs px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors text-center"
                      >
                        查看预约
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
