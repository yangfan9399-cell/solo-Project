import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/common/StatusBadge';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import MediaCardForm from '../../components/mediaCards/MediaCardForm';
import MediaCardBorrowForm from '../../components/mediaCards/MediaCardBorrowForm';
import MediaCardReturnForm from '../../components/mediaCards/MediaCardReturnForm';
import { mediaCardApi } from '../../api/mediaCards';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import { MEDIA_CARD_RECORD_COLORS, MEDIA_CARD_RECORD_LABELS, MEDIA_CARD_RETURN_STATUS_LABELS } from '../../utils/constants';
import type { MediaCard, MediaCardRecord } from '../../types';
import { formatDateTime } from '../../utils/format';

const RecordItem: React.FC<{ record: MediaCardRecord }> = ({ record }) => {
  const recordColor = MEDIA_CARD_RECORD_COLORS[record.action_type] || 'bg-gray-100 text-gray-800 border-gray-200';
  const recordLabel = MEDIA_CARD_RECORD_LABELS[record.action_type] || record.action_type;

  return (
    <div className="relative pl-12">
      <div className={`absolute left-3 w-5 h-5 rounded-full border-2 ${recordColor} flex items-center justify-center`}>
        <div className="w-2 h-2 rounded-full bg-current" />
      </div>
      <div className={`rounded-lg border p-4 ${recordColor.split(' ')[2]}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${recordColor.split(' ').slice(0, 2).join(' ')}`}>
                {recordLabel}
              </span>
              <span className="text-sm text-gray-500">
                {formatDateTime(record.created_at)}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-500">借用人：</span>
                <span className="text-gray-900 font-medium">{record.user_name}</span>
              </p>
              {record.handler_name && (
                <p>
                  <span className="text-gray-500">经办人：</span>
                  <span className="text-gray-900">{record.handler_name}</span>
                </p>
              )}
              {record.borrow_time && (
                <p>
                  <span className="text-gray-500">借出时间：</span>
                  <span className="text-gray-900">{formatDateTime(record.borrow_time)}</span>
                </p>
              )}
              {record.expected_return_time && (
                <p>
                  <span className="text-gray-500">预计归还：</span>
                  <span className="text-gray-900">{formatDateTime(record.expected_return_time)}</span>
                </p>
              )}
              {record.actual_return_time && (
                <p>
                  <span className="text-gray-500">实际归还：</span>
                  <span className="text-gray-900">{formatDateTime(record.actual_return_time)}</span>
                </p>
              )}
              {record.return_status && (
                <p>
                  <span className="text-gray-500">归还状态：</span>
                  <span className={`font-medium ${
                    record.return_status === 'normal' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {MEDIA_CARD_RETURN_STATUS_LABELS[record.return_status]}
                  </span>
                </p>
              )}
              {record.reservation_no && (
                <p>
                  <span className="text-gray-500">关联预约：</span>
                  <Link
                    to={`/reservations/${record.reservation_id}`}
                    className="text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {record.reservation_no}
                  </Link>
                </p>
              )}
              {record.remark && (
                <p>
                  <span className="text-gray-500">备注：</span>
                  <span className="text-gray-900">{record.remark}</span>
                </p>
              )}
            </div>
          </div>
          {record.damage_report_id && (
            <Link
              to={`/damage-reports/${record.damage_report_id}`}
              className="shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              查看损坏报告
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

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
              {mediaCard.history && mediaCard.history.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-6">
                    {mediaCard.history.map((record) => (
                      <RecordItem key={record.id} record={record} />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState message="暂无操作记录" icon="history" />
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
