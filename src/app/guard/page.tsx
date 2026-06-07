'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { PickupStatusMap, AuthorizationTypeMap, ExceptionReasonMap, ClassNameMap } from '@/types';
import type { ExceptionReason } from '@/types';
import Link from 'next/link';

export default function GuardPage() {
  const { state, getChildById, getAuthorizationById, verifyPickup, getHistoryNodesByRecordId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [blockReason, setBlockReason] = useState<ExceptionReason>('ID_MISMATCH');
  const [blockRemark, setBlockRemark] = useState('');

  const pendingRecords = useMemo(() => 
    state.pickupRecords
      .filter(r => r.status === 'PENDING')
      .map(r => ({
        ...r,
        child: getChildById(r.childId),
      })),
    [state.pickupRecords, getChildById]
  );

  const todayAllRecords = useMemo(() => 
    state.pickupRecords
      .map(r => ({
        ...r,
        child: getChildById(r.childId),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [state.pickupRecords, getChildById]
  );

  const filteredRecords = useMemo(() => 
    searchQuery
      ? todayAllRecords.filter(r => 
          r.child?.name.includes(searchQuery) ||
          r.id.includes(searchQuery)
        )
      : todayAllRecords,
    [searchQuery, todayAllRecords]
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

  const handleVerifyPass = () => {
    if (!selectedRecord) return;
    verifyPickup(selectedRecord, 'VERIFIED', '张门卫');
    setSelectedRecord(null);
  };

  const handleBlock = () => {
    setBlockReason('ID_MISMATCH');
    setBlockRemark('');
    setShowBlockModal(true);
  };

  const confirmBlock = () => {
    if (!selectedRecord) return;
    
    if (blockReason === 'ID_MISMATCH') {
      const remark = blockRemark || '来人出示的身份证照片与系统登记照片不符，疑似冒用证件';
      verifyPickup(selectedRecord, 'BLOCKED', '张门卫', 'ID_MISMATCH', remark);
    } else {
      verifyPickup(selectedRecord, 'BLOCKED', '张门卫', blockReason, blockRemark);
    }
    
    setShowBlockModal(false);
    setSelectedRecord(null);
  };

  const handleReportException = () => {
    setBlockReason('PARENT_DISPUTE');
    setBlockRemark('');
    setShowExceptionModal(true);
  };

  const confirmException = () => {
    if (!selectedRecord) return;
    verifyPickup(selectedRecord, 'PENDING_PRINCIPAL', '张门卫', blockReason, blockRemark || '需园长复核处理');
    setShowExceptionModal(false);
    setSelectedRecord(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🚪 门岗身份核验
        </h1>
        <p className="text-gray-600">
          核验接送人身份，处理异常情况
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索幼儿姓名或记录编号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="font-semibold text-gray-900 mb-2">
                待核验 ({pendingRecords.length})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingRecords.length > 0 ? (
                  pendingRecords.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => setSelectedRecord(record.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedRecord === record.id
                          ? 'bg-green-50 border-2 border-green-300'
                          : 'bg-yellow-50 hover:bg-yellow-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">👶</span>
                          <span className="font-medium text-gray-900">
                            {record.child?.name || '未知'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                          待核验
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {record.child ? ClassNameMap[record.child.className] : ''}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    暂无待核验记录
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h2 className="font-semibold text-gray-900 mb-2">
                全部记录 ({todayAllRecords.length})
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredRecords.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedRecord(record.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedRecord === record.id
                        ? 'bg-green-50 border-2 border-green-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">👶</span>
                        <span className="font-medium text-gray-900">
                          {record.child?.name || '未知'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        record.status === 'VERIFIED' || record.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : record.status === 'BLOCKED'
                          ? 'bg-red-100 text-red-700'
                          : record.status === 'EXCEPTION_APPROVED'
                          ? 'bg-orange-100 text-orange-700'
                          : record.status === 'EXCEPTION_REJECTED'
                          ? 'bg-gray-100 text-gray-700'
                          : record.status === 'PENDING_PRINCIPAL'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {PickupStatusMap[record.status]}
                      </span>
                    </div>
                    {record.pickupTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(record.pickupTime).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRecordData ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">幼儿信息</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRecordData.status === 'VERIFIED' || selectedRecordData.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : selectedRecordData.status === 'BLOCKED'
                      ? 'bg-red-100 text-red-700'
                      : selectedRecordData.status === 'EXCEPTION_APPROVED'
                      ? 'bg-orange-100 text-orange-700'
                      : selectedRecordData.status === 'EXCEPTION_REJECTED'
                      ? 'bg-gray-100 text-gray-700'
                      : selectedRecordData.status === 'PENDING_PRINCIPAL'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {PickupStatusMap[selectedRecordData.status]}
                  </span>
                </div>
                {selectedRecordData.child && (
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-4xl">👶</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedRecordData.child.name}
                      </h3>
                      <p className="text-gray-500">
                        {ClassNameMap[selectedRecordData.child.className]} · {selectedRecordData.child.gender}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">主监护人：</span>
                          <span className="text-gray-700 font-medium">
                            {selectedRecordData.child.primaryGuardianName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">联系电话：</span>
                          <span className="text-gray-700 font-medium">
                            {selectedRecordData.child.primaryGuardianPhone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedRecordData.authorization ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">授权人信息</h2>
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {selectedRecordData.authorization.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          selectedRecordData.authorization.type === 'PRIMARY'
                            ? 'bg-blue-100 text-blue-700'
                            : selectedRecordData.authorization.type === 'TEMPORARY'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {AuthorizationTypeMap[selectedRecordData.authorization.type]}
                        </span>
                        {selectedRecordData.authorization.isActive ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            授权有效
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            授权失效
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 mb-3">
                        与幼儿关系：{selectedRecordData.authorization.relation}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">身份证号：</span>
                          <span className="text-gray-700 font-mono">
                            {selectedRecordData.authorization.idCardNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">联系电话：</span>
                          <span className="text-gray-700">
                            {selectedRecordData.authorization.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">有效期：</span>
                          <span className="text-gray-700">
                            {new Date(selectedRecordData.authorization.validFrom).toLocaleDateString('zh-CN')}
                            {selectedRecordData.authorization.validTo 
                              ? ` 至 ${new Date(selectedRecordData.authorization.validTo).toLocaleDateString('zh-CN')}`
                              : ' · 长期有效'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">登记人：</span>
                          <span className="text-gray-700">
                            {selectedRecordData.authorization.registeredBy}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-lg font-semibold text-red-900">无授权记录</h3>
                  </div>
                  <p className="text-red-700">
                    未查询到该幼儿的授权信息，请联系主监护人确认。
                  </p>
                </div>
              )}

              {selectedRecordData.exceptionReason && (
                <div className={`rounded-xl border p-6 ${
                  selectedRecordData.status === 'BLOCKED' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <h3 className="font-semibold text-gray-900 mb-2">异常说明</h3>
                  <p className={`font-medium mb-1 ${
                    selectedRecordData.status === 'BLOCKED' ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    异常原因：{ExceptionReasonMap[selectedRecordData.exceptionReason]}
                  </p>
                  {selectedRecordData.exceptionRemark && (
                    <p className={`text-sm ${
                      selectedRecordData.status === 'BLOCKED' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      详细说明：{selectedRecordData.exceptionRemark}
                    </p>
                  )}
                  {selectedRecordData.status === 'BLOCKED' && selectedRecordData.exceptionReason === 'ID_MISMATCH' && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-medium">
                        🚫 证件不符，已阻断放行。请联系主监护人 {selectedRecordData.child?.primaryGuardianName}（{selectedRecordData.child?.primaryGuardianPhone}）核实。
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedRecordData.status === 'PENDING' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">核验操作</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={handleVerifyPass}
                      className="p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-center"
                    >
                      <div className="text-3xl mb-2">✅</div>
                      <p className="font-semibold">核验通过</p>
                      <p className="text-sm text-green-100">身份信息一致</p>
                    </button>
                    <button
                      onClick={handleBlock}
                      className="p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-center"
                    >
                      <div className="text-3xl mb-2">🚫</div>
                      <p className="font-semibold">阻断放行</p>
                      <p className="text-sm text-red-100">证件不符等</p>
                    </button>
                    <button
                      onClick={handleReportException}
                      className="p-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-center"
                    >
                      <div className="text-3xl mb-2">📢</div>
                      <p className="font-semibold">上报异常</p>
                      <p className="text-sm text-orange-100">需园长复核</p>
                    </button>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ 注意：</strong>证件不符时必须阻断放行，并第一时间联系主监护人 {selectedRecordData.child?.primaryGuardianName}（{selectedRecordData.child?.primaryGuardianPhone}）。
                    </p>
                  </div>
                </div>
              )}

              <Link
                href={`/records/${selectedRecordData.id}`}
                className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                查看完整详情 →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-5xl mb-4">👈</p>
              <p className="text-gray-500">请从左侧选择一条接送记录进行核验</p>
            </div>
          )}
        </div>
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🚫</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">阻断放行</h3>
                  <p className="text-sm text-gray-500">请选择阻断原因</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  异常原因
                </label>
                <div className="space-y-2">
                  {(['ID_MISMATCH', 'NO_AUTHORIZATION', 'EXPIRED_AUTHORIZATION', 'PARENT_DISPUTE', 'OTHER'] as ExceptionReason[]).map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        blockReason === reason
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="blockReason"
                        value={reason}
                        checked={blockReason === reason}
                        onChange={() => setBlockReason(reason)}
                        className="mr-3"
                      />
                      <span className="text-gray-700">{ExceptionReasonMap[reason]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细说明
                </label>
                <textarea
                  rows={3}
                  value={blockRemark}
                  onChange={(e) => setBlockRemark(e.target.value)}
                  placeholder="请描述具体情况..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ 重要提示：</strong>阻断放行后，请立即联系主监护人。
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmBlock}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认阻断
              </button>
            </div>
          </div>
        </div>
      )}

      {showExceptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📢</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">上报异常</h3>
                  <p className="text-sm text-gray-500">上报园长复核处理</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  异常原因
                </label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value as ExceptionReason)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {(['PARENT_DISPUTE', 'NO_AUTHORIZATION', 'EXPIRED_AUTHORIZATION', 'OTHER'] as ExceptionReason[]).map((reason) => (
                    <option key={reason} value={reason}>
                      {ExceptionReasonMap[reason]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  情况说明
                </label>
                <textarea
                  rows={4}
                  value={blockRemark}
                  onChange={(e) => setBlockRemark(e.target.value)}
                  placeholder="请详细描述异常情况，便于园长复核..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowExceptionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmException}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                确认上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
