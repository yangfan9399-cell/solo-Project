import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Loading from '../components/common/Loading';
import ErrorState from '../components/common/ErrorState';
import UserForm from '../components/users/UserForm';
import { userApi } from '../api/users';
import { useNotificationStore } from '../store/notificationStore';
import { usePermission } from '../hooks/usePermission';
import type { User } from '../types';
import { ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, USER_STATUS_COLORS, USER_STATUS_LABELS } from '../utils/constants';
import { formatDateTime } from '../utils/format';

const UserListPage: React.FC = () => {
  const { success, error } = useNotificationStore();
  const { canManageUsers } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleDialog, setToggleDialog] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await userApi.getList({
        keyword: keyword || undefined,
        role: role || undefined,
      });
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setErrorState(response.error || '加载用户列表失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers()) {
      fetchUsers();
    }
  }, [keyword, role, canManageUsers]);

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: User) => {
    setEditingUser(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: User) => {
    setDeleteDialog({ isOpen: true, user: item });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.user) return;
    setDeleteLoading(true);
    try {
      const response = await userApi.delete(deleteDialog.user.id);
      if (response.success) {
        success('用户删除成功');
        fetchUsers();
      } else {
        error(response.error || '删除失败');
      }
    } catch (e) {
      error('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = (item: User) => {
    setToggleDialog({ isOpen: true, user: item });
  };

  const confirmToggleStatus = async () => {
    if (!toggleDialog.user) return;
    setToggleLoading(true);
    try {
      const response = await userApi.toggleStatus(toggleDialog.user.id);
      if (response.success) {
        success(response.message || '操作成功');
        fetchUsers();
      } else {
        error(response.error || '操作失败');
      }
    } catch (e) {
      error('操作失败，请稍后重试');
    } finally {
      setToggleLoading(false);
      setToggleDialog({ isOpen: false, user: null });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'username',
        title: '用户名',
        className: 'w-32',
      },
      {
        key: 'name',
        title: '姓名',
        className: 'w-24',
        render: (item: User) => (
          <span className="font-medium text-gray-900">{item.name}</span>
        ),
      },
      {
        key: 'email',
        title: '邮箱',
        render: (item: User) => item.email || '-',
      },
      {
        key: 'role',
        title: '角色',
        className: 'w-32',
        render: (item: User) => (
          <span className={`badge ${ROLE_COLORS[item.role]}`}>
            {ROLE_LABELS[item.role]}
          </span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        className: 'w-24',
        render: (item: User) => (
          <span className={`badge ${USER_STATUS_COLORS[item.status]}`}>
            {USER_STATUS_LABELS[item.status]}
          </span>
        ),
      },
      {
        key: 'created_at',
        title: '创建时间',
        className: 'w-40',
        render: (item: User) => formatDateTime(item.created_at),
      },
      {
        key: 'actions',
        title: '操作',
        className: 'w-64',
        render: (item: User) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              编辑
            </button>
            {(item.role !== 'admin' || item.status === 'inactive') && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(item);
                  }}
                  className={`text-sm font-medium ${
                    item.status === 'active'
                      ? 'text-orange-600 hover:text-orange-700'
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {item.status === 'active' ? '禁用' : '启用'}
                </button>
              </>
            )}
            <span className="text-gray-300">|</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              删除
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const handleReset = () => {
    setKeyword('');
    setRole('');
  };

  if (!canManageUsers()) {
    return (
      <div className="min-h-full">
        <Header title="用户管理" />
        <div className="p-6">
          <ErrorState message="您没有权限访问此页面" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Header
        title="用户管理"
        subtitle="管理系统用户和权限"
        actions={
          <button onClick={handleAdd} className="btn-primary">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增用户
          </button>
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
                  placeholder="搜索用户名、姓名、邮箱..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>
            <div className="w-40">
              <label className="form-label">角色</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">全部角色</option>
                {ROLE_OPTIONS.map((opt) => (
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

        {loading ? (
          <div className="py-16">
            <Loading text="加载中..." />
          </div>
        ) : errorState ? (
          <ErrorState message={errorState} onRetry={fetchUsers} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={users}
              emptyTitle="暂无用户"
              emptyDescription="还没有添加任何用户"
              emptyAction={
                <button onClick={handleAdd} className="btn-primary">
                  添加第一个用户
                </button>
              }
              rowKey={(item) => item.id}
            />
          </div>
        )}
      </div>

      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={editingUser}
        onSuccess={fetchUsers}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除用户"${deleteDialog.user?.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={toggleDialog.isOpen}
        onClose={() => setToggleDialog({ isOpen: false, user: null })}
        onConfirm={confirmToggleStatus}
        title={`确认${toggleDialog.user?.status === 'active' ? '禁用' : '启用'}`}
        message={`确定要${toggleDialog.user?.status === 'active' ? '禁用' : '启用'}用户"${toggleDialog.user?.name}"吗？`}
        confirmText={toggleDialog.user?.status === 'active' ? '禁用' : '启用'}
        confirmVariant={toggleDialog.user?.status === 'active' ? 'danger' : 'primary'}
        isLoading={toggleLoading}
      />
    </div>
  );
};

export default UserListPage;
