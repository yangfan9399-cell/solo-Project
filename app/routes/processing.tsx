import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { AppLayout } from "~/components/AppLayout";
import { getRecords, getRecordDetail, updateRecord, addNodeToRecord, getCurrentUserInfo } from "~/services/dataService";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, formatDateTime, cn } from "~/utils/constants";
import type { RecordSummary, RecordDetail } from "~/types";
import { STATUS, NODE_TYPES, EXCEPTION_TYPES } from "~/db/schema";

export const meta: MetaFunction = () => {
  return [{ title: "处理台 - 铅封核验系统" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "processing";
  
  const { records, dbMode } = await getRecords({ 
    status: status === "all" ? undefined : status 
  });
  const filteredRecords = records.filter(r => !r.isArchived);
  const user = await getCurrentUserInfo();
  
  return json({ records: filteredRecords, currentStatus: status, dbMode, user });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const recordId = parseInt(formData.get("recordId") as string);
  
  if (intent === "supplement") {
    const comment = formData.get("comment") as string;
    const record = (await getRecordDetail(recordId)).record;
    if (!record) return json({ error: "记录不存在" }, { status: 404 });
    
    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.SUPPLEMENT,
      nodeName: "补充材料",
      status: "completed",
      operatorName: "张伟",
      comment,
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
  
  if (intent === "review_approve") {
    const comment = formData.get("comment") as string;
    const conclusion = formData.get("conclusion") as string;
    const record = (await getRecordDetail(recordId)).record;
    if (!record) return json({ error: "记录不存在" }, { status: 404 });
    
    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.REVIEW,
      nodeName: "复核审批",
      status: "completed",
      operatorName: "王芳",
      comment,
      basis: record.basis,
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
    const record = (await getRecordDetail(recordId)).record;
    if (!record) return json({ error: "记录不存在" }, { status: 404 });
    
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
    const record = (await getRecordDetail(recordId)).record;
    if (!record) return json({ error: "记录不存在" }, { status: 404 });
    
    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.ARCHIVE,
      nodeName: "归档结案",
      status: "completed",
      operatorName: "陈杰",
      comment: "复核通过，材料齐全，予以归档",
      sequence: record.nodes.length + 1,
      isReProcess: false,
    });
    
    updateRecord(recordId, {
      status: STATUS.ARCHIVED,
      isArchived: true,
      archivedAt: new Date().toISOString(),
      currentHandler: "陈杰",
      currentHandlerName: "陈杰",
    });
    
    return redirect("/processing");
  }
  
  if (intent === "reprocess") {
    const record = (await getRecordDetail(recordId)).record;
    if (!record) return json({ error: "记录不存在" }, { status: 404 });
    
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
  
  if (intent === "process_complete") {
    const comment = formData.get("comment") as string;
    const record = (await getRecordDetail(recordId)).record;
    if (!record) return json({ error: "记录不存在" }, { status: 404 });
    
    addNodeToRecord(recordId, {
      recordId,
      nodeType: NODE_TYPES.PROCESS,
      nodeName: "现场核验",
      status: "completed",
      operatorName: "李明",
      comment,
      sequence: record.nodes.length + 1,
      isReProcess: record.exceptionType === EXCEPTION_TYPES.RE_PROCESS,
    });
    
    updateRecord(recordId, {
      status: STATUS.PENDING_REVIEW,
      currentHandler: "王芳",
      currentHandlerName: "王芳",
      summary: comment?.slice(0, 50) + "..." || record.summary,
    });
    
    return json({ success: true });
  }

  if (intent === "accept") {
    const comment = formData.get("comment") as string;
    const record = (await getRecordDetail(recordId)).record;
    if (!record) return json({ error: "记录不存在" }, { status: 404 });
    
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
  
  return json({ error: "未知操作" }, { status: 400 });
}

function ProcessingCard({ record }: { record: RecordSummary }) {
  const statusInfo = STATUS_MAP[record.status] || { label: record.status, color: "text-slate-600", bgColor: "bg-slate-100" };
  const exceptionInfo = EXCEPTION_TYPE_MAP[record.exceptionType] || { label: record.exceptionType, color: "text-slate-600", bgColor: "bg-slate-100" };
  
  return (
    <Link
      to={`/processing/${record.id}`}
      className="card p-4 hover:shadow-md transition-all hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-900 group-hover:text-ocean-600 transition-colors">
            {record.recordNo}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">{record.containerNo}</p>
        </div>
        <span className={cn("badge", statusInfo.bgColor, statusInfo.color)}>
          {statusInfo.label}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">🔒</span>
          <span className="text-slate-600">{record.sealNo}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">🚢</span>
          <span className="text-slate-600">{record.vesselName} / {record.voyageNo}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">👤</span>
          <span className="text-slate-600">{record.currentHandler}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className={cn("badge text-xs", exceptionInfo.bgColor, exceptionInfo.color)}>
          {exceptionInfo.label}
        </span>
        <span className="text-xs text-slate-400">
          {formatDateTime(record.updatedAt)}
        </span>
      </div>
    </Link>
  );
}

export default function Processing() {
  const { records, currentStatus, dbMode, user } = useLoaderData<typeof loader>();
  const typedRecords = records as RecordSummary[];
  
  const tabs = [
    { value: "all", label: "全部待办" },
    { value: STATUS.PENDING_ACCEPT, label: "待受理" },
    { value: STATUS.PROCESSING, label: "处理中" },
    { value: STATUS.PENDING_REVIEW, label: "待复核" },
    { value: STATUS.RETURNED, label: "已退回" },
  ];

  return (
    <AppLayout
      title="处理台"
      subtitle={`共 ${typedRecords.length} 条待处理记录`}
      user={user}
      actions={
        <>
          {!dbMode && (
            <span className="badge bg-amber-100 text-amber-700">
              演示模式（使用 Mock 数据）
            </span>
          )}
          <button className="btn-primary">
            <span className="mr-2">＋</span>新建核验
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="card p-2">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                to={`/processing?status=${tab.value}`}
                className={cn(
                  "px-4 py-2 text-sm rounded-lg transition-colors",
                  currentStatus === tab.value
                    ? "bg-ocean-100 text-ocean-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {typedRecords.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-slate-500">当前分类下暂无待处理记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typedRecords.map((record) => (
              <ProcessingCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
