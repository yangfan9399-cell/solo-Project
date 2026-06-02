import { useState, useEffect } from 'react';
import { apiRequest, formatDate, formatMoney, getLevelText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import Modal from './Modal';
import Pagination from './Pagination';

export default function MemberList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', level: 'normal', address: '', note: ''
  });
  const [depositData, setDepositData] = useState({ amount: '', payment_method: 'cash', note: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest(`/members?page=${page}&pageSize=10${keyword ? '&keyword=' + keyword : ''}${levelFilter ? '&level=' + levelFilter : ''}`);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, keyword, levelFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedMember?.id) {
        await apiRequest(`/members/${selectedMember.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...formData, balance: selectedMember.balance })
        });
      } else {
        await apiRequest('/members', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setEditModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/members/${selectedMember.id}/deposit`, {
        method: 'POST',
        body: JSON.stringify(depositData)
      });
      setDepositModal(false);
      setDepositData({ amount: '', payment_method: 'cash', note: '' });
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
        <h1 className="text-2xl font-bold text-gray-900">会员管理</h1>
        <button
          onClick={() => {
            setSelectedMember(null);
            setFormData({ name: '', phone: '', email: '', level: 'normal', address: '', note: '' });
            setEditModal(true);
          }}
          className="btn btn-primary"
        >
          + 添加会员
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b flex items-center space-x-4">
          <input
            type="text"
            placeholder="搜索姓名、电话或会员号..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="input w-64"
          />
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            className="input w-40"
          >
            <option value="">全部等级</option>
            <option value="normal">普通会员</option>
            <option value="silver">银卡会员</option>
            <option value="gold">金卡会员</option>
            <option value="platinum">白金会员</option>
          </select>
        </div>

        {data.data.length === 0 ? (
          <EmptyState icon="👥" title="暂无会员" description="点击右上角按钮添加新会员" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">会员号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">姓名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">电话</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">等级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">余额</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">累计充值</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">注册时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{member.member_no}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge level-${member.level}`}>
                          {getLevelText(member.level)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{formatMoney(member.balance)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatMoney(member.total_deposit)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(member.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              const detail = await apiRequest(`/members/${member.id}`);
                              setSelectedMember(detail);
                              setDetailModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            详情
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setFormData({
                                name: member.name,
                                phone: member.phone,
                                email: member.email || '',
                                level: member.level,
                                address: member.address || '',
                                note: member.note || ''
                              });
                              setEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setDepositModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            充值
                          </button>
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

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={selectedMember?.id ? '编辑会员' : '添加会员'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">姓名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">手机号 *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">邮箱</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">会员等级</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="input"
            >
              <option value="normal">普通会员</option>
              <option value="silver">银卡会员</option>
              <option value="gold">金卡会员</option>
              <option value="platinum">白金会员</option>
            </select>
          </div>
          <div>
            <label className="label">地址</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">备注</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="input"
              rows="2"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setEditModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={depositModal} onClose={() => setDepositModal(false)} title="会员充值">
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedMember?.name}</div>
                <div className="text-sm text-gray-500">{selectedMember?.member_no}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">当前余额</div>
                <div className="text-xl font-bold text-green-600">{formatMoney(selectedMember?.balance || 0)}</div>
              </div>
            </div>
          </div>
          <div>
            <label className="label">充值金额 *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={depositData.amount}
              onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
              className="input"
              placeholder="输入充值金额"
              required
            />
          </div>
          <div>
            <label className="label">支付方式</label>
            <select
              value={depositData.payment_method}
              onChange={(e) => setDepositData({ ...depositData, payment_method: e.target.value })}
              className="input"
            >
              <option value="cash">现金</option>
              <option value="wechat">微信支付</option>
              <option value="alipay">支付宝</option>
              <option value="card">银行卡</option>
            </select>
          </div>
          <div>
            <label className="label">备注</label>
            <input
              type="text"
              value={depositData.note}
              onChange={(e) => setDepositData({ ...depositData, note: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setDepositModal(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              确认充值
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="会员详情" size="lg">
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`status-badge level-${selectedMember.level}`}>
                    {getLevelText(selectedMember.level)}
                  </span>
                  <span className="text-sm text-gray-500">{selectedMember.member_no}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">账户余额</div>
                <div className="text-2xl font-bold text-green-600">{formatMoney(selectedMember.balance)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-500">电话</div>
                <div className="font-medium">{selectedMember.phone}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-500">邮箱</div>
                <div className="font-medium">{selectedMember.email || '-'}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-500">累计充值</div>
                <div className="font-medium">{formatMoney(selectedMember.total_deposit)}</div>
              </div>
            </div>

            {selectedMember.preorders && selectedMember.preorders.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">最近预售订单</h4>
                <div className="space-y-2">
                  {selectedMember.preorders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">📖</div>
                        <div>
                          <div className="font-medium">{order.title}</div>
                          <div className="text-xs text-gray-500">{order.preorder_no}</div>
                        </div>
                      </div>
                      <span className={`status-badge status-${order.status}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedMember.transactions && selectedMember.transactions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">最近交易记录</h4>
                <div className="space-y-2">
                  {selectedMember.transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{tx.type === 'deposit' ? '充值' : tx.type === 'refund' ? '退款' : '消费'}</div>
                        <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
                      </div>
                      <div className={`font-semibold ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}{formatMoney(tx.amount)}
                      </div>
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
