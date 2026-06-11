'use client';

import { useState, useEffect } from 'react';
import { STATUS_LABELS, REJECT_REASON_LABELS, CATEGORY_LABELS } from '@/lib/constants';

interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  byCustomer: Record<string, { total: number; statuses: Record<string, number> }>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  rejectReasons: Record<string, number>;
  returnReasons: Record<string, number>;
  avgProofCycles: string;
  proofCycleDistribution: Record<string, number>;
  colorDeviationCount: number;
  recentOrdersCount: number;
  ordersWithColorDeviation: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const res = await fetch('/api/dashboard');
    const data = await res.json();
    setData(data);
    setLoading(false);
  };

  if (loading || !data) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  const maxCategoryValue = Math.max(...Object.values(data.byCategory), 1);
  const maxCustomerValue = Math.max(...Object.values(data.byCustomer).map(c => c.total), 1);
  const maxProofCycleValue = Math.max(...Object.values(data.proofCycleDistribution), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
        <p className="text-sm text-gray-500 mt-1">订单统计与打样周期分析</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">总订单数</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">进行中</p>
              <p className="text-2xl font-bold text-gray-900">{data.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">已下单</p>
              <p className="text-2xl font-bold text-gray-900">{data.completedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">平均打样次数</p>
              <p className="text-2xl font-bold text-gray-900">{data.avgProofCycles} 次</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">按客户分布</h3>
          <div className="space-y-3">
            {Object.entries(data.byCustomer).map(([customer, info]) => (
              <div key={customer}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{customer}</span>
                  <span className="text-gray-500">{info.total} 单</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${(info.total / maxCustomerValue) * 100}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {Object.entries(info.statuses).map(([status, count]) => (
                    <span key={status} className="text-xs text-gray-500">
                      {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">按品类分布</h3>
          <div className="space-y-3">
            {Object.entries(data.byCategory).map(([category, count]) => (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                  </span>
                  <span className="text-gray-500">{count} 单</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full"
                    style={{ width: `${(count / maxCategoryValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">状态分布</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">
                  {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                </p>
                <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">打样周期分布</h3>
          <div className="space-y-3">
            {Object.entries(data.proofCycleDistribution).map(([cycle, count]) => (
              <div key={cycle}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{cycle}</span>
                  <span className="text-gray-500">{count} 单</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full"
                    style={{ width: `${(count / maxProofCycleValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                颜色偏差相关订单：<span className="font-medium text-red-600">{data.ordersWithColorDeviation}</span> 单
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                标注颜色偏差的样稿：<span className="font-medium text-orange-600">{data.colorDeviationCount}</span> 份
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">客户拒绝原因分布</h3>
          {Object.keys(data.rejectReasons).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">暂无拒绝记录</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.rejectReasons).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                  <span className="text-sm font-medium text-red-800">
                    {REJECT_REASON_LABELS[reason as keyof typeof REJECT_REASON_LABELS] || reason}
                  </span>
                  <span className="text-sm text-red-600 font-bold">{count} 次</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">生产退回原因</h3>
          {Object.keys(data.returnReasons).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">暂无退回记录</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.returnReasons).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                  <span className="text-sm font-medium text-orange-800">{reason}</span>
                  <span className="text-sm text-orange-600 font-bold">{count} 次</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">业务流程说明</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { step: '1', title: '业务员提交', desc: '业务员创建订单并提交需求', color: 'bg-blue-500' },
            { step: '2', title: '设计师打样', desc: '设计师上传打样稿', color: 'bg-purple-500' },
            { step: '3', title: '客户确认', desc: '客户确认或拒绝样稿', color: 'bg-green-500' },
            { step: '4', title: '生产复核', desc: '生产主管审核并下单', color: 'bg-amber-500' },
            { step: '5', title: '下单生产', desc: '复核通过后正式下单', color: 'bg-emerald-500' },
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                {item.step}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              {index < 4 && (
                <svg className="w-5 h-5 mx-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
