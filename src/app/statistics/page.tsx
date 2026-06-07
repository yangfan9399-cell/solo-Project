import { mockChildren, mockAuthorizations, mockPickupRecords, getPickupRecordWithDetails } from '@/lib/mockData';
import { ClassNameMap, AuthorizationTypeMap, ExceptionReasonMap, PickupStatusMap } from '@/types';
import type { ClassName, AuthorizationType, ExceptionReason, PickupStatus } from '@/types';

export default function StatisticsPage() {
  const records = mockPickupRecords
    .map(r => getPickupRecordWithDetails(r.id))
    .filter((r): r is NonNullable<ReturnType<typeof getPickupRecordWithDetails>> => r !== undefined);

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

  mockChildren.forEach(child => {
    classStats[child.className].children++;
  });

  const authTypeStats: Record<AuthorizationType, number> = {
    PRIMARY: 0,
    TEMPORARY: 0,
    EMERGENCY: 0,
  };

  mockAuthorizations.forEach(auth => {
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

  const statusStats: Record<PickupStatus, number> = {
    PENDING: 0,
    VERIFIED: 0,
    BLOCKED: 0,
    EXCEPTION_APPROVED: 0,
    EXCEPTION_REJECTED: 0,
    COMPLETED: 0,
  };

  records.forEach(record => {
    statusStats[record.status]++;
  });

  const exceptionRecords = records.filter(r => 
    r.status === 'EXCEPTION_APPROVED' || r.status === 'EXCEPTION_REJECTED'
  );

  let avgProcessingTime = 0;
  if (exceptionRecords.length > 0) {
    const totalTime = exceptionRecords.reduce((sum, record) => {
      if (record.verifiedAt && record.principalReviewAt) {
        const timeDiff = new Date(record.principalReviewAt).getTime() - new Date(record.verifiedAt).getTime();
        return sum + timeDiff;
      }
      return sum;
    }, 0);
    avgProcessingTime = totalTime / exceptionRecords.length / 1000 / 60;
  }

  const maxClassTotal = Math.max(...Object.values(classStats).map(s => s.total), 1);
  const maxExceptionCount = Math.max(...Object.values(exceptionStats).map(v => v), 1);
  const maxAuthCount = Math.max(...Object.values(authTypeStats).map(v => v), 1);

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
              <p className="text-sm text-gray-500">总接送记录</p>
              <p className="text-3xl font-bold text-blue-600">{records.length}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">正常放行</p>
              <p className="text-3xl font-bold text-green-600">
                {statusStats.VERIFIED + statusStats.COMPLETED}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">异常记录</p>
              <p className="text-3xl font-bold text-red-600">
                {statusStats.BLOCKED + statusStats.EXCEPTION_APPROVED + statusStats.EXCEPTION_REJECTED}
              </p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均处理耗时</p>
              <p className="text-3xl font-bold text-purple-600">
                {avgProcessingTime > 0 ? `${avgProcessingTime.toFixed(1)} 分钟` : '-'}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-2">🏫</span>
            按班级统计
          </h2>
          <div className="space-y-4">
            {(Object.keys(classStats) as ClassName[]).map((className) => {
              const stats = classStats[className];
              const width = (stats.total / maxClassTotal) * 100;
              const exceptionRate = stats.total > 0 ? ((stats.exception / stats.total) * 100).toFixed(1) : '0';
              return (
                <div key={className}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {ClassNameMap[className]}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({stats.children} 名幼儿)
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">{stats.total}</span>
                      <span className="text-gray-500"> 次</span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${stats.total > 0 ? (stats.normal / stats.total) * 100 : 0}%` }}
                    ></div>
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${stats.total > 0 ? (stats.exception / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>正常: {stats.normal}</span>
                    <span>异常率: {exceptionRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-2">👤</span>
            授权类型统计
          </h2>
          <div className="space-y-4">
            {(Object.keys(authTypeStats) as AuthorizationType[]).map((type) => {
              const count = authTypeStats[type];
              const width = (count / maxAuthCount) * 100;
              const percentage = mockAuthorizations.length > 0 
                ? ((count / mockAuthorizations.length) * 100).toFixed(1)
                : '0';
              const colors: Record<AuthorizationType, string> = {
                PRIMARY: 'bg-blue-500',
                TEMPORARY: 'bg-yellow-500',
                EMERGENCY: 'bg-red-500',
              };
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {AuthorizationTypeMap[type]}
                    </span>
                    <div className="text-sm">
                      <span className="font-bold text-gray-900">{count}</span>
                      <span className="text-gray-500"> 人 ({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[type]} rounded-full transition-all`}
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">授权总人数</span>
              <span className="text-xl font-bold text-gray-900">
                {mockAuthorizations.length} 人
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            异常原因统计
          </h2>
          <div className="space-y-4">
            {(Object.keys(exceptionStats) as ExceptionReason[]).map((reason) => {
              const count = exceptionStats[reason];
              const width = (count / maxExceptionCount) * 100;
              const totalExceptions = Object.values(exceptionStats).reduce((a, b) => a + b, 0);
              const percentage = totalExceptions > 0 
                ? ((count / totalExceptions) * 100).toFixed(1)
                : '0';
              return (
                <div key={reason}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {ExceptionReasonMap[reason]}
                    </span>
                    <div className="text-sm">
                      <span className="font-bold text-red-600">{count}</span>
                      <span className="text-gray-500"> 次 ({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">异常总次数</span>
              <span className="text-xl font-bold text-red-600">
                {Object.values(exceptionStats).reduce((a, b) => a + b, 0)} 次
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-2">📈</span>
            接送状态分布
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(statusStats) as PickupStatus[]).map((status) => {
              const count = statusStats[status];
              const colors: Record<PickupStatus, string> = {
                PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                VERIFIED: 'bg-green-50 border-green-200 text-green-700',
                BLOCKED: 'bg-red-50 border-red-200 text-red-700',
                EXCEPTION_APPROVED: 'bg-orange-50 border-orange-200 text-orange-700',
                EXCEPTION_REJECTED: 'bg-gray-50 border-gray-200 text-gray-700',
                COMPLETED: 'bg-blue-50 border-blue-200 text-blue-700',
              };
              return (
                <div
                  key={status}
                  className={`p-4 rounded-xl border ${colors[status]}`}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm font-medium">{PickupStatusMap[status]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="text-xl mr-2">⏱️</span>
          异常处理耗时分析
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <p className="text-3xl font-bold text-purple-600 mb-1">
              {avgProcessingTime > 0 ? avgProcessingTime.toFixed(1) : '-'}
            </p>
            <p className="text-sm text-purple-700">平均处理时间（分钟）</p>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600 mb-1">
              {exceptionRecords.length}
            </p>
            <p className="text-sm text-blue-700">已处理异常数</p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600 mb-1">
              {statusStats.EXCEPTION_APPROVED}
            </p>
            <p className="text-sm text-green-700">异常放行数</p>
          </div>
        </div>

        {exceptionRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">幼儿</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">异常原因</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">上报时间</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">复核时间</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">处理耗时</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">处理结果</th>
                </tr>
              </thead>
              <tbody>
                {exceptionRecords.map((record) => {
                  let processingTime = '-';
                  if (record.verifiedAt && record.principalReviewAt) {
                    const diff = new Date(record.principalReviewAt).getTime() - new Date(record.verifiedAt).getTime();
                    const minutes = Math.floor(diff / 1000 / 60);
                    const seconds = Math.floor((diff / 1000) % 60);
                    processingTime = `${minutes}分${seconds}秒`;
                  }
                  return (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {record.child?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {record.exceptionReason ? ExceptionReasonMap[record.exceptionReason] : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {record.verifiedAt 
                          ? new Date(record.verifiedAt).toLocaleString('zh-CN')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {record.principalReviewAt 
                          ? new Date(record.principalReviewAt).toLocaleString('zh-CN')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-600">
                        {processingTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'EXCEPTION_APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {PickupStatusMap[record.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-3xl mb-2">🎉</p>
            <p>暂无异常处理记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
