import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Users, Play, CheckCircle } from 'lucide-react';
import { workOrdersApi, repairTeamsApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { Button, Modal, TextArea, Input } from '../components/Modal';
import { formatDate } from '../utils/format';
import type { WorkOrder, RepairTeam } from '../types';

export function WorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [teams, setTeams] = useState<RepairTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [workSummary, setWorkSummary] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, teamsRes] = await Promise.all([
          workOrdersApi.getAll(statusFilter || undefined, teamFilter || undefined),
          repairTeamsApi.getAll(),
        ]);
        setOrders(ordersRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [statusFilter, teamFilter]);

  const handleStart = async () => {
    if (!selectedOrder) return;
    try {
      await workOrdersApi.updateStatus(selectedOrder.id, 'in_progress');
      const response = await workOrdersApi.getAll(statusFilter || undefined, teamFilter || undefined);
      setOrders(response.data);
      setIsStartModalOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      alert('开始工单失败，请重试');
    }
  };

  const handleComplete = async () => {
    if (!selectedOrder) return;
    try {
      await workOrdersApi.updateStatus(selectedOrder.id, 'completed', workSummary, materialsUsed);
      const response = await workOrdersApi.getAll(statusFilter || undefined, teamFilter || undefined);
      setOrders(response.data);
      setIsCompleteModalOpen(false);
      setSelectedOrder(null);
      setWorkSummary('');
      setMaterialsUsed('');
    } catch (err) {
      alert('完成工单失败，请重试');
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const inProgressCount = orders.filter((o) => o.status === 'in_progress').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">工单调度</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">待处理工单</div>
          <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">进行中工单</div>
          <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">已完成工单</div>
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="搜索工单..."
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
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已完成' },
              { value: 'delayed', label: '已延期' },
            ]}
          />
          <Select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            options={[
              { value: '', label: '全部队伍' },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <EmptyState title="暂无工单" description="还没有工单记录" />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工单号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">抢修队</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地点</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                    {order.order_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{order.title}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      {order.team_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {order.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UrgencyBadge urgency={order.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/work-orders/${order.id}`} className="text-primary-600 hover:text-primary-900">
                        详情
                      </Link>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsStartModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <Play className="w-4 h-4" />
                          开始
                        </button>
                      )}
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsCompleteModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          完成
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">抢修队工作量</h2>
        <div className="grid grid-cols-3 gap-4">
          {teams.map((team) => {
            const teamOrders = orders.filter((o) => o.team_id === team.id);
            const activeCount = teamOrders.filter((o) => o.status !== 'completed').length;
            return (
              <div key={team.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{team.name}</span>
                  <StatusBadge status={team.status} />
                </div>
                <div className="text-sm text-gray-500">进行中：{activeCount} 个工单</div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${Math.min(activeCount * 33, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} title="开始工单" size="sm">
        <div className="space-y-4">
          {selectedOrder && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{selectedOrder.title}</div>
              <div className="text-sm text-gray-500 mt-1">{selectedOrder.team_name}</div>
            </div>
          )}
          <p className="text-sm text-gray-600">
            确定要开始此工单吗？开始后状态将更新为"进行中"。
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsStartModalOpen(false)}>取消</Button>
            <Button onClick={handleStart}>确认开始</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="完成工单" size="lg">
        <div className="space-y-4">
          {selectedOrder && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{selectedOrder.title}</div>
            </div>
          )}
          <TextArea
            label="工作摘要"
            value={workSummary}
            onChange={(e) => setWorkSummary(e.target.value)}
            rows={3}
            placeholder="请描述完成的工作内容"
          />
          <TextArea
            label="使用材料"
            value={materialsUsed}
            onChange={(e) => setMaterialsUsed(e.target.value)}
            rows={2}
            placeholder="请列出使用的材料（可选）"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCompleteModalOpen(false)}>取消</Button>
            <Button onClick={handleComplete}>确认完成</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label?: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
