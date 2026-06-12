export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetail } from "@/lib/data-service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { FieldDifferences } from "@/components/orders/FieldDifferences";
import { BlockInfo } from "@/components/orders/BlockInfo";
import { formatDate, formatDateShort, formatDecimal, getStatusBgColor } from "@/lib/utils";
import {
  ArrowLeft,
  Eye,
  Settings,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  History,
  User,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "detail" } = await searchParams;
  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  const hasBlock = !!order.blockReason;
  const isArchived = order.isArchived;

  const tabs = [
    { key: "detail", label: "详情信息", icon: Eye },
    { key: "process", label: "处理台", icon: Settings },
    { key: "history", label: "历史节点", icon: History },
    { key: "differences", label: "差异记录", icon: BarChart3 },
    { key: "attachments", label: "证据附件", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
            <StatusBadge status={order.status} />
            <CategoryBadge category={order.sampleCategory} />
            {isArchived && (
              <span className="badge bg-gray-200 text-gray-700">
                只读归档
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            指令编号：{order.orderNo}
          </p>
        </div>
      </div>

      {isArchived && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800">
            该记录已归档，处于只读状态。如需修改，请联系管理员重新处理。
          </span>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.key;
            return (
              <Link
                key={item.key}
                href={{
                  pathname: `/orders/${id}`,
                  query: { tab: item.key },
                }}
                className={`inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {tab === "detail" && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileCheck className="w-5 h-5 mr-2 text-primary-600" />
                基本信息
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label">来源</label>
                  <p className="text-gray-900">
                    {order.source} - {order.sourceDept}
                  </p>
                </div>
                <div>
                  <label className="label">当前责任人</label>
                  <p className="text-gray-900">{order.responsiblePerson}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                关键对象
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="label">水库名称</label>
                  <p className="text-gray-900 font-medium">{order.reservoirName}</p>
                </div>
                <div>
                  <label className="label">闸门编号</label>
                  <p className="text-gray-900 font-medium">{order.gateNo}</p>
                </div>
                <div>
                  <label className="label">责任单位</label>
                  <p className="text-gray-900 font-medium">{order.responsibleUnit}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                处理前后差异
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-4">目标值</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">目标开度</span>
                      <span className="font-medium">{formatDecimal(order.targetOpening)} 米</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">目标流量</span>
                      <span className="font-medium">{formatDecimal(order.targetFlow)} m³/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">计划执行时间</span>
                      <span className="font-medium">{formatDateShort(order.planExecuteTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-4">实际值</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-600">实际开度</span>
                      <span className={`font-medium ${
                        order.targetOpening && order.actualOpening &&
                        Math.abs(Number(order.targetOpening) - Number(order.actualOpening)) > 0.1
                          ? "text-red-600"
                          : "text-blue-700"
                      }`}>
                        {formatDecimal(order.actualOpening)} 米
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">实际流量</span>
                      <span className={`font-medium ${
                        order.targetFlow && order.actualFlow &&
                        Math.abs(Number(order.targetFlow) - Number(order.actualFlow)) > 50
                          ? "text-red-600"
                          : "text-blue-700"
                      }`}>
                        {formatDecimal(order.actualFlow)} m³/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">实际执行时间</span>
                      <span className="font-medium text-blue-700">
                        {formatDateShort(order.actualExecuteTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">涉及金额：</span>
                  <span className="font-medium text-gray-900">
                    ¥{formatDecimal(order.amount)}
                  </span>
                </div>
                {order.reviewTime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">复核时间：</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(order.reviewTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileCheck className="w-5 h-5 mr-2 text-primary-600" />
                采用依据与结论
              </h2>
            </div>
            <div className="card-body">
              <div className="mb-6">
                <label className="label">指令内容</label>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {order.content}
                </p>
              </div>
              {order.conclusion && (
                <div>
                  <label className="label">处理结论</label>
                  <div className={`p-4 rounded-lg ${
                    hasBlock ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"
                  }`}>
                    <p className={hasBlock ? "text-red-800" : "text-green-800"}>
                      {order.conclusion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-primary-600" />
                异常阻断信息
              </h2>
            </div>
            <div className="card-body">
              <BlockInfo
                blockReason={order.blockReason}
                remedyPath={order.remedyPath}
                hasBlock={hasBlock}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                操作人信息
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="label">创建时间</label>
                  <p className="text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <label className="label">最后更新</label>
                  <p className="text-gray-900">{formatDate(order.updatedAt)}</p>
                </div>
                <div>
                  <label className="label">经办人员</label>
                  <p className="text-gray-900">{order.operatorId || "未分配"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "process" && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">处理台</h2>
              <p className="text-sm text-gray-500 mt-1">
                当前状态：{order.status}
              </p>
            </div>
            <div className="card-body">
              {isArchived ? (
                <div className="text-center py-8">
                  <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">该记录已归档，不能进行操作</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {order.status === "PENDING_ACCEPT" && (
                    <form
                      action={`/api/orders/${order.id}/accept`}
                      method="POST"
                      className="p-6 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <h3 className="font-medium text-amber-800 mb-4">受理指令</h3>
                      <p className="text-amber-700 mb-4">
                        确认受理该调度指令并开始处理
                      </p>
                      <button type="submit" className="btn btn-warning">
                        确认受理
                      </button>
                    </form>
                  )}

                  {(order.status === "PROCESSING" || order.status === "REVIEW_REJECTED") && (
                    <div className="space-y-4">
                      <form
                        action={`/api/orders/${order.id}/process`}
                        method="POST"
                        className="p-6 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <h3 className="font-medium text-blue-800 mb-4">更新执行数据</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="label">实际执行时间</label>
                            <input
                              type="datetime-local"
                              name="actualExecuteTime"
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">实际开度（米）</label>
                            <input
                              type="number"
                              name="actualOpening"
                              step="0.1"
                              className="input"
                              placeholder={formatDecimal(order.actualOpening)}
                            />
                          </div>
                          <div>
                            <label className="label">实际流量（m³/s）</label>
                            <input
                              type="number"
                              name="actualFlow"
                              step="10"
                              className="input"
                              placeholder={formatDecimal(order.actualFlow)}
                            />
                          </div>
                          <div>
                            <label className="label">涉及金额（元）</label>
                            <input
                              type="number"
                              name="amount"
                              className="input"
                              placeholder={formatDecimal(order.amount)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">执行说明</label>
                          <textarea
                            name="remark"
                            className="textarea"
                            rows={3}
                            placeholder="请输入现场执行说明..."
                          />
                        </div>
                        <button type="submit" className="btn btn-primary mt-4">
                          保存执行数据
                        </button>
                      </form>

                      <form
                        action={`/api/orders/${order.id}/supplement`}
                        method="POST"
                        className="p-6 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <h3 className="font-medium text-purple-800 mb-4">补充业务材料</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="label">业务记录</label>
                            <textarea
                              name="businessRecord"
                              className="textarea"
                              rows={3}
                              placeholder="请输入业务记录详情..."
                              required
                            />
                          </div>
                          <div>
                            <label className="label">现场说明</label>
                            <textarea
                              name="siteDescription"
                              className="textarea"
                              rows={3}
                              placeholder="请输入现场情况说明..."
                              required
                            />
                          </div>
                          <div>
                            <label className="label">备注</label>
                            <textarea
                              name="remark"
                              className="textarea"
                              rows={2}
                              placeholder="其他需要说明的情况..."
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-secondary mt-4">
                          提交补充材料
                        </button>
                      </form>

                      {order.status === "PROCESSING" && (
                        <form
                          action={`/api/orders/${order.id}/submit-review`}
                          method="POST"
                          className="p-6 bg-indigo-50 rounded-lg border border-indigo-200"
                        >
                          <h3 className="font-medium text-indigo-800 mb-4">提交复核</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="label">处理结论</label>
                              <textarea
                                name="conclusion"
                                className="textarea"
                                rows={3}
                                placeholder="请输入处理结论..."
                                required
                              />
                            </div>
                            <div>
                              <label className="label">采用依据</label>
                              <textarea
                                name="evidenceBasis"
                                className="textarea"
                                rows={3}
                                placeholder="请说明采用的依据，如规范、图纸、现场证据等..."
                                required
                              />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary mt-4">
                            提交复核
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {order.status === "PENDING_REVIEW" && (
                    <div className="space-y-4">
                      <form
                        action={`/api/orders/${order.id}/review`}
                        method="POST"
                        className="p-6 bg-green-50 rounded-lg border border-green-200"
                      >
                        <h3 className="font-medium text-green-800 mb-4">复核通过</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="label">复核结论</label>
                            <textarea
                              name="conclusion"
                              className="textarea"
                              rows={3}
                              placeholder="请输入复核通过的结论..."
                              required
                            />
                          </div>
                          <div>
                            <label className="label">复核意见</label>
                            <textarea
                              name="opinion"
                              className="textarea"
                              rows={2}
                              placeholder="请输入复核意见..."
                            />
                          </div>
                        </div>
                        <input
                          type="hidden"
                          name="isApproved"
                          value="true"
                        />
                        <button type="submit" className="btn btn-success mt-4">
                          确认通过
                        </button>
                      </form>

                      <form
                        action={`/api/orders/${order.id}/review`}
                        method="POST"
                        className="p-6 bg-red-50 rounded-lg border border-red-200"
                      >
                        <h3 className="font-medium text-red-800 mb-4">复核退回</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="label">复核结论</label>
                            <textarea
                              name="conclusion"
                              className="textarea"
                              rows={2}
                              placeholder="请输入复核退回的结论..."
                              required
                            />
                          </div>
                          <div>
                            <label className="label">复核意见</label>
                            <textarea
                              name="opinion"
                              className="textarea"
                              rows={2}
                              placeholder="请输入复核意见..."
                            />
                          </div>
                          <div>
                            <label className="label">阻断原因</label>
                            <textarea
                              name="blockReason"
                              className="textarea"
                              rows={2}
                              placeholder="请详细说明阻断原因..."
                              required
                            />
                          </div>
                          <div>
                            <label className="label">补救路径</label>
                            <textarea
                              name="remedyPath"
                              className="textarea"
                              rows={3}
                              placeholder="请说明需要补充或整改的具体步骤..."
                              required
                            />
                          </div>
                        </div>
                        <input
                          type="hidden"
                          name="isApproved"
                          value="false"
                        />
                        <button type="submit" className="btn btn-danger mt-4">
                          确认退回
                        </button>
                      </form>
                    </div>
                  )}

                  {order.status === "REVIEW_APPROVED" && (
                    <form
                      action={`/api/orders/${order.id}/archive`}
                      method="POST"
                      className="p-6 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h3 className="font-medium text-gray-800 mb-4">归档处理</h3>
                      <p className="text-gray-600 mb-4">
                        复核已通过，确认将该记录归档。归档后记录将变为只读状态。
                      </p>
                      <button type="submit" className="btn btn-secondary">
                        确认归档
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <History className="w-5 h-5 mr-2 text-primary-600" />
              所有历史节点
            </h2>
          </div>
          <div className="card-body">
            <OrderTimeline nodes={order.nodes} />
          </div>
        </div>
      )}

      {tab === "differences" && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
              字段差异记录
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {order.differences.length} 条变更记录
            </p>
          </div>
          <div className="card-body">
            <FieldDifferences differences={order.differences} />
          </div>
        </div>
      )}

      {tab === "attachments" && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary-600" />
              证据附件
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {order.attachments.length} 个附件
            </p>
          </div>
          <div className="card-body">
            {order.attachments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无附件
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center p-4 bg-gray-50 rounded-lg border"
                  >
                    <FileText className="w-8 h-8 text-gray-400 mr-3" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {att.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {att.type} · {(att.size / 1024).toFixed(1)} KB ·{" "}
                        {formatDate(att.uploadedAt)}
                      </p>
                      {att.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {att.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
