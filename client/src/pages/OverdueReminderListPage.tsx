import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import { overdueReminderApi } from '../api/overdueReminders';
import { useNotificationStore } from '../store/notificationStore';
import { usePermission } from '../hooks/usePermission';
import type { OverdueReminder } from '../types';
import { REMINDER_TYPE_LABELS, STATUS_LABELS } from '../utils/constants';
import { formatDateTime, formatRelativeTime } from '../utils/format';

const OVERDUE_TABS = [
  { value: '', label: '全部' },
  { value: 'reservation', label: '设备逾期' },
  { value: 'media_card', label: '素材卡逾期' },
  { value: 'pending', label: '未通知' },
  { value: 'resolved', label: '已解决' },
];

const OverdueReminderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { canManageEquipment } = usePermission();
  const [reminders, setReminders] = useState<OverdueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    reminder: OverdueReminder | null;
    action: 'notify' | 'resolve' | null;
  }>({
    isOpen: false,
    reminder: null,
    action: null,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchConfirmDialog, setBatchConfirmDialog] = useState(false);

  const fetchReminders = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const params: { type?: string; status?: string } = {};
      if (activeTab === 'reservation' || activeTab === 'media_card') {
        params.type = activeTab;
      } else if (activeTab === 'pending' || activeTab === 'resolved') {
        params.status = activeTab;
      }

      const response = await overdueReminderApi.getList(params);
      if (response.success && response.data) {
        setReminders(response.data);
        setSelectedIds([]);
      } else {
        setErrorState(response.error || '加载逾期提醒列表失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await overdueReminderApi.refresh();
      if (response.success) {
        success('逾期状态已更新');
        fetchReminders();
      } else {
        error(response.error || '刷新失败');
      }
    } catch (e) {
      error('刷新失败，请稍后重试');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(reminders.filter(r => r.status === 'pending').map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleNotify = (item: OverdueReminder) => {
    setActionDialog({ isOpen: true, reminder: item, action: 'notify' });
  };

  const handleResolve = (item: OverdueReminder) => {
    setActionDialog({ isOpen: true, reminder: item, action: 'resolve' });
  };

  const handleGoToDetail = (item: OverdueReminder) => {
    if (item.type === 'reservation') {
      navigate(`/reservations/${item.related_id}`);
    } else if (item.type === 'media_card') {
      navigate(`/media-cards/${item.related_id}`);
    }
  };

  const confirmAction = async () => {
    if (!actionDialog.reminder || !actionDialog.action) return;
    setActionLoading(true);
    try {
      let response;
      const { id } = actionDialog.reminder;
      
      switch (actionDialog.action) {
        case 'notify':
          response = await overdueReminderApi.notify(id);
          break;
        case 'resolve':
          response = await overdueReminderApi.resolve(id);
          break;
      }

      if (response.success) {
        success('操作成功');
        fetchReminders();
      } else {
        error(response.error || '操作失败');
      }
    } catch (e) {
      error('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
      setActionDialog({ isOpen: false, reminder: null, action: null });
    }
  };

  const handleBatchNotify = async () => {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    try {
      const response = await overdueReminderApi.batchNotify(selectedIds);
      if (response.success) {
        success(response.message || '批量标记成功');
        fetchReminders();
      } else {
        error(response.error || '批量标记失败');
      }
    } catch (e) {
      error('批量标记失败，请稍后重试');
    } finally {
      setBatchLoading(false);
      setBatchConfirmDialog(false);
    }
  };

  const getActionDialogContent = () => {
    if (!actionDialog.reminder || !actionDialog.action) return { title: '', message: '' };
    
    const titles: Record<string, string> = {
      notify: '确认标记已通知',
      resolve: '确认标记已解决',
    };
    
    const messages: Record<string, string> = {
      notify: `确定要标记"${actionDialog.reminder.related_no}"为已通知吗？`,
      resolve: `确定要标记"${actionDialog.reminder.related_no}"为已解决吗？`,
    };

    return {
      title: titles[actionDialog.action],
      message: messages[actionDialog.action],
    };
  };

  const columns = useMemo(
    () => [
      {
        key: 'select',
        title: (
          <div className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={selectedIds.length > 0 && selectedIds.length === reminders.filter(r => r.status === 'pending').length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              disabled={!canManageEquipment()}
            />
          </div>
        ),
        className: 'w-12',
        render: (item: OverdueReminder) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={selectedIds.includes(item.id)}
              onChange={(e) => handleSelect(item.id, e.target.checked)}
              disabled={item.status !== 'pending' || !canManageEquipment()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
      },
      {
        key: 'type',
        title: '类型',
        className: 'w-28',
        render: (item: OverdueReminder) => (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.type === 'reservation' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            {REMINDER_TYPE_LABELS[item.type]}
          </span>
        ),
      },
      {
        key: 'related_no',
        title: '关联编号',
        className: 'w-32',
      },
      {
        key: 'related_content',
        title: '关联内容',
        render: (item: OverdueReminder) => (
          <div>
            <span className="font-medium text-gray-900">{item.equipment_name}</span>
            <p className="text-xs text-gray-500 mt-0.5">
              责任人：{item.user_name}
            </p>
          </div>
        ),
      },
      {
        key: 'overdue_days',
        title: '逾期时长',
        className: 'w-24',
        render: (item: OverdueReminder) => (
          <span className={item.overdue_days > 3 ? 'text-red-600 font-medium' : 'text-orange-600 font-medium'}>
            {item.overdue_days}天
          </span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        className: 'w-24',
        render: (item: OverdueReminder) => <StatusBadge status={item.status} />,
      },
      {
        key: 'notified_at',
        title: '通知状态',
        className: 'w-24',
        render: (item: OverdueReminder) => (
          item.notified_at 
            ? <span className="text-sm text-green-600">已通知</span>
            : <span className="text-sm text-gray-500">未通知</span>
        ),
      },
      {
        key: 'created_at',
        title: '创建时间',
        className: 'w-40',
        render: (item: OverdueReminder) => formatRelativeTime(item.created_at),
      },
      {
        key: 'actions',
        title: '操作',
        className: 'w-64',
        render: (item: OverdueReminder) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGoToDetail(item);
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              关联详情
            </button>
            {canManageEquipment() && (
              <>
                {item.status === 'pending' && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotify(item);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      标记已通知
                    </button>
                  </>
                )}
                {item.status !== 'resolved' && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(item);
                      }}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      标记已解决
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ),
      },
    ],
    [canManageEquipment, selectedIds, reminders]
  );

  const dialogContent = getActionDialogContent();
  const pendingCount = reminders.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-full">
      <Header
        title="逾期提醒"
        subtitle="管理设备和素材卡的逾期提醒"
        actions={
          <div className="flex items-center gap-3">
            {canManageEquipment() && selectedIds.length > 0 && (
              <button 
                onClick={() => setBatchConfirmDialog(true)} 
                className="btn-secondary"
                disabled={batchLoading}
              >
                批量标记已通知 ({selectedIds.length})
              </button>
            )}
            {canManageEquipment() && (
              <button onClick={handleRefresh} className="btn-secondary" disabled={refreshing}>
                {refreshing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                    刷新中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    刷新
                  </>
                )}
              </button>
            )}
          </div>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {OVERDUE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.value
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="py-16">
            <Loading text="加载中..." />
          </div>
        ) : errorState ? (
          <ErrorState message={errorState} onRetry={fetchReminders} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={reminders}
              emptyTitle="暂无逾期提醒"
              emptyDescription="当前没有逾期的设备或素材卡"
              rowKey={(item) => item.id}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={actionDialog.isOpen}
        onClose={() => setActionDialog({ isOpen: false, reminder: null, action: null })}
        onConfirm={confirmAction}
        title={dialogContent.title}
        message={dialogContent.message}
        confirmText="确认"
        isLoading={actionLoading}
      />

      <ConfirmDialog
        isOpen={batchConfirmDialog}
        onClose={() => setBatchConfirmDialog(false)}
        onConfirm={handleBatchNotify}
        title="确认批量标记"
        message={`确定要将选中的 ${selectedIds.length} 条记录标记为已通知吗？`}
        confirmText="确认"
        isLoading={batchLoading}
      />
    </div>
  );
};

export default OverdueReminderListPage;
