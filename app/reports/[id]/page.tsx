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

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reportId = Number(params.id);
  const detail = await getReportDetail(reportId);

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
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
            <StatusBadge status={report.status} />
            {report.conflictType !== "none" && (
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
              <p className="mt-2 text-red-700">{report.conflictNotes}</p>
              <div className="mt-4 flex gap-4">
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                  🔄 启动重新盘点
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 font-medium">
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
              <p className="mt-2 text-orange-700">{report.conflictNotes}</p>
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
              <p className="mt-2 text-yellow-700">{report.conflictNotes}</p>
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
                  {batch?.medicine?.genericName}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">规格</div>
                <div className="text-gray-700 mt-1">
                  {batch?.medicine?.specification}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">生产厂家</div>
                <div className="text-gray-700 mt-1">
                  {batch?.medicine?.manufacturer}
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
                  {formatCurrency(batch?.medicine?.price || 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              🏷️ 批次与效期
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <span className="ml-2 text-sm">
                    (剩余 {daysUntilExpiry} 天)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              🏪 门店与库存
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500">原门店</div>
                <div className="font-medium text-gray-900 mt-1">
                  {store?.name}
                </div>
                <div className="text-sm text-gray-500">{store?.code}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">上报人</div>
                <div className="text-gray-700 mt-1">{reportedBy?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">上报数量</div>
                <div className="text-gray-700 mt-1">
                  {report.reportedQuantity} {batch?.medicine?.unit}
                </div>
                <div className="text-sm text-gray-500">
                  系统库存: {report.inventoryQuantity}
                </div>
              </div>
              {report.suggestedTransferStoreId && (
                <div>
                  <div className="text-sm text-gray-500">建议调拨门店</div>
                  <div className="text-green-700 font-medium mt-1">
                    {suggestedStore?.name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {transferRequest && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📤 调拨信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500">调出门店</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {sourceStore?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">调入门店</div>
                  <div className="font-medium text-green-700 mt-1">
                    {targetStore?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">调拨数量</div>
                  <div className="text-gray-700 mt-1">
                    {transferRequest.quantity} {batch?.medicine?.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <StatusBadge status={transferRequest.status} />
                </div>
              </div>
              {transferRequest.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">调拨说明</div>
                  <div className="text-gray-700 mt-1">{transferRequest.notes}</div>
                </div>
              )}
            </div>
          )}

          {destructionRequest && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🗑️ 销毁信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500">销毁门店</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {store?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">销毁数量</div>
                  <div className="text-gray-700 mt-1">
                    {destructionRequest.quantity} {batch?.medicine?.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">月度限额</div>
                  <div className="text-gray-700 mt-1">
                    {destructionRequest.maxAllowedQuantity}{" "}
                    {batch?.medicine?.unit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">损耗金额</div>
                  <div className="font-bold text-red-600 mt-1">
                    {formatCurrency(destructionRequest.lossAmount || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <StatusBadge status={destructionRequest.status} />
                </div>
              </div>
              {destructionRequest.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">销毁说明</div>
                  <div className="text-gray-700 mt-1">{destructionRequest.notes}</div>
                </div>
              )}
            </div>
          )}

          {evidence && evidence.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📎 采用证据</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {evidence.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="text-2xl mb-2">📄</div>
                    <div className="text-sm font-medium text-gray-900">
                      {ev.fileName}
                    </div>
                    {ev.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {ev.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📜 历史节点</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {historyNodes.map((node: any, index: number) => (
                  <div key={node.id} className="relative pl-12">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center text-lg">
                      {nodeIcons[node.nodeType] || "📌"}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{node.title}</div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(node.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{node.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📋 审核日志</h2>
            <div className="space-y-4">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-700">
                      {log.action.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(log.createdAt)}
                    </div>
                  </div>
                  {log.notes && (
                    <div className="text-sm text-gray-600">{log.notes}</div>
                  )}
                  {log.previousStatus && log.newStatus && (
                    <div className="text-xs text-gray-500 mt-1">
                      {log.previousStatus} → {log.newStatus}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {report.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📝 备注</h2>
              <div className="text-gray-700">{report.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
