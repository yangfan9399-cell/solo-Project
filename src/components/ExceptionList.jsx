import { useState, useEffect } from 'react';
import { apiRequest, formatDateTime, getStatusText, getExceptionTypeText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Modal from './Modal';
import Pagination from './Pagination';

export default function ExceptionList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [handleModal, setHandleModal] = useState(false);
  const [selectedException, setSelectedException] = useState(null);
  const [formData, setFormData] = useState({
    type: 'damage',
    book_id: '',
    member_id: '',
    description: '',
    priority: 'normal'
  });
  const [resolution, setResolution] = useState('');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [exRes, booksRes, membersRes] = await Promise.all([
        apiRequest(
          `/exceptions?page=${page}&pageSize=20${statusFilter ? '&status=' + statusFilter : ''}${typeFilter ? '&type=' + typeFilter : ''}${priorityFilter ? '&priority=' + priorityFilter : ''}`
        ),
        apiRequest('/books?pageSize=100'),
        apiRequest('/members?pageSize=100')
      ]);
      setData(exRes);
      setBooks(booksRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, typeFilter, priorityFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/exceptions', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setCreateModal(false);
      setFormData({ type: 'damage', book_id: '', member_id: '', description: '', priority: 'normal' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const exception = await apiRequest(`/exceptions/${id}`);
      setSelectedException(exception);
      setDetailModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStartProcess = (exception) => {
    setSelectedException(exception);
    setResolution('');
    setHandleModal(true);
  };

  const handleProcess = async () => {
    if (!selectedException || !resolution.trim()) {
      alert('请输入处理方案');
      return;
    }
    try {
      await apiRequest(`/exceptions/${selectedException.id}/handle`, {
        method: 'PUT',
        body: JSON.stringify({ resolution })
      });
      setHandleModal(false);
      setResolution('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolve = async (id) => {
    const resolutionText = prompt('请输入解决方案：');
    if (!resolutionText) return;
    try {
      await apiRequest(`/exceptions/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolution: resolutionText })
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClose = async (id) => {
    const resolutionText = prompt('请输入关闭原因：');
    if (!resolutionText) return;
    try {
      await apiRequest(`/exceptions/${id}/close`, {
        method: 'PUT',
        body: JSON.stringify({ resolution: resolutionText })
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getPriorityText = (priority) => {
    const map = {
      urgent: '紧急',
      high: '高',
      normal: '普通',
      low: '低'
    };
    return map[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const map = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      normal: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return map[priority] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">异常处理</h1>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary">
          + 上报异常
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">异常总数</p>
          <p className="text-2xl font-bold text-gray-900">{data?.pagination?.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold text-yellow-600">
            {data?.stats?.find(s => s.status === 'open')?.count || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">处理中</p>
          <p className="text-2xl font-bold text-blue-600">
            {data?.stats?.find(s => s.status === 'processing')?.count || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">已解决</p>
          <p className="text-2xl font-bold text-green-600">
            {(data?.stats?.find(s => s.status === 'resolved')?.count || 0) +
             (data?.stats?.find(s => s.status === 'closed')?.count || 0)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b flex items-center space-x-4">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部类型</option>
            {['damage', 'missing', 'wrong_book', 'quality', 'other'].map(t => (
              <option key={t} value={t}>{getExceptionTypeText(t)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部状态</option>
            {['open', 'processing', 'resolved', 'closed'].map(s => (
              <option key={s} value={s}>{getStatusText(s)}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部优先级</option>
            {['urgent', 'high', 'normal', 'low'].map(p => (
              <option key={p} value={p}>{getPriorityText(p)}</option>
            ))}
          </select>
        </div>

        {data.data.length === 0 ? (
          <EmptyState icon="⚠️" title="暂无异常记录" description="点击右上角按钮上报新的异常" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>异常编号</th>
                    <th>类型</th>
                    <th>图书</th>
                    <th>会员</th>
                    <th>优先级</th>
                    <th>状态</th>
                    <th>上报人</th>
                    <th>上报时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(ex => (
                    <tr key={ex.id}>
                      <td className="font-mono text-sm">{ex.exception_no}</td>
                      <td>
                        <span className="font-medium">{getExceptionTypeText(ex.type)}</span>
                      </td>
                      <td>{ex.title || '-'}</td>
                      <td>{ex.member_name || '-'}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(ex.priority)}`}>
                          {getPriorityText(ex.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${ex.status}`}>
                          {getStatusText(ex.status)}
                        </span>
                      </td>
                      <td>{ex.reported_by_name}</td>
                      <td>{formatDateTime(ex.created_at)}</td>
                      <td className="space-x-2">
                        <button onClick={() => handleViewDetail(ex.id)} className="btn-link">
                          详情
                        </button>
                        {ex.status === 'open' && (
                          <button onClick={() => handleStartProcess(ex)} className="btn-link text-blue-600">
                            开始处理
                          </button>
                        )}
                        {ex.status === 'processing' && (
                          <button onClick={() => handleResolve(ex.id)} className="btn-link text-green-600">
                            解决
                          </button>
                        )}
                        {['open', 'processing'].includes(ex.status) && (
                          <button onClick={() => handleClose(ex.id)} className="btn-link text-gray-600">
                            关闭
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              current={data.pagination.page}
              pageSize={data.pagination.pageSize}
              total={data.pagination.total}
              onChange={setPage}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="上报异常"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">异常类型 *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
                required
              >
                {['damage', 'missing', 'wrong_book', 'quality', 'other'].map(t => (
                  <option key={t} value={t}>{getExceptionTypeText(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">优先级</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
              >
                {['urgent', 'high', 'normal', 'low'].map(p => (
                  <option key={p} value={p}>{getPriorityText(p)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">相关图书</label>
            <select
              value={formData.book_id}
              onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
              className="input"
            >
              <option value="">选择图书</option>
              {books.map(book => (
                <option key={book.id} value={book.id}>{book.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">相关会员</label>
            <select
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              className="input"
            >
              <option value="">选择会员</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name} - {member.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">问题描述 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="4"
              required
              placeholder="请详细描述遇到的问题..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              提交
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="异常详情"
        size="lg"
      >
        {selectedException && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div>
                <span className="text-gray-500 text-sm">异常编号</span>
                <p className="font-mono font-medium">{selectedException.exception_no}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">类型</span>
                <p className="font-medium">{getExceptionTypeText(selectedException.type)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">优先级</span>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedException.priority)}`}>
                    {getPriorityText(selectedException.priority)}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">状态</span>
                <p>
                  <span className={`status-badge status-${selectedException.status}`}>
                    {getStatusText(selectedException.status)}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">问题描述</h3>
              <p className="text-gray-700 p-3 bg-gray-50 rounded">{selectedException.description}</p>
            </div>

            {selectedException.resolution && (
              <div>
                <h3 className="font-medium mb-2">处理方案</h3>
                <p className="text-gray-700 p-3 bg-green-50 rounded">{selectedException.resolution}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">相关图书</span>
                <p>{selectedException.title || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">相关会员</span>
                <p>{selectedException.member_name || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">上报人</span>
                <p>{selectedException.reported_by_name}</p>
              </div>
              <div>
                <span className="text-gray-500">上报时间</span>
                <p>{formatDateTime(selectedException.created_at)}</p>
              </div>
              {selectedException.handled_by_name && (
                <div>
                  <span className="text-gray-500">处理人</span>
                  <p>{selectedException.handled_by_name}</p>
                </div>
              )}
              {selectedException.resolved_at && (
                <div>
                  <span className="text-gray-500">解决时间</span>
                  <p>{formatDateTime(selectedException.resolved_at)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={handleModal}
        onClose={() => setHandleModal(false)}
        title="开始处理"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded text-sm">
            <p className="font-medium">异常编号：{selectedException?.exception_no}</p>
            <p className="text-gray-600">{selectedException?.description}</p>
          </div>
          <div>
            <label className="label">处理方案 *</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="input"
              rows="4"
              placeholder="请输入处理方案..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button onClick={() => setHandleModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button onClick={handleProcess} className="btn btn-primary">
              确认开始处理
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
