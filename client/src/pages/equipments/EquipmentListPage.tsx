import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EquipmentForm from '../../components/equipments/EquipmentForm';
import { equipmentApi } from '../../api/equipments';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { Equipment } from '../../types';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUS_OPTIONS } from '../../utils/constants';

const EquipmentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { canManageEquipment } = usePermission();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; equipment: Equipment | null }>({
    isOpen: false,
    equipment: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEquipments = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await equipmentApi.getList({
        keyword: keyword || undefined,
        category: category || undefined,
        status: status || undefined,
      });
      if (response.success && response.data) {
        setEquipments(response.data);
      } else {
        setErrorState(response.error || '加载设备列表失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, [keyword, category, status]);

  const handleAdd = () => {
    setEditingEquipment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: Equipment) => {
    setDeleteDialog({ isOpen: true, equipment: item });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.equipment) return;
    setDeleteLoading(true);
    try {
      const response = await equipmentApi.delete(deleteDialog.equipment.id);
      if (response.success) {
        success('设备删除成功');
        fetchEquipments();
      } else {
        error(response.error || '删除失败');
      }
    } catch (e) {
      error('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetail = (item: Equipment) => {
    navigate(`/equipments/${item.id}`);
  };

  const columns = useMemo(
    () => [
      {
        key: 'code',
        title: '编号',
        className: 'w-32',
      },
      {
        key: 'name',
        title: '名称',
        render: (item: Equipment) => (
          <span className="font-medium text-gray-900">{item.name}</span>
        ),
      },
      {
        key: 'category',
        title: '分类',
        className: 'w-24',
      },
      {
        key: 'model',
        title: '型号',
        className: 'w-32',
      },
      {
        key: 'status',
        title: '状态',
        className: 'w-24',
        render: (item: Equipment) => <StatusBadge status={item.status} />,
      },
      {
        key: 'stock_quantity',
        title: '库存数',
        className: 'w-20 text-center',
        render: (item: Equipment) => item.stock_quantity ?? 1,
      },
      {
        key: 'available',
        title: '可用数',
        className: 'w-20 text-center',
        render: (item: Equipment) => (
          <span className={item.status === 'available' ? 'text-green-600 font-medium' : 'text-gray-500'}>
            {item.status === 'available' ? (item.stock_quantity ?? 1) : 0}
          </span>
        ),
      },
      {
        key: 'location',
        title: '位置',
        className: 'w-32',
      },
      {
        key: 'actions',
        title: '操作',
        className: 'w-36',
        render: (item: Equipment) => (
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
            {canManageEquipment() && (
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
              </>
            )}
          </div>
        ),
      },
    ],
    [canManageEquipment]
  );

  const handleReset = () => {
    setKeyword('');
    setCategory('');
    setStatus('');
  };

  return (
    <div className="min-h-full">
      <Header
        title="设备台账"
        subtitle="管理所有设备的基本信息和状态"
        actions={
          canManageEquipment() ? (
            <button onClick={handleAdd} className="btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增设备
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
                  placeholder="搜索设备名称、编号、型号..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>
            <div className="w-40">
              <label className="form-label">分类</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">全部分类</option>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="form-label">状态</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">全部状态</option>
                {EQUIPMENT_STATUS_OPTIONS.map((opt) => (
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
          <ErrorState message={errorState} onRetry={fetchEquipments} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={equipments}
              emptyTitle="暂无设备"
              emptyDescription="还没有添加任何设备"
              emptyAction={
                canManageEquipment() ? (
                  <button onClick={handleAdd} className="btn-primary">
                    添加第一个设备
                  </button>
                ) : null
              }
              rowKey={(item) => item.id}
              onRowClick={handleViewDetail}
            />
          </div>
        )}
      </div>

      <EquipmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        equipment={editingEquipment}
        onSuccess={fetchEquipments}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, equipment: null })}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除设备"${deleteDialog.equipment?.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default EquipmentListPage;
