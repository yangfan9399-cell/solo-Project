import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import EquipmentForm from '../../components/equipments/EquipmentForm';
import { equipmentApi } from '../../api/equipments';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { Equipment, ScheduleItem, EquipmentStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/format';

const EquipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { canManageEquipment, canReportDamage } = usePermission();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ isOpen: boolean; status: EquipmentStatus | null }>({
    isOpen: false,
    status: null,
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'reservations' | 'damage'>('schedule');

  const equipmentId = parseInt(id || '0', 10);

  const fetchData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const [detailResponse, scheduleResponse] = await Promise.all([
        equipmentApi.getDetail(equipmentId),
        equipmentApi.getSchedule(equipmentId),
      ]);

      if (detailResponse.success && detailResponse.data) {
        setEquipment(detailResponse.data);
      } else {
        setErrorState(detailResponse.error || '加载设备详情失败');
        return;
      }

      if (scheduleResponse.success && scheduleResponse.data) {
        setSchedule(scheduleResponse.data);
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (equipmentId) {
      fetchData();
    }
  }, [equipmentId]);

  const handleBack = () => {
    navigate('/equipments');
  };

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await equipmentApi.delete(equipmentId);
      if (response.success) {
        success('设备删除成功');
        navigate('/equipments');
      } else {
        error(response.error || '删除失败');
      }
    } catch (e) {
      error('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReportDamage = () => {
    if (equipment) {
      navigate('/damage-reports/new', { state: { equipmentId: equipment.id } });
    }
  };

  const handleStatusChange = (status: EquipmentStatus) => {
    setStatusDialog({ isOpen: true, status });
  };

  const confirmStatusChange = async () => {
    if (!statusDialog.status || !equipment) return;
    setStatusLoading(true);
    try {
      const response = await equipmentApi.update(equipmentId, {
        status: statusDialog.status,
      });
      if (response.success) {
        success(`设备状态已更新为"${STATUS_LABELS[statusDialog.status]}"`);
        fetchData();
      } else {
        error(response.error || '状态更新失败');
      }
    } catch (e) {
      error('状态更新失败，请稍后重试');
    } finally {
      setStatusLoading(false);
      setStatusDialog({ isOpen: false, status: null });
    }
  };

  const getAvailableStatusTransitions = (currentStatus: EquipmentStatus): EquipmentStatus[] => {
    const transitions: Record<EquipmentStatus, EquipmentStatus[]> = {
      available: ['in_use', 'maintenance', 'damaged', 'scrapped'],
      in_use: ['available', 'maintenance', 'damaged', 'scrapped'],
      maintenance: ['available', 'damaged', 'scrapped'],
      damaged: ['available', 'maintenance', 'scrapped'],
      scrapped: [],
    };
    return transitions[currentStatus] || [];
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

  if (errorState || !equipment) {
    return (
      <div className="min-h-full">
        <Header title="设备详情" />
        <div className="p-6">
          <ErrorState message={errorState || '设备不存在'} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  const availableTransitions = getAvailableStatusTransitions(equipment.status);

  return (
    <div className="min-h-full">
      <Header
        title="设备详情"
        subtitle={equipment.name}
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
                  <h2 className="text-xl font-semibold text-gray-900">{equipment.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{equipment.code}</p>
                </div>
                <StatusBadge status={equipment.status} />
              </div>

              <div className="space-y-4">
                <InfoItem label="分类" value={equipment.category} />
                <InfoItem label="品牌" value={equipment.brand} />
                <InfoItem label="型号" value={equipment.model} />
                <InfoItem label="规格" value={equipment.specification} />
                <InfoItem label="序列号" value={equipment.serial_number} />
                <InfoItem label="购买日期" value={formatDate(equipment.purchase_date)} />
                <InfoItem label="存放位置" value={equipment.location} />
                <InfoItem label="库存数量" value="1" />
                <InfoItem
                  label="可用数量"
                  value={
                    <span
                      className={equipment.status === 'available' ? 'text-green-600 font-medium' : 'text-gray-500'}
                    >
                      {equipment.status === 'available' ? '1' : '0'}
                    </span>
                  }
                />
                <InfoItem label="创建时间" value={formatDateTime(equipment.created_at)} />
              </div>

              {equipment.remark && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">备注</h3>
                  <p className="text-sm text-gray-600">{equipment.remark}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                {canManageEquipment() && (
                  <>
                    <button onClick={handleEdit} className="btn-primary w-full">
                      编辑设备
                    </button>
                    {availableTransitions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">状态流转</p>
                        <div className="flex flex-wrap gap-2">
                          {availableTransitions.map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              标记为{STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {canReportDamage() && equipment.status !== 'scrapped' && (
                  <button onClick={handleReportDamage} className="btn-warning w-full">
                    登记损坏
                  </button>
                )}
                {canManageEquipment() && (
                  <button onClick={handleDelete} className="btn-danger w-full">
                    删除设备
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'schedule'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    设备档期
                  </button>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'reservations'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    预约记录
                  </button>
                  <button
                    onClick={() => setActiveTab('damage')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'damage'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    损坏报告
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'schedule' && (
                  <div>
                    {schedule.length === 0 ? (
                      <EmptyState
                        title="暂无档期"
                        description="该设备暂无预约档期"
                      />
                    ) : (
                      <div className="space-y-4">
                        {schedule.map((item) => (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Link
                                  to={`/reservations/${item.id}`}
                                  className="font-medium text-primary-600 hover:text-primary-700"
                                >
                                  {item.reservation_no}
                                </Link>
                                {item.task_title && (
                                  <p className="text-sm text-gray-500 mt-1">{item.task_title}</p>
                                )}
                              </div>
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                <span className="text-gray-500">申请人：</span>
                                {item.requester_name}
                              </p>
                              <p>
                                <span className="text-gray-500">用途：</span>
                                {item.purpose}
                              </p>
                              <p>
                                <span className="text-gray-500">时间：</span>
                                {formatDateTime(item.start_time)} ~ {formatDateTime(item.end_time)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reservations' && (
                  <div>
                    {!equipment.recent_reservations || equipment.recent_reservations.length === 0 ? (
                      <EmptyState
                        title="暂无预约记录"
                        description="该设备暂无预约记录"
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>预约单号</th>
                              <th>任务标题</th>
                              <th>申请人</th>
                              <th>预计领用时间</th>
                              <th>预计归还时间</th>
                              <th>状态</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {equipment.recent_reservations.map((reservation) => (
                              <tr key={reservation.id}>
                                <td className="font-medium">{reservation.reservation_no}</td>
                                <td>{reservation.task_title || '-'}</td>
                                <td>{reservation.requester_name}</td>
                                <td>{formatDateTime(reservation.expected_pickup_time)}</td>
                                <td>{formatDateTime(reservation.expected_return_time)}</td>
                                <td>
                                  <StatusBadge status={reservation.status} />
                                </td>
                                <td>
                                  <Link
                                    to={`/reservations/${reservation.id}`}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                  >
                                    查看
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'damage' && (
                  <div>
                    {!equipment.damage_reports || equipment.damage_reports.length === 0 ? (
                      <EmptyState
                        title="暂无损坏报告"
                        description="该设备暂无损坏报告记录"
                        action={
                          canReportDamage() && equipment.status !== 'scrapped' ? (
                            <button onClick={handleReportDamage} className="btn-primary">
                              登记损坏
                            </button>
                          ) : null
                        }
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>报告编号</th>
                              <th>损坏类型</th>
                              <th>报告人</th>
                              <th>发生时间</th>
                              <th>状态</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {equipment.damage_reports.map((report) => (
                              <tr key={report.id}>
                                <td className="font-medium">{report.report_no}</td>
                                <td>
                                  <StatusBadge status={report.damage_type} />
                                </td>
                                <td>{report.reporter_name}</td>
                                <td>{formatDateTime(report.occurred_time)}</td>
                                <td>
                                  <StatusBadge status={report.status} />
                                </td>
                                <td>
                                  <Link
                                    to={`/damage-reports/${report.id}`}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                  >
                                    查看
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EquipmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        equipment={equipment}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除设备"${equipment.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={statusDialog.isOpen}
        onClose={() => setStatusDialog({ isOpen: false, status: null })}
        onConfirm={confirmStatusChange}
        title="确认状态变更"
        message={`确定要将设备状态更新为"${statusDialog.status ? STATUS_LABELS[statusDialog.status] : ''}"吗？`}
        confirmText="确认"
        isLoading={statusLoading}
      />
    </div>
  );
};

export default EquipmentDetailPage;
