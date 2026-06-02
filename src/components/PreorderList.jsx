import { useState, useEffect } from 'react';
import { apiRequest, formatDate, formatMoney, getStatusText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Modal from './Modal';
import Pagination from './Pagination';

export default function PreorderList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPreorder, setSelectedPreorder] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [formData, setFormData] = useState({ book_id: '', member_id: '', quantity: 1, note: '' });
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [preordersRes, booksRes, membersRes] = await Promise.all([
        apiRequest(`/preorders?page=${page}&pageSize=10${statusFilter ? '&status=' + statusFilter : ''}`),
        apiRequest('/books?pageSize=100'),
        apiRequest('/members?pageSize=100')
      ]);
      setData(preordersRes);
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
  }, [page, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/preorders', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setCreateModal(false);
      setFormData({ book_id: '', member_id: '', quantity: 1, note: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!confirm(`确定要将订单状态更改为"${getStatusText(newStatus)}"吗？`)) return;
    try {
      await apiRequest(`/preorders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">预售订单</h1>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary">
          + 新建预售
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部状态</option>
            {['pending', 'confirmed', 'arrived', 'reserved', 'picked', 'cancelled', 'refunded', 'expired'].map(s => (
              <option key={s} value={s}>{getStatusText(s)}</option>
            ))}
          </select>
        </div>

        {data.data.length === 0 ? (
          <EmptyState icon="📦" title="暂无预售订单" description="点击右上角按钮创建新的预售订单" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">图书</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">会员</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订金</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{order.preorder_no}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center text-xl mr-3">
                            📖
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{order.title}</div>
                            <div className="text-xs text-gray-500">{order.author}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{order.member_name}</div>
                        <div className="text-xs text-gray-500">{order.member_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatMoney(order.deposit_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge status-${order.status}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              const detail = await apiRequest(`/preorders/${order.id}`);
                              setSelectedPreorder(detail);
                              setDetailModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            详情
                          </button>
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              取消
                            </button>
                          )}
                          {order.status === 'arrived' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'reserved')}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              预留
                            </button>
                          )}
                          {order.status === 'reserved' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'picked')}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              取书
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={10}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="新建预售订单">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">选择图书</label>
            <select
              value={formData.book_id}
              onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
              className="input"
              required
            >
              <option value="">请选择图书</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.title} - {formatMoney(b.price)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">选择会员</label>
            <select
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              className="input"
              required
            >
              <option value="">请选择会员</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.phone} (余额: {formatMoney(m.balance)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">数量</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">备注</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="input"
              rows="3"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建订单
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="订单详情" size="lg">
        {selectedPreorder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">订单号</div>
                <div className="font-mono">{selectedPreorder.preorder_no}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <span className={`status-badge status-${selectedPreorder.status}`}>
                  {getStatusText(selectedPreorder.status)}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-500">图书</div>
                <div className="font-medium">{selectedPreorder.title}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">ISBN</div>
                <div>{selectedPreorder.isbn}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">会员</div>
                <div className="font-medium">{selectedPreorder.member_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">联系电话</div>
                <div>{selectedPreorder.member_phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">订金金额</div>
                <div className="font-semibold text-primary-600">{formatMoney(selectedPreorder.deposit_amount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">图书定价</div>
                <div>{formatMoney(selectedPreorder.price)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">创建时间</div>
                <div>{formatDate(selectedPreorder.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">创建人</div>
                <div>{selectedPreorder.created_by_name}</div>
              </div>
            </div>

            {selectedPreorder.notifications && selectedPreorder.notifications.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">通知记录</h3>
                <div className="space-y-2">
                  {selectedPreorder.notifications.map(n => (
                    <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{n.title}</span>
                        <span className={`status-badge status-${n.status}`}>{getStatusText(n.status)}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{n.content}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
