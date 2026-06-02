import { useState, useEffect } from 'react';
import { apiRequest, formatDateTime, getStatusText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Modal from './Modal';
import Pagination from './Pagination';

export default function NotificationList() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [listRes, statsRes] = await Promise.all([
        apiRequest(
          `/notifications?page=${page}&pageSize=20${statusFilter ? '&status=' + statusFilter : ''}${typeFilter ? '&type=' + typeFilter : ''}`
        ),
        apiRequest('/notifications/stats')
      ]);
      setData(listRes);
      setStats(statsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, typeFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      await apiRequest(`/notifications/${id}/read`, {
        method: 'PUT'
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条通知吗？')) return;
    try {
      await apiRequest(`/notifications/${id}`, {
        method: 'DELETE'
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBatchSend = async () => {
    if (!confirm('确定要批量发送所有已到货订单的通知吗？')) return;
    try {
      setIsProcessing('batch');
      const res = await apiRequest('/notifications/batch-arrival', {
        method: 'POST'
      });
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleBatchReminder = async () => {
    if (!confirm('确定要为所有已预留但未取书的订单批量发送提醒吗？')) return;
    try {
      setIsProcessing('reminder');
      const res = await apiRequest('/notifications/batch-reminder', {
        method: 'POST'
      });
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOverdueCheck = async () => {
    if (!confirm('确定要执行逾期检查吗？这将自动处理逾期未取的订单并退还订金。')) return;
    try {
      setIsProcessing('overdue');
      const res = await apiRequest('/notifications/overdue-check', {
        method: 'POST'
      });
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleViewDetail = (notification) => {
    setSelectedNotification(notification);
    setDetailModal(true);
    if (notification.status === 'sent') {
      handleMarkAsRead(notification.id);
    }
  };

  const getTypeText = (type) => {
    const map = {
      arrival: '到货通知',
      reminder: '取书提醒',
      overdue: '逾期通知',
      refund: '退款通知'
    };
    return map[type] || type;
  };

  const getTypeIcon = (type) => {
    const map = {
      arrival: '📦',
      reminder: '⏰',
      overdue: '⚠️',
      refund: '💰'
    };
    return map[type] || '📬';
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const unreadCount = data?.stats?.find(s => s.status === 'sent')?.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-sm rounded-full">
              {unreadCount} 条未读
            </span>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleOverdueCheck}
            disabled={isProcessing !== null}
            className="btn btn-secondary"
          >
            {isProcessing === 'overdue' ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                处理中...
              </>
            ) : (
              '🔍 逾期检查'
            )}
          </button>
          <button
            onClick={handleBatchReminder}
            disabled={isProcessing !== null}
            className="btn btn-secondary"
          >
            {isProcessing === 'reminder' ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                发送中...
              </>
            ) : (
              '⏰ 批量提醒'
            )}
          </button>
          <button
            onClick={handleBatchSend}
            disabled={isProcessing !== null}
            className="btn btn-primary"
          >
            {isProcessing === 'batch' ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                发送中...
              </>
            ) : (
              '📤 批量发送到货通知'
            )}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">待发送通知</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.toSend}</div>
              </div>
              <div className="text-3xl">📬</div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              到货通知 {stats.toSendArrival} 条 · 取书提醒 {stats.toSendReminder} 条
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">已通知</div>
                <div className="text-2xl font-bold text-blue-600">{stats.notified}</div>
              </div>
              <div className="text-3xl">✉️</div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              已发送到货通知和取书提醒的订单
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">已释放</div>
                <div className="text-2xl font-bold text-gray-600">{stats.released}</div>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              已逾期、退款或取消的订单
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">未读通知</div>
                <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
              </div>
              <div className="text-3xl">🔔</div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              点击通知可标记为已读
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b flex items-center space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部类型</option>
            {['arrival', 'reminder', 'overdue', 'refund'].map(t => (
              <option key={t} value={t}>{getTypeText(t)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部状态</option>
            {['sent', 'read', 'failed'].map(s => (
              <option key={s} value={s}>{getStatusText(s)}</option>
            ))}
          </select>
        </div>

        {data.data.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="暂无通知"
            description={
              statusFilter || typeFilter
                ? '当前筛选条件下没有通知，试试调整筛选条件'
                : '还没有发送过任何通知，有到货或逾期时会自动生成通知'
            }
          />
        ) : (
          <>
            <div className="divide-y">
              {data.data.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${notification.status === 'sent' ? 'bg-blue-50' : ''}`}
                  onClick={() => handleViewDetail(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`status-badge status-${notification.status} text-xs`}>
                            {getStatusText(notification.status)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {notification.type && getTypeText(notification.type)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.content}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span>收件人：{notification.member_name} ({notification.member_phone})</span>
                        <span>{formatDateTime(notification.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              current={data.pagination.page}
              pageSize={data.pagination.pageSize}
              total={data.pagination.total}
              onChange={setPage}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="通知详情"
        size="lg"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded">
              <span className="text-3xl">{getTypeIcon(selectedNotification.type)}</span>
              <div>
                <h2 className="text-lg font-bold">{selectedNotification.title}</h2>
                <p className="text-sm text-gray-500">
                  {getTypeText(selectedNotification.type)} · {formatDateTime(selectedNotification.created_at)}
                </p>
              </div>
            </div>

            <div className="p-4 border rounded">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">通知编号</span>
                <p className="font-mono">{selectedNotification.notification_no}</p>
              </div>
              <div>
                <span className="text-gray-500">状态</span>
                <p>
                  <span className={`status-badge status-${selectedNotification.status}`}>
                    {getStatusText(selectedNotification.status)}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-gray-500">会员</span>
                <p>{selectedNotification.member_name}</p>
              </div>
              <div>
                <span className="text-gray-500">手机号</span>
                <p>{selectedNotification.member_phone}</p>
              </div>
              <div>
                <span className="text-gray-500">相关图书</span>
                <p>{selectedNotification.book_title || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">发送渠道</span>
                <p>{selectedNotification.channel === 'sms' ? '短信' : selectedNotification.channel}</p>
              </div>
              {selectedNotification.sent_at && (
                <div>
                  <span className="text-gray-500">发送时间</span>
                  <p>{formatDateTime(selectedNotification.sent_at)}</p>
                </div>
              )}
              {selectedNotification.read_at && (
                <div>
                  <span className="text-gray-500">阅读时间</span>
                  <p>{formatDateTime(selectedNotification.read_at)}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => handleDelete(selectedNotification.id)}
                className="btn btn-secondary text-red-600"
              >
                删除
              </button>
              <button onClick={() => setDetailModal(false)} className="btn btn-primary">
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
