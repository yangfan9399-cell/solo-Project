"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";
import { mockExpiryReports, getBatchById, getStoreById, mockStores, mockUsers } from "@/lib/mockData";
import { formatDate, formatDateTime, getDisposalTypeText, getDaysUntilExpiry } from "@/lib/utils";

export default function PharmacistPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveType, setApproveType] = useState<"transfer" | "destruction">("transfer");
  const [targetStoreId, setTargetStoreId] = useState<number | null>(null);
  const [approveNotes, setApproveNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const reports = mockExpiryReports
    .filter((r) => r.status === "pending")
    .filter((r) => filterType === "all" || r.conflictType === filterType || (filterType === "no_conflict" && r.conflictType === "none"))
    .map((report) => ({
      ...report,
      batch: getBatchById(report.batchId),
      store: getStoreById(report.storeId),
      reportedByUser: mockUsers.find((u) => u.id === report.reportedBy),
    }));

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowApproveModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const handleReject = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span>操作成功！</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">区域药师审核</h1>
        <p className="mt-1 text-gray-600">确认近效期药品的调拨或销毁方案</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">筛选:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">全部待审核</option>
              <option value="no_conflict">无冲突</option>
              <option value="batch_mismatch">批号不一致</option>
              <option value="quantity_exceeded">销毁数量超限</option>
              <option value="store_conflict">责任门店冲突</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-900">{reports.length}</span> 条待审核记录
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => {
          const daysUntilExpiry = report.batch?.expiryDate ? getDaysUntilExpiry(report.batch.expiryDate) : 0;
          const isSelected = selectedReport === report.id;

          return (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/reports/${report.id}`}
                        className="text-lg font-bold text-blue-600 hover:text-blue-700"
                      >
                        {report.reportNumber}
                      </Link>
                      <StatusBadge status={report.status} />
                      {report.conflictType !== "none" && <ConflictBadge conflictType={report.conflictType} />}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-gray-500">药品</div>
                        <div className="font-medium text-gray-900">{report.batch?.medicine?.name}</div>
                        <div className="text-sm text-gray-500">批号: {report.batch?.batchNumber}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">上报门店</div>
                        <div className="font-medium text-gray-900">{report.store?.name}</div>
                        <div className="text-sm text-gray-500">经办人: {report.reportedByUser?.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">数量</div>
                        <div className="font-medium text-gray-900">
                          {report.reportedQuantity} {report.batch?.medicine?.unit}
                        </div>
                        <div className={`text-sm ${daysUntilExpiry <= 30 ? "text-red-500" : "text-gray-500"}`}>
                          效期: {formatDate(report.batch?.expiryDate || null)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">建议处置方式</div>
                        <div className="font-medium text-gray-900">
                          {getDisposalTypeText(report.disposalType)}
                        </div>
                        {report.suggestedTransferStoreId && (
                          <div className="text-sm text-green-600">
                            建议调拨至: {getStoreById(report.suggestedTransferStoreId)?.name}
                          </div>
                        )}
                      </div>
                    </div>
                    {report.conflictType !== "none" && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm font-medium text-red-800">冲突说明</div>
                        <div className="text-sm text-red-700 mt-1">{report.conflictNotes}</div>
                      </div>
                    )}
                    {report.notes && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-500">备注说明</div>
                        <div className="text-sm text-gray-700 mt-1">{report.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {report.conflictType !== "batch_mismatch" && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {!isSelected ? (
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            setSelectedReport(report.id);
                            setApproveType(report.disposalType === "transfer" ? "transfer" : "destruction");
                            setTargetStoreId(report.suggestedTransferStoreId || null);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          ✅ 审核处理
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={isSubmitting}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                        >
                          ❌ 驳回
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-bold text-gray-900 mb-4">审核处理</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              处置方式
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 px-4 py-3 border border-green-300 rounded-lg cursor-pointer bg-green-50">
                                <input
                                  type="radio"
                                  name="approveType"
                                  value="transfer"
                                  checked={approveType === "transfer"}
                                  onChange={() => setApproveType("transfer")}
                                  className="w-4 h-4 text-green-600"
                                />
                                <span className="text-green-700">📤 调拨</span>
                              </label>
                              <label className="flex items-center gap-2 px-4 py-3 border border-red-300 rounded-lg cursor-pointer bg-red-50">
                                <input
                                  type="radio"
                                  name="approveType"
                                  value="destruction"
                                  checked={approveType === "destruction"}
                                  onChange={() => setApproveType("destruction")}
                                  className="w-4 h-4 text-red-600"
                                />
                                <span className="text-red-700">🗑️ 销毁</span>
                              </label>
                            </div>
                          </div>

                          {approveType === "transfer" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                目标门店 <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={targetStoreId || ""}
                                onChange={(e) => setTargetStoreId(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                              >
                                <option value="">请选择目标门店</option>
                                {mockStores
                                  .filter((s) => s.id !== report.storeId)
                                  .map((store) => (
                                    <option key={store.id} value={store.id}>
                                      {store.name} ({store.code})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {approveType === "destruction" && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                销毁数量
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="1"
                                  max={report.reportedQuantity}
                                  defaultValue={report.reportedQuantity}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                                <span className="text-gray-500">{report.batch?.medicine?.unit}</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-2">
                                最大可销毁: {report.reportedQuantity} {report.batch?.medicine?.unit}
                              </div>
                            </div>
                          )}

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              审核备注
                            </label>
                            <textarea
                              value={approveNotes}
                              onChange={(e) => setApproveNotes(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                              placeholder="请输入审核意见..."
                            />
                          </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={handleApprove}
                            disabled={isSubmitting || (approveType === "transfer" && !targetStoreId)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "处理中..." : "✅ 确认通过"}
                          </button>
                          <button
                            onClick={() => setSelectedReport(null)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {report.conflictType === "batch_mismatch" && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">🚫</span>
                        <div>
                          <div className="font-medium text-red-800">批号不一致 - 流程已阻断</div>
                          <div className="text-sm text-red-700 mt-1">{report.conflictNotes}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                        🔄 启动重新盘点流程
                      </button>
                      <Link
                        href={`/reports/${report.id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        📋 查看详情
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {reports.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无待审核记录</h3>
          <p className="text-gray-500">所有近效期药品报告已处理完毕</p>
        </div>
      )}
    </div>
  );
}
