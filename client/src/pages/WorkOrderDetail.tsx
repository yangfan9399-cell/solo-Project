import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Clock } from 'lucide-react';
import { workOrdersApi } from '../services/api';
import { LoadingCard, ErrorState } from '../components/Loading';
import { StatusBadge, UrgencyBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import type { WorkOrder } from '../types';

export function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<(WorkOrder & { repair_report?: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await workOrdersApi.getById(id);
        setOrder(response.data);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!order) return <ErrorState message="工单不存在" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/work-orders')} className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">工单详情</h1>
        <span className="font-mono text-sm text-gray-500">{order.order_no}</span>
        <StatusBadge status={order.status} />
        <UrgencyBadge urgency={order.priority} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">工单信息</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">标题</div>
                <div className="font-medium text-gray-900">{order.title}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">工作描述</div>
                <div className="text-gray-700 whitespace-pre-wrap">{order.description}</div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-gray-900">{order.location}</div>
              </div>
            </div>
          </div>

          {order.repair_report && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">关联报修单</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-gray-500">{order.repair_report.report_no}</span>
                  <StatusBadge status={order.repair_report.status} />
                </div>
                <div className="font-medium text-gray-900 mb-1">{order.repair_report.title}</div>
                <div className="text-sm text-gray-600">{order.repair_report.description}</div>
              </div>
            </div>
          )}

          {order.work_summary && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">工作摘要</h2>
              <div className="text-gray-700 whitespace-pre-wrap">{order.work_summary}</div>
            </div>
          )}

          {order.materials_used && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">使用材料</h2>
              <div className="text-gray-700 whitespace-pre-wrap">{order.materials_used}</div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">抢修队信息</h2>
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">{order.team_name}</span>
            </div>
            <div className="text-sm text-gray-600">成员：{order.team_members}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">时间信息</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">创建时间</div>
                  <div className="text-gray-900">{formatDate(order.created_at)}</div>
                </div>
              </div>
              {order.estimated_start && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">预计开始</div>
                    <div className="text-gray-900">{order.estimated_start}</div>
                  </div>
                </div>
              )}
              {order.actual_start && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-sm text-gray-500">实际开始</div>
                    <div className="text-gray-900">{formatDate(order.actual_start)}</div>
                  </div>
                </div>
              )}
              {order.actual_end && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-500">完成时间</div>
                    <div className="text-gray-900">{formatDate(order.actual_end)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
