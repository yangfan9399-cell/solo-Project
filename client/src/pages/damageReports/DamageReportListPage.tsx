import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import ErrorState from '../../components/common/ErrorState';
import DamageReportForm from '../../components/damageReports/DamageReportForm';
import { damageReportApi } from '../../api/damageReports';
import { useNotificationStore } from '../../store/notificationStore';
import { usePermission } from '../../hooks/usePermission';
import type { DamageReport } from '../../types';
import { DAMAGE_TYPE_OPTIONS, DAMAGE_STATUS_OPTIONS, STATUS_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

const DAMAGE_TABS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'repairing', label: '维修中' },
  { value: 'repaired', label: '已完成' },
  { value: 'scrapped', label: '已报废' },
];

const DamageReportListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useNotificationStore();
  const { canManageEquipment, canReportDamage } = usePermission();
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [damageType, setDamageType] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DamageReport | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    report: DamageReport | null;
    action: 'startRepair' | 'complete' | 'scrap' | null;
  }>({
    isOpen: false,
    report: null,
    action: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await damageReportApi.getList({
        keyword: keyword || undefined,
        damage_type: damageType || undefined,
        status: activeTab || undefined,
      });
      if (response.success && response.data) {
        setReports(response.data);
      } else {
        setErrorState(response.error || '加载损坏报告列表失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [keyword, damageType, activeTab]);

  const handleAdd = () => {
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleViewDetail = (item: DamageReport) => {
    navigate(`/damage-reports/${item.id}`);
  };

  const handleStartRepair = (item: DamageReport) => {
    setActionDialog({ isOpen: true, report: item, action: 'startRepair' });
  };

  const handleComplete = (item: DamageReport) => {
    setActionDialog({ isOpen: true, report: item, action: 'complete' });
  };

  const handleScrap = (item: DamageReport) => {
    setActionDialog({ isOpen: true, report: item, action: 'scrap' });
  };

  const confirmAction = async () => {
    if (!actionDialog.report || !actionDialog.action) return;
    setActionLoading(true);
    try {
      let response;
      const { id } = actionDialog.report;
      
      switch (actionDialog.action) {
        case 'startRepair':
          response = await damageReportApi.startRepair(id);
          break;
        case 'complete':
          response = await damageReportApi.complete(id);
          break;
        case 'scrap':
          response = await damageReportApi.scrap(id);
          break;
      }

      if (response.success) {
        success('操作成功');
        fetchReports();
      } else {
        error(response.error || '操作失败');
      }
    } catch (e) {
      error('操作失败，请稍后重试');
    } finally {
      setActionLoading(false);
      setActionDialog({ isOpen: false, report: null, action: null });
    }
  };

  const getActionDialogContent = () => {
    if (!actionDialog.report || !actionDialog.action) return { title: '', message: '' };
    
    const titles: Record<string, string> = {
      startRepair: '确认开始维修',
      complete: '确认完成维修',
      scrap: '确认报废',
    };
    
    const messages: Record<string, string> = {
      startRepair: `确定要开始维修设备"${actionDialog.report.equipment_name}"吗？`,
      complete: `确定要完成设备"${actionDialog.report.equipment_name}"的维修吗？`,
      scrap: `确定要报废设备"${actionDialog.report.equipment_name}"吗？此操作不可撤销。`,
    };

    return {
      title: titles[actionDialog.action],
      message: messages[actionDialog.action],
    };
  };

  const columns = useMemo(
    () => [
      {
        key: 'report_no',
        title: '编号',
        className: 'w-32',
      },
      {
        key: 'equipment_name',
        title: '设备',
        render: (item: DamageReport) => (
          <div>
            <span className="font-medium text-gray-900">{item.equipment_name}</span>
            {item.equipment_code && (
              <p className="text-xs text-gray-500 mt-0.5">{item.equipment_code}</p>
            )}
          </div>
        ),
      },
      {
        key: 'damage_type',
        title: '损坏程度',
        className: 'w-24',
        render: (item: DamageReport) => <StatusBadge status={item.damage_type} />,
      },
      {
        key: 'status',
        title: '状态',
        className: 'w-24',
        render: (item: DamageReport) => <StatusBadge status={item.status} />,
      },
      {
        key: 'reporter_name',
        title: '报告人',
        className: 'w-24',
      },
      {
        key: 'created_at',
        title: '报告时间',
        className: 'w-40',
        render: (item: DamageReport) => formatDateTime(item.created_at),
      },
      {
        key: 'actions',
        title: '操作',
        className: 'w-64',
        render: (item: DamageReport) => (
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
                {item.status === 'pending' && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRepair(item);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      开始维修
                    </button>
                  </>
                )}
                {item.status === 'repairing' && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(item);
                      }}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      完成维修
                    </button>
                  </>
                )}
                {['pending', 'repairing'].includes(item.status) && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScrap(item);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      报废
                    </button>
                  </>
                )}
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
    setDamageType('');
    setActiveTab('');
  };

  const dialogContent = getActionDialogContent();

  return (
    <div className="min-h-full">
      <Header
        title="损坏登记"
        subtitle="管理设备损坏报告和维修进度"
        actions={
          canReportDamage() ? (
            <button onClick={handleAdd} className="btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增报告
            </button>
          ) : null
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {DAMAGE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.value
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
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
                    placeholder="搜索报告编号、设备名称、报告人..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-40">
                <label className="form-label">损坏程度</label>
                <select
                  className="form-select"
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                >
                  <option value="">全部程度</option>
                  {DAMAGE_TYPE_OPTIONS.map((opt) => (
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
          <ErrorState message={errorState} onRetry={fetchReports} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <DataTable
              columns={columns}
              data={reports}
              emptyTitle="暂无损坏报告"
              emptyDescription="还没有任何损坏报告记录"
              emptyAction={
                canReportDamage() ? (
                  <button onClick={handleAdd} className="btn-primary">
                    登记第一个损坏报告
                  </button>
                ) : null
              }
              rowKey={(item) => item.id}
              onRowClick={handleViewDetail}
            />
          </div>
        )}
      </div>

      <DamageReportForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        report={editingReport}
        onSuccess={fetchReports}
      />

      <ConfirmDialog
        isOpen={actionDialog.isOpen}
        onClose={() => setActionDialog({ isOpen: false, report: null, action: null })}
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

export default DamageReportListPage;
