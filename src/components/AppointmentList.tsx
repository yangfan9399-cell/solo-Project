import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';

interface AppointmentListProps {
  status?: string;
  visitee_id?: number;
}

interface Appointment {
  id: number;
  visitor_name: string;
  visitor_phone: string;
  purpose: string;
  visitee_name: string;
  visitee_department: string | null;
  expected_arrival: string;
  status: string;
  created_at: string;
}

const filterTabs = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'checked_in', label: '已签到' },
  { value: 'checked_out', label: '已签退' },
  { value: 'timeout', label: '超时' },
  { value: 'rejected', label: '已驳回' },
];

export default function AppointmentList({ status: initialStatus, visitee_id }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus || '');
  const [search, setSearch] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.set('status', activeTab);
      if (visitee_id) params.set('visitee_id', String(visitee_id));
      if (search) params.set('search', search);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (!res.ok) throw new Error('获取预约列表失败');
      const data = await res.json();
      setAppointments(data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, visitee_id, search]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAppointments();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索访客姓名/手机号"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          搜索
        </button>
      </form>

      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <EmptyState title="暂无预约记录" description="没有找到匹配的预约" />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">预约单号</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">访客姓名</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">来访事由</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">被访人</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">预约时间</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr
                    key={apt.id}
                    onClick={() => { window.location.href = `/appointments/${apt.id}`; }}
                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800 font-mono">#{apt.id}</td>
                    <td className="px-4 py-3 text-gray-800">{apt.visitor_name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{apt.purpose}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {apt.visitee_name || '-'}
                      {apt.visitee_department ? <span className="text-gray-400 ml-1">({apt.visitee_department})</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(apt.expected_arrival).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={apt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
