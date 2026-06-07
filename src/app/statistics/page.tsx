'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/store';
import { ClassNameMap, AuthorizationTypeMap, ExceptionReasonMap, PickupStatusMap } from '@/types';
import type { ClassName, AuthorizationType, ExceptionReason, PickupStatus } from '@/types';

export default function StatisticsPage() {
  const { state, getChildById, getAuthorizationById } = useApp();

  const stats = useMemo(() => {
    const records = state.pickupRecords.map(r => ({
      ...r,
      child: getChildById(r.childId),
      authorization: r.authorizationId ? getAuthorizationById(r.authorizationId) : undefined,
    }));

    const classStats: Record<ClassName, { total: number; normal: number; exception: number; children: number }> = {
      CLASS_A: { total: 0, normal: 0, exception: 0, children: 0 },
      CLASS_B: { total: 0, normal: 0, exception: 0, children: 0 },
      CLASS_C: { total: 0, normal: 0, exception: 0, children: 0 },
    };

    records.forEach(record => {
      if (record.child) {
        const className = record.child.className;
        classStats[className].total++;
        if (record.status === 'VERIFIED' || record.status === 'COMPLETED') {
          classStats[className].normal++;
        } else if (record.exceptionReason) {
          classStats[className].exception++;
        }
      }
    });

    state.children.forEach(child => {
      classStats[child.className].children++;
    });

    const authTypeStats: Record<AuthorizationType, number> = {
      PRIMARY: 0,
      TEMPORARY: 0,
      EMERGENCY: 0,
    };

    state.authorizations.forEach(auth => {
      authTypeStats[auth.type]++;
    });

    const exceptionStats: Record<ExceptionReason, number> = {
      ID_MISMATCH: 0,
      PARENT_DISPUTE: 0,
      NO_AUTHORIZATION: 0,
      EXPIRED_AUTHORIZATION: 0,
      OTHER: 0,
    };

    records.forEach(record => {
      if (record.exceptionReason) {
        exceptionStats[record.exceptionReason]++;
      }
    });

    const statusStats: Record<string, number> = {
      PENDING: 0,
      PENDING_PRINCIPAL: 0,
      VERIFIED: 0,
      BLOCKED: 0,
      EXCEPTION_APPROVED: 0,
      EXCEPTION_REJECTED: 0,
      COMPLETED: 0,
    };

    records.forEach(record => {
      if (statusStats[record.status] !== undefined) {
        statusStats[record.status]++;
      }
    });

    const processedRecords = records.filter(r => 
      r.status === 'EXCEPTION_APPROVED' || r.status === 'EXCEPTION_REJECTED'
    );

    let avgProcessingTime = 0;
    const processingDetails: Array<{
      id: string;
      childName: string;
      exceptionReason: ExceptionReason;
      status: PickupStatus;
      processingTime: number;
    }> = [];

    if (processedRecords.length > 0) {
      let totalTime = 0;
      let validCount = 0;

      processedRecords.forEach(record => {
        if (record.verifiedAt && record.principalReviewAt) {
          const timeDiff = new Date(record.principalReviewAt).getTime() - new Date(record.verifiedAt).getTime();
          const minutes = timeDiff / 1000 / 60;
          totalTime += timeDiff;
          validCount++;
          processingDetails.push({
            id: record.id,
            childName: record.child?.name || '未知',
            exceptionReason: record.exceptionReason || 'OTHER',
            status: record.status as PickupStatus,
            processingTime: minutes,
          });
        }
      });

      if (validCount > 0) {
        avgProcessingTime = totalTime / validCount / 1000 / 60;
      }
    }

    const maxClassTotal = Math.max(...Object.values(classStats).map(s => s.total), 1);
    const maxExceptionCount = Math.max(...Object.values(exceptionStats).map(v => v), 1);
    const maxAuthCount = Math.max(...Object.values(authTypeStats).map(v => v), 1);

    return {
      classStats,
      authTypeStats,
      exceptionStats,
      statusStats,
      avgProcessingTime,
      processingDetails,
      maxClassTotal,
      maxExceptionCount,
      maxAuthCount,
      totalRecords: records.length,
      totalChildren: state.children.length,
      totalAuthorizations: state.authorizations.length,
    };
  }, [state, getChildById, getAuthorizationById]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(1)} 分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} 小时 ${mins} 分钟`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📊 数据统计分析
        </h1>
        <p className="text-gray-600">
          按班级、授权类型、异常原因、处理耗时聚合统计
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总记录数</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalRecords}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">在园幼儿</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalChildren}</p>
            </div>
            <div className="text-3xl">👶</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">授权总数</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalAuthorizations}</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均处理耗时</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.avgProcessingTime > 0 ? formatTime(stats.avgProcessingTime) : '-'}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            📊 按班级统计
          </h2>
          <div className="space-y-5">
            {(Object.keys(stats.classStats) as ClassName[]).map(className => {
              const stat = stats.classStats[className];
              const normalWidth = stat.total > 0 ? (stat.normal / stats.maxClassTotal) * 100 : 0;
              const exceptionWidth = stat.total > 0 ? (stat.exception / stats.maxClassTotal) * 100 : 0;
              return (
                <div key={className}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{ClassNameMap[className]}</span>
                    <span className="text-sm text-gray-500">
                      {stat.total} 次 · {stat.children} 名幼儿
                    </span>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100">
                    <div
                      className="bg-green-500 flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${normalWidth}%`, minWidth: stat.normal > 0 ? '40px' : '0' }}
                    >
                      {stat.normal > 0 && <span className="text-xs text-white font-medium">{stat.normal}</span>}
                    </div>
                    <div
                      className="bg-red-500 flex items-center justify-start pl-2 transition-all"
                      style={{ width: `${exceptionWidth}%`, minWidth: stat.exception > 0 ? '40px' : '0' }}
                    >
                      {stat.exception > 0 && <span className="text-xs text-white font-medium">{stat.exception}</span>}
                    </div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>正常 {stat.normal}</span>
                    <span>异常 {stat.exception}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            � 授权类型统计
          </h2>
          <div className="space-y-4">
            {(Object.keys(stats.authTypeStats) as AuthorizationType[]).map(type => {
              const count = stats.authTypeStats[type];
              const percentage = stats.totalAuthorizations > 0 
                ? ((count / stats.totalAuthorizations) * 100).toFixed(1) 
                : '0';
              const width = (count / stats.maxAuthCount) * 100;
              const colorClass = 
                type === 'PRIMARY' ? 'bg-blue-500' :
                type === 'TEMPORARY' ? 'bg-yellow-500' : 'bg-red-500';
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-gray-900">
                      {AuthorizationTypeMap[type]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {count} 人 ({percentage}%)
                    </span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClass} rounded-full transition-all`}
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            ⚠️ 异常原因统计
          </h2>
          <div className="space-y-4">
            {(Object.keys(stats.exceptionStats) as ExceptionReason[]).map(reason => {
              const count = stats.exceptionStats[reason];
              const totalExceptions = Object.values(stats.exceptionStats).reduce((a, b) => a + b, 0);
              const percentage = totalExceptions > 0 
                ? ((count / totalExceptions) * 100).toFixed(1) 
                : '0';
              const width = totalExceptions > 0 ? (count / totalExceptions) * 100 : 0;
              return (
                <div key={reason}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-gray-900">
                      {ExceptionReasonMap[reason]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {count} 次 ({percentage}%)
                    </span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            📈 接送状态分布
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.statusStats).map(([status, count]) => {
              const statusKey = status as keyof typeof PickupStatusMap;
              const label = PickupStatusMap[statusKey] || status;
              let colorClass = 'bg-gray-100 text-gray-700';
              if (status === 'VERIFIED' || status === 'COMPLETED') {
                colorClass = 'bg-green-100 text-green-700';
              } else if (status === 'BLOCKED') {
                colorClass = 'bg-red-100 text-red-700';
              } else if (status === 'EXCEPTION_APPROVED') {
                colorClass = 'bg-orange-100 text-orange-700';
              } else if (status === 'EXCEPTION_REJECTED') {
                colorClass = 'bg-gray-200 text-gray-700';
              } else if (status === 'PENDING_PRINCIPAL') {
                colorClass = 'bg-purple-100 text-purple-700';
              } else {
                colorClass = 'bg-yellow-100 text-yellow-700';
              }
              return (
                <div
                  key={status}
                  className={`p-4 rounded-lg ${colorClass}`}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm font-medium">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          ⏱️ 异常处理耗时分析
        </h2>
        {stats.processingDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">记录编号</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">幼儿姓名</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">异常原因</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">处理结果</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">处理耗时</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.processingDetails.map((detail) => (
                  <tr key={detail.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{detail.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{detail.childName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ExceptionReasonMap[detail.exceptionReason]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        detail.status === 'EXCEPTION_APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {detail.status === 'EXCEPTION_APPROVED' ? '同意放行' : '驳回申请'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right font-medium">
                      {formatTime(detail.processingTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">📊</p>
            <p>暂无已处理的异常记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
