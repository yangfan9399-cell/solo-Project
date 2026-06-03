import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ShootingTask, TaskStatus, Priority } from '../../types';
import { taskApi, type TaskQuery } from '../../api/tasks';
import { usePermission } from '../../hooks/usePermission';
import Header from '../../components/layout/Header';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import TaskForm from '../../components/tasks/TaskForm';
import { formatDateTime } from '../../utils/format';
import { TASK_STATUS_OPTIONS, PRIORITY_COLORS, PRIORITY_LABELS } from '../../utils/constants';
import { useNotificationStore } from '../../store/notificationStore';

type TabType = 'all' | 'my' | 'pending' | 'in_progress' | 'completed';

const tabs: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'my', label: '我的任务' },
  { key: 'pending', label: '待审批' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

const TaskListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, canCreateTask, canApprove, isReporter } = usePermission();
  const { addNotification } = useNotificationStore();
  const [tasks, setTasks] = useState<ShootingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ShootingTask | undefined>();
  const [statusAction, setStatusAction] = useState<{ task: ShootingTask; action: string; title: string; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: TaskQuery = {};

      if (keyword.trim()) {
        params.keyword = keyword.trim();
      }

      if (statusFilter) {
        params.status = statusFilter;
      } else if (activeTab === 'pending') {
        params.status = 'pending';
      } else if (activeTab === 'in_progress') {
        params.status = 'in_progress';
      } else if (activeTab === 'completed') {
        params.status = 'completed';
      }

      if (activeTab === 'my' && user) {
        params.reporter_id = user.id;
      }

      const response = await taskApi.getList(params);
      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        setError(response.error || '加载任务列表失败');
      }
    } catch (err) {
      setError('加载任务列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, activeTab, user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setStatusFilter('');
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setPriorityFilter('');
    setActiveTab('all');
  };

  const handleCreate = () => {
    setEditingTask(undefined);
    setIsFormModalOpen(true);
  };

  const handleEdit = (task: ShootingTask) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingTask(undefined);
    fetchTasks();
  };

  const canEditTask = (task: ShootingTask): boolean => {
    if (isReporter()) {
      return task.status === 'draft' && task.reporter_id === user?.id;
    }
    return true;
  };

  const getAvailableActions = (task: ShootingTask) => {
    const actions: { key: string; label: string; variant: 'primary' | 'danger' | 'warning' }[] = [];

    if (task.status === 'draft' && task.reporter_id === user?.id) {
      actions.push({ key: 'submit', label: '提交审批', variant: 'primary' });
    }

    if (task.status === 'pending' && canApprove()) {
      actions.push({ key: 'approve', label: '审批通过', variant: 'primary' });
      actions.push({ key: 'reject', label: '驳回', variant: 'danger' });
    }

    if (task.status === 'approved' && task.reporter_id === user?.id) {
      actions.push({ key: 'start', label: '开始拍摄', variant: 'primary' });
    }

    if (task.status === 'in_progress' && task.reporter_id === user?.id) {
      actions.push({ key: 'complete', label: '完成', variant: 'primary' });
    }

    if (['draft', 'pending', 'approved'].includes(task.status)) {
      actions.push({ key: 'cancel', label: '取消', variant: 'warning' });
    }

    return actions;
  };

  const handleStatusAction = (task: ShootingTask, actionKey: string) => {
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
      setStatusAction({ task, action: actionKey, ...config });
    }
  };

  const executeStatusAction = async () => {
    if (!statusAction) return;

    setActionLoading(true);
    try {
      const { task, action } = statusAction;
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
        fetchTasks();
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

  const filteredTasks = priorityFilter
    ? tasks.filter((task) => task.priority === priorityFilter)
    : tasks;

  const columns = [
    {
      key: 'task_no',
      title: '任务编号',
      render: (task: ShootingTask) => (
        <span className="font-mono text-sm text-gray-600">{task.task_no}</span>
      ),
    },
    {
      key: 'title',
      title: '标题',
      render: (task: ShootingTask) => (
        <div className="max-w-xs truncate" title={task.title}>
          {task.title}
        </div>
      ),
    },
    {
      key: 'priority',
      title: '优先级',
      render: (task: ShootingTask) => (
        <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (task: ShootingTask) => <StatusBadge status={task.status} />,
    },
    {
      key: 'shooting_time',
      title: '拍摄时间',
      render: (task: ShootingTask) => (
        <div className="text-sm">
          <div>{formatDateTime(task.shooting_start_time)}</div>
          <div className="text-gray-500">至 {formatDateTime(task.shooting_end_time)}</div>
        </div>
      ),
    },
    {
      key: 'reporter_name',
      title: '负责人',
      render: (task: ShootingTask) => task.reporter_name || '-',
    },
    {
      key: 'created_at',
      title: '创建时间',
      render: (task: ShootingTask) => formatDateTime(task.created_at),
    },
    {
      key: 'actions',
      title: '操作',
      className: 'w-48',
      render: (task: ShootingTask) => {
        const actions = getAvailableActions(task);
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/tasks/${task.id}`)}
              className="btn-outline btn-sm"
            >
              详情
            </button>
            {canEditTask(task) && (
              <button
                onClick={() => handleEdit(task)}
                className="btn-outline btn-sm"
              >
                编辑
              </button>
            )}
            {actions.length > 0 && (
              <div className="relative group">
                <button className="btn-outline btn-sm">更多</button>
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] hidden group-hover:block z-10">
                  {actions.map((action) => (
                    <button
                      key={action.key}
                      onClick={() => handleStatusAction(task, action.key)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="拍摄任务" />
        <main className="p-8">
          <ErrorState message={error} onRetry={fetchTasks} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="拍摄任务"
        subtitle="管理和跟踪所有拍摄任务"
        actions={
          canCreateTask() && (
            <button onClick={handleCreate} className="btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建任务
            </button>
          )
        }
      />

      <main className="p-8">
        <div className="card mb-6">
          <div className="card-body">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="label">搜索</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="input"
                  placeholder="按标题、任务编号搜索"
                />
              </div>
              <div className="w-40">
                <label className="label">状态</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                  className="input"
                >
                  <option value="">全部状态</option>
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="label">优先级</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
                  className="input"
                >
                  <option value="">全部优先级</option>
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  搜索
                </button>
                <button type="button" onClick={handleReset} className="btn-secondary">
                  重置
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <DataTable
              columns={columns}
              data={filteredTasks}
              loading={loading}
              emptyTitle="暂无任务"
              emptyDescription="点击右上角按钮创建新的拍摄任务"
              rowKey={(task) => task.id}
            />
          </div>
        </div>
      </main>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingTask ? '编辑任务' : '新建任务'}
        size="lg"
      >
        <TaskForm
          task={editingTask}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormModalOpen(false)}
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

export default TaskListPage;
