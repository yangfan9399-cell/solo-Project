"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";
import {
  formatDate,
  getDisposalTypeText,
  getDaysUntilExpiry,
} from "@/lib/utils";
import {
  getPendingPharmacistReviews,
  getStores,
  approveTransfer,
  approveDestruction,
  rejectReport,
  restartInventory,
  type Store,
} from "@/lib/actions";

interface Batch {
  id: number;
  medicineId: number;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  medicine?: {
    id: number;
    name: string;
    genericName: string;
    specification: string;
    manufacturer: string;
    category: string;
    unit: string;
    price: string;
  };
}

interface ReportItem {
  report: {
    id: number;
    reportNumber: string;
    storeId: number;
    reportedBy: number;
    batchId: number;
    reportedQuantity: number;
    inventoryQuantity: number;
    notes?: string;
    conflictType: string;
    conflictNotes?: string;
    status: string;
    disposalType: string;
    suggestedTransferStoreId?: number;
    createdAt: string;
    updatedAt: string;
  };
  store?: Store;
  batch?: Batch;
}

export default function PharmacistPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveType, setApproveType] = useState<"transfer" | "destruction">("transfer");
  const [targetStoreId, setTargetStoreId] = useState<number | null>(null);
  const [destructionQuantity, setDestructionQuantity] = useState<number>(0);
  const [approveNotes, setApproveNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartBatchNumber, setRestartBatchNumber] = useState("");
  const [restartQuantity, setRestartQuantity] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [reportsData, storesData] = await Promise.all([
      getPendingPharmacistReviews(),
      getStores(),
    ]);
    setReports(reportsData as ReportItem[]);
    setStores(storesData);
  }

  const filteredReports = reports.filter(
    (r) =>
      filterType === "all" ||
      r.report.conflictType === filterType ||
      (filterType === "no_conflict" && r.report.conflictType === "none")
  );

  async function handleApprove() {
    if (!selectedReport) return;
    setIsSubmitting(true);
    setError("");

    try {
      const report = reports.find((r) => r.report.id === selectedReport);
      if (!report) return;

      let result;
      if (approveType === "transfer") {
        if (!targetStoreId) {
          setError("请选择目标门店");
          setIsSubmitting(false);
          return;
        }
        result = await approveTransfer({
          reportId: selectedReport,
          approvedBy: 4,
          targetStoreId,
          quantity: report.report.reportedQuantity,
          notes: approveNotes,
        });
      } else {
        const lossAmount = (
          destructionQuantity * parseFloat(report.batch?.medicine?.price || "0")
        ).toFixed(2);
        result = await approveDestruction({
          reportId: selectedReport,
          approvedBy: 4,
          quantity: destructionQuantity,
          maxAllowedQuantity: 20,
          lossAmount,
          notes: approveNotes,
        });
      }

      if (result.success) {
        setIsSubmitting(false);
        setShowSuccess(true);
        setSelectedReport(null);
        setTimeout(() => {
          setShowSuccess(false);
          loadData();
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || "操作失败");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("操作失败，请重试");
      setIsSubmitting(false);
    }
  }

  async function handleReject(reportId: number) {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await rejectReport({
        reportId,
        rejectedBy: 4,
        reason: approveNotes || "审核驳回",
      });
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          loadData();
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败，请重试");
    }
    setIsSubmitting(false);
  }

  async function handleRestartInventory() {
    if (!selectedReport) return;
    setIsSubmitting(true);
    setError("");
    try {
      const result = await restartInventory({
        reportId: selectedReport,
        restartedBy: 4,
        newBatchNumber: restartBatchNumber,
        newQuantity: restartQuantity,
        notes: approveNotes,
      });
      if (result.success) {
        setShowRestartModal(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          loadData();
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || "操作失败");
      }
    } catch (err) {
      setError("操作失败，请重试");
    }
    setIsSubmitting(false);
  }

  function openRestartModal(reportId: number) {
    const report = reports.find((r) => r.report.id === reportId);
    if (report) {
      setSelectedReport(reportId);
      setRestartBatchNumber(report.batch?.batchNumber || "");
      setRestartQuantity(report.report.reportedQuantity);
      setShowRestartModal(true);
    }
  }

  function openApproveModal(reportId: number) {
    const report = reports.find((r) => r.report.id === reportId);
    if (report) {
      setSelectedReport(reportId);
      setApproveType(
        report.report.disposalType === "transfer" ? "transfer" : "destruction"
      );
      setTargetStoreId(report.report.suggestedTransferStoreId || null);
      setDestructionQuantity(report.report.reportedQuantity);
      setApproveNotes("");
      setShowApproveModal(true);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span>操作成功！</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
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
            共{" "}
            <span className="font-medium text-gray-900">
              {filteredReports.length}
            </span>{" "}
            条待审核记录
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReports.map((item) => {
          const { report, store, batch } = item;
          const daysUntilExpiry = batch?.expiryDate
            ? getDaysUntilExpiry(batch.expiryDate)
            : 0;

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
                      {report.conflictType !== "none" && (
                        <ConflictBadge conflictType={report.conflictType} />
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-gray-500">药品</div>
                        <div className="font-medium text-gray-900">
                          {batch?.medicine?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          批号: {batch?.batchNumber}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">上报门店</div>
                        <div className="font-medium text-gray-900">
                          {store?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          经办人: 门店经办人
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">数量</div>
                        <div className="font-medium text-gray-900">
                          {report.reportedQuantity} {batch?.medicine?.unit}
                        </div>
                        <div
                          className={`text-sm ${daysUntilExpiry <= 30 ? "text-red-500" : "text-gray-500"}`}
                        >
                          效期: {formatDate(batch?.expiryDate || null)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">建议处置方式</div>
                        <div className="font-medium text-gray-900">
                          {getDisposalTypeText(report.disposalType)}
                        </div>
                        {report.suggestedTransferStoreId && (
                          <div className="text-sm text-green-600">
                            建议调拨至:{" "}
                            {stores.find(
                              (s) => s.id === report.suggestedTransferStoreId
                            )?.name}
                          </div>
                        )}
                      </div>
                    </div>
                    {report.conflictType !== "none" && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm font-medium text-red-800">
                          冲突说明
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          {report.conflictNotes}
                        </div>
                      </div>
                    )}
                    {report.notes && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-500">备注说明</div>
                        <div className="text-sm text-gray-700 mt-1">
                          {report.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {report.conflictType !== "batch_mismatch" && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex gap-4">
                      <button
                        onClick={() => openApproveModal(report.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        ✅ 审核处理
                      </button>
                      <button
                        onClick={() => handleReject(report.id)}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
                      >
                        ❌ 驳回
                      </button>
                    </div>
                  </div>
                )}

                {report.conflictType === "batch_mismatch" && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">🚫</span>
                        <div>
                          <div className="font-medium text-red-800">
                            批号不一致 - 流程已阻断
                          </div>
                          <div className="text-sm text-red-700 mt-1">
                            {report.conflictNotes}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => openRestartModal(report.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
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

      {filteredReports.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无待审核记录</h3>
          <p className="text-gray-500">所有近效期药品报告已处理完毕</p>
        </div>
      )}

      {showApproveModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">审核处理</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
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
                      {stores
                        .filter(
                          (s) =>
                            s.id !==
                            reports.find((r) => r.report.id === selectedReport)
                              ?.store?.id
                        )
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
                        max={
                          reports.find((r) => r.report.id === selectedReport)
                            ?.report.reportedQuantity || 0
                        }
                        value={destructionQuantity}
                        onChange={(e) =>
                          setDestructionQuantity(Number(e.target.value))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <span className="text-gray-500">
                        {
                          reports.find((r) => r.report.id === selectedReport)
                            ?.batch?.medicine?.unit
                        }
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      最大可销毁:{" "}
                      {
                        reports.find((r) => r.report.id === selectedReport)
                          ?.report.reportedQuantity
                      }{" "}
                      {
                        reports.find((r) => r.report.id === selectedReport)
                          ?.batch?.medicine?.unit
                      }
                    </div>
                    <div className="text-sm text-blue-600 mt-2">
                      预计损耗金额: ¥
                      {(
                        destructionQuantity *
                        parseFloat(
                          reports.find((r) => r.report.id === selectedReport)
                            ?.batch?.medicine?.price || "0"
                        )
                      ).toFixed(2)}
                    </div>
                  </div>
                )}

                <div>
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
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedReport(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                disabled={
                  isSubmitting ||
                  (approveType === "transfer" && !targetStoreId)
                }
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "处理中..." : "✅ 确认通过"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">重新盘点</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    请输入重新盘点后的正确批号和数量，系统将解除阻断状态并重新进入审核流程。
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新批号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={restartBatchNumber}
                    onChange={(e) => setRestartBatchNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入正确的批号"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    实际数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restartQuantity}
                    onChange={(e) => setRestartQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入实际盘点数量"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    盘点说明
                  </label>
                  <textarea
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="请输入盘点说明..."
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowRestartModal(false);
                  setSelectedReport(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleRestartInventory}
                disabled={isSubmitting || !restartBatchNumber || !restartQuantity}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "处理中..." : "🔄 确认重新盘点"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
