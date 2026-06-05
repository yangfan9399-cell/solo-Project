import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConflictBadge from "@/components/ConflictBadge";
import {
  getExpiryReportDetail,
  getTransferRequestsByReportId,
  getDestructionRequestsByReportId,
  getAuditLogsByReportId,
  getEvidenceByReportId,
  getHistoryNodesByReportId,
} from "@/lib/mockData";
import {
  formatDate,
  formatDateTime,
  getDaysUntilExpiry,
  getDisposalTypeText,
  getCategoryText,
  formatCurrency,
} from "@/lib/utils";

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const reportId = Number(params.id);
  const report = getExpiryReportDetail(reportId);
  const transfers = getTransferRequestsByReportId(reportId);
  const destructions = getDestructionRequestsByReportId(reportId);
  const auditLogs = getAuditLogsByReportId(reportId);
  const evidence = getEvidenceByReportId(reportId);
  const historyNodes = getHistoryNodesByReportId(reportId);

  if (!report) {
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

  const daysUntilExpiry = report.batch?.expiryDate ? getDaysUntilExpiry(report.batch.expiryDate) : 0;

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
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/reports" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← 返回列表
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">上报详情 - {report.reportNumber}</h1>
            <p className="mt-1 text-gray-600">
              {report.batch?.medicine?.name} - {report.store?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />
            {report.conflictType !== "none" && <ConflictBadge conflictType={report.conflictType} />}
          </div>
        </div>
      </div>

      {report.conflictType === "batch_mismatch" && (
        <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🚫</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800">批号不一致 - 流程已阻断</h3>
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
              <h3 className="text-lg font-bold text-orange-800">销毁数量超限</h3>
              <p className="mt-2 text-orange-700">{report.conflictNotes}</p>
            </div>
          </div>
        </div>
      )}

      {report.conflictType === "store_conflict" && (
        <div className="mb-6 p-6 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚡</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-purple-800">责任门店冲突</h3>
              <p className="mt-2 text-purple-700">{report.conflictNotes}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">💊 药品信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">药品名称</div>
                <div className="mt-1 font-medium text-gray-900">{report.batch?.medicine?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">通用名</div>
                <div className="mt-1 text-gray-700">{report.batch?.medicine?.genericName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">药品类别</div>
                <div className="mt-1 text-gray-700">{getCategoryText(report.batch?.medicine?.category || "")}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">规格</div>
                <div className="mt-1 text-gray-700">{report.batch?.medicine?.specification}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">生产厂家</div>
                <div className="mt-1 text-gray-700">{report.batch?.medicine?.manufacturer}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">单价</div>
                <div className="mt-1 font-medium text-gray-900">{formatCurrency(report.batch?.medicine?.price || 0)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏷️ 批次与效期</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">批号</div>
                <div className="mt-1 font-mono font-medium text-gray-900">{report.batch?.batchNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">生产日期</div>
                <div className="mt-1 text-gray-700">{formatDate(report.batch?.productionDate || null)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500">有效期至</div>
                <div className={`mt-1 text-lg font-bold ${daysUntilExpiry <= 30 ? "text-red-600" : "text-gray-900"}`}>
                  {formatDate(report.batch?.expiryDate || null)}
                  <span className="ml-3 text-sm font-normal">
                    (还有 <span className={daysUntilExpiry <= 30 ? "text-red-600" : ""}>{daysUntilExpiry}</span> 天过期)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏪 门店与库存</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">原门店</div>
                <div className="mt-1 font-medium text-gray-900">{report.store?.name}</div>
                <div className="text-sm text-gray-500">{report.store?.code}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">上报人</div>
                <div className="mt-1 text-gray-700">{report.reportedByUser?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">上报数量</div>
                <div className="mt-1 text-xl font-bold text-gray-900">
                  {report.reportedQuantity} {report.batch?.medicine?.unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">系统库存</div>
                <div className="mt-1 text-gray-700">
                  {report.inventoryQuantity} {report.batch?.medicine?.unit}
                  {report.reportedQuantity !== report.inventoryQuantity && (
                    <span className="ml-2 text-red-500 text-sm">(不一致)</span>
                  )}
                </div>
              </div>
              {report.suggestedTransferStore && (
                <div>
                  <div className="text-sm text-gray-500">建议调拨目标门店</div>
                  <div className="mt-1 text-green-700 font-medium">
                    📤 {report.suggestedTransferStore.name}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">建议处置方式</div>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.disposalType === "transfer" ? "bg-green-100 text-green-800" :
                    report.disposalType === "destruction" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {getDisposalTypeText(report.disposalType)}
                  </span>
                </div>
              </div>
            </div>
            {report.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">备注说明</div>
                <div className="mt-1 text-gray-700">{report.notes}</div>
              </div>
            )}
          </div>

          {transfers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📤 调拨信息</h2>
              {transfers.map((transfer) => (
                <div key={transfer.id} className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-500">调出门店</div>
                      <div className="mt-1 font-medium text-gray-900">{transfer.sourceStore?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">调入门店</div>
                      <div className="mt-1 font-medium text-gray-900">{transfer.targetStore?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">调拨数量</div>
                      <div className="mt-1 text-xl font-bold text-green-600">
                        {transfer.quantity} {report.batch?.medicine?.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">状态</div>
                      <div className="mt-1">
                        <StatusBadge status={transfer.status} />
                      </div>
                    </div>
                  </div>
                  {transfer.notes && (
                    <div>
                      <div className="text-sm text-gray-500">备注</div>
                      <div className="mt-1 text-gray-700">{transfer.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {destructions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🗑️ 销毁信息</h2>
              {destructions.map((destruction) => (
                <div key={destruction.id} className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-500">销毁门店</div>
                      <div className="mt-1 font-medium text-gray-900">{destruction.store?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">状态</div>
                      <div className="mt-1">
                        <StatusBadge status={destruction.status} />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">申请销毁数量</div>
                      <div className="mt-1 text-xl font-bold text-red-600">
                        {destruction.quantity} {report.batch?.medicine?.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">最大允许销毁数量</div>
                      <div className="mt-1 text-gray-700">
                        {destruction.maxAllowedQuantity} {report.batch?.medicine?.unit}
                        {destruction.quantity > destruction.maxAllowedQuantity && (
                          <span className="ml-2 text-red-500 text-sm">(超限)</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">损耗金额</div>
                      <div className="mt-1 text-lg font-bold text-red-600">
                        {formatCurrency(destruction.lossAmount || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">药师审核</div>
                      <div className="mt-1 text-gray-700">
                        {destruction.approvedByUser?.name || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">财务复核</div>
                      <div className="mt-1 text-gray-700">
                        {destruction.financeApprovedByUser?.name || "-"}
                      </div>
                    </div>
                  </div>
                  {destruction.notes && (
                    <div>
                      <div className="text-sm text-gray-500">备注</div>
                      <div className="mt-1 text-gray-700">{destruction.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {evidence.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📎 采用证据</h2>
              <div className="space-y-3">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {item.fileType.startsWith("image") ? "🖼️" : "📄"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.fileName}</div>
                        <div className="text-sm text-gray-500">
                          上传人: {item.uploadedByUser?.name} · {formatDateTime(item.createdAt)}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                        )}
                      </div>
                    </div>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      查看
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📜 历史节点</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {historyNodes.map((node, index) => (
                  <div key={node.id} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                      <span className="text-sm">{nodeIcons[node.nodeType] || "📌"}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{node.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{node.description}</div>
                      {node.quantityChange && (
                        <div className="text-sm text-blue-600 mt-1">
                          数量变化: {node.quantityChange}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        {node.user?.name} · {formatDateTime(node.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📋 审核日志</h2>
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-700 text-sm">{log.action}</div>
                    <div className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</div>
                  </div>
                  {log.notes && (
                    <div className="text-sm text-gray-500 mt-1">{log.notes}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">操作人: {log.user?.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
