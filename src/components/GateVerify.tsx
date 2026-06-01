import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import StatusBadge from './StatusBadge';
import ErrorState from './ErrorState';

interface VisitorInfo {
  id: number;
  name: string;
  phone: string;
  id_type: string;
  id_number: string;
  company: string | null;
}

interface AppointmentInfo {
  id: number;
  visitor_name: string;
  visitor_phone: string;
  visitor_id_number: string;
  purpose: string;
  visitee_name: string;
  visitee_department: string | null;
  expected_arrival: string;
  expected_leave: string;
  status: string;
}

interface BlacklistInfo {
  id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_id_number: string;
  reason: string;
}

export default function GateVerify() {
  const [clock, setClock] = useState(new Date());
  const [searchInput, setSearchInput] = useState('');
  const [visitor, setVisitor] = useState<VisitorInfo | null>(null);
  const [appointments, setAppointments] = useState<AppointmentInfo[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setError('');
    setVisitor(null);
    setAppointments([]);
    setBlacklist(null);
    setSearched(true);

    try {
      const [visitorsRes, appointmentsRes, blacklistRes] = await Promise.all([
        fetch(`/api/visitors?search=${encodeURIComponent(searchInput.trim())}`),
        fetch(`/api/appointments?search=${encodeURIComponent(searchInput.trim())}`),
        fetch(`/api/blacklist?search=${encodeURIComponent(searchInput.trim())}`),
      ]);

      if (!visitorsRes.ok || !appointmentsRes.ok || !blacklistRes.ok) {
        throw new Error('查询失败');
      }

      const visitorsData: VisitorInfo[] = await visitorsRes.json();
      const appointmentsData: AppointmentInfo[] = await appointmentsRes.json();
      const blacklistData: BlacklistInfo[] = await blacklistRes.json();

      if (visitorsData.length > 0) {
        setVisitor(visitorsData[0]);
      }

      setAppointments(appointmentsData);

      if (blacklistData.length > 0) {
        setBlacklist(blacklistData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId: number, action: 'check_in' | 'check_out') => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId, action }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '操作失败');
      }
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, status: action === 'check_in' ? 'checked_in' : 'checked_out' }
            : apt
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white text-center">
        <div className="text-4xl font-mono font-bold tracking-wider">
          {clock.toLocaleTimeString('zh-CN', { hour12: false })}
        </div>
        <div className="text-sm mt-1 opacity-80">
          {clock.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="输入访客证件号码进行查询"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? '查询中...' : '查询'}
        </button>
      </form>

      {error && <ErrorState message={error} />}

      {loading && <LoadingSpinner text="查询中..." />}

      {!loading && searched && !visitor && appointments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <span className="text-4xl block mb-3">🔍</span>
          <p>未找到相关访客信息</p>
        </div>
      )}

      {blacklist && (
        <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚫</span>
            <h3 className="text-lg font-bold text-red-700">黑名单警告</h3>
          </div>
          <p className="text-red-600">访客 <strong>{blacklist.visitor_name}</strong> 已被加入黑名单</p>
          <p className="text-red-500 text-sm mt-1">原因：{blacklist.reason}</p>
        </div>
      )}

      {visitor && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">访客信息</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">姓名</span>
              <p className="font-medium text-gray-800">{visitor.name}</p>
            </div>
            <div>
              <span className="text-gray-500">手机号</span>
              <p className="font-medium text-gray-800">{visitor.phone}</p>
            </div>
            <div>
              <span className="text-gray-500">证件号码</span>
              <p className="font-medium text-gray-800">{visitor.id_number}</p>
            </div>
            <div>
              <span className="text-gray-500">证件类型</span>
              <p className="font-medium text-gray-800">{visitor.id_type}</p>
            </div>
            <div>
              <span className="text-gray-500">公司</span>
              <p className="font-medium text-gray-800">{visitor.company || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {appointments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">相关预约记录</h3>
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-gray-600 text-sm">预约单 #{apt.id}</span>
                <StatusBadge status={apt.status} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">来访事由</span>
                  <p className="font-medium text-gray-800">{apt.purpose}</p>
                </div>
                <div>
                  <span className="text-gray-500">被访人</span>
                  <p className="font-medium text-gray-800">{apt.visitee_name || '-'}{apt.visitee_department ? ` (${apt.visitee_department})` : ''}</p>
                </div>
                <div>
                  <span className="text-gray-500">预计到达</span>
                  <p className="font-medium text-gray-800">{new Date(apt.expected_arrival).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <span className="text-gray-500">预计离开</span>
                  <p className="font-medium text-gray-800">{new Date(apt.expected_leave).toLocaleString('zh-CN')}</p>
                </div>
              </div>

              {!blacklist && (apt.status === 'approved' || apt.status === 'checked_in' || apt.status === 'timeout') && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  {apt.status === 'approved' && (
                    <button
                      onClick={() => handleAction(apt.id, 'check_in')}
                      disabled={actionLoading === apt.id}
                      className="px-5 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
                    >
                      {actionLoading === apt.id ? '处理中...' : '签到入园'}
                    </button>
                  )}
                  {(apt.status === 'checked_in' || apt.status === 'timeout') && (
                    <button
                      onClick={() => handleAction(apt.id, 'check_out')}
                      disabled={actionLoading === apt.id}
                      className="px-5 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
                    >
                      {actionLoading === apt.id ? '处理中...' : '签退离园'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
