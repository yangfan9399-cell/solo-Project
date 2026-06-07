'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { PickupStatusMap, ExceptionReasonMap, AuthorizationTypeMap, ClassNameMap, RoleMap } from '@/types';
import type { PickupStatus } from '@/types';
import Link from 'next/link';

export default function PrincipalPage() {
  const { state, getChildById, getAuthorizationById, getHistoryNodesByRecordId, principalReview } = useApp();

  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject'>('approve');
  const [reviewRemark, setReviewRemark] = useState('');

  const pendingRecords = useMemo(() => 
    state.pickupRecords
      .filter(r => r.status === 'PENDING_PRINCIPAL')
      .map(r => ({
        ...r,
        child: getChildById(r.childId),
        authorization: r.authorizationId ? getAuthorizationById(r.authorizationId) : undefined,
        historyNodes: getHistoryNodesByRecordId(r.id),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.pickupRecords, getChildById, getAuthorizationById, getHistoryNodesByRecordId]
  );

  const allExceptionRecords = useMemo(() => 
    state.pickupRecords
      .filter(r => r.exceptionReason)
      .map(r => ({
        ...r,
        child: getChildById(r.childId),
        authorization: r.authorizationId ? getAuthorizationById(r.authorizationId) : undefined,
        historyNodes: getHistoryNodesByRecordId(r.id),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.pickupRecords, getChildById, getAuthorizationById, getHistoryNodesByRecordId]
  );

  const selectedRecordData = useMemo(() => {
    if (!selectedRecord) return null;
    const record = state.pickupRecords.find(r => r.id === selectedRecord);
    if (!record) return null;
    return {
      ...record,
      child: getChildById(record.childId),
      authorization: record.authorizationId ? getAuthorizationById(record.authorizationId) : undefined,
      historyNodes: getHistoryNodesByRecordId(record.id),
    };
  }, [selectedRecord, state.pickupRecords, getChildById, getAuthorizationById, getHistoryNodesByRecordId]);

  const needsReview = (status: PickupStatus) => {
    return status === 'PENDING_PRINCIPAL';
  };

  const handleReview = (decision: 'approve' | 'reject') => {
    setReviewDecision(decision);
    setReviewRemark('');
    setShowReviewModal(true);
  };

  const confirmReview = () => {
    if (!selectedRecord) return;
    
    const decision = reviewDecision === 'approve' ? 'EXCEPTION_APPROVED' : 'EXCEPTION_REJECTED';
    principalReview(selectedRecord, decision, '李园长', reviewRemark || (reviewDecision === 'approve' ? '经核实，同意异常放行' : '不予放行，请联系主监护人'));
    
    setShowReviewModal(false);
    setSelectedRecord(null);
  };

  const approvedCount = allExceptionRecords.filter(r => r.status === 'EXCEPTION_APPROVED').length;
  const rejectedCount = allExceptionRecords.filter(r => r.status === 'EXCEPTION_REJECTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          👨‍💼 园长异常复核
        </h1>
        <p className="text-gray-600">
          复核异常放行申请，做出最终决定
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待复核</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingRecords.length}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已放行</p>
              <p className="text-2xl font-bold text-green-600">
                {approvedCount}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已驳回</p>
              <p className="text-2xl font-bold text-red-600">
                {rejectedCount}
              </p>
            </div>
            <div className="text-3xl">🚫</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">异常总数</p>
              <p className="text-2xl font-bold text-orange-600">{allExceptionRecords.length}</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">待复核列表</h2>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                {pendingRecords.length} 条
              </span>
            </div>
            <div className="space-y-3">
              {pendingRecords.length > 0 ? (
                pendingRecords.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecord(record.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedRecord === record.id
                        ? 'bg-purple-50 border-2 border-purple-300 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">👶</span>
                        <span className="font-semibold text-gray-900">
                          {record.child?.name || '未知'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'BLOCKED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {PickupStatusMap[record.status]}
                      </span>
                    </div>
                    {record.exceptionReason && (
                      <p className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        {ExceptionReasonMap[record.exceptionReason]}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-sm">暂无待复核记录</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
            <h2 className="font-semibold text-gray-900 mb-3">历史异常记录</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allExceptionRecords.filter(r => !needsReview(r.status)).map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecord(record.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedRecord === record.id
                      ? 'bg-purple-50 border-2 border-purple-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">
                      {record.child?.name || '未知'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'EXCEPTION_APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'BLOCKED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {PickupStatusMap[record.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRecordData ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">异常详情</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRecordData.status === 'EXCEPTION_APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : selectedRecordData.status === 'EXCEPTION_REJECTED'
                      ? 'bg-gray-100 text-gray-700'
                      : selectedRecordData.status === 'BLOCKED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {PickupStatusMap[selectedRecordData.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                      <span className="text-xl mr-2">👶</span>
                      幼儿信息
                    </h3>
                    {selectedRecordData.child && (
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-blue-600">姓名：</span>
                          <span className="text-blue-900 font-medium">{selectedRecordData.child.name}</span>
                        </p>
                        <p>
                          <span className="text-blue-600">班级：</span>
                          <span className="text-blue-900">{ClassNameMap[selectedRecordData.child.className]}</span>
                        </p>
                        <p>
                          <span className="text-blue-600">主监护人：</span>
                          <span className="text-blue-900">{selectedRecordData.child.primaryGuardianName}</span>
                        </p>
                        <p>
                          <span className="text-blue-600">联系电话：</span>
                          <span className="text-blue-900 font-mono">{selectedRecordData.child.primaryGuardianPhone}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl">
                    <h3 className="font-medium text-green-900 mb-3 flex items-center">
                      <span className="text-xl mr-2">👤</span>
                      接送人信息
                    </h3>
                    {selectedRecordData.authorization ? (
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-green-600">姓名：</span>
                          <span className="text-green-900 font-medium">{selectedRecordData.authorization.name}</span>
                        </p>
                        <p>
                          <span className="text-green-600">关系：</span>
                          <span className="text-green-900">{selectedRecordData.authorization.relation}</span>
                        </p>
                        <p>
                          <span className="text-green-600">授权类型：</span>
                          <span className="text-green-900">
                            {AuthorizationTypeMap[selectedRecordData.authorization.type]}
                          </span>
                        </p>
                        <p>
                          <span className="text-green-600">联系电话：</span>
                          <span className="text-green-900 font-mono">{selectedRecordData.authorization.phone}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600">无授权记录</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-xl mr-2">⚠️</span>
                  异常情况
                </h3>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">🚨</span>
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900 mb-2">
                        {selectedRecordData.exceptionReason 
                          ? ExceptionReasonMap[selectedRecordData.exceptionReason]
                          : '未知异常'}
                      </p>
                      <p className="text-orange-700 text-sm">
                        {selectedRecordData.exceptionRemark || '暂无详细说明'}
                      </p>
                      <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-orange-600">
                        上报时间：{new Date(selectedRecordData.createdAt).toLocaleString('zh-CN')}
                        {selectedRecordData.guardVerifiedBy && (
                          <span className="ml-4">上报人：{selectedRecordData.guardVerifiedBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRecordData.principalReviewBy && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">📝</span>
                    园长复核结果
                  </h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">👨‍💼</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="font-semibold text-purple-900">
                            {selectedRecordData.principalReviewBy}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            selectedRecordData.principalDecision === 'EXCEPTION_APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedRecordData.principalDecision === 'EXCEPTION_APPROVED' 
                              ? '同意放行' 
                              : '驳回申请'}
                          </span>
                        </div>
                        <p className="text-purple-700 text-sm">
                          {selectedRecordData.principalRemark || '无复核意见'}
                        </p>
                        <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-purple-600">
                          复核时间：{selectedRecordData.principalReviewAt 
                            ? new Date(selectedRecordData.principalReviewAt).toLocaleString('zh-CN')
                            : '-'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRecordData.historyNodes && selectedRecordData.historyNodes.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-xl mr-2">📜</span>
                    处理流程
                  </h3>
                  <div className="relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                    <div className="space-y-4">
                      {selectedRecordData.historyNodes.map((node, index) => (
                        <div key={node.id} className="relative pl-10">
                          <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white ${
                            index === 0 ? 'bg-green-500' : 
                            index === selectedRecordData.historyNodes!.length - 1 ? 'bg-purple-500' : 
                            'bg-blue-500'
                          }`}></div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {node.description}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>{node.operator}</span>
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
                </div>
              )}

              {needsReview(selectedRecordData.status) && (
                <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">园长复核操作</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => handleReview('approve')}
                      className="p-5 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-colors text-center"
                    >
                      <div className="text-3xl mb-2">✅</div>
                      <p className="font-semibold text-green-800">同意放行</p>
                      <p className="text-sm text-green-600">经核实后同意异常放行</p>
                    </button>
                    <button
                      onClick={() => handleReview('reject')}
                      className="p-5 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors text-center"
                    >
                      <div className="text-3xl mb-2">🚫</div>
                      <p className="font-semibold text-red-800">驳回申请</p>
                      <p className="text-sm text-red-600">不予放行，等待主监护人</p>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    请仔细核实情况，确保幼儿安全后再做决定
                  </p>
                </div>
              )}

              <Link
                href={`/records/${selectedRecordData.id}`}
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                查看完整记录详情 →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-5xl mb-4">👈</p>
              <p className="text-gray-500">请从左侧选择一条异常记录进行复核</p>
            </div>
          )}
        </div>
      </div>

      {showReviewModal && selectedRecordData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">
                  {reviewDecision === 'approve' ? '✅' : '🚫'}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {reviewDecision === 'approve' ? '同意异常放行' : '驳回放行申请'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    幼儿：{selectedRecordData.child?.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-xl ${
                reviewDecision === 'approve' 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  reviewDecision === 'approve' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {reviewDecision === 'approve'
                    ? '确认同意该幼儿异常放行，请填写复核意见。'
                    : '确认驳回放行申请，幼儿需由主监护人接走。'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  复核意见
                </label>
                <textarea
                  rows={4}
                  value={reviewRemark}
                  onChange={(e) => setReviewRemark(e.target.value)}
                  placeholder="请填写复核意见和处理说明..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReview}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  reviewDecision === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                确认{reviewDecision === 'approve' ? '放行' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
