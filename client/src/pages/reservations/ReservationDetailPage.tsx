import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ReservationForm from '../../components/reservations/ReservationForm';
import { reservationApi } from '../../api/reservations';
import { equipmentApi } from '../../api/equipments';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { Reservation, Equipment } from '../../types';
import { formatDateTime, formatDateTimeRange } from '../../utils/format';

interface TimelineEvent {
  time: string;
  action: string;
  user: string;
  description?: string;
}

const ReservationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { user, canApprove, canHandlePickupReturn, isReporter } = usePermission();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<{
    action: string;
    title: string;
    message: string;
    variant: 'primary' | 'danger' | 'warning';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const reservationId = parseInt(id || '0', 10);

  const fetchData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const reservationResponse = await reservationApi.getDetail(reservationId);

      if (reservationResponse.success && reservationResponse.data) {
        setReservation(reservationResponse.data);
        if (reservationResponse.data.equipment_id) {
          const equipmentResponse = await equipmentApi.getDetail(reservationResponse.data.equipment_id);
          if (equipmentResponse.success && equipmentResponse.data) {
            setEquipment(equipmentResponse.data);
          }
        }
      } else {
        setErrorState(reservationResponse.error || '加载预约详情失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservationId) {
      fetchData();
    }
  }, [reservationId]);

  const handleBack = () => {
    navigate('/reservations');
  };

  const handleEdit = () => {
    if (reservation && reservation.status !== 'pending') {
      error('仅待审批状态的预约可编辑');
      return;
    }
    setIsFormOpen(true);
  };

  const getAvailableActions = () => {
    if (!reservation) return [];
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

  const handleStatusAction = (actionKey: string) => {
    const actionConfig: Record<string, { title: string; message: string; variant: 'primary' | 'danger' | 'warning' }> = {
      approve: { title: '审批通过', message: '确定要通过此预约的审批吗？', variant: 'primary' },
      reject: { title: '驳回预约', message: '确定要驳回此预约吗？', variant: 'danger' },
      pickup: { title: '确认领用', message: '确定要标记此设备为已领用吗？', variant: 'primary' },
      return: { title: '确认归还', message: '确定要标记此设备为已归还吗？', variant: 'primary' },
      cancel: { title: '取消预约', message: '确定要取消此预约吗？此操作不可撤销。', variant: 'warning' },
    };

    const config = actionConfig[actionKey];
    if (config) {
      setStatusAction({ action: actionKey, ...config });
    }
  };

  const executeStatusAction = async () => {
    if (!statusAction || !reservation) return;

    setActionLoading(true);
    try {
      const { action } = statusAction;
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
        fetchData();
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

  const handleBorrowMediaCard = () => {
    if (reservation) {
      navigate(`/media-cards?equipment_id=${reservation.equipment_id}&reservation_id=${reservation.id}`);
    }
  };

  const getTimeline = (): TimelineEvent[] => {
    if (!reservation) return [];
    const events: TimelineEvent[] = [];

    events.push({
      time: reservation.created_at,
      action: '创建预约',
      user: reservation.requester_name,
      description: '预约申请已提交',
    });

    if (reservation.status === 'pending') {
      events.push({
        time: reservation.created_at,
        action: '待审批',
        user: '系统',
        description: '等待审批人处理',
      });
    }

    if (reservation.approved_at && reservation.status !== 'rejected' && reservation.status !== 'cancelled') {
      events.push({
        time: reservation.approved_at,
        action: '审批通过',
        user: reservation.approver_name || '系统',
        description: '预约已通过审批',
      });
    }

    if (reservation.status === 'rejected') {
      events.push({
        time: reservation.approved_at || reservation.created_at,
        action: '已驳回',
        user: reservation.approver_name || '系统',
        description: '预约已被驳回',
      });
    }

    if (reservation.actual_pickup_time) {
      events.push({
        time: reservation.actual_pickup_time,
        action: '设备领用',
        user: reservation.pickup_handler_name || '系统',
        description: '设备已领用',
      });
    }

    if (reservation.actual_return_time) {
      events.push({
        time: reservation.actual_return_time,
        action: '设备归还',
        user: reservation.return_handler_name || '系统',
        description: '设备已归还',
      });
    }

    if (reservation.status === 'cancelled') {
      events.push({
        time: reservation.created_at,
        action: '已取消',
        user: reservation.requester_name,
        description: '预约已取消',
      });
    }

    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  const canEdit = (): boolean => {
    if (!reservation) return false;
    if (reservation.status !== 'pending') return false;
    if (isReporter()) {
      return reservation.requester_id === user?.id;
    }
    return canApprove();
  };

  const InfoItem: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex">
      <dt className="w-28 text-sm text-gray-500 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 flex-1">{value || '-'}</dd>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loading text="加载中..." size="lg" />
      </div>
    );
  }

  if (errorState || !reservation) {
    return (
      <div className="min-h-full">
        <Header title="预约详情" />
        <div className="p-6">
          <ErrorState message={errorState || '预约不存在'} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  const actions = getAvailableActions();
  const timeline = getTimeline();

  return (
    <div className="min-h-full">
      <Header
        title="预约详情"
        subtitle={reservation.reservation_no}
        actions={
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="btn-secondary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回列表
            </button>
            {canEdit() && (
              <button onClick={handleEdit} className="btn-secondary">
                编辑
              </button>
            )}
          </div>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{reservation.equipment_name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{reservation.reservation_no}</p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>

              <div className="space-y-4">
                <InfoItem label="设备编号" value={reservation.equipment_code || '-'} />
                <InfoItem label="设备分类" value={reservation.equipment_category || '-'} />
                <InfoItem label="申请人" value={reservation.requester_name} />
                <InfoItem
                  label="预约时间"
                  value={formatDateTimeRange(reservation.expected_pickup_time, reservation.expected_return_time)}
                />
                <InfoItem
                  label="实际领用"
                  value={reservation.actual_pickup_time ? formatDateTime(reservation.actual_pickup_time) : '-'}
                />
                <InfoItem
                  label="实际归还"
                  value={reservation.actual_return_time ? formatDateTime(reservation.actual_return_time) : '-'}
                />
                <InfoItem label="审批人" value={reservation.approver_name || '-'} />
                <InfoItem
                  label="审批时间"
                  value={reservation.approved_at ? formatDateTime(reservation.approved_at) : '-'}
                />
                <InfoItem label="创建时间" value={formatDateTime(reservation.created_at)} />
              </div>

              {reservation.purpose && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">用途描述</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{reservation.purpose}</p>
                </div>
              )}

              {reservation.remark && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">备注</h3>
                  <p className="text-sm text-gray-600">{reservation.remark}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                {actions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">状态流转</p>
                    <div className="grid grid-cols-2 gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.key}
                          onClick={() => handleStatusAction(action.key)}
                          className={`btn-${action.variant} btn-sm`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {reservation.status === 'picked_up' && (
                  <button onClick={handleBorrowMediaCard} className="btn-primary w-full">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    借用素材卡
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold">关联信息</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">设备信息</h3>
                    {equipment ? (
                      <div
                        onClick={() => navigate(`/equipments/${equipment.id}`)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">{equipment.name}</p>
                            <p className="text-sm text-gray-500">{equipment.code}</p>
                          </div>
                          <StatusBadge status={equipment.status} />
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="text-gray-500">品牌：</span>
                            {equipment.brand || '-'}
                          </p>
                          <p>
                            <span className="text-gray-500">型号：</span>
                            {equipment.model || '-'}
                          </p>
                          <p>
                            <span className="text-gray-500">位置：</span>
                            {equipment.location || '-'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <EmptyState title="暂无设备信息" description="" />
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">任务信息</h3>
                    {reservation.task_id ? (
                      <div
                        onClick={() => navigate(`/tasks/${reservation.task_id}`)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">{reservation.task_title || '关联任务'}</p>
                            <p className="text-sm text-gray-500">{reservation.task_number || '-'}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>
                            <span className="text-gray-500">点击查看任务详情</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <EmptyState title="未关联任务" description="" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold">操作时间线</h2>
              </div>
              <div className="p-6">
                <div className="relative">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 absolute top-3" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{event.action}</span>
                          <span className="text-sm text-gray-500">{event.user}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{formatDateTime(event.time)}</p>
                        {event.description && (
                          <p className="text-sm text-gray-600">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReservationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        reservation={reservation}
        onSuccess={fetchData}
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

export default ReservationDetailPage;
