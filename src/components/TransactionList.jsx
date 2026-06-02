import { useState, useEffect } from 'react';
import { apiRequest, formatDateTime, formatMoney, getStatusText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Modal from './Modal';
import Pagination from './Pagination';

export default function TransactionList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [refundModal, setRefundModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [refundData, setRefundData] = useState({
    preorder_id: '',
    amount: '',
    payment_method: 'balance',
    note: ''
  });
  const [preorders, setPreorders] = useState([]);
  const [members, setMembers] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [txRes, preordersRes, membersRes] = await Promise.all([
        apiRequest(
          `/transactions?page=${page}&pageSize=20${typeFilter ? '&type=' + typeFilter : ''}${statusFilter ? '&status=' + statusFilter : ''}${memberFilter ? '&member_id=' + memberFilter : ''}`
        ),
        apiRequest('/preorders?status=confirmed,arrived,reserved&pageSize=100'),
        apiRequest('/members?pageSize=100')
      ]);
      setData(txRes);
      setPreorders(preordersRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, typeFilter, statusFilter, memberFilter]);

  const getTypeText = (type) => {
    const map = {
      deposit: '订金支付',
      recharge: '账户充值',
      refund: '退款',
      purchase: '购买',
      transfer: '转账'
    };
    return map[type] || type;
  };

  const getTypeIcon = (type) => {
    const map = {
      deposit: '💳',
      recharge: '💰',
      refund: '↩️',
      purchase: '🛒',
      transfer: '💸'
    };
    return map[type] || '📝';
  };

  const getPaymentMethodText = (method) => {
    const map = {
      cash: '现金',
      wechat: '微信支付',
      alipay: '支付宝',
      balance: '账户余额',
      card: '银行卡',
      transfer: '银行转账'
    };
    return map[method] || method;
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/transactions/refund', {
        method: 'POST',
        body: JSON.stringify(refundData)
      });
      setRefundModal(false);
      setRefundData({ preorder_id: '', amount: '', payment_method: 'balance', note: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetail = (tx) => {
    setSelectedTransaction(tx);
    setDetailModal(true);
  };

  const handlePreorderChange = (preorderId) => {
    const preorder = preorders.find(p => p.id == preorderId);
    setRefundData({
      ...refundData,
      preorder_id: preorderId,
      amount: preorder?.deposit_amount || ''
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const getSummaryAmount = (type) => {
    const item = data?.summary?.find(s => s.type === type);
    return item?.total_amount || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">交易记录</h1>
        <button onClick={() => setRefundModal(true)} className="btn btn-primary">
          + 手动退款
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">交易总数</p>
          <p className="text-2xl font-bold text-gray-900">{data?.pagination?.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">充值总额</p>
          <p className="text-2xl font-bold text-green-600">{formatMoney(getSummaryAmount('recharge'))}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">订金总额</p>
          <p className="text-2xl font-bold text-blue-600">{formatMoney(getSummaryAmount('deposit'))}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">退款总额</p>
          <p className="text-2xl font-bold text-red-600">{formatMoney(getSummaryAmount('refund'))}</p>
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
            {['deposit', 'recharge', 'refund', 'purchase', 'transfer'].map(t => (
              <option key={t} value={t}>{getTypeText(t)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部状态</option>
            {['pending', 'completed', 'failed'].map(s => (
              <option key={s} value={s}>{getStatusText(s)}</option>
            ))}
          </select>
          <select
            value={memberFilter}
            onChange={(e) => { setMemberFilter(e.target.value); setPage(1); }}
            className="input w-48"
          >
            <option value="">全部会员</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} - {m.member_no}</option>
            ))}
          </select>
        </div>

        {data.data.length === 0 ? (
          <EmptyState icon="💰" title="暂无交易记录" description="交易列表为空" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>交易编号</th>
                    <th>类型</th>
                    <th>会员</th>
                    <th>金额</th>
                    <th>支付方式</th>
                    <th>状态</th>
                    <th>关联订单</th>
                    <th>操作人</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(tx => (
                    <tr key={tx.id}>
                      <td className="font-mono text-sm">{tx.tx_no}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <span>{getTypeIcon(tx.type)}</span>
                          <span>{getTypeText(tx.type)}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{tx.member_name}</p>
                          <p className="text-xs text-gray-500">{tx.member_no}</p>
                        </div>
                      </td>
                      <td className={`font-bold ${tx.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.type === 'refund' ? '-' : '+'}{formatMoney(tx.amount)}
                      </td>
                      <td>{getPaymentMethodText(tx.payment_method)}</td>
                      <td>
                        <span className={`status-badge status-${tx.status}`}>
                          {getStatusText(tx.status)}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{tx.book_title || '-'}</td>
                      <td>{tx.processed_by_name || '-'}</td>
                      <td>{formatDateTime(tx.created_at)}</td>
                      <td>
                        <button onClick={() => handleViewDetail(tx)} className="btn-link">
                          详情
                        </button>
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
        isOpen={refundModal}
        onClose={() => setRefundModal(false)}
        title="手动退款"
      >
        <form onSubmit={handleRefund} className="space-y-4">
          <div>
            <label className="label">预售订单 *</label>
            <select
              value={refundData.preorder_id}
              onChange={(e) => handlePreorderChange(e.target.value)}
              className="input"
              required
            >
              <option value="">选择订单</option>
              {preorders.map(p => (
                <option key={p.id} value={p.id}>
                  {p.preorder_no} - {p.book_title} ({p.member_name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">退款金额 *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={refundData.amount}
              onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">退款方式</label>
            <select
              value={refundData.payment_method}
              onChange={(e) => setRefundData({ ...refundData, payment_method: e.target.value })}
              className="input"
            >
              <option value="balance">退还到账户余额</option>
              <option value="wechat">微信退款</option>
              <option value="alipay">支付宝退款</option>
              <option value="cash">现金退款</option>
            </select>
          </div>
          <div>
            <label className="label">退款原因</label>
            <textarea
              value={refundData.note}
              onChange={(e) => setRefundData({ ...refundData, note: e.target.value })}
              className="input"
              rows="2"
              placeholder="请输入退款原因..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setRefundModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              确认退款
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="交易详情"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <p className="text-gray-500 text-sm">交易编号</p>
                <p className="font-mono font-bold">{selectedTransaction.tx_no}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${selectedTransaction.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedTransaction.type === 'refund' ? '-' : '+'}{formatMoney(selectedTransaction.amount)}
                </p>
                <p className="text-sm text-gray-500">{getTypeText(selectedTransaction.type)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">会员</span>
                <p className="font-medium">{selectedTransaction.member_name}</p>
              </div>
              <div>
                <span className="text-gray-500">会员号</span>
                <p className="font-mono">{selectedTransaction.member_no}</p>
              </div>
              <div>
                <span className="text-gray-500">支付方式</span>
                <p>{getPaymentMethodText(selectedTransaction.payment_method)}</p>
              </div>
              <div>
                <span className="text-gray-500">状态</span>
                <p>
                  <span className={`status-badge status-${selectedTransaction.status}`}>
                    {getStatusText(selectedTransaction.status)}
                  </span>
                </p>
              </div>
              {selectedTransaction.book_title && (
                <div>
                  <span className="text-gray-500">关联图书</span>
                  <p>{selectedTransaction.book_title}</p>
                </div>
              )}
              {selectedTransaction.processed_by_name && (
                <div>
                  <span className="text-gray-500">操作人</span>
                  <p>{selectedTransaction.processed_by_name}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">创建时间</span>
                <p>{formatDateTime(selectedTransaction.created_at)}</p>
              </div>
            </div>

            {selectedTransaction.note && (
              <div>
                <span className="text-gray-500 text-sm">备注</span>
                <p className="mt-1 p-3 bg-gray-50 rounded text-gray-700">{selectedTransaction.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
