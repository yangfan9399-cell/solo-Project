import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Users } from 'lucide-react';
import { repairReportsApi, workOrdersApi, repairTeamsApi } from '../services/api';
import { LoadingCard, ErrorState } from '../components/Loading';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { Button, Modal, Select, TextArea } from '../components/Modal';
import { formatDate, reportTypeLabels } from '../utils/format';
import type { RepairReport, WorkOrder, RepairTeam } from '../types';

export function RepairReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<(RepairReport & { work_orders: WorkOrder[] }) | null>(null);
  const [teams, setTeams] = useState<RepairTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusRemark, setStatusRemark] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [reportRes, teamsRes] = await Promise.all([
          repairReportsApi.getById(id),
          repairTeamsApi.getAll(),
        ]);
        setReport(reportRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAssign = async () => {
    if (!id || !selectedTeamId) return;
    try {
      const team = teams.find((t) => t.id === selectedTeamId);
      await repairReportsApi.assign(id, selectedTeamId, team?.name || '');
      const response = await repairReportsApi.getById(id);
      setReport(response.data);
      setIsAssignModalOpen(false);
      setSelectedTeamId('');
    } catch (err) {
      alert('派单失败，请重试');
    }
  };

  const handleUpdateStatus = async () => {
    if (!id || !newStatus) return;
    try {
      await repairReportsApi.updateStatus(id, newStatus);
      const response = await repairReportsApi.getById(id);
      setReport(response.data);
      setIsStatusModalOpen(false);
      setNewStatus('');
      setStatusRemark('');
    } catch (err) {
      alert('更新状态失败，请重试');
    }
  };

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!report) return <ErrorState message="报修单不存在" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/repair-reports')} className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">报修单详情</h1>
        <span className="font-mono text-sm text-gray-500">{report.report_no}</span>
        <StatusBadge status={report.status} />
        <UrgencyBadge urgency={report.urgency} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">报修信息</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">标题</div>
                <div className="font-medium text-gray-900">{report.title}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">问题描述</div>
                <div className="text-gray-700 whitespace-pre-wrap">{report.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">报修类型</div>
                  <div className="text-gray-900">{reportTypeLabels[report.type] || report.type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">是否需要停水</div>
                  <div className="text-gray-900">{report.water_stop_needed ? '是' : '否'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">地点信息</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-gray-900">{report.location}</div>
                  <div className="text-gray-600">{report.address}</div>
                </div>
              </div>
              {report.affected_area && (
                <div className="text-gray-600">
                  影响区域：{report.affected_area}
                  {report.affected_population && ` (约${report.affected_population}人)`}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">联系方式</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{report.contact_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{report.contact_phone}</span>
              </div>
              {report.reporter_name && (
                <div className="text-sm text-gray-500">
                  报修人：{report.reporter_name} ({report.reporter_role === 'hotline' ? '热线客服' : report.reporter_role})
                </div>
              )}
            </div>
          </div>

          {report.work_orders && report.work_orders.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">关联工单</h2>
              <div className="space-y-3">
                {report.work_orders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{order.order_no}</div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{order.title}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {order.team_name}
                      </div>
                      <div>成员：{order.team_members}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
            <div className="space-y-3">
              {report.status === 'pending' && (
                <Button className="w-full" onClick={() => setIsAssignModalOpen(true)}>
                  派单给抢修队
                </Button>
              )}
              <Button variant="secondary" className="w-full" onClick={() => setIsStatusModalOpen(true)}>
                更新状态
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">时间线</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">创建报修单</div>
                  <div className="text-xs text-gray-500">{formatDate(report.created_at)}</div>
                </div>
              </div>
              {report.assigned_to && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">已派单给 {report.assignee_name}</div>
                  </div>
                </div>
              )}
              {report.status === 'completed' && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">已完成</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {report.assigned_to && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">负责抢修队</h2>
              <div className="text-gray-900 font-medium">{report.assignee_name}</div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="派单给抢修队" size="md">
        <div className="space-y-4">
          <Select
            label="选择抢修队"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            options={[
              { value: '', label: '请选择抢修队' },
              ...teams.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.area}) - ${t.status === 'available' ? '空闲' : '忙碌'}`,
              })),
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>取消</Button>
            <Button onClick={handleAssign} disabled={!selectedTeamId}>确认派单</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="更新状态" size="md">
        <div className="space-y-4">
          <Select
            label="选择新状态"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: '', label: '请选择状态' },
              { value: 'pending', label: '待处理' },
              { value: 'assessing', label: '评估中' },
              { value: 'in_progress', label: '处理中' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ]}
          />
          <TextArea
            label="备注"
            value={statusRemark}
            onChange={(e) => setStatusRemark(e.target.value)}
            rows={3}
            placeholder="可选，输入状态变更说明"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)}>取消</Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus}>确认更新</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
