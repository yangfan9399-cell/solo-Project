import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorState from './ErrorState';
import StatusBadge from './StatusBadge';

interface AppointmentDetailProps {
  id: number;
}

interface AppointmentData {
  id: number;
  visitor_name: string;
  visitor_phone: string;
  visitor_id_type: string;
  visitor_id_number: string;
  visitor_company: string | null;
  visitee_id: number;
  visitee_name: string;
  visitee_department: string | null;
  purpose: string;
  expected_arrival: string;
  expected_leave: string;
  status: string;
  notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  check_in_time: string | null;
  check_out_time: string | null;
  checkin_notes: string | null;
}

const statusTimeline = [
  { key: 'pending', label: '提交预约' },
  { key: 'approved', label: '审批通过' },
  { key: 'checked_in', label: '签到入园' },
  { key: 'checked_out', label: '签退离园' },
];

const statusOrder: Record<string, number> = {
  pending: 0,
  approved: 1,
  rejected: 1,
  checked_in: 2,
  checked_out: 3,
  timeout: 2,
  cancelled: -1,
};

export default function AppointmentDetail({ id }: AppointmentDetailProps) {
  const [data, setData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments/${id}`);
      if (!res.ok) throw new Error('获取预约详情失败');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApprove = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      setShowRejectInput(true);
      return;
    }
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = { appointment_id: id, action };
      if (action === 'reject') body.rejected_reason = rejectReason;
      const res = await fetch('/api/appointments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '操作失败');
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(false);
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  const handleCheckin = async (action: 'check_in' | 'check_out') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: id, action }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '操作失败');
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="加载预约详情..." />;
  if (error && !data) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="预约不存在" />;

  const currentOrder = statusOrder[data.status] ?? -1;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">预约单 #{data.id}</h2>
            <p className="text-sm text-gray-500 mt-1">创建于 {new Date(data.created_at).toLocaleString('zh-CN')}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="访客姓名" value={data.visitor_name} />
          <InfoItem label="访客手机号" value={data.visitor_phone} />
          <InfoItem label="证件类型" value={data.visitor_id_type} />
          <InfoItem label="证件号码" value={data.visitor_id_number} />
          <InfoItem label="访客公司" value={data.visitor_company || '-'} />
          <InfoItem label="来访事由" value={data.purpose} />
          <InfoItem label="被访人" value={`${data.visitee_name || '-'}${data.visitee_department ? ` (${data.visitee_department})` : ''}`} />
          <InfoItem label="预计到达" value={new Date(data.expected_arrival).toLocaleString('zh-CN')} />
          <InfoItem label="预计离开" value={new Date(data.expected_leave).toLocaleString('zh-CN')} />
          <InfoItem label="备注" value={data.notes || '-'} />
          {data.approved_at && <InfoItem label="审批时间" value={new Date(data.approved_at).toLocaleString('zh-CN')} />}
          {data.rejected_reason && <InfoItem label="驳回原因" value={data.rejected_reason} />}
          {data.check_in_time && <InfoItem label="签到时间" value={new Date(data.check_in_time).toLocaleString('zh-CN')} />}
          {data.check_out_time && <InfoItem label="签退时间" value={new Date(data.check_out_time).toLocaleString('zh-CN')} />}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">状态流程</h3>
        <div className="flex items-center">
          {statusTimeline.map((step, idx) => {
            const stepOrder = statusOrder[step.key] ?? 0;
            const isCompleted = currentOrder >= stepOrder && currentOrder >= 0;
            const isCurrent = data.status === step.key;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCurrent
                        ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted && !isCurrent ? '✓' : idx + 1}
                  </div>
                  <span className={`mt-2 text-xs ${isCurrent ? 'text-blue-600 font-medium' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < statusTimeline.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${isCompleted && currentOrder > stepOrder ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {(data.status === 'pending' || data.status === 'approved' || data.status === 'checked_in' || data.status === 'timeout') && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">操作</h3>
          <div className="flex flex-wrap gap-3">
            {data.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove('approve')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
                >
                  {actionLoading ? '处理中...' : '审批通过'}
                </button>
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-medium"
                >
                  驳回
                </button>
              </>
            )}
            {data.status === 'approved' && (
              <button
                onClick={() => handleCheckin('check_in')}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
              >
                {actionLoading ? '处理中...' : '签到入园'}
              </button>
            )}
            {(data.status === 'checked_in' || data.status === 'timeout') && (
              <button
                onClick={() => handleCheckin('check_out')}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
              >
                {actionLoading ? '处理中...' : '签退离园'}
              </button>
            )}
          </div>

          {showRejectInput && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-2">驳回原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="请输入驳回原因..."
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleApprove('reject')}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  确认驳回
                </button>
                <button
                  onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-800">{value}</dd>
    </div>
  );
}
