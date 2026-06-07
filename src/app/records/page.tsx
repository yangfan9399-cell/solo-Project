'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { PickupStatusMap, ClassNameMap, ExceptionReasonMap } from '@/types';
import type { PickupStatus, ClassName } from '@/types';
import Link from 'next/link';

export default function RecordsPage() {
  const { state, getChildById, getAuthorizationById } = useApp();

  const [statusFilter, setStatusFilter] = useState<PickupStatus | 'all'>('all');
  const [classFilter, setClassFilter] = useState<ClassName | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const records = useMemo(() => 
    state.pickupRecords
      .map(record => {
        const child = getChildById(record.childId);
        const authorization = record.authorizationId ? getAuthorizationById(record.authorizationId) : undefined;
        return { ...record, child, authorization };
      })
      .filter(record => {
        if (statusFilter !== 'all' && record.status !== statusFilter) return false;
        if (classFilter !== 'all' && record.child?.className !== classFilter) return false;
        if (searchQuery && !record.child?.name.includes(searchQuery) && !record.id.includes(searchQuery)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.pickupRecords, getChildById, getAuthorizationById, statusFilter, classFilter, searchQuery]
  );

  const getStatusStyle = (status: PickupStatus) => {
    switch (status) {
      case 'VERIFIED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'BLOCKED':
        return 'bg-red-100 text-red-700';
      case 'EXCEPTION_APPROVED':
        return 'bg-orange-100 text-orange-700';
      case 'EXCEPTION_REJECTED':
        return 'bg-gray-100 text-gray-700';
      case 'PENDING_PRINCIPAL':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📋 接送记录查询
        </h1>
        <p className="text-gray-600">
          查看所有接送记录及详细信息
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索幼儿姓名或记录编号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">状态筛选</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PickupStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="PENDING">待核验</option>
              <option value="VERIFIED">核验通过</option>
              <option value="BLOCKED">已阻断</option>
              <option value="PENDING_PRINCIPAL">待园长复核</option>
              <option value="EXCEPTION_APPROVED">异常放行</option>
              <option value="EXCEPTION_REJECTED">异常驳回</option>
              <option value="COMPLETED">已完成</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">班级筛选</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as ClassName | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部班级</option>
              <option value="CLASS_A">小班</option>
              <option value="CLASS_B">中班</option>
              <option value="CLASS_C">大班</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">幼儿信息</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">班级</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">接送日期</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">异常原因</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">核验人</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">👶</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{record.child?.name || '-'}</p>
                        <p className="text-xs text-gray-500 font-mono">{record.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.child ? ClassNameMap[record.child.className] : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(record.pickupDate).toLocaleDateString('zh-CN')}
                    {record.pickupTime && (
                      <span className="text-gray-400 ml-1">
                        {new Date(record.pickupTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(record.status)}`}>
                      {PickupStatusMap[record.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.exceptionReason ? ExceptionReasonMap[record.exceptionReason] : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.guardVerifiedBy || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/records/${record.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      查看详情 →
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <p className="text-4xl mb-2">📭</p>
                  <p>暂无符合条件的记录</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-right">
        共 {records.length} 条记录
      </div>
    </div>
  );
}
