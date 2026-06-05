"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { mockDestructionRequests, getStoreById, getBatchById, mockUsers, getExpiryReportDetail } from "@/lib/mockData";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function FinancePage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const destructionRequests = mockDestructionRequests
    .filter((r) => filterStatus === "all" || r.status === filterStatus)
    .map((request) => {
      const report = getExpiryReportDetail(request.reportId);
      return {
        ...request,
        store: getStoreById(request.storeId),
        batch: report?.batch,
        approvedByUser: request.approvedBy ? mockUsers.find((u) => u.id === request.approvedBy) : undefined,
        financeApprovedByUser: request.financeApprovedBy ? mockUsers.find((u) => u.id === request.financeApprovedBy) : undefined,
      };
    });

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedRequest(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const handleReject = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedRequest(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const totalPendingAmount = destructionRequests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + parseFloat(r.lossAmount || "0"), 0);

  const totalApprovedAmount = destructionRequests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + parseFloat(r.lossAmount || "0"), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-purple-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span>复核完成！</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">财务复核</h1>
        <p className="mt-1 text-gray-600">复核销毁申请的损耗金额并归档</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500">待复核申请</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {destructionRequests.filter((r) => r.status === "pending").length}
          </div>
          <div className="mt-2 text-sm text-orange-600">
            待复核金额: {formatCurrency(totalPendingAmount)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500">已复核通过</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {destructionRequests.filter((r) => r.status === "approved").length}
          </div>
          <div className="mt-2 text-sm text-green-600">
            已确认损耗: {formatCurrency(totalApprovedAmount)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-500">总申请数量</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {destructionRequests.length}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            总金额: {formatCurrency(totalPendingAmount + totalApprovedAmount)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">状态筛选:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">全部</option>
              <option value="pending">待复核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {destructionRequests.map((request) => {
          const isSelected = selectedRequest === request.id;

          return (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🗑️</div>
                    <div>
                      <div className="font-bold text-gray-900">
                        销毁申请 #{String(request.id).padStart(4, "0")}
                      </div>
                      <div className="text-sm text-gray-500">
                        关联上报:{" "}
                        <Link
                          href={`/reports/${request.reportId}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          查看上报详情 →
                        </Link>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-gray-500">药品</div>
                    <div className="font-medium text-gray-900">
                      {request.batch?.medicine?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      批号: {request.batch?.batchNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">销毁门店</div>
                    <div className="font-medium text-gray-900">{request.store?.name}</div>
                    <div className="text-sm text-gray-500">{request.store?.code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">销毁数量</div>
                    <div className="font-medium text-gray-900">
                      {request.quantity} {request.batch?.medicine?.unit}
                    </div>
                    {request.quantity > request.maxAllowedQuantity && (
                      <div className="text-sm text-red-500">
                        超限 {request.quantity - request.maxAllowedQuantity}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">损耗金额</div>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(request.lossAmount || 0)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-sm text-gray-500">药师审核人</div>
                    <div className="font-medium text-gray-900">
                      {request.approvedByUser?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">药师审核时间</div>
                    <div className="text-gray-700">
                      {request.approvedAt ? formatDate(request.approvedAt) : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">财务复核人</div>
                    <div className="font-medium text-gray-900">
                      {request.financeApprovedByUser?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">财务复核时间</div>
                    <div className="text-gray-700">
                      {request.financeApprovedAt ? formatDate(request.financeApprovedAt) : "-"}
                    </div>
                  </div>
                </div>

                {request.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">销毁说明</div>
                    <div className="text-sm text-gray-700 mt-1">{request.notes}</div>
                  </div>
                )}

                {request.quantity > request.maxAllowedQuantity && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <div className="font-medium text-orange-800">销毁数量超限提醒</div>
                        <div className="text-sm text-orange-700 mt-1">
                          月度销毁限额为 {request.maxAllowedQuantity}{" "}
                          {request.batch?.medicine?.unit}，申请销毁 {request.quantity}{" "}
                          {request.batch?.medicine?.unit}，超出 {request.quantity - request.maxAllowedQuantity}{" "}
                          {request.batch?.medicine?.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {!isSelected ? (
                      <div className="flex gap-4">
                        <button
                          onClick={() => setSelectedRequest(request.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          💰 复核处理
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-bold text-gray-900 mb-4">财务复核</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="p-4 bg-white rounded-lg border">
                            <div className="text-sm text-gray-500">确认损耗金额</div>
                            <div className="text-2xl font-bold text-red-600 mt-1">
                              {formatCurrency(request.lossAmount || 0)}
                            </div>
                          </div>
                          <div className="p-4 bg-white rounded-lg border">
                            <div className="text-sm text-gray-500">复核状态</div>
                            <div className="flex gap-3 mt-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`review-${request.id}`}
                                  value="approve"
                                  defaultChecked
                                  className="w-4 h-4 text-purple-600"
                                />
                                <span className="text-green-600">✅ 确认无误</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`review-${request.id}`}
                                  value="reject"
                                  className="w-4 h-4 text-purple-600"
                                />
                                <span className="text-red-600">❌ 需要调整</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            复核备注
                          </label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            placeholder="请输入复核意见..."
                          />
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                          >
                            {isSubmitting ? "处理中..." : "✅ 确认复核通过并归档"}
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                          >
                            ❌ 驳回
                          </button>
                          <button
                            onClick={() => setSelectedRequest(null)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {destructionRequests.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无销毁申请</h3>
          <p className="text-gray-500">等待药师审核通过的销毁申请</p>
        </div>
      )}
    </div>
  );
}
