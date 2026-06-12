import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, useParams } from "@remix-run/react";
import { db } from "~/db";
import { complaints, complaintNodes, attachments, users } from "~/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { STATUS_MAP, NODE_TYPE_MAP, EXCEPTION_TYPE_MAP, FIELD_LABEL_MAP, formatDate, formatCurrency, formatNoise } from "~/lib/utils";
import { useState } from "react";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = parseInt(params.id || "0");
  
  const complaint = await db.query.complaints.findFirst({
    where: eq(complaints.id, id),
    with: {
      applicant: true,
      currentHandler: true,
      nodes: {
        orderBy: (nodes, { asc }) => [asc(nodes.sortOrder)],
        with: {
          operator: true,
          attachments: true,
        },
      },
      attachments: {
        orderBy: (attachments, { desc }) => [desc(attachments.uploadedAt)],
      },
    },
  });

  if (!complaint) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ complaint });
}

export default function ComplaintDetail() {
  const { complaint } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "attachments">("info");
  
  const statusInfo = STATUS_MAP[complaint.currentStatus] || { label: complaint.currentStatus, color: "text-gray-700", bgColor: "bg-gray-100" };
  const exceptionInfo = complaint.exceptionType ? EXCEPTION_TYPE_MAP[complaint.exceptionType] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-500 hover:text-slate-700">
            ← 返回列表
          </Link>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-sm text-slate-500">{complaint.caseNo}</span>
        </div>
        <div className="flex gap-2">
          {!complaint.isArchived ? (
            <Link
              to={`/complaints/${complaint.id}/process`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              ✏️ 进入处理台
            </Link>
          ) : (
            <span className="px-4 py-2 bg-slate-200 text-slate-500 rounded-lg text-sm font-medium">
              🔒 已归档（只读）
            </span>
          )}
        </div>
      </div>

      {complaint.hasException && complaint.blockingReason && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
              ⚠️
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-red-800">异常提示</h3>
                {exceptionInfo && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 ${exceptionInfo.color}`}>
                    {exceptionInfo.label}
                  </span>
                )}
              </div>
              <p className="text-red-700 mb-3">
                <strong>阻断原因：</strong>{complaint.blockingReason}
              </p>
              {complaint.remedyPath && (
                <p className="text-orange-700 bg-orange-100/50 rounded-lg p-3 text-sm">
                  <strong>💡 补救路径：</strong>{complaint.remedyPath}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{complaint.title}</h2>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <span className="text-sm text-slate-500">
                  📍 {complaint.location}
                </span>
                <span className="text-sm text-slate-500">
                  📡 {complaint.source}
                </span>
                {complaint.isArchived && (
                  <span className="text-sm text-green-600 font-medium">
                    📦 已归档 · {formatDate(complaint.archivedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex">
            {[
              { key: "info", label: "📋 案件信息" },
              { key: "timeline", label: "⏱️ 历史节点" },
              { key: "attachments", label: "📎 证据附件" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "info" && <InfoTab complaint={complaint} />}
          {activeTab === "timeline" && <TimelineTab nodes={complaint.nodes} />}
          {activeTab === "attachments" && <AttachmentsTab attachments={complaint.attachments} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 处理前后对比</h3>
          <div className="space-y-4">
            <CompareItem
              label="噪声值"
              before={formatNoise(complaint.noiseLevelBefore)}
              after={formatNoise(complaint.noiseLevelAfter)}
              unit="dB"
              isImproved={complaint.noiseLevelBefore && complaint.noiseLevelAfter && Number(complaint.noiseLevelAfter) < Number(complaint.noiseLevelBefore)}
            />
            <CompareItem
              label="整改状态"
              before="待整改"
              after={complaint.noiseLevelAfter ? "已整改" : "待整改"}
              isImproved={!!complaint.noiseLevelAfter}
            />
            <CompareItem
              label="罚款金额"
              before="-"
              after={formatCurrency(complaint.fineAmount)}
              isImproved={!!complaint.fineAmount}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">👥 关键信息</h3>
          <div className="space-y-4">
            <InfoRow label="当前责任人" value={complaint.currentHandler?.name || "-"} highlight />
            <InfoRow label="责任单位" value={complaint.responsibleParty || "-"} />
            <InfoRow label="责任人" value={complaint.responsiblePerson || "-"} />
            <InfoRow label="联系电话" value={complaint.contactPhone || "-"} />
            <InfoRow label="违法类型" value={complaint.violationType || "-"} />
            <InfoRow label="案件申请人" value={complaint.applicant?.name || "-"} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📜 采用依据与结论</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-2">法律依据</h4>
            <div className="bg-slate-50 rounded-lg p-4 text-slate-700">
              {complaint.legalBasis || <span className="text-slate-400 italic">待填写</span>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-2">处理结论</h4>
            <div className="bg-blue-50/50 rounded-lg p-4 text-slate-700">
              {complaint.conclusion || <span className="text-slate-400 italic">待填写</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTab({ complaint }: { complaint: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-medium text-slate-500 mb-3">基本信息</h4>
        <div className="space-y-3">
          <InfoRow label="案件编号" value={complaint.caseNo} />
          <InfoRow label="来源" value={complaint.source} />
          <InfoRow label="地点" value={complaint.location} />
          <InfoRow label="受理时间" value={formatDate(complaint.receivedAt)} />
          <InfoRow label="当前状态" value={STATUS_MAP[complaint.currentStatus]?.label || complaint.currentStatus} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-500 mb-3">案件描述</h4>
        <div className="bg-slate-50 rounded-lg p-4 text-slate-700 text-sm leading-relaxed">
          {complaint.description}
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ nodes }: { nodes: any[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
      <div className="space-y-6">
        {nodes.map((node, index) => {
          const nodeInfo = NODE_TYPE_MAP[node.nodeType] || { label: node.nodeType, icon: "📌" };
          const isBlocking = node.isBlocking;
          
          return (
            <div key={node.id} className="relative pl-10">
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                isBlocking 
                  ? "bg-red-100 border-2 border-red-400" 
                  : "bg-white border-2 border-slate-300"
              }`}>
                {nodeInfo.icon}
              </div>
              <div className={`rounded-lg border p-4 ${
                isBlocking ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{nodeInfo.label}</span>
                    <span className="text-xs text-slate-400">节点 #{node.sortOrder}</span>
                    {isBlocking && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                        阻断
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">{formatDate(node.timestamp)}</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{node.remark}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>操作人：{node.operatorName}</span>
                  <span>角色：{node.operatorRole === "applicant" ? "申请人" : node.operatorRole === "reviewer" ? "复核人" : "归档员"}</span>
                </div>
                {isBlocking && node.blockingReason && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>阻断原因：</strong>{node.blockingReason}
                    </p>
                    {node.remedyPath && (
                      <p className="text-sm text-orange-600 mt-1">
                        <strong>补救路径：</strong>{node.remedyPath}
                      </p>
                    )}
                    {node.diffFields && Array.isArray(node.diffFields) && node.diffFields.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-slate-600">差异字段：</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {node.diffFields.map((field: string) => (
                            <span key={field} className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">
                              {FIELD_LABEL_MAP[field] || field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {node.changes && Object.keys(node.changes).length > 0 && !isBlocking && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-xs font-medium text-slate-600">变更字段：</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.keys(node.changes).map((field) => (
                        <span key={field} className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                          {FIELD_LABEL_MAP[field] || field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttachmentsTab({ attachments }: { attachments: any[] }) {
  const typeIcons: Record<string, string> = {
    photo: "🖼️",
    document: "📄",
    report: "📊",
    audio: "🎵",
    video: "🎬",
  };

  const hasMultipleVersions = attachments.some(a => a.version > 1);

  return (
    <div>
      {hasMultipleVersions && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ 注意：部分附件存在多个版本，请确认使用的版本是否正确
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                {typeIcons[att.type] || "📎"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{att.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">v{att.version}</span>
                  {att.isEvidence && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      att.evidenceConclusion === "支持" 
                        ? "bg-green-100 text-green-600"
                        : att.evidenceConclusion === "不支持"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                    }`}>
                      {att.evidenceConclusion || "待核实"}
                    </span>
                  )}
                </div>
                {att.description && (
                  <p className="text-xs text-slate-500 mt-2">{att.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {attachments.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-3xl mb-2">📎</div>
          暂无附件
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${highlight ? "font-medium text-blue-600" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}

function CompareItem({ label, before, after, unit, isImproved }: {
  label: string;
  before: string;
  after: string;
  unit?: string;
  isImproved?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <span className="text-sm text-slate-600 font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-xs text-slate-400 block">处理前</span>
          <span className="text-lg font-semibold text-slate-500">{before}</span>
        </div>
        <span className={`text-xl ${isImproved ? "text-green-500" : "text-slate-300"}`}>
          →
        </span>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">处理后</span>
          <span className={`text-lg font-semibold ${isImproved ? "text-green-600" : "text-slate-400"}`}>
            {after}
          </span>
        </div>
      </div>
    </div>
  );
}
