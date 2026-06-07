'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { PickupStatusMap, ExceptionReasonMap, AuthorizationTypeMap, ClassNameMap, RoleMap } from '@/types';
import type { PickupStatus } from '@/types';

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { state, getChildById, getAuthorizationById, getAuthorizationsByChildId, getHistoryNodesByRecordId } = useApp();

  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const record = useMemo(() => {
    if (!id) return undefined;
    const r = state.pickupRecords.find(x => x.id === id);
    if (!r) return undefined;
    return {
      ...r,
      child: getChildById(r.childId),
      authorization: r.authorizationId ? getAuthorizationById(r.authorizationId) : undefined,
      historyNodes: getHistoryNodesByRecordId(r.id),
      allAuthorizations: getAuthorizationsByChildId(r.childId),
    };
  }, [id, state.pickupRecords, getChildById, getAuthorizationById, getHistoryNodesByRecordId, getAuthorizationsByChildId]);

  if (!id) return null;

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">记录未找到</h1>
        <p className="text-gray-500 mb-6">未找到对应的接送记录</p>
        <Link
          href="/records"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← 返回记录列表
        </Link>
      </div>
    );
  }

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/records"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
        >
          ← 返回记录列表
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              接送记录详情
            </h1>
            <p className="text-gray-500 font-mono text-sm">{record.id}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(record.status)}`}>
            {PickupStatusMap[record.status]}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">👶</span>
            幼儿信息
          </h2>
          {record.child && (
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">👶</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{record.child.name}</h3>
                <p className="text-gray-500">
                  {ClassNameMap[record.child.className]} · {record.child.gender} · {new Date(record.child.birthDate).toLocaleDateString('zh-CN')}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">主监护人：</span>
                    <span className="text-gray-700 font-medium">{record.child.primaryGuardianName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">联系电话：</span>
                    <span className="text-gray-700 font-medium font-mono">{record.child.primaryGuardianPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">👤</span>
            接送人信息
          </h2>
          {record.authorization ? (
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {record.authorization.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    record.authorization.type === 'PRIMARY'
                      ? 'bg-blue-100 text-blue-700'
                      : record.authorization.type === 'TEMPORARY'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {AuthorizationTypeMap[record.authorization.type]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    record.authorization.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {record.authorization.isActive ? '授权有效' : '授权已停用'}
                  </span>
                </div>
                <p className="text-gray-500 mb-3">与幼儿关系：{record.authorization.relation}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">身份证号：</span>
                    <span className="text-gray-700 font-mono">{record.authorization.idCardNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">联系电话：</span>
                    <span className="text-gray-700">{record.authorization.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">有效期：</span>
                    <span className="text-gray-700">
                      {new Date(record.authorization.validFrom).toLocaleDateString('zh-CN')}
                      {record.authorization.validTo 
                        ? ` 至 ${new Date(record.authorization.validTo).toLocaleDateString('zh-CN')}`
                        : ' · 长期有效'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">登记人：</span>
                    <span className="text-gray-700">{record.authorization.registeredBy}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xl">⚠️</span>
                <span className="font-medium text-red-800">无授权记录</span>
              </div>
              <p className="text-red-600 text-sm">
                未查询到该幼儿对应的授权信息
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">📅</span>
            接送时间
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">接送日期</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(record.pickupDate).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">预计接送时间</p>
              <p className="text-lg font-medium text-gray-900 font-mono">
                {record.pickupTime 
                  ? new Date(record.pickupTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {record.guardVerifiedBy && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">🚪</span>
              核验信息
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">核验人</p>
                <p className="text-base font-medium text-gray-900">{record.guardVerifiedBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">核验时间</p>
                <p className="text-base font-medium text-gray-900">
                  {record.verifiedAt ? new Date(record.verifiedAt).toLocaleString('zh-CN') : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {record.principalReviewBy && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">👨‍💼</span>
              园长复核
            </h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-semibold text-purple-900">{record.principalReviewBy}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  record.principalDecision === 'EXCEPTION_APPROVED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {record.principalDecision === 'EXCEPTION_APPROVED' ? '同意放行' : '驳回申请'}
                </span>
              </div>
              <p className="text-purple-700 text-sm mb-2">
                {record.principalRemark || '无复核意见'}
              </p>
              <p className="text-xs text-purple-500">
                复核时间：{record.principalReviewAt ? new Date(record.principalReviewAt).toLocaleString('zh-CN') : '-'}
              </p>
            </div>
          </div>
        )}

        {record.exceptionReason && (
          <div className={`rounded-xl border p-6 ${
            record.status === 'BLOCKED' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              异常说明
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">异常原因：</span>
                <span className={`font-medium ${record.status === 'BLOCKED' ? 'text-red-700' : 'text-orange-700'}`}>
                  {ExceptionReasonMap[record.exceptionReason]}
                </span>
              </div>
              {record.exceptionRemark && (
                <div>
                  <span className="text-sm font-medium text-gray-600">详细说明：</span>
                  <span className={record.status === 'BLOCKED' ? 'text-red-600' : 'text-orange-600'}>
                    {record.exceptionRemark}
                  </span>
                </div>
              )}
              {record.status === 'BLOCKED' && record.exceptionReason === 'ID_MISMATCH' && record.child && (
                <div className="mt-3 p-4 bg-white rounded-lg border border-red-300">
                  <p className="text-red-700 font-medium">
                    🚫 证件不符，已阻断放行。请联系主监护人 {record.child.primaryGuardianName}（{record.child.primaryGuardianPhone}）核实。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {record.principalRemark && !record.principalReviewBy && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-xl mr-2">📝</span>
              园长复核意见
            </h2>
            <p className="text-gray-700">{record.principalRemark}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-xl mr-2">📜</span>
            历史节点
          </h2>
          {record.historyNodes && record.historyNodes.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {record.historyNodes.map((node, index) => (
                  <div key={node.id} className="relative pl-10">
                    <div className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-white ${
                      index === 0 
                        ? 'bg-green-500' 
                        : index === record.historyNodes!.length - 1 
                        ? 'bg-purple-500' 
                        : 'bg-blue-500'
                    }`}></div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900">{node.description}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <span className="font-medium">{node.operator}</span>
                        <span>·</span>
                        <span>{RoleMap[node.operatorRole]}</span>
                        <span>·</span>
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

        {record.allAuthorizations && record.allAuthorizations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">📋</span>
              该幼儿所有授权
            </h2>
            <div className="space-y-3">
              {record.allAuthorizations.map((auth) => (
                <div
                  key={auth.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    auth.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{auth.name}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          auth.type === 'PRIMARY'
                            ? 'bg-blue-100 text-blue-700'
                            : auth.type === 'TEMPORARY'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {AuthorizationTypeMap[auth.type]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{auth.relation}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    auth.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {auth.isActive ? '有效' : '已停用'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
