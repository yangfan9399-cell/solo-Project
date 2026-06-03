import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import MediaCardForm from '../../components/mediaCards/MediaCardForm';
import MediaCardBorrowForm from '../../components/mediaCards/MediaCardBorrowForm';
import MediaCardReturnForm from '../../components/mediaCards/MediaCardReturnForm';
import { mediaCardApi } from '../../api/mediaCards';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { MediaCard } from '../../types';
import { MEDIA_CARD_TYPES, MEDIA_CARD_STATUS_OPTIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

type TabType = 'all' | 'available' | 'in_use' | 'damaged';

const MediaCardListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { canManageMediaCards, canBorrowMediaCards } = usePermission();
  const [mediaCards, setMediaCards] = useState<MediaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBorrowFormOpen, setIsBorrowFormOpen] = useState(false);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [editingMediaCard, setEditingMediaCard] = useState<MediaCard | null>(null);
  const [borrowingMediaCard, setBorrowingMediaCard] = useState<MediaCard | null>(null);
  const [returningMediaCard, setReturningMediaCard] = useState<MediaCard | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; mediaCard: MediaCard | null }>({
    isOpen: false,
    mediaCard: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMediaCards = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const status = activeTab === 'all' ? statusFilter : activeTab;
      const response = await mediaCardApi.getList({
        keyword: keyword || undefined,
        type: typeFilter || undefined,
        status: status || undefined,
      });
      if (response.success && response.data) {
        setMediaCards(response.data);
      } else {
        setErrorState(response.error || '加载素材卡列表失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaCards();
  }, [keyword, typeFilter, statusFilter, activeTab]);

  const handleAdd = () => {
    setEditingMediaCard(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MediaCard) => {
    setEditingMediaCard(item);
    setIsFormOpen(true);
  };

  const handleBorrow = (item: MediaCard) => {
    setBorrowingMediaCard(item);
    setIsBorrowFormOpen(true);
  };

  const handleReturn = (item: MediaCard) => {
    setReturningMediaCard(item);
    setIsReturnFormOpen(true);
  };

  const handleDelete = (item: MediaCard) => {
    setDeleteDialog({ isOpen: true, mediaCard: item });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.mediaCard) return;
    setDeleteLoading(true);
    try {
      const response = await mediaCardApi.delete(deleteDialog.mediaCard.id);
      if (response.success) {
        success('素材卡删除成功');
        fetchMediaCards();
      } else {
        error(response.error || '删除失败');
      }
    } catch (e) {
      error('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewDetail = (item: MediaCard) => {
    navigate(`/media-cards/${item.id}`);
  };

  const tabs = [
    { key: 'all' as TabType, label: '全部', count: mediaCards.length },
    { key: 'available' as TabType, label: '可用', count: mediaCards.filter((m) => m.status === 'available').length },
    { key: 'in_use' as TabType, label: '借用中', count: mediaCards.filter((m) => m.status === 'in_use').length },
    { key: 'damaged' as TabType, label: '已损坏', count: mediaCards.filter((m) => m.status === 'damaged').length },
  ];

  const columns = useMemo(
    () => [
      {
        key: 'code',
        title: '卡号',
        className: 'w-32',
        render: (item: MediaCard) => (
          <span className="font-medium text-gray-900">{item.code}</span>
        ),
      },
      {
        key: 'type',
        title: '类型',
        className: 'w-28',
      },
      {
        key: 'capacity',
        title: '容量',
        className: 'w-20',
      },
      {
        key: 'status',
        title: '状态',
        className: 'w-24',
        render: (item: MediaCard) => <StatusBadge status={item.status} />,
      },
      {
        key: 'equipment_name',
        title: '关联设备',
        className: 'w-40',
        render: (item: MediaCard) => item.equipment_name || '-',
      },
      {
        key: 'current_user_name',
        title: '借用人',
        className: 'w-24',
        render: (item: MediaCard) => item.current_user_name || '-',
      },
      {
        key: 'borrow_time',
        title: '借出时间',
        className: 'w-40',
        render: (item: MediaCard) => formatDateTime(item.borrow_time),
      },
      {
        key: 'actions',
        title: '操作',
        className: 'w-64',
        render: (item: MediaCard) => (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetail(item);
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              详情
            </button>
            {canManageMediaCards() && (
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
            {canBorrowMediaCards() && item.status === 'available' && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBorrow(item);
                  }}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  借用
                </button>
              </>
            )}
            {canManageMediaCards() && item.status === 'in_use' && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReturn(item);
                  }}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  归还
                </button>
              </>
            )}
            {canManageMediaCards() && item.status !== 'in_use' && (
              <>
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
    [canManageMediaCards, canBorrowMediaCards]
  );

  const handleReset = () => {
    setKeyword('');
    setTypeFilter('');
    setStatusFilter('');
    setActiveTab('all');
  };

  return (
    <div className="min-h-full">
      <Header
        title="素材卡管理"
        subtitle="管理所有素材卡的信息和借用状态"
        actions={
          canManageMediaCards() ? (
            <button onClick={handleAdd} className="btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增素材卡
            </button>
          ) : null
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
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
                    placeholder="搜索卡号、类型、容量、关联设备..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-40">
                <label className="form-label">类型</label>
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">全部类型</option>
                  {MEDIA_CARD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="form-label">状态</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={activeTab !== 'all'}
                >
                  <option value="">全部状态</option>
                  {MEDIA_CARD_STATUS_OPTIONS.map((opt) => (
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
        </div>

        {loading ? (
          <div className="py-16">
            <Loading text="加载中..." />
          </div>
        ) : errorState ? (
          <ErrorState message={errorState} onRetry={fetchMediaCards} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={mediaCards}
              emptyTitle="暂无素材卡"
              emptyDescription="还没有添加任何素材卡"
              emptyAction={
                canManageMediaCards() ? (
                  <button onClick={handleAdd} className="btn-primary">
                    添加第一张素材卡
                  </button>
                ) : null
              }
              rowKey={(item) => item.id}
              onRowClick={handleViewDetail}
            />
          </div>
        )}
      </div>

      <MediaCardForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mediaCard={editingMediaCard}
        onSuccess={fetchMediaCards}
      />

      <MediaCardBorrowForm
        isOpen={isBorrowFormOpen}
        onClose={() => {
          setIsBorrowFormOpen(false);
          setBorrowingMediaCard(null);
        }}
        mediaCard={borrowingMediaCard}
        onSuccess={fetchMediaCards}
      />

      <MediaCardReturnForm
        isOpen={isReturnFormOpen}
        onClose={() => {
          setIsReturnFormOpen(false);
          setReturningMediaCard(null);
        }}
        mediaCard={returningMediaCard}
        onSuccess={fetchMediaCards}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, mediaCard: null })}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除素材卡"${deleteDialog.mediaCard?.code}"吗？此操作不可撤销。`}
        confirmText="删除"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default MediaCardListPage;
