"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";
import { getReportDetail, restartInventory } from "@/lib/actions";
import {
  formatDate,
  formatDateTime,
  getDaysUntilExpiry,
  getDisposalTypeText,
  getCategoryText,
  formatCurrency,
} from "@/lib/utils";

interface Batch {
  id: number;
  medicineId: number;
  batchNumber: string;
  productionDate: string | Date;
  expiryDate: string | Date;
  createdAt: Date;
  medicine?: {
    id: number;
    name: string;
    genericName: string | null;
    specification: string | null;
    manufacturer: string | null;
    category: string;
    unit: string;
    price: string;
  };
}

interface Report {
  id: number;
  reportNumber: string;
  storeId: number;
  reportedBy: number;
  batchId: number;
  reportedQuantity: number;
  inventoryQuantity: number;
  notes: string | null;
  conflictType: string | null;
  conflictNotes: string | null;
  status: string | null;
  disposalType: string | null;
  suggestedTransferStoreId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  region: string;
  manager: string;
  phone: string;
  createdAt: Date;
}

interface User {
  id: number;
  name: string;
  role: string;
  storeId: number | null;
  email: string;
  createdAt: Date;
}

interface TransferRequest {
  id: number;
  reportId: number;
  sourceStoreId: number;
  targetStoreId: number;
  quantity: number;
  approvedBy: number | null;
  approvedAt: Date | null;
  status: string | null;
  notes: string | null;
  evidenceUrls: string[];
  createdAt: Date;
}

interface DestructionRequest {
  id: number;
  reportId: number;
  storeId: number;
  quantity: number;
  maxAllowedQuantity: number;
  approvedBy: number | null;
  financeApprovedBy: number | null;
  approvedAt: Date | null;
  financeApprovedAt: Date | null;
  status: string | null;
  lossAmount: string | null;
  notes: string | null;
  evidenceUrls: string[];
  createdAt: Date;
}

interface HistoryNode {
  id: number;
  reportId: number;
  nodeType: string;
  title: string;
  description: string;
  userId: number;
  quantityChange: number | null;
  createdAt: Date;
}

interface AuditLog {
  id: number;
  reportId: number;
  userId: number;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  notes: string | null;
  createdAt: Date;
}

interface ReportDetail {
  report: Report;
  store?: Store;
  reportedBy?: User;
  batch?: Batch;
  suggestedStore?: Store;
  transferRequest?: TransferRequest;
  destructionRequest?: DestructionRequest;
  evidence: any[];
  historyNodes: HistoryNode[];
  auditLogs: AuditLog[];
  sourceStore?: Store;
  targetStore?: Store;
}

export default function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const reportId = Number(params.id);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartBatchNumber, setRestartBatchNumber] = useState("");
  const [restartQuantity, setRestartQuantity] = useState(0);
  const [restartNotes, setRestartNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [reportId]);

  async function loadData() {
    setLoading(true);
    const data = await getReportDetail(reportId);
    setDetail(data as ReportDetail | null);
    setLoading(false);
  }

  async function handleRestartInventory() {
    if (!restartBatchNumber || restartQuantity <= 0) {
      setError("请填写完整的盘点信息");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await restartInventory({
        reportId,
        restartedBy: 1,
        newBatchNumber: restartBatchNumber,
        newQuantity: restartQuantity,
        notes: restartNotes || undefined,
      });

      if (result.success) {
        setShowSuccess(true);
        setShowRestartModal(false);
        setRestartBatchNumber("");
        setRestartQuantity(0);
        setRestartNotes("");

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

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">加载中...</h2>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">上报记录不存在</h2>
          <Link href="/reports" className="text-blue-600 hover:text-blue-700">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const {
    report,
    store,
    reportedBy,
    batch,
    suggestedStore,
    transferRequest,
    destructionRequest,
    evidence,
    historyNodes,
    auditLogs,
    sourceStore,
    targetStore,
  } = detail;

  const daysUntilExpiry = batch?.expiryDate
    ? getDaysUntilExpiry(batch.expiryDate)
    : 0;

  const nodeIcons: Record<string, string> = {
    report: "📝",
    suggest_transfer: "📤",
    request_destruction: "🗑️",
    blocked: "🚫",
    approved: "✅",
    conflict: "⚡",
    transferred: "🚚",
    destroyed: "🔥",
    archived: "📦",
    approve_transfer: "✅",
    approve_destruction: "✅",
    finance_approve: "💰",
    restart_inventory: "🔄",
    rejected: "❌",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span>重新盘点完成！</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/reports"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← 返回列表
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              上报详情 - {report.reportNumber}
            </h1>
            <p className="mt-1 text-gray-600">
              {batch?.medicine?.name} - {store?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={report.status ?? "pending"} />
            {report.conflictType !== "none" && report.conflictType != null && (
              <ConflictBadge conflictType={report.conflictType} />
            )}
          </div>
        </div>
      </div>

      {report.conflictType === "batch_mismatch" && (
        <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🚫</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800">
                批号不一致 - 流程已阻断
              </h3>
              <p className="mt-2 text-red-700">{report.conflictNotes ?? ""}</p>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => {
                    setRestartBatchNumber(batch?.batchNumber || "");
                    setRestartQuantity(report.reportedQuantity);
                    setShowRestartModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  🔄 启动重新盘点
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors">
                  📋 查看盘点指引
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {report.conflictType === "quantity_exceeded" && (
        <div className="mb-6 p-6 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-800">
                销毁数量超限提醒
              </h3>
              <p className="mt-2 text-orange-700">{report.conflictNotes ?? ""}</p>
            </div>
          </div>
        </div>
      )}

      {report.conflictType === "store_conflict" && (
        <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚡</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-800">
                责任门店冲突
              </h3>
              <p className="mt-2 text-yellow-700">{report.conflictNotes ?? ""}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">💊 药品信息</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500">药品名称</div>
                <div className="font-medium text-gray-900 mt-1">
                  {batch?.medicine?.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">通用名</div>
                <div className="text-gray-700 mt-1">
                  {batch?.medicine?.genericName || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">规格</div>
                <div className="text-gray-700 mt-1">
                  {batch?.medicine?.specification || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">生产厂家</div>
                <div className="text-gray-700 mt-1">
                  {batch?.medicine?.manufacturer || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">药品类别</div>
                <div className="text-gray-700 mt-1">
                  {getCategoryText(batch?.medicine?.category || "")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">单价</div>
                <div className="text-gray-700 mt-1">
                  {formatCurrency(batch?.medicine?.price || "0")}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📦 批次与效期</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500">批号</div>
                <div className="font-medium text-gray-900 mt-1">
                  {batch?.batchNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">生产日期</div>
                <div className="text-gray-700 mt-1">
                  {formatDate(batch?.productionDate || null)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">有效期至</div>
                <div
                  className={`font-medium mt-1 ${
                    daysUntilExpiry <= 30 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatDate(batch?.expiryDate || null)}
                  <span className="text-sm ml-2">
                    {daysUntilExpiry <= 30
                      ? `(${daysUntilExpiry}天后过期)`
                      : `(剩余${daysUntilExpiry}天)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏪 门店与库存</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500">上报门店</div>
                <div className="font-medium text-gray-900 mt-1">{store?.name}</div>
                <div className="text-sm text-gray-500">{store?.code}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">上报人</div>
                <div className="text-gray-700 mt-1">{reportedBy?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">上报数量</div>
                <div className="font-medium text-gray-900 mt-1">
                  {report.reportedQuantity} {batch?.medicine?.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">系统库存</div>
                <div className="text-gray-700 mt-1">
                  {report.inventoryQuantity} {batch?.medicine?.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">建议处置方式</div>
                <div className="text-gray-700 mt-1">
                  {getDisposalTypeText(report.disposalType || "")}
                </div>
              </div>
              {suggestedStore && (
                <div>
                  <div className="text-sm text-gray-500">建议调拨门店</div>
                  <div className="text-gray-700 mt-1">{suggestedStore.name}</div>
                </div>
              )}
            </div>
            {report.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">备注</div>
                <div className="text-gray-700 mt-1">{report.notes}</div>
              </div>
            )}
          </div>

          {transferRequest && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">📤 调拨信息</h2>
                <StatusBadge status={transferRequest.status ?? "pending"} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500">调出门店</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {sourceStore?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">调入门店</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {targetStore?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">调拨数量</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {transferRequest.quantity} {batch?.medicine?.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">审核时间</div>
                  <div className="text-gray-700 mt-1">
                    {formatDate(transferRequest.approvedAt || null)}
                  </div>
                </div>
              </div>
              {transferRequest.notes != null && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">调拨说明</div>
                  <div className="text-gray-700 mt-1">{transferRequest.notes}</div>
                </div>
              )}
            </div>
          )}

          {destructionRequest && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">🗑️ 销毁信息</h2>
                <StatusBadge status={destructionRequest.status ?? "pending"} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500">销毁门店</div>
                  <div className="font-medium text-gray-900 mt-1">{store?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">销毁数量</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {destructionRequest.quantity} {batch?.medicine?.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">月度限额</div>
                  <div className="text-gray-700 mt-1">
                    {destructionRequest.maxAllowedQuantity} {batch?.medicine?.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">损耗金额</div>
                  <div className="font-bold text-red-600 mt-1 text-lg">
                    {formatCurrency(destructionRequest.lossAmount || "0")}
                  </div>
                </div>
              </div>
              {destructionRequest.notes != null && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">销毁说明</div>
                  <div className="text-gray-700 mt-1">{destructionRequest.notes}</div>
                </div>
              )}
              {destructionRequest.quantity > destructionRequest.maxAllowedQuantity && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm text-orange-800 font-medium">
                    ⚠️ 销毁数量超出月度限额
                  </div>
                  <div className="text-sm text-orange-700 mt-1">
                    超出 {destructionRequest.quantity - destructionRequest.maxAllowedQuantity}{" "}
                    {batch?.medicine?.unit}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📷 采用证据</h2>
            {evidence.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📷</div>
                <p>暂无证据上传</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                  >
                    <span className="text-4xl">🖼️</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📜 历史节点</h2>
            <div className="space-y-4">
              {historyNodes.map((node) => (
                <div key={node.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                      {nodeIcons[node.nodeType] || "📋"}
                    </div>
                    {historyNodes.indexOf(node) < historyNodes.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="font-medium text-gray-900">{node.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {node.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {formatDateTime(node.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📋 审核日志</h2>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-700">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  {log.notes && (
                    <div className="text-gray-600 mt-1">{log.notes}</div>
                  )}
                  {log.previousStatus && (
                    <div className="text-gray-500 text-xs mt-1">
                      {log.previousStatus} → {log.newStatus}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showRestartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              🔄 启动重新盘点流程
            </h3>

            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">⚠️ 重新盘点说明</div>
                  <div className="text-yellow-700">
                    请仔细核对药品实际批号和库存数量，确认无误后提交。
                    重新盘点后，流程将解除阻断并返回待审核状态。
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  实际盘点批号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={restartBatchNumber}
                  onChange={(e) => setRestartBatchNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="请输入实际盘点批号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  实际盘点数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={restartQuantity}
                  onChange={(e) => setRestartQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="请输入实际盘点数量"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  盘点备注
                </label>
                <textarea
                  value={restartNotes}
                  onChange={(e) => setRestartNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="请输入盘点备注（可选）"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowRestartModal(false);
                  setRestartBatchNumber("");
                  setRestartQuantity(0);
                  setRestartNotes("");
                  setError("");
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleRestartInventory}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {isSubmitting ? "提交中..." : "✅ 确认重新盘点"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
