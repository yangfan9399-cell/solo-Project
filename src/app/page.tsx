'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  getStatusLabel, 
  getStatusColor, 
  OrderStatus 
} from '@/lib/mockData';
import { useOrderStore } from '@/lib/orderStore';

export default function Home() {
  const { orders, loading, fetchOrders, useMockFallback } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.recipientName.includes(searchTerm) ||
        order.source.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const statusOptions: { value: string; label: string }[] = [
    { value: 'ALL', label: '全部' },
    { value: 'PENDING', label: '待处理' },
    { value: 'DOCUMENTS_INCOMPLETE', label: '资料不全' },
    { value: 'INVOICE_MISMATCH', label: '发票金额不符' },
    { value: 'CLASSIFICATION_CONFLICT', label: '品名归类冲突' },
    { value: 'ID_MISSING', label: '证件缺失' },
    { value: 'UNDER_REVIEW', label: '关务复核中' },
    { value: 'APPROVED', label: '已放行' },
    { value: 'REJECTED', label: '已退回' },
    { value: 'ARCHIVED', label: '已归档' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">清关处理台</h1>
          {useMockFallback && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              ⚠️ 演示模式 (内存数据)
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          共 {orders.length} 票订单
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {statusOptions.slice(0, 6).map(option => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              statusFilter === option.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-2xl font-bold text-gray-800">
              {statusCounts[option.value] || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">{option.label}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索订单号、收件人、来源..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} ({statusCounts[option.value] || 0})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  来源
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  国家/品类
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  收件人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申报金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  经办人
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    暂无符合条件的订单
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-primary">
                        {order.orderNumber}
                      </div>
                      {order.trackingNumber && (
                        <div className="text-xs text-gray-500">
                          运单: {order.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.source}</div>
                      {order.sourceOrderNo && (
                        <div className="text-xs text-gray-500">
                          {order.sourceOrderNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.country}</div>
                      <div className="text-xs text-gray-500">{order.category}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.recipientName}</div>
                      {order.recipientIdNumber && (
                        <div className="text-xs text-gray-500">
                          {order.recipientIdType}: {order.recipientIdNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{order.declaredAmount.toFixed(2)}
                      </div>
                      {order.actualAmount && order.actualAmount !== order.declaredAmount && (
                        <div className="text-xs text-red-600">
                          实际: ¥{order.actualAmount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status as OrderStatus)}`}>
                        {getStatusLabel(order.status as OrderStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>单证: {order.documentHandlerName || '-'}</div>
                      <div>复核: {order.customsReviewerName || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white text-sm font-medium rounded-md transition-colors"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
