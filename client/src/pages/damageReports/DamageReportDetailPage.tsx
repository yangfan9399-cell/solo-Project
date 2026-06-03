import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import { damageReportApi } from '../../api/damageReports';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { DamageReport, DamageStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/constants';
import { formatDateTime, formatCurrency } from '../../utils/format';

const DamageReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { canManageEquipment } = usePermission();

  const [report, setReport] = useState<DamageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    action: 'startRepair' | 'complete' | 'scrap' | null;
  }>({
    isOpen: false,
    action: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const reportId = parseInt(id || '0', 10);

  const fetchData = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await damageReportApi.getDetail(reportId);
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        setErrorState(response.error || '加载损坏报告详情失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchData();
    }
  }, [reportId]);

  const handleBack = () => {
    navigate('/damage-reports');
  };

  const handleStartRepair = () => {
    setActionDialog({ isOpen: true, action: 'startRepair' });
  };

  const handleComplete = () => {
    setActionDialog({ isOpen: true, action: 'complete' });
  };

  const handleScrap = () => {
    setActionDialog({ isOpen: true, action: 'scrap' });
  };

  const confirmAction = async () => {
    if (!actionDialog.action) return;
    setActionLoading(true);
    try {
      let response;
      
      switch (actionDialog.action) {
        case 'startRepair':
          response = await damageReportApi.startRepair(reportId);
          break;
        case 'complete':
          response = await damageReportApi.complete(reportId);
          break;
        case 'scrap':
          response = await damageReportApi.scrap(reportId);
          break;
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
      setActionDialog({ isOpen: false, action: null });
    }
  };

  const getActionDialogContent = () => {
    if (!report || !actionDialog.action) return { title: '', message: '' };
    
    const titles: Record<string, string> = {
      startRepair: '确认开始维修',
      complete: '确认完成维修',
      scrap: '确认报废',
    };
    
    const messages: Record<string, string> = {
      startRepair: `确定要开始维修设备"${report.equipment_name}"吗？`,
      complete: `确定要完成设备"${report.equipment_name}"的维修吗？`,
      scrap: `确定要报废设备"${report.equipment_name}"吗？此操作不可撤销。`,
    };

    return {
      title: titles[actionDialog.action],
      message: messages[actionDialog.action],
    };
  };

  const getAvailableActions = (status: DamageStatus) => {
    const actions: { key: string; label: string; handler: () => void; variant: string }[] = [];
    
    if (status === 'pending') {
      actions.push({ key: 'startRepair', label: '开始维修', handler: handleStartRepair, variant: 'primary' });
    }
    if (status === 'repairing') {
      actions.push({ key: 'complete', label: '完成维修', handler: handleComplete, variant: 'primary' });
    }
    if (['pending', 'repairing'].includes(status)) {
      actions.push({ key: 'scrap', label: '报废设备', handler: handleScrap, variant: 'danger' });
    }
    
    return actions;
  };

  const getTimelineEvents = (report: DamageReport) => {
    const events = [];

    events.push({
      time: report.created_at,
      title: '报告提交',
      description: `${report.reporter_name} 提交了损坏报告`,
      status: 'completed',
    });

    if (report.status !== 'pending' && report.handler_name) {
      events.push({
        time: report.created_at,
        title: '开始维修',
        description: `${report.handler_name} 开始处理维修`,
        status: 'completed',
      });
    }

    if (report.status === 'repaired' && report.resolved_at) {
      events.push({
        time: report.resolved_at,
        title: '维修完成',
        description: `设备已修复，维修费用：${formatCurrency(report.repair_cost)}`,
        status: 'completed',
      });
    }

    if (report.status === 'scrapped' && report.resolved_at) {
      events.push({
        time: report.resolved_at,
        title: '设备报废',
        description: `设备已报废，处理人：${report.handler_name}`,
        status: 'completed',
      });
    }

    return events;
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

  if (errorState || !report) {
    return (
      <div className="min-h-full">
        <Header title="损坏报告详情" />
        <div className="p-6">
          <ErrorState message={errorState || '损坏报告不存在'} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  const actions = getAvailableActions(report.status);
  const timelineEvents = getTimelineEvents(report);
  const dialogContent = getActionDialogContent();

  return (
    <div className="min-h-full">
      <Header
        title="损坏报告详情"
        subtitle={report.report_no}
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
                  <h2 className="text-xl font-semibold text-gray-900">{report.equipment_name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{report.report_no}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              <div className="space-y-4">
                <InfoItem label="设备编号" value={report.equipment_code} />
                <InfoItem label="设备分类" value={report.equipment_category} />
                <InfoItem label="品牌型号" value={`${report.equipment_brand || ''} ${report.equipment_model || ''}`.trim()} />
                <InfoItem label="损坏程度" value={<StatusBadge status={report.damage_type} />} />
                <InfoItem label="发生时间" value={formatDateTime(report.occurred_time)} />
                <InfoItem label="发生地点" value={report.location} />
                <InfoItem label="报告人" value={report.reporter_name} />
                <InfoItem label="报告时间" value={formatDateTime(report.created_at)} />
                {report.handler_name && (
                  <InfoItem label="处理人" value={report.handler_name} />
                )}
                {report.repair_cost !== null && (
                  <InfoItem label="维修费用" value={formatCurrency(report.repair_cost)} />
                )}
                {report.resolved_at && (
                  <InfoItem label="解决时间" value={formatDateTime(report.resolved_at)} />
                )}
              </div>

              {report.remark && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">报告人备注</h3>
                  <p className="text-sm text-gray-600">{report.remark}</p>
                </div>
              )}

              {report.repair_result && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">维修结果</h3>
                  <p className="text-sm text-gray-600">{report.repair_result}</p>
                </div>
              )}

              {canManageEquipment() && actions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {actions.map((action) => (
                    <button
                      key={action.key}
                      onClick={action.handler}
                      className={`w-full ${action.variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">损坏描述</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{report.description}</p>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">现场照片</h4>
                <div className="flex items-center justify-center w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">照片上传功能预留</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">维修记录时间线</h3>
              <div className="relative">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="relative pl-8 pb-8 last:pb-0">
                    {index < timelineEvents.length - 1 && (
                      <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200" />
                    )}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                      event.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <svg className={`w-3 h-3 ${
                        event.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                        <span className="text-xs text-gray-500">{formatDateTime(event.time)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">关联设备</h3>
                <Link
                  to={`/equipments/${report.equipment_id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  查看设备详情 →
                </Link>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{report.equipment_name}</p>
                  <p className="text-sm text-gray-500">{report.equipment_code}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={actionDialog.isOpen}
        onClose={() => setActionDialog({ isOpen: false, action: null })}
        onConfirm={confirmAction}
        title={dialogContent.title}
        message={dialogContent.message}
        confirmText="确认"
        confirmVariant={actionDialog.action === 'scrap' ? 'danger' : 'primary'}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default DamageReportDetailPage;
