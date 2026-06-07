import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPickupRecordWithDetails, getAuthorizationsByChildId } from '@/lib/mockData';
import { PickupStatusMap, ExceptionReasonMap, AuthorizationTypeMap, ClassNameMap, RoleMap } from '@/types';

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const record = getPickupRecordWithDetails(resolvedParams.id);

  if (!record) {
    notFound();
  }

  const allAuthorizations = record.childId ? getAuthorizationsByChildId(record.childId) : [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'BLOCKED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'EXCEPTION_APPROVED':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'EXCEPTION_REJECTED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/records"
          className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center"
        >
          ← 返回记录列表
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              接送记录详情
            </h1>
            <p className="text-gray-500 font-mono text-sm">{record.id}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusStyle(record.status)}`}>
            {PickupStatusMap[record.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <span className="text-xl mr-2">👶</span>
              幼儿信息
            </h2>
          </div>
          <div className="p-6">
            {record.child ? (
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">👶</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {record.child.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      {ClassNameMap[record.child.className]}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      {record.child.gender}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-20">出生日期：</span>
                      <span className="text-gray-700">
                        {new Date(record.child.birthDate).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">主监护人：</span>
                      <span className="text-gray-700 font-medium">
                        {record.child.primaryGuardianName}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">联系电话：</span>
                      <span className="text-gray-700 font-mono">
                        {record.child.primaryGuardianPhone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无幼儿信息</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <span className="text-xl mr-2">👤</span>
              接送人信息
            </h2>
          </div>
          <div className="p-6">
            {record.authorization ? (
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {record.authorization.name}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      record.authorization.type === 'PRIMARY'
                        ? 'bg-blue-100 text-blue-700'
                        : record.authorization.type === 'TEMPORARY'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {AuthorizationTypeMap[record.authorization.type]}
                    </span>
                  </div>
                  <p className="text-gray-500 mb-3">{record.authorization.relation}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-20">身份证号：</span>
                      <span className="text-gray-700 font-mono">
                        {record.authorization.idCardNumber}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">联系电话：</span>
                      <span className="text-gray-700 font-mono">
                        {record.authorization.phone}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">有效期：</span>
                      <span className="text-gray-700">
                        {new Date(record.authorization.validFrom).toLocaleDateString('zh-CN')}
                        {record.authorization.validTo
                          ? ` 至 ${new Date(record.authorization.validTo).toLocaleDateString('zh-CN')}`
                          : ' · 长期有效'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">⚠️</p>
                <p className="text-red-600 font-medium">无授权记录</p>
                <p className="text-gray-500 text-sm mt-1">系统中未查询到该次接送的授权信息</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📅</span>
            接送时间
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {new Date(record.pickupDate).toLocaleDateString('zh-CN')}
          </p>
          {record.pickupTime && (
            <p className="text-gray-500 mt-1">
              {new Date(record.pickupTime).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🚪</span>
            核验信息
          </h3>
          <p className="text-lg font-medium text-gray-900">
            {record.guardVerifiedBy || '待核验'}
          </p>
          {record.verifiedAt && (
            <p className="text-gray-500 text-sm mt-1">
              {new Date(record.verifiedAt).toLocaleString('zh-CN')}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">👨‍💼</span>
            园长复核
          </h3>
          <p className="text-lg font-medium text-gray-900">
            {record.principalReviewBy || '待复核'}
          </p>
          {record.principalReviewAt && (
            <p className="text-gray-500 text-sm mt-1">
              {new Date(record.principalReviewAt).toLocaleString('zh-CN')}
            </p>
          )}
          {record.principalDecision && (
            <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
              record.principalDecision === 'EXCEPTION_APPROVED'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {record.principalDecision === 'EXCEPTION_APPROVED' ? '同意放行' : '驳回申请'}
            </span>
          )}
        </div>
      </div>

      {record.exceptionReason && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-6 mb-6">
          <h3 className="font-bold text-orange-900 text-lg mb-3 flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            异常说明
          </h3>
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-orange-800 font-medium mb-2">
              异常原因：{ExceptionReasonMap[record.exceptionReason]}
            </p>
            {record.exceptionRemark && (
              <p className="text-gray-700 text-sm">
                详细说明：{record.exceptionRemark}
              </p>
            )}
          </div>
          {record.exceptionReason === 'ID_MISMATCH' && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-xl">
              <p className="text-red-800 text-sm font-medium">
                🚫 证件不符，已阻断放行。请联系主监护人 {record.child?.primaryGuardianName}（{record.child?.primaryGuardianPhone}）核实。
              </p>
            </div>
          )}
        </div>
      )}

      {record.principalRemark && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6 mb-6">
          <h3 className="font-bold text-purple-900 text-lg mb-3 flex items-center">
            <span className="text-xl mr-2">📝</span>
            园长复核意见
          </h3>
          <div className="bg-white/60 rounded-xl p-4">
            <p className="text-gray-700">{record.principalRemark}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <span className="text-xl mr-2">📜</span>
            历史节点
          </h2>
        </div>
        <div className="p-6">
          {record.historyNodes && record.historyNodes.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {record.historyNodes.map((node, index) => (
                  <div key={node.id} className="relative pl-12">
                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white shadow-md ${
                      index === 0 ? 'bg-green-500' :
                      index === record.historyNodes!.length - 1 ? 'bg-purple-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900">{node.description}</p>
                        <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600 border border-gray-200">
                          {RoleMap[node.operatorRole]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span className="font-medium">{node.operator}</span>
                        <span className="text-gray-300">·</span>
                        <span>{new Date(node.timestamp).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无历史记录</p>
          )}
        </div>
      </div>

      {allAuthorizations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <span className="text-xl mr-2">📋</span>
              该幼儿所有授权
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {allAuthorizations.map((auth) => (
                <div
                  key={auth.id}
                  className={`p-4 rounded-xl border ${
                    auth.id === record.authorizationId
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <span>👤</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{auth.name}</p>
                        <p className="text-xs text-gray-500">{auth.relation}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        auth.type === 'PRIMARY'
                          ? 'bg-blue-100 text-blue-700'
                          : auth.type === 'TEMPORARY'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {AuthorizationTypeMap[auth.type]}
                      </span>
                      {auth.id === record.authorizationId && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                          本次接送
                        </span>
                      )}
                      {auth.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          有效
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          已停用
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
