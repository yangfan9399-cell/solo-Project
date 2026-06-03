import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/common/StatusBadge';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import MediaCardForm from '../../components/mediaCards/MediaCardForm';
import MediaCardBorrowForm from '../../components/mediaCards/MediaCardBorrowForm';
import MediaCardReturnForm from '../../components/mediaCards/MediaCardReturnForm';
import { mediaCardApi } from '../../api/mediaCards';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { MediaCard } from '../../types';
import { formatDateTime } from '../../utils/format';

const MediaCardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { canManageMediaCards, canBorrowMediaCards } = usePermission();

  const [mediaCard, setMediaCard] = useState<MediaCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBorrowFormOpen, setIsBorrowFormOpen] = useState(false);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);

  const mediaCardId = parseInt(id || '0', 10);

  const fetchData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await mediaCardApi.getDetail(mediaCardId);
      if (response.success && response.data) {
        setMediaCard(response.data);
      } else {
        setErrorState(response.error || '加载素材卡详情失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mediaCardId) {
      fetchData();
    }
  }, [mediaCardId]);

  const handleBack = () => {
    navigate('/media-cards');
  };

  const InfoItem: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex">
      <dt className="w-24 text-sm text-gray-500 flex-shrink-0">{label}</dt>
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

  if (errorState || !mediaCard) {
    return (
      <div className="min-h-full">
        <Header title="素材卡详情" />
        <div className="p-6">
          <ErrorState message={errorState || '素材卡不存在'} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Header
        title="素材卡详情"
        subtitle={mediaCard.code}
        actions={
          <button onClick={handleBack} className="btn-secondary">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回列表
          </button>
        }
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{mediaCard.code}</h2>
                  <p className="text-sm text-gray-500 mt-1">{mediaCard.type} · {mediaCard.capacity}</p>
                </div>
                <StatusBadge status={mediaCard.status} />
              </div>

              <div className="space-y-4">
                <InfoItem label="类型" value={mediaCard.type} />
                <InfoItem label="容量" value={mediaCard.capacity} />
                <InfoItem label="品牌" value={mediaCard.brand} />
                <InfoItem label="关联设备" value={mediaCard.equipment_name} />
                <InfoItem label="状态" value={<StatusBadge status={mediaCard.status} />} />

                {mediaCard.status === 'in_use' && (
                  <>
                    <InfoItem label="借用人" value={mediaCard.current_user_name || '-'} />
                    <InfoItem label="借出时间" value={mediaCard.borrow_time ? formatDateTime(mediaCard.borrow_time) : '-'} />
                    <InfoItem
                      label="预计归还"
                      value={mediaCard.expected_return_time ? formatDateTime(mediaCard.expected_return_time) : '-'}
                    />
                  </>
                )}

                <InfoItem label="创建时间" value={formatDateTime(mediaCard.created_at)} />
              </div>

              {mediaCard.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">描述</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{mediaCard.description}</p>
                </div>
              )}

              {mediaCard.remark && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">备注</h3>
                  <p className="text-sm text-gray-600">{mediaCard.remark}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                {canManageMediaCards() && (
                  <button onClick={() => setIsFormOpen(true)} className="btn-primary w-full">
                    编辑素材卡
                  </button>
                )}
                {canBorrowMediaCards() && mediaCard.status === 'available' && (
                  <button onClick={() => setIsBorrowFormOpen(true)} className="btn-primary w-full">
                    借出
                  </button>
                )}
                {canManageMediaCards() && mediaCard.status === 'in_use' && (
                  <button onClick={() => setIsReturnFormOpen(true)} className="btn-primary w-full">
                    归还
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">操作记录</h2>
              {mediaCard.status === 'in_use' ? (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium text-blue-900">当前借出中</p>
                      <p className="text-sm text-blue-700">
                        借用人：{mediaCard.current_user_name}，借出时间：{mediaCard.borrow_time ? formatDateTime(mediaCard.borrow_time) : '-'}
                      </p>
                      {mediaCard.expected_return_time && (
                        <p className="text-sm text-blue-700">
                          预计归还：{formatDateTime(mediaCard.expected_return_time)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无操作记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MediaCardForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mediaCard={mediaCard}
        onSuccess={fetchData}
      />

      <MediaCardBorrowForm
        isOpen={isBorrowFormOpen}
        onClose={() => {
          setIsBorrowFormOpen(false);
        }}
        mediaCard={mediaCard}
        onSuccess={fetchData}
      />

      <MediaCardReturnForm
        isOpen={isReturnFormOpen}
        onClose={() => {
          setIsReturnFormOpen(false);
        }}
        mediaCard={mediaCard}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MediaCardDetailPage;
