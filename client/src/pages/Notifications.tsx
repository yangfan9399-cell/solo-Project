import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { Button } from '../components/Modal';
import { formatRelativeTime } from '../utils/format';
import type { Notification } from '../types';

const typeIcons: Record<string, string> = {
  repair: '🔧',
  quality: '💧',
  water_stop: '🚰',
  system: '📢',
};

const typeLabels: Record<string, string> = {
  repair: '报修通知',
  quality: '水质通知',
  water_stop: '停水通知',
  system: '系统通知',
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getAll();
      setNotifications(response.data);
    } catch (err) {
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      alert('操作失败，请重试');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      alert('操作失败，请重试');
    }
  };

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={fetchNotifications} />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-sm rounded-full">
              {unreadCount} 条未读
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            全部标记已读
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {notifications.length === 0 ? (
          <EmptyState title="暂无通知" description="还没有任何通知" icon={Bell} />
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{typeIcons[notification.type] || '📢'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{notification.title}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {typeLabels[notification.type] || notification.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-gray-600 text-sm">{notification.content}</p>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
