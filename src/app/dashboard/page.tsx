'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { getOrders, Order, OrderStatus, getStatusLabel } from '@/lib/mockData';

export default function DashboardPage() {
  const orders = getOrders();
  const [timeRange, setTimeRange] = useState('all');

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status !== 'APPROVED' && o.status !== 'REJECTED' && o.status !== 'ARCHIVED').length;
    const approved = orders.filter(o => o.status === 'APPROVED' || o.status === 'ARCHIVED').length;
    const rejected = orders.filter(o => o.status === 'REJECTED').length;
    
    const avgTime = orders.reduce((acc, o) => {
      if (o.historyNodes.length >= 2) {
        const first = new Date(o.historyNodes[0].timestamp).getTime();
        const last = new Date(o.historyNodes[o.historyNodes.length - 1].timestamp).getTime();
        return acc + (last - first);
      }
      return acc;
    }, 0) / total / (1000 * 60 * 60);

    return { total, pending, approved, rejected, avgTime: avgTime.toFixed(1) };
  }, [orders]);

  const byCountry = useMemo(() => {
    const grouped: Record<string, { total: number; approved: number; pending: number; rejected: number }> = {};
    orders.forEach(order => {
      if (!grouped[order.country]) {
        grouped[order.country] = { total: 0, approved: 0, pending: 0, rejected: 0 };
      }
      grouped[order.country].total++;
      if (order.status === 'APPROVED' || order.status === 'ARCHIVED') {
        grouped[order.country].approved++;
      } else if (order.status === 'REJECTED') {
        grouped[order.country].rejected++;
      } else {
        grouped[order.country].pending++;
      }
    });
    return Object.entries(grouped).map(([country, data]) => ({ country, ...data }));
  }, [orders]);

  const byCategory = useMemo(() => {
    const grouped: Record<string, { total: number; approved: number; pending: number; rejected: number; totalValue: number }> = {};
    orders.forEach(order => {
      if (!grouped[order.category]) {
        grouped[order.category] = { total: 0, approved: 0, pending: 0, rejected: 0, totalValue: 0 };
      }
      grouped[order.category].total++;
      grouped[order.category].totalValue += order.declaredAmount;
      if (order.status === 'APPROVED' || order.status === 'ARCHIVED') {
        grouped[order.category].approved++;
      } else if (order.status === 'REJECTED') {
        grouped[order.category].rejected++;
      } else {
        grouped[order.category].pending++;
      }
    });
    return Object.entries(grouped).map(([category, data]) => ({ category, ...data }));
  }, [orders]);

  const byRejectReason = useMemo(() => {
    const reasons = [
      { reason: '发票金额不符', count: orders.filter(o => o.status === 'INVOICE_MISMATCH').length, orders: orders.filter(o => o.status === 'INVOICE_MISMATCH') },
      { reason: '品名归类冲突', count: orders.filter(o => o.status === 'CLASSIFICATION_CONFLICT').length, orders: orders.filter(o => o.status === 'CLASSIFICATION_CONFLICT') },
      { reason: '收件人证件缺失', count: orders.filter(o => o.status === 'ID_MISSING').length, orders: orders.filter(o => o.status === 'ID_MISSING') },
      { reason: '资料不全', count: orders.filter(o => o.status === 'DOCUMENTS_INCOMPLETE').length, orders: orders.filter(o => o.status === 'DOCUMENTS_INCOMPLETE') },
    ];
    return reasons.filter(r => r.count > 0);
  }, [orders]);

  const processingTime = useMemo(() => {
    return orders.map(order => {
      if (order.historyNodes.length >= 2) {
        const first = new Date(order.historyNodes[0].timestamp);
        const last = new Date(order.historyNodes[order.historyNodes.length - 1].timestamp);
        const hours = (last.getTime() - first.getTime()) / (1000 * 60 * 60);
        return {
          orderNumber: order.orderNumber,
          country: order.country,
          category: order.category,
          hours: hours.toFixed(1),
          status: order.status,
        };
      }
      return {
        orderNumber: order.orderNumber,
        country: order.country,
        category: order.category,
        hours: '处理中',
        status: order.status,
      };
    });
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📊 复盘统计</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          >
            <option value="all">全部时间</option>
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">订单总数</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">📦</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">待处理</div>
              <div className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">已放行</div>
              <div className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">平均处理时长</div>
              <div className="text-3xl font-bold text-purple-600 mt-1">{stats.avgTime}h</div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">⏱️</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🌍 按国家统计</h2>
          <div className="space-y-4">
            {byCountry.map((item, index) => (
              <div key={item.country} className="flex items-center">
                <div className="w-24 text-sm font-medium text-gray-700">{item.country}</div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(item.approved / item.total) * 100}%` }}
                    ></div>
                    <div 
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${(item.pending / item.total) * 100}%` }}
                    ></div>
                    <div 
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(item.rejected / item.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-right text-sm">
                  <span className="text-green-600 font-medium">{item.approved}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-gray-600">{item.total}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-500">已放行</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-xs text-gray-500">处理中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-500">已退回</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📦 按品类统计</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-3">品类</th>
                  <th className="pb-3 text-center">订单数</th>
                  <th className="pb-3 text-right">总金额</th>
                  <th className="pb-3 text-right">放行率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byCategory.map(item => (
                  <tr key={item.category}>
                    <td className="py-3 font-medium text-gray-800">{item.category}</td>
                    <td className="py-3 text-center">{item.total}</td>
                    <td className="py-3 text-right font-medium">¥{item.totalValue.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <span className={item.approved / item.total >= 0.8 ? 'text-green-600' : 'text-yellow-600'}>
                        {((item.approved / item.total) * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">⚠️ 退回/异常原因分布</h2>
          <div className="space-y-4">
            {byRejectReason.map((item, index) => (
              <div key={item.reason}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{item.reason}</span>
                  <span className="text-sm text-gray-500">{item.count} 票</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      index === 0 ? 'bg-red-500' :
                      index === 1 ? 'bg-orange-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-yellow-500'
                    } transition-all`}
                    style={{ width: `${Math.min((item.count / orders.length) * 100, 100)}%` }}
                  ></div>
                </div>
                {item.orders.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    关联订单: {item.orders.map(o => (
                      <Link 
                        key={o.id} 
                        href={`/orders/${o.id}`}
                        className="text-primary hover:underline mx-1"
                      >
                        {o.orderNumber}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">⏱️ 处理耗时明细</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-3">订单号</th>
                  <th className="pb-3">国家</th>
                  <th className="pb-3">品类</th>
                  <th className="pb-3 text-right">耗时</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processingTime.map(item => (
                  <tr key={item.orderNumber}>
                    <td className="py-2">
                      <Link 
                        href={`/orders/${orders.find(o => o.orderNumber === item.orderNumber)?.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {item.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-gray-600">{item.country}</td>
                    <td className="py-2 text-gray-600">{item.category}</td>
                    <td className="py-2 text-right">
                      <span className={`font-medium ${
                        item.hours === '处理中' ? 'text-yellow-600' :
                        parseFloat(item.hours) > 24 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.hours}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 订单状态明细</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['PENDING', 'DOCUMENTS_INCOMPLETE', 'INVOICE_MISMATCH', 'CLASSIFICATION_CONFLICT', 'ID_MISSING', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED'] as OrderStatus[]).map(status => {
            const count = orders.filter(o => o.status === status).length;
            return (
              <div key={status} className="border border-gray-200 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-xs text-gray-500 mt-1">{getStatusLabel(status)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
