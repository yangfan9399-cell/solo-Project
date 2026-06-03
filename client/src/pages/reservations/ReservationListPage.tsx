import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import ReservationForm from '../../components/reservations/ReservationForm';
import { reservationApi, type ReservationQuery } from '../../api/reservations';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { Reservation, ReservationStatus } from '../../types';
import { RESERVATION_STATUS_OPTIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

type TabType = 'all' | 'my' | 'pending' | 'approved' | 'picked_up' | 'returned';

const tabs: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'my', label: '我的预约' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '待领用' },
  { key: 'picked_up', label: '使用中' },
  { key: 'returned', label: '已归还' },
];

const ReservationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useNotificationStore();
  const { user, canCreateReservation, canApprove, canHandlePickupReturn, isReporter } = usePermission();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [defaultTaskId, setDefaultTaskId] = useState<number | undefined>();
  const [statusAction, setStatusAction] = useState<{
    reservation: Reservation;
    action: string;
    title: string;
    message: string;
    variant: 'primary' | 'danger' | 'warning';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const taskId = searchParams.get('task_id');
    if (taskId) {
      setDefaultTaskId(parseInt(taskId, 10));
    }
  }, [searchParams]);

  const fetchReservations = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const params: ReservationQuery = {};

      if (keyword.trim()) {
        params.keyword = keyword.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      } else if (activeTab === 'pending') {
        params.status = 'pending';
      } else if (activeTab === 'approved') {
        params.status = 'approved';
      } else if (activeTab === 'picked_up') {
        params.status = 'picked_up';
      } else if (activeTab === 'returned') {
        params.status = 'returned';
      }

      if (activeTab === 'my' && user) {
        params.requester_id = user.id;
      }

      const response = await reservationApi.getList(params);
      if (response.success && response.data) {
        setReservations(response.data);
      } else {
        setErrorState(response.error || '加载预约列表失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [keyword, statusFilter, activeTab, user]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setStatusFilter('');
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setActiveTab('all');
  };

  const handleAdd = () => {
    setEditingReservation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Reservation) => {
    if (item.status !== 'pending') {
      error('仅待审批状态的预约可编辑');
      return;
    }
    setEditingReservation(item);
    setIsFormOpen(true);
  };

  const handleViewDetail = (item: Reservation) => {
    navigate(`/reservations/${item.id}`);
  };

  const getAvailableActions = (reservation: Reservation) => {
    const actions: { key: string; label: string; variant: 'primary' | 'danger' | 'warning' }[] = [];

    if (reservation.status === 'pending' && canApprove()) {
      actions.push({ key: 'approve', label: '审批通过', variant: 'primary' });
      actions.push({ key: 'reject', label: '驳回', variant: 'danger' });
    }

    if (reservation.status === 'approved' && canHandlePickupReturn()) {
      actions.push({ key: 'pickup', label: '领用', variant: 'primary' });
    }

    if (reservation.status === 'picked_up' && canHandlePickupReturn()) {
      actions.push({ key: 'return', label: '归还', variant: 'primary' });
    }

    if (['pending', 'approved'].includes(reservation.status)) {
      if (isReporter() && reservation.requester_id === user?.id) {
        actions.push({ key: 'cancel', label: '取消', variant: 'warning' });
      }
    }

    return actions;
  };

  const handleStatusAction = (reservation: Reservation, actionKey: string) => {
    const actionConfig: Record<string, { title: string; message: string; variant: 'primary' | 'danger' | 'warning' }> = {
      approve: { title: '审批通过', message: '确定要通过此预约的审批吗？', variant: 'primary' },
      reject: { title: '驳回预约', message: '确定要驳回此预约吗？', variant: 'danger' },
      pickup: { title: '确认领用', message: '确定要标记此设备为已领用吗？', variant: 'primary' },
      return: { title: '确认归还', message: '确定要标记此设备为已归还吗？', variant: 'primary' },
      cancel: { title: '取消预约', message: '确定要取消此预约吗？此操作不可撤销。', variant: 'warning' },
    };

    const config = actionConfig[actionKey];
    if (config) {
      setStatusAction({ reservation, action: actionKey, ...config });
    }
  };

  const executeStatusAction = async () => {
    if (!statusAction) return;

    setActionLoading(true);
    try {
      const { reservation, action } = statusAction;
      let response;

      switch (action) {
        case 'approve':
          response = await reservationApi.approve(reservation.id);
          break;
        case 'reject':
          response = await reservationApi.reject(reservation.id);
          break;
        case 'pickup':
          response = await reservationApi.pickup(reservation.id);
          break;
        case 'return':
          response = await reservationApi.return(reservation.id);
          break;
        case 'cancel':
          response = await reservationApi.cancel(reservation.id);
          break;
        default:
          return;
      }

      if (response.success) {
        success('操作成功');
        fetchReservations();
      } else {
        error(response.error || '操作失败');
      }
    } catch (e) {
      error('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
      setStatusAction(null);
    }
  };

  const canEdit = (reservation: Reservation): boolean => {
    if (reservation.status !== 'pending') return false;
    if (isReporter()) {
      return reservation.requester_id === user?.id;
    }
    return canApprove();
  };

  const columns = useMemo(
    () => [
      {
        key: 'reservation_no',
        title: '编号',
        className: 'w-32',
        render: (item: Reservation) => (
          <span className="font-mono text-sm text-gray-600">{item.reservation_no}</span>
        ),
      },
      {
        key: 'equipment',
        title: '设备',
        render: (item: Reservation) => (
          <div>
            <span className="font-medium text-gray-900">{item.equipment_name}</span>
            {item.equipment_code && <p className="text-xs text-gray-500 mt-0.5">{item.equipment_code}</p>}
          </div>
        ),
      },
      {
        key: 'task',
        title: '任务',
        className: 'w-48',
        render: (item: Reservation) => (
          <div>
            {item.task_title ? (
              <>
                <span className="text-gray-900">{item.task_title}</span>
                {item.task_number && <p className="text-xs text-gray-500 mt-0.5">{item.task_number}</p>}
              </>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        ),
      },
      {
        key: 'requester',
        title: '申请人',
        className: 'w-24',
        render: (item: Reservation) => item.requester_name,
      },
      {
        key: 'time',
        title: '预约时间段',
        className: 'w-56',
        render: (item: Reservation) => (
          <div className="text-sm">
            <div>{formatDateTime(item.expected_pickup_time)}</div>
            <div className="text-gray-500">至 {formatDateTime(item.expected_return_time)}</div>
          </div>
        ),
      },
      {
        key: 'status',
        title: '状态',
        className: 'w-24',
        render: (item: Reservation) => <StatusBadge status={item.status} />,
      },
      {
        key: 'created_at',
        title: '创建时间',
        className: 'w-40',
        render: (item: Reservation) => formatDateTime(item.created_at),
      },
      {
        key: 'actions',
        title: '操作',
        className: 'w-48',
        render: (item: Reservation) => {
          const actions = getAvailableActions(item);
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetail(item);
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                详情
              </button>
              {canEdit(item) && (
                <>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    编辑
                  </button>
                </>
              )}
              {actions.length > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <div className="relative group">
                    <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">更多</button>
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] hidden group-hover:block z-10">
                      {actions.map((action) => (
                        <button
                          key={action.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusAction(item, action.key);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                            action.variant === 'danger' ? 'text-red-600' : action.variant === 'warning' ? 'text-yellow-600' : 'text-gray-900'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [user, canApprove, canHandlePickupReturn, isReporter]
  );

  return (
    <div className="min-h-full">
      <Header
        title="预约审批"
        subtitle="管理设备预约申请和审批流程"
        actions={
          canCreateReservation() ? (
            <button onClick={handleAdd} className="btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增预约
            </button>
          ) : null
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-64">
              <label className="form-label">搜索</label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="搜索预约编号、设备名称、申请人..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>
            <div className="w-40">
              <label className="form-label">状态</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | '')}
              >
                <option value="">全部状态</option>
                {RESERVATION_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleReset} className="btn-secondary">
              重置
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-4">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="py-16">
                <Loading text="加载中..." />
              </div>
            ) : errorState ? (
              <ErrorState message={errorState} onRetry={fetchReservations} />
            ) : (
              <DataTable
                columns={columns}
                data={reservations}
                emptyTitle="暂无预约"
                emptyDescription="还没有任何预约记录"
                emptyAction={
                  canCreateReservation() ? (
                    <button onClick={handleAdd} className="btn-primary">
                      添加第一个预约
                    </button>
                  ) : null
                }
                rowKey={(item) => item.id}
                onRowClick={handleViewDetail}
              />
            )}
          </div>
        </div>
      </div>

      <ReservationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        reservation={editingReservation}
        onSuccess={fetchReservations}
        defaultTaskId={defaultTaskId}
      />

      <ConfirmDialog
        isOpen={!!statusAction}
        onClose={() => setStatusAction(null)}
        onConfirm={executeStatusAction}
        title={statusAction?.title || ''}
        message={statusAction?.message || ''}
        confirmText="确认"
        confirmVariant={statusAction?.variant || 'primary'}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default ReservationListPage;
