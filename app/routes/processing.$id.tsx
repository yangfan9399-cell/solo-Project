import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useFetcher, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { AppLayout } from "~/components/AppLayout";
import { getRecordDetail, updateRecord, addNodeToRecord, getCurrentUserInfo } from "~/services/dataService";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, NODE_TYPE_MAP, formatDateTime, cn, formatFileSize } from "~/utils/constants";
import type { RecordDetail, NodeDetail } from "~/types";
import { STATUS, NODE_TYPES, EXCEPTION_TYPES, ROLES } from "~/db/schema";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.record) {
    return [{ title: "处理 - 铅封核验系统" }];
  }
  return [{ title: `处理 ${data.record.recordNo} - 铅封核验系统` }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const id = parseInt(params.id || "0");
  const { record, dbMode } = await getRecordDetail(id);

  if (!record) {
    throw new Response("Not Found", { status: 404 });
  }

  const user = await getCurrentUserInfo();

  return json({ record, dbMode, user });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const recordId = parseInt(params.id || "0");
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const { record } = await getRecordDetail(recordId);
  if (!record) return json({ error: "记录不存在" }, { status: 404 });

  if (intent === "accept") {
    const comment = formData.get("comment") as string;
    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.ACCEPT,
      nodeName: "受理登记",
      status: "completed",
      operatorName: "李明",
      comment: comment || "已受理",
      sequence: record.nodes.length + 1,
      isReProcess: false,
    });
    updateRecord(recordId, {
      status: STATUS.PROCESSING,
      currentHandler: "李明",
      currentHandlerName: "李明",
    });
    return json({ success: true });
  }

  if (intent === "supplement") {
    const businessRecord = formData.get("businessRecord") as string;
    const siteDescription = formData.get("siteDescription") as string;
    const comment = formData.get("comment") as string;

    let fullComment = "";
    if (businessRecord) fullComment += `业务记录补充：${businessRecord}\n`;
    if (siteDescription) fullComment += `现场说明：${siteDescription}\n`;
    if (comment) fullComment += `备注：${comment}`;

    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.SUPPLEMENT,
      nodeName: "补充材料",
      status: "completed",
      operatorName: "张伟",
      comment: fullComment,
      sequence: record.nodes.length + 1,
      isReProcess: false,
    });

    if (record.status === STATUS.RETURNED) {
      updateRecord(recordId, {
        status: STATUS.PENDING_REVIEW,
        currentHandler: "王芳",
        currentHandlerName: "王芳",
      });
    }

    return json({ success: true });
  }

  if (intent === "process_complete") {
    const comment = formData.get("comment") as string;
    const basis = formData.get("basis") as string;

    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.PROCESS,
      nodeName: "现场核验",
      status: "completed",
      operatorName: "李明",
      comment,
      basis,
      sequence: record.nodes.length + 1,
      isReProcess: record.exceptionType === EXCEPTION_TYPES.RE_PROCESS,
    });

    updateRecord(recordId, {
      status: STATUS.PENDING_REVIEW,
      currentHandler: "王芳",
      currentHandlerName: "王芳",
      summary: comment?.slice(0, 80) || record.summary,
    });

    return json({ success: true });
  }

  if (intent === "review_approve") {
    const comment = formData.get("comment") as string;
    const conclusion = formData.get("conclusion") as string;
    const basis = formData.get("basis") as string;

    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.REVIEW,
      nodeName: "复核审批",
      status: "completed",
      operatorName: "王芳",
      comment,
      basis,
      sequence: record.nodes.length + 1,
      isReProcess: record.exceptionType === EXCEPTION_TYPES.RE_PROCESS,
    });

    updateRecord(recordId, {
      status: STATUS.REVIEWED,
      conclusion,
      currentHandler: "陈杰",
      currentHandlerName: "陈杰",
    });

    return json({ success: true });
  }

  if (intent === "review_return") {
    const comment = formData.get("comment") as string;
    const blockReason = formData.get("blockReason") as string;
    const remedyPath = formData.get("remedyPath") as string;

    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.RETURN,
      nodeName: "复核退回",
      status: "returned",
      operatorName: "王芳",
      comment,
      sequence: record.nodes.length + 1,
      isReProcess: false,
    });

    updateRecord(recordId, {
      status: STATUS.RETURNED,
      blockReason,
      remedyPath,
      currentHandler: record.applicantName || "张伟",
      currentHandlerName: record.applicantName || "张伟",
    });

    return json({ success: true });
  }

  if (intent === "archive") {
    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.ARCHIVE,
      nodeName: "归档结案",
      status: "completed",
      operatorName: "陈杰",
      comment: "材料齐全，归档保存",
      sequence: record.nodes.length + 1,
      isReProcess: false,
    });

    updateRecord(recordId, {
      status: STATUS.ARCHIVED,
      isArchived: true,
      archivedAt: new Date().toISOString(),
    });

    return json({ success: true });
  }

  if (intent === "reprocess") {
    const lastNode = record.nodes[record.nodes.length - 1];

    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.RE_PROCESS,
      nodeName: "重新处理-启动",
      status: "completed",
      operatorName: "陈杰",
      comment: "档案抽检发现问题，启动重新处理流程",
      basis: "《档案质量抽检办法》第6条",
      isReProcess: true,
      parentNodeId: lastNode?.id,
      sequence: record.nodes.length + 1,
      fieldChanges: {
        status: { before: "archived", after: "processing", label: "状态" },
        isArchived: { before: true, after: false, label: "归档状态" },
      },
      snapshotBefore: { status: "archived", conclusion: record.conclusion },
      snapshotAfter: { status: "processing", conclusion: "原结论撤销，重新核验" },
    });

    updateRecord(recordId, {
      status: STATUS.PROCESSING,
      isArchived: false,
      exceptionType: EXCEPTION_TYPES.RE_PROCESS,
      currentHandler: "李明",
      currentHandlerName: "李明",
      archivedAt: undefined,
    });

    return json({ success: true });
  }

  return json({ error: "未知操作" }, { status: 400 });
}

function TimelineMini({ nodes }: { nodes: NodeDetail[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {nodes.map((node, index) => {
        const typeInfo = NODE_TYPE_MAP[node.nodeType] || { label: node.nodeName, color: "bg-slate-500" };
        const isCompleted = node.status === "completed";
        const isCurrent = index === nodes.length - 1;
        return (
          <div key={node.id} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm border-2",
                isCompleted ? typeInfo.color + " border-transparent text-white" :
                isCurrent ? "border-ocean-500 bg-white text-ocean-500" :
                "border-slate-300 bg-slate-100 text-slate-400"
              )}>
                {isCompleted ? "✓" : isCurrent ? "●" : index + 1}
              </div>
              <span className="text-xs text-slate-600 mt-1 whitespace-nowrap">
                {node.nodeName}
              </span>
            </div>
            {index < nodes.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 -mt-3",
                isCompleted ? "bg-emerald-400" : "bg-slate-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProcessingDetail() {
  const { record, dbMode, user } = useLoaderData<typeof loader>();
  const typedRecord = record as RecordDetail;
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("action");

  const statusInfo = STATUS_MAP[typedRecord.status] || {
    label: typedRecord.status,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  };
  const exceptionInfo = EXCEPTION_TYPE_MAP[typedRecord.exceptionType] || {
    label: typedRecord.exceptionType,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  };

  const isArchived = typedRecord.isArchived;
  const isApplicantAction = typedRecord.status === STATUS.RETURNED;
  const isHandlerAction = typedRecord.status === STATUS.PROCESSING || typedRecord.status === STATUS.PENDING_ACCEPT;
  const isReviewerAction = typedRecord.status === STATUS.PENDING_REVIEW;
  const isArchivistAction = typedRecord.status === STATUS.REVIEWED;

  const [formData, setFormData] = useState({
    comment: "",
    businessRecord: "",
    siteDescription: "",
    conclusion: "",
    basis: "",
    blockReason: "",
    remedyPath: "",
  });

  const handleSubmit = (intent: string) => {
    const form = new FormData();
    form.append("intent", intent);
    form.append("recordId", String(typedRecord.id));
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value);
    });
    fetcher.submit(form, { method: "post" });
  };

  const isSubmitting = fetcher.state === "submitting";

  return (
    <AppLayout
      title={`处理：${typedRecord.recordNo}`}
      subtitle={typedRecord.summary}
      user={user}
      actions={
        <div className="flex items-center gap-2">
          {!dbMode && (
            <span className="badge bg-amber-100 text-amber-700">
              🎯 演示模式
            </span>
          )}
          <Link to={`/records/${typedRecord.id}`} className="btn-secondary">
            📋 查看详情
          </Link>
          {isArchived ? (
            <button
              className="btn-warning"
              onClick={() => handleSubmit("reprocess")}
              disabled={isSubmitting}
            >
              🔄 申请重新处理
            </button>
          ) : (
            <span className={cn("badge", statusInfo.bgColor, statusInfo.color)}>
              {statusInfo.label}
            </span>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">处理进度</h3>
              <span className={cn("badge", exceptionInfo.bgColor, exceptionInfo.color)}>
                {exceptionInfo.label}
              </span>
            </div>
            <TimelineMini nodes={typedRecord.nodes} />
          </div>

          <div className="card">
            <div className="border-b border-slate-200">
              <div className="flex">
                <button
                  className={cn(
                    "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "action"
                      ? "border-ocean-500 text-ocean-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                  onClick={() => setActiveTab("action")}
                >
                  ⚙️ 操作区
                </button>
                <button
                  className={cn(
                    "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === "info"
                      ? "border-ocean-500 text-ocean-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                  onClick={() => setActiveTab("info")}
                >
                  📋 详细信息
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "action" && (
                <div className="space-y-6">
                  {isArchived && (
                    <div className="bg-slate-50 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-3">🔒</div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">已归档（只读）</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        该记录已于 {formatDateTime(typedRecord.archivedAt)} 归档，如需修改请申请重新处理
                      </p>
                      <button
                        className="btn-warning"
                        onClick={() => handleSubmit("reprocess")}
                        disabled={isSubmitting}
                      >
                        🔄 申请重新处理
                      </button>
                    </div>
                  )}

                  {!isArchived && isApplicantAction && (
                    <div className="space-y-5">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-900 mb-2">📌 退回原因</h4>
                        <p className="text-sm text-amber-800 whitespace-pre-line">
                          {typedRecord.blockReason || "记录不完整，需要补充材料"}
                        </p>
                      </div>

                      <div>
                        <label className="label">补充业务记录</label>
                        <textarea
                          className="input min-h-[80px]"
                          placeholder="请补充业务相关记录，如操作日志、系统截图描述等"
                          value={formData.businessRecord}
                          onChange={(e) => setFormData({ ...formData, businessRecord: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="label">现场情况说明</label>
                        <textarea
                          className="input min-h-[80px]"
                          placeholder="请描述现场实际情况、发现过程等"
                          value={formData.siteDescription}
                          onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="label">证据附件</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-ocean-400 transition-colors cursor-pointer">
                          <div className="text-3xl mb-2">📎</div>
                          <p className="text-sm text-slate-600">点击或拖拽上传证据附件</p>
                          <p className="text-xs text-slate-400 mt-1">支持图片、PDF、Excel 等格式</p>
                        </div>
                      </div>

                      <div>
                        <label className="label">补充说明（可选）</label>
                        <textarea
                          className="input min-h-[60px]"
                          placeholder="其他需要说明的内容"
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button className="btn-secondary">取消</button>
                        <button
                          className="btn-primary"
                          onClick={() => handleSubmit("supplement")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "提交中..." : "提交补充材料"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isArchived && typedRecord.status === STATUS.PENDING_ACCEPT && (
                    <div className="space-y-5">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">📥 待受理</h4>
                        <p className="text-sm text-blue-800">
                          新申报的核验记录，确认信息无误后请受理
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-500">集装箱号</span>
                          <p className="font-medium text-slate-900">{typedRecord.containerNo}</p>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">铅封号</span>
                          <p className="font-medium text-slate-900">{typedRecord.sealNo}</p>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">来源</span>
                          <p className="font-medium text-slate-900">{typedRecord.source}</p>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">申请人</span>
                          <p className="font-medium text-slate-900">{typedRecord.applicantName}</p>
                        </div>
                      </div>

                      <div>
                        <label className="label">受理意见</label>
                        <textarea
                          className="input min-h-[80px]"
                          placeholder="请输入受理意见"
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button className="btn-secondary">退回</button>
                        <button
                          className="btn-primary"
                          onClick={() => handleSubmit("accept")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "受理中..." : "确认受理"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isArchived && typedRecord.status === STATUS.PROCESSING && (
                    <div className="space-y-5">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">🔍 现场核验中</h4>
                        <p className="text-sm text-blue-800">
                          请完成现场核验，记录核验结果和依据
                        </p>
                      </div>

                      {typedRecord.blockReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-medium text-red-900 mb-2">🚫 阻断原因</h4>
                          <p className="text-sm text-red-800 whitespace-pre-line">
                            {typedRecord.blockReason}
                          </p>
                        </div>
                      )}

                      {typedRecord.diffFields && Object.keys(typedRecord.diffFields).length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3">⚖️ 差异字段</h4>
                          <div className="space-y-2">
                            {Object.entries(typedRecord.diffFields as Record<string, any>).map(([key, diff]) => (
                              <div key={key} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                                <span className="text-sm text-slate-500 w-28">{diff.label || key}</span>
                                <div className="flex-1 flex items-center gap-3">
                                  <span className="text-sm px-2 py-1 rounded bg-red-100 text-red-700 line-through">
                                    {diff.before ?? "-"}
                                  </span>
                                  <span className="text-slate-400">→</span>
                                  <span className="text-sm px-2 py-1 rounded font-medium bg-emerald-100 text-emerald-700">
                                    {diff.after ?? "-"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="label">核验结果</label>
                        <textarea
                          className="input min-h-[120px]"
                          placeholder="请详细描述现场核验结果、发现的问题等"
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="label">核验依据</label>
                        <textarea
                          className="input min-h-[80px]"
                          placeholder="请列出核验所依据的规范条款、证据材料等"
                          value={formData.basis}
                          onChange={(e) => setFormData({ ...formData, basis: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button className="btn-secondary">暂存</button>
                        <button
                          className="btn-primary"
                          onClick={() => handleSubmit("process_complete")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "提交中..." : "提交复核"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isArchived && isReviewerAction && (
                    <div className="space-y-5">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-900 mb-2">✅ 待复核</h4>
                        <p className="text-sm text-amber-800">
                          请复核核验结果，确认无误后通过，有问题请退回
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">核验结论</h4>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-sm text-slate-700">{typedRecord.conclusion || "暂无结论"}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">核验依据</h4>
                        <p className="text-sm text-slate-600">{typedRecord.basis || "暂无"}</p>
                      </div>

                      <div>
                        <label className="label">复核结论</label>
                        <textarea
                          className="input min-h-[100px]"
                          placeholder="请填写复核结论意见"
                          value={formData.conclusion}
                          onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="label">复核意见</label>
                        <textarea
                          className="input min-h-[80px]"
                          placeholder="请填写复核意见和说明"
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          className="btn-danger"
                          onClick={() => {
                            const reason = prompt("请输入退回原因：");
                            if (reason) {
                              setFormData({ ...formData, blockReason: reason });
                              handleSubmit("review_return");
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          ↩️ 退回补证
                        </button>
                        <button
                          className="btn-success"
                          onClick={() => handleSubmit("review_approve")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "复核中..." : "✓ 复核通过"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isArchived && isArchivistAction && (
                    <div className="space-y-5">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <h4 className="font-medium text-emerald-900 mb-2">📁 待归档</h4>
                        <p className="text-sm text-emerald-800">
                          复核已通过，请确认材料齐全后归档
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">归档材料清单</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-500">✓</span>
                            <span className="text-slate-700">基本信息记录</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-500">✓</span>
                            <span className="text-slate-700">现场核验记录</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-500">✓</span>
                            <span className="text-slate-700">附件材料 ({typedRecord.attachments.length} 个)</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-500">✓</span>
                            <span className="text-slate-700">复核审批记录</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                          className="btn-primary"
                          onClick={() => handleSubmit("archive")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "归档中..." : "📁 确认归档"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "info" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">记录编号</dt>
                      <dd className="text-sm font-medium text-ocean-600">{typedRecord.recordNo}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">来源</dt>
                      <dd className="text-sm font-medium text-slate-900">{typedRecord.source}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">集装箱号</dt>
                      <dd className="text-sm font-medium text-slate-900">{typedRecord.containerNo}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">铅封号</dt>
                      <dd className="text-sm font-medium text-slate-900">{typedRecord.sealNo}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">船名</dt>
                      <dd className="text-sm font-medium text-slate-900">{typedRecord.vesselName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">航次</dt>
                      <dd className="text-sm font-medium text-slate-900">{typedRecord.voyageNo}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">申请人</dt>
                      <dd className="text-sm font-medium text-slate-900">{typedRecord.applicantName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500 mb-1">当前责任人</dt>
                      <dd className="text-sm font-medium text-slate-900">{typedRecord.currentHandlerName}</dd>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-medium text-slate-900 mb-3">附件材料</h4>
                    <div className="space-y-2">
                      {typedRecord.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                        >
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl border border-slate-200">
                            {att.fileType?.startsWith("image") ? "🖼️" : "📄"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{att.fileName}</p>
                            <p className="text-xs text-slate-500">
                              v{att.version} · {formatFileSize(att.fileSize)}
                            </p>
                          </div>
                          <button className="text-ocean-600 text-sm hover:underline">查看</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-medium text-slate-900 mb-3">历史节点</h4>
                    <div className="space-y-3">
                      {typedRecord.nodes.map((node) => {
                        const typeInfo = NODE_TYPE_MAP[node.nodeType] || { label: node.nodeName, color: "bg-slate-500" };
                        return (
                          <div key={node.id} className="flex gap-3">
                            <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", typeInfo.color)} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-900">{node.nodeName}</span>
                                <span className="text-xs text-slate-400">{formatDateTime(node.createdAt)}</span>
                              </div>
                              <p className="text-xs text-slate-500">{node.operatorName}</p>
                              {node.comment && (
                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{node.comment}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">当前状态</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", statusInfo.bgColor)}>
                {typedRecord.status === STATUS.ARCHIVED ? "📁" :
                 typedRecord.status === STATUS.PROCESSING ? "🔄" :
                 typedRecord.status === STATUS.PENDING_REVIEW ? "⏳" :
                 typedRecord.status === STATUS.RETURNED ? "↩️" : "📋"}
              </div>
              <div>
                <p className={cn("font-semibold text-lg", statusInfo.color)}>{statusInfo.label}</p>
                <p className="text-sm text-slate-500">共 {typedRecord.nodes.length} 个节点</p>
              </div>
            </div>

            {typedRecord.currentHandlerName && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-ocean-500 rounded-full flex items-center justify-center text-white font-medium">
                  {typedRecord.currentHandlerName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{typedRecord.currentHandlerName}</p>
                  <p className="text-xs text-slate-500">当前责任人</p>
                </div>
              </div>
            )}
          </div>

          {typedRecord.blockReason && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-3">🚫 阻断原因</h3>
              <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg whitespace-pre-line">
                {typedRecord.blockReason}
              </p>
            </div>
          )}

          {typedRecord.remedyPath && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-3">🛠️ 补救路径</h3>
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg whitespace-pre-line">
                {typedRecord.remedyPath}
              </p>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-3">📊 操作角色</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">申请人</span>
                <span className="font-medium text-slate-900">{typedRecord.applicantName || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">处理人</span>
                <span className="font-medium text-slate-900">{typedRecord.currentHandlerName || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">复核人</span>
                <span className="font-medium text-slate-900">{typedRecord.reviewerName || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">归档人</span>
                <span className="font-medium text-slate-900">
                  {typedRecord.isArchived ? "陈杰" : "待归档"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
