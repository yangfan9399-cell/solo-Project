import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

interface BlacklistEntry {
  id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_id_number: string;
  visitor_phone: string;
  reason: string;
  creator_name: string;
  created_at: string;
}

interface Visitor {
  id: number;
  name: string;
  id_number: string;
  phone: string;
}

export default function BlacklistManager() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [selectedVisitorId, setSelectedVisitorId] = useState('');
  const [reason, setReason] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/blacklist${params}`);
      if (!res.ok) throw new Error('获取黑名单失败');
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetch('/api/visitors')
      .then((res) => res.json())
      .then(setVisitors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitorId || !reason.trim()) {
      setFormError('请选择访客并填写拉黑原因');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: Number(selectedVisitorId), reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '添加失败');
      }
      setSelectedVisitorId('');
      setReason('');
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('确定要移除此黑名单记录吗？')) return;
    try {
      const res = await fetch('/api/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('移除失败');
      await fetchData();
    } catch {
      setError('移除失败，请重试');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-md">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名/证件号"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
              搜索
            </button>
          </form>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          {showForm ? '取消' : '添加黑名单'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择访客 *</label>
            <select
              value={selectedVisitorId}
              onChange={(e) => setSelectedVisitorId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择访客</option>
              {visitors.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.id_number})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">拉黑原因 *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="请输入拉黑原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-medium"
            >
              {formLoading ? '添加中...' : '确认添加'}
            </button>
          </div>
        </form>
      )}

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {loading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <EmptyState title="暂无黑名单记录" description="黑名单为空" icon="🛡️" />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">访客姓名</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">证件号</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">拉黑原因</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">添加时间</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 font-medium">{entry.visitor_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{entry.visitor_id_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[300px] truncate">{entry.reason}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(entry.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        移除
                      </button>
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
