import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ShootingTask } from '../../types';
import { taskApi } from '../../api/tasks';
import { usePermission } from '../../hooks/usePermission';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/common/StatusBadge';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import TaskForm from '../../components/tasks/TaskForm';
import { formatDateTime, formatDateTimeRange } from '../../utils/format';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../../utils/constants';
import { useNotificationStore } from '../../store/notificationStore';

interface TimelineEvent {
  time: string;
  action: string;
  user: string;
  description?: string;
}

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canApprove, isReporter, canCreateReservation } = usePermission();
  const { addNotification } = useNotificationStore();
  const [task, setTask] = useState<ShootingTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<{ action: string; title: string; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await taskApi.getDetail(parseInt(id));
      if (response.success && response.data) {
        setTask(response.data);
      } else {
        setError(response.error || '加载任务详情失败');
      }
    } catch (err) {
      setError('加载任务详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const canEdit = (): boolean => {
    if (!task) return false;
    if (isReporter()) {
      return task.status === 'draft' && task.reporter_id === user?.id;
    }
    return true;
  };

  const getAvailableActions = () => {
    if (!task) return [];
    const actions: { key: string; label: string; variant: string }[] = [];

    if (task.status === 'draft' && task.reporter_id === user?.id) {
      actions.push({ key: 'submit', label: '提交审批', variant: 'primary' });
    }

    if (task.status === 'pending' && canApprove()) {
      actions.push({ key: 'approve', label: '审批通过', variant: 'success' });
      actions.push({ key: 'reject', label: '驳回', variant: 'danger' });
    }

    if (task.status === 'approved' && task.reporter_id === user?.id) {
      actions.push({ key: 'start', label: '开始拍摄', variant: 'primary' });
    }

    if (task.status === 'in_progress' && task.reporter_id === user?.id) {
      actions.push({ key: 'complete', label: '完成任务', variant: 'success' });
    }

    if (['draft', 'pending', 'approved'].includes(task.status)) {
      actions.push({ key: 'cancel', label: '取消任务', variant: 'warning' });
    }

    return actions;
  };

  const handleStatusAction = (actionKey: string) => {
    const actionConfig: Record<string, { title: string; message: string }> = {
      submit: { title: '提交审批', message: '确定要提交此任务进行审批吗？' },
      approve: { title: '审批通过', message: '确定要通过此任务的审批吗？' },
      reject: { title: '驳回任务', message: '确定要驳回此任务吗？' },
      start: { title: '开始拍摄', message: '确定要开始此拍摄任务吗？' },
      complete: { title: '完成任务', message: '确定要标记此任务为已完成吗？' },
      cancel: { title: '取消任务', message: '确定要取消此任务吗？此操作不可撤销。' },
    };

    const config = actionConfig[actionKey];
    if (config) {
      setStatusAction({ action: actionKey, ...config });
    }
  };

  const executeStatusAction = async () => {
    if (!statusAction || !task) return;

    setActionLoading(true);
    try {
      const { action } = statusAction;
      let response;

      switch (action) {
        case 'submit':
          response = await taskApi.submit(task.id);
          break;
        case 'approve':
          response = await taskApi.approve(task.id);
          break;
        case 'reject':
          response = await taskApi.reject(task.id);
          break;
        case 'start':
          response = await taskApi.start(task.id);
          break;
        case 'complete':
          response = await taskApi.complete(task.id);
          break;
        case 'cancel':
          response = await taskApi.cancel(task.id);
          break;
        default:
          return;
      }

      if (response.success) {
        addNotification('success', '操作成功');
        fetchTask();
      } else {
        addNotification('error', response.error || '操作失败');
      }
    } catch (err) {
      addNotification('error', '操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
      setStatusAction(null);
    }
  };

  const handleCreateReservation = () => {
    if (task) {
      navigate(`/reservations?task_id=${task.id}`);
    }
  };

  const getTimeline = (): TimelineEvent[] => {
    if (!task) return [];
    const events: TimelineEvent[] = [];

    events.push({
      time: task.created_at,
      action: '创建任务',
      user: task.reporter_name,
      description: '任务已创建',
    });

    if (task.status !== 'draft') {
      events.push({
        time: task.created_at,
        action: '提交审批',
        user: task.reporter_name,
        description: '任务已提交审批',
      });
    }

    if (task.approved_at && task.status !== 'rejected') {
      events.push({
        time: task.approved_at,
        action: '审批通过',
        user: task.producer_name || '系统',
        description: '任务已通过审批',
      });
    }

    if (task.status === 'rejected') {
      events.push({
        time: task.approved_at || task.created_at,
        action: '已驳回',
        user: task.producer_name || '系统',
        description: '任务已被驳回',
      });
    }

    if (task.status === 'in_progress' || task.status === 'completed') {
      events.push({
        time: task.shooting_start_time,
        action: '开始拍摄',
        user: task.reporter_name,
        description: '拍摄任务已开始',
      });
    }

    if (task.completed_at) {
      events.push({
        time: task.completed_at,
        action: '任务完成',
        user: task.reporter_name,
        description: '拍摄任务已完成',
      });
    }

    if (task.status === 'cancelled') {
      events.push({
        time: task.created_at,
        action: '任务取消',
        user: task.reporter_name,
        description: '任务已取消',
      });
    }

    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="任务详情" />
        <main className="p-8">
          <Loading text="加载任务详情..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="任务详情" />
        <main className="p-8">
          <ErrorState message={error} onRetry={fetchTask} />
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="任务详情" />
        <main className="p-8">
          <EmptyState title="任务不存在" description="请检查任务ID是否正确" />
        </main>
      </div>
    );
  }

  const actions = getAvailableActions();
  const timeline = getTimeline();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="任务详情"
        subtitle={task.task_no}
        actions={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tasks')} className="btn-secondary">
              返回列表
            </button>
            {canEdit() && (
              <button onClick={() => setIsEditModalOpen(true)} className="btn-secondary">
                编辑
              </button>
            )}
            {canCreateReservation() && ['approved', 'in_progress'].includes(task.status) && (
              <button onClick={handleCreateReservation} className="btn-primary">
                预约设备
              </button>
            )}
          </div>
        }
      />

      <main className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold">基本信息</h2>
                <div className="flex items-center gap-2">
                  <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  <StatusBadge status={task.status} />
                </div>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{task.description || '暂无描述'}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">拍摄地点</p>
                    <p className="font-medium">{task.shooting_location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">拍摄时间</p>
                    <p className="font-medium">
                      {formatDateTimeRange(task.shooting_start_time, task.shooting_end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">负责人</p>
                    <p className="font-medium">{task.reporter_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">制片负责人</p>
                    <p className="font-medium">{task.producer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">创建时间</p>
                    <p className="font-medium">{formatDateTime(task.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">审批时间</p>
                    <p className="font-medium">{formatDateTime(task.approved_at)}</p>
                  </div>
                </div>

                {task.remark && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">备注</p>
                    <p className="text-gray-700">{task.remark}</p>
                  </div>
                )}
              </div>
              {actions.length > 0 && (
                <div className="card-footer flex justify-end gap-3">
                  {actions.map((action) => (
                    <button
                      key={action.key}
                      onClick={() => handleStatusAction(action.key)}
                      className={`btn-${action.variant}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">操作时间线</h2>
              </div>
              <div className="card-body">
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

          <div className="space-y-6">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold">预约设备</h2>
                {canCreateReservation() && ['approved', 'in_progress'].includes(task.status) && (
                  <button onClick={handleCreateReservation} className="text-sm text-primary-600 hover:text-primary-700">
                    新增预约
                  </button>
                )}
              </div>
              <div className="card-body">
                {task.reservations && task.reservations.length > 0 ? (
                  <div className="space-y-3">
                    {task.reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        onClick={() => navigate(`/reservations/${reservation.id}`)}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{reservation.equipment_name}</span>
                          <StatusBadge status={reservation.status} />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{reservation.reservation_no}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(reservation.expected_pickup_time)} ~ {formatDateTime(reservation.expected_return_time)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="暂无预约"
                    description="此任务还没有预约任何设备"
                    action={
                      canCreateReservation() && ['approved', 'in_progress'].includes(task.status) ? (
                        <button onClick={handleCreateReservation} className="btn-primary btn-sm">
                          立即预约
                        </button>
                      ) : undefined
                    }
                  />
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">任务状态</h2>
              </div>
              <div className="card-body">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">当前状态</span>
                  <StatusBadge status={task.status} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">优先级</span>
                  <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">完成时间</span>
                  <span className="font-medium">{formatDateTime(task.completed_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑任务"
        size="lg"
      >
        <TaskForm
          task={task}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchTask();
          }}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!statusAction}
        onClose={() => setStatusAction(null)}
        onConfirm={executeStatusAction}
        title={statusAction?.title || ''}
        message={statusAction?.message || ''}
        confirmText="确认"
        confirmVariant={statusAction?.action === 'cancel' || statusAction?.action === 'reject' ? 'danger' : 'primary'}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default TaskDetailPage;
