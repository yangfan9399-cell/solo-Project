import { useState, useEffect } from 'react';
import { apiRequest, formatDate, formatMoney, getStatusText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Modal from './Modal';
import Pagination from './Pagination';

export default function PurchaseList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(false);
  const [formData, setFormData] = useState({ supplier: '', expected_date: '', note: '', items: [] });
  const [books, setBooks] = useState([]);
  const [receiveItems, setReceiveItems] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [poRes, booksRes] = await Promise.all([
        apiRequest(`/purchase?page=${page}&pageSize=10${statusFilter ? '&status=' + statusFilter : ''}`),
        apiRequest('/books?pageSize=100')
      ]);
      setData(poRes);
      setBooks(booksRes.data);
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
      await apiRequest('/purchase', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setCreateModal(false);
      setFormData({ supplier: '', expected_date: '', note: '', items: [] });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { book_id: '', quantity_ordered: 1, unit_price: 0, note: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!confirm(`确定要将采购单状态更改为"${getStatusText(newStatus)}"吗？`)) return;
    try {
      await apiRequest(`/purchase/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const po = await apiRequest(`/purchase/${id}`);
      setSelectedPO(po);
      setDetailModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenReceive = async (id) => {
    try {
      const po = await apiRequest(`/purchase/${id}`);
      setSelectedPO(po);
      setReceiveItems(po.items.map(item => ({
        item_id: item.id,
        book_title: item.title,
        quantity_ordered: item.quantity_ordered,
        quantity_received: item.quantity_received || 0,
        quantity: 0
      })));
      setReceiveModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      const items = receiveItems.filter(item => item.quantity > 0);
      if (items.length === 0) {
        alert('请输入到货数量');
        return;
      }
      const res = await apiRequest(`/purchase/${selectedPO.id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      setReceiveModal(false);
      setReceiveItems([]);
      const taskInfo = res.generatedTasks > 0 ? `\n已自动生成 ${res.generatedTasks} 个分拣任务，可前往分拣看板处理。` : '';
      alert(res.message + taskInfo);
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
        <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary">
          + 新建采购单
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
            {['draft', 'submitted', 'partial', 'received'].map(s => (
              <option key={s} value={s}>{getStatusText(s)}</option>
            ))}
          </select>
        </div>

        {data.data.length === 0 ? (
          <EmptyState icon="🛒" title="暂无采购单" description="点击右上角按钮创建新的采购单" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>采购单号</th>
                    <th>供应商</th>
                    <th>总金额</th>
                    <th>状态</th>
                    <th>创建人</th>
                    <th>创建时间</th>
                    <th>预计到货</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(po => (
                    <tr key={po.id}>
                      <td className="font-mono text-sm">{po.po_no}</td>
                      <td>{po.supplier}</td>
                      <td className="font-medium text-green-600">{formatMoney(po.total_amount)}</td>
                      <td>
                        <span className={`status-badge status-${po.status}`}>
                          {getStatusText(po.status)}
                        </span>
                      </td>
                      <td>{po.created_by_name}</td>
                      <td>{formatDate(po.created_at)}</td>
                      <td>{formatDate(po.expected_date)}</td>
                      <td className="space-x-2">
                        <button onClick={() => handleViewDetail(po.id)} className="btn-link">
                          详情
                        </button>
                        {po.status === 'draft' && (
                          <button onClick={() => handleStatusChange(po.id, 'submitted')} className="btn-link text-blue-600">
                            提交
                          </button>
                        )}
                        {['submitted', 'partial'].includes(po.status) && (
                          <button onClick={() => handleOpenReceive(po.id)} className="btn-link text-green-600">
                            到货验收
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
        title="新建采购单"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">供应商 *</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">预计到货日期</label>
              <input
                type="date"
                value={formData.expected_date}
                onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">备注</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="input"
              rows="2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">采购明细 *</label>
              <button type="button" onClick={handleAddItem} className="btn-link">
                + 添加图书
              </button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded">
                  <select
                    value={item.book_id}
                    onChange={(e) => handleItemChange(index, 'book_id', e.target.value)}
                    className="input flex-1"
                    required
                  >
                    <option value="">选择图书</option>
                    {books.map(book => (
                      <option key={book.id} value={book.id}>{book.title} - {book.author}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity_ordered}
                    onChange={(e) => handleItemChange(index, 'quantity_ordered', parseInt(e.target.value) || 1)}
                    className="input w-24"
                    placeholder="数量"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="input w-28"
                    placeholder="单价"
                  />
                  <button type="button" onClick={() => handleRemoveItem(index)} className="btn-link text-red-600 pt-2">
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建采购单
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="采购单详情"
        size="lg"
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div>
                <span className="text-gray-500 text-sm">采购单号</span>
                <p className="font-mono font-medium">{selectedPO.po_no}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">状态</span>
                <p>
                  <span className={`status-badge status-${selectedPO.status}`}>
                    {getStatusText(selectedPO.status)}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">供应商</span>
                <p className="font-medium">{selectedPO.supplier}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">总金额</span>
                <p className="font-medium text-green-600">{formatMoney(selectedPO.total_amount)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">创建人</span>
                <p>{selectedPO.created_by_name}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">创建时间</span>
                <p>{formatDate(selectedPO.created_at)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">采购明细</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>图书</th>
                    <th>ISBN</th>
                    <th>订购数量</th>
                    <th>已到货</th>
                    <th>单价</th>
                    <th>小计</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items?.map(item => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.author}</p>
                      </td>
                      <td className="font-mono text-sm">{item.isbn}</td>
                      <td>{item.quantity_ordered}</td>
                      <td>{item.quantity_received || 0}</td>
                      <td>{formatMoney(item.unit_price)}</td>
                      <td>{formatMoney(item.unit_price * item.quantity_ordered)}</td>
                      <td>
                        <span className={`status-badge status-${item.status || 'pending'}`}>
                          {getStatusText(item.status || 'pending')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedPO.note && (
              <div>
                <h3 className="font-medium mb-2">备注</h3>
                <p className="text-gray-600">{selectedPO.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={receiveModal}
        onClose={() => setReceiveModal(false)}
        title="到货验收"
        size="lg"
      >
        <form onSubmit={handleReceive} className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="font-medium">{selectedPO?.po_no}</p>
            <p className="text-sm text-gray-600">供应商：{selectedPO?.supplier}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">到货明细</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>图书</th>
                  <th>订购数量</th>
                  <th>已到货</th>
                  <th>本次到货</th>
                </tr>
              </thead>
              <tbody>
                {receiveItems.map((item, index) => (
                  <tr key={item.item_id}>
                    <td>{item.book_title}</td>
                    <td>{item.quantity_ordered}</td>
                    <td>{item.quantity_received}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity_ordered - item.quantity_received}
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...receiveItems];
                          newItems[index].quantity = parseInt(e.target.value) || 0;
                          setReceiveItems(newItems);
                        }}
                        className="input w-24"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setReceiveModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              确认到货
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
