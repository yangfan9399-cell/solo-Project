import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, User as UserIcon, Phone } from 'lucide-react';
import { repairReportsApi, repairTeamsApi, usersApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { Button, Modal, Input, Select, TextArea } from '../components/Modal';
import { formatDate, reportTypeLabels } from '../utils/format';
import { useRole } from '../context/RoleContext';
import type { RepairReport, RepairTeam, User } from '../types';

export function RepairReports() {
  const [reports, setReports] = useState<RepairReport[]>([]);
  const [teams, setTeams] = useState<RepairTeam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<RepairReport | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const { currentRole } = useRole();
  const [formData, setFormData] = useState({
    type: 'pipe_leak',
    title: '',
    description: '',
    location: '',
    address: '',
    contact_name: '',
    contact_phone: '',
    affected_area: '',
    affected_population: '',
    urgency: 'medium' as const,
    water_stop_needed: false,
  });

  const defaultReporter = useMemo(() => {
    const roleUsers = users.filter((u) => u.role === currentRole);
    if (roleUsers.length > 0) return roleUsers[0];
    const hotlineUsers = users.filter((u) => u.role === 'hotline');
    return hotlineUsers[0] || users[0];
  }, [users, currentRole]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reportsRes, teamsRes, usersRes] = await Promise.all([
          repairReportsApi.getAll(statusFilter || undefined, urgencyFilter || undefined),
          repairTeamsApi.getAll(),
          usersApi.getAll(),
        ]);
        setReports(reportsRes.data);
        setTeams(teamsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [statusFilter, urgencyFilter]);

  const handleSubmit = async () => {
    if (!defaultReporter) return;
    try {
      await repairReportsApi.create({
        ...formData,
        affected_population: formData.affected_population ? parseInt(formData.affected_population) : undefined,
        reporter_name: defaultReporter.name,
        reporter_role: currentRole,
        reported_by: defaultReporter.id,
      });
      const response = await repairReportsApi.getAll(statusFilter || undefined, urgencyFilter || undefined);
      setReports(response.data);
      setIsModalOpen(false);
      setFormData({
        type: 'pipe_leak',
        title: '',
        description: '',
        location: '',
        address: '',
        contact_name: '',
        contact_phone: '',
        affected_area: '',
        affected_population: '',
        urgency: 'medium',
        water_stop_needed: false,
      });
    } catch (err) {
      alert('提交失败，请重试');
    }
  };

  const handleAssign = async () => {
    if (!selectedReport || !selectedTeamId) return;
    try {
      const team = teams.find((t) => t.id === selectedTeamId);
      await repairReportsApi.assign(selectedReport.id, selectedTeamId, team?.name || '');
      const response = await repairReportsApi.getAll(statusFilter || undefined, urgencyFilter || undefined);
      setReports(response.data);
      setIsAssignModalOpen(false);
      setSelectedReport(null);
      setSelectedTeamId('');
    } catch (err) {
      alert('派单失败，请重试');
    }
  };

  const filteredReports = reports.filter((report) =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">报修管理</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增报修单
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="搜索报修单..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待处理' },
              { value: 'assessing', label: '评估中' },
              { value: 'assigned', label: '已派单' },
              { value: 'in_progress', label: '处理中' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ]}
          />
          <Select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            options={[
              { value: '', label: '全部紧急度' },
              { value: 'low', label: '低' },
              { value: 'medium', label: '中' },
              { value: 'high', label: '高' },
              { value: 'critical', label: '紧急' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredReports.length === 0 ? (
          <EmptyState title="暂无报修单" description="还没有报修记录" />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报修单号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地点</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">紧急度</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                    {report.report_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{report.title}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {reportTypeLabels[report.type] || report.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {report.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-gray-600">
                      <UserIcon className="w-4 h-4" />
                      <span>{report.contact_name}</span>
                      <Phone className="w-4 h-4 ml-2" />
                      <span>{report.contact_phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UrgencyBadge urgency={report.urgency} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/repair-reports/${report.id}`} className="text-primary-600 hover:text-primary-900">
                        详情
                      </Link>
                      {report.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setIsAssignModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          派单
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增报修单" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="报修类型"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as RepairReport['type'] })}
              options={[
                { value: 'water_quality', label: '水质问题' },
                { value: 'pipe_leak', label: '水管漏水' },
                { value: 'pressure_low', label: '水压不足' },
                { value: 'no_water', label: '无水' },
                { value: 'meter_issue', label: '水表问题' },
                { value: 'other', label: '其他' },
              ]}
            />
            <Select
              label="紧急程度"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as RepairReport['urgency'] })}
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'critical', label: '紧急' },
              ]}
            />
          </div>
          <Input
            label="标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="请输入报修标题"
          />
          <TextArea
            label="问题描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="请详细描述问题情况"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="所在区域"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="如：城东区"
            />
            <Input
              label="详细地址"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="请输入详细地址"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="联系人姓名"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            />
            <Input
              label="联系电话"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="影响区域"
              value={formData.affected_area}
              onChange={(e) => setFormData({ ...formData, affected_area: e.target.value })}
              placeholder="可选"
            />
            <Input
              label="影响人数"
              type="number"
              value={formData.affected_population}
              onChange={(e) => setFormData({ ...formData, affected_population: e.target.value })}
              placeholder="可选"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="water_stop_needed"
              checked={formData.water_stop_needed}
              onChange={(e) => setFormData({ ...formData, water_stop_needed: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="water_stop_needed" className="text-sm text-gray-700">
              是否需要停水维修
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>提交</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="派单给抢修队" size="md">
        <div className="space-y-4">
          {selectedReport && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{selectedReport.title}</div>
              <div className="text-sm text-gray-500 mt-1">{selectedReport.address}</div>
            </div>
          )}
          <Select
            label="选择抢修队"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            options={[
              { value: '', label: '请选择抢修队' },
              ...teams.filter((t) => t.status === 'available').map((t) => ({
                value: t.id,
                label: `${t.name} (${t.area})`,
              })),
            ]}
          />
          {teams.filter((t) => t.status !== 'available').length > 0 && (
            <div className="text-sm text-gray-500">
              其他抢修队当前忙碌中：
              {teams.filter((t) => t.status !== 'available').map((t) => t.name).join('、')}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>取消</Button>
            <Button onClick={handleAssign} disabled={!selectedTeamId}>确认派单</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
