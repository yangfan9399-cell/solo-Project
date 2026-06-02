import { useState, useEffect } from 'react';
import { apiRequest, formatDate, formatMoney, getStatusText } from '../utils/api';
import Loading from './Loading';
import ErrorState from './ErrorState';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest('/dashboard');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const statCards = [
    { label: '今日分拣任务', value: data.todayTasks, icon: '📋', color: 'blue' },
    { label: '待处理异常', value: data.pendingExceptions, icon: '⚠️', color: 'red' },
    { label: '会员总数', value: data.totalMembers, icon: '👥', color: 'green' },
    { label: '图书总数', value: data.totalBooks, icon: '📚', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">工作台</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="card p-6">
            <div className="flex items-center">
              <div className="text-4xl mr-4">{card.icon}</div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                <div className="text-sm text-gray-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">预售订单统计</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {data.preorderStats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className={`status-badge status-${stat.status}`}>
                    {getStatusText(stat.status)}
                  </span>
                  <span className="font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">会员等级分布</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {data.memberStats.map((stat) => (
                <div key={stat.level} className="flex items-center justify-between">
                  <span className={`status-badge level-${stat.level}`}>
                    {stat.level === 'platinum' ? '白金会员' : stat.level === 'gold' ? '金卡会员' : stat.level === 'silver' ? '银卡会员' : '普通会员'}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          stat.level === 'platinum' ? 'bg-amber-500' :
                          stat.level === 'gold' ? 'bg-yellow-500' :
                          stat.level === 'silver' ? 'bg-gray-400' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((stat.count / data.totalMembers) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold w-12 text-right">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">最近预售订单</h2>
          </div>
          <div className="divide-y">
            {data.recentPreorders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded flex items-center justify-center text-lg mr-3">
                    📖
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{order.title}</div>
                    <div className="text-sm text-gray-500">{order.member_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`status-badge status-${order.status}`}>
                    {getStatusText(order.status)}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">{formatDate(order.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">最近交易记录</h2>
          </div>
          <div className="divide-y">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded flex items-center justify-center text-lg mr-3 ${
                    tx.type === 'deposit' || tx.type === 'refund' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.type === 'deposit' ? '💳' : tx.type === 'refund' ? '↩️' : '💰'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{tx.member_name}</div>
                    <div className="text-sm text-gray-500">{tx.type === 'deposit' ? '订金支付' : tx.type === 'refund' ? '退款' : '交易'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}{formatMoney(tx.amount)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{formatDate(tx.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
