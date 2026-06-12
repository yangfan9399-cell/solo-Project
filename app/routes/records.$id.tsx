import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AppLayout } from "~/components/AppLayout";
import { getRecordDetail, getCurrentUserInfo } from "~/services/dataService";
import { STATUS_MAP, EXCEPTION_TYPE_MAP, NODE_TYPE_MAP, formatDateTime, cn, formatFileSize } from "~/utils/constants";
import type { RecordDetail, NodeDetail } from "~/types";
import { STATUS, NODE_TYPES, EXCEPTION_TYPES } from "~/db/schema";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.record) {
    return [{ title: "记录不存在 - 铅封核验系统" }];
  }
  return [{ title: `${data.record.recordNo} - 核验详情` }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const id = parseInt(params.id || "0");
  const { record } = await getRecordDetail(id);
  const user = await getCurrentUserInfo();

  if (!record) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ record, user });
}

function Section({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-slate-500 mb-1">{label}</dt>
      <dd className={cn("text-sm font-medium", highlight ? "text-ocean-600" : "text-slate-900")}>
        {value || "-"}
      </dd>
    </div>
  );
}

function DiffField({ label, before, after, isDiff }: { label: string; before: any; after: any; isDiff?: boolean }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
      <span className="text-sm text-slate-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-3">
        <span className={cn(
          "text-sm px-2 py-1 rounded",
          isDiff ? "bg-red-100 text-red-700 line-through" : "text-slate-600"
        )}>
          {before ?? "-"}
        </span>
        <span className="text-slate-400">→</span>
        <span className={cn(
          "text-sm px-2 py-1 rounded font-medium",
          isDiff ? "bg-emerald-100 text-emerald-700" : "text-slate-600"
        )}>
          {after ?? "-"}
        </span>
      </div>
    </div>
  );
}

function TimelineNode({ node, isFirst, isLast }: { node: NodeDetail; isFirst: boolean; isLast: boolean }) {
  const typeInfo = NODE_TYPE_MAP[node.nodeType] || {
    label: node.nodeName,
    color: "bg-slate-500",
    icon: "📌",
  };

  const hasFieldChanges = node.fieldChanges && Object.keys(node.fieldChanges).length > 0;

  return (
    <div className="relative pl-8 pb-6">
      {!isLast && (
        <div className="absolute left-4 top-6 w-0.5 h-full bg-slate-200" />
      )}
      <div className={cn(
        "absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-sm",
        typeInfo.color,
        node.isReProcess && "ring-2 ring-purple-400 ring-offset-2"
      )}>
        {typeInfo.icon}
      </div>

      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">{node.nodeName}</h4>
              {node.isReProcess && (
                <span className="badge bg-purple-100 text-purple-700">重新处理</span>
              )}
              <span className="badge bg-slate-100 text-slate-600">
                第 {node.sequence} 节点
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {node.operatorName} · {formatDateTime(node.createdAt)}
            </p>
          </div>
          <span className={cn(
            "badge",
            node.status === "completed" && "bg-emerald-100 text-emerald-700",
            node.status === "processing" && "bg-blue-100 text-blue-700",
            node.status === "pending" && "bg-amber-100 text-amber-700",
            node.status === "returned" && "bg-red-100 text-red-700"
          )}>
            {node.status === "completed" ? "已完成" :
             node.status === "processing" ? "进行中" :
             node.status === "pending" ? "待处理" :
             node.status === "returned" ? "已退回" : node.status}
          </span>
        </div>

        {node.comment && (
          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 mb-3">
            {node.comment}
          </p>
        )}

        {node.basis && (
          <div className="text-sm text-slate-600 mb-3">
            <span className="text-slate-400">📚 采用依据：</span>
            {node.basis}
          </div>
        )}

        {hasFieldChanges && node.snapshotBefore && node.snapshotAfter && (
          <div className="border-t border-slate-100 pt-3 mt-3">
            <p className="text-xs text-slate-500 mb-2 font-medium">📝 字段变更</p>
            <div className="space-y-2">
              {Object.entries(node.fieldChanges as Record<string, any>).map(([key, change]) => {
                const before = change.before;
                const after = change.after;
                const label = typeof change === "object" && change.label ? change.label : key;
                const isDiff = before !== after;
                return (
                  <DiffField
                    key={key}
                    label={label}
                    before={before}
                    after={after}
                    isDiff={isDiff}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecordDetail() {
  const { record, user } = useLoaderData<typeof loader>();
  const typedRecord = record as RecordDetail;

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

  const hasException = typedRecord.exceptionType !== EXCEPTION_TYPES.NORMAL;
  const hasDiffFields = typedRecord.diffFields && Object.keys(typedRecord.diffFields).length > 0;

  return (
    <AppLayout
      title={`核验详情 - ${typedRecord.recordNo}`}
      subtitle={typedRecord.summary}
      user={user}
      actions={
        <div className="flex items-center gap-2">
          {typedRecord.isArchived ? (
            <>
              <span className="badge bg-slate-200 text-slate-700">
                🔒 已归档（只读）
              </span>
              <button className="btn-warning">
                🔄 申请重新处理
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary">
                📋 复制记录
              </button>
              <Link to={`/processing/${typedRecord.id}`} className="btn-primary">
                ⚙️ 前往处理
              </Link>
            </>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="基本信息" icon="📋">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              <InfoItem label="记录编号" value={typedRecord.recordNo} highlight />
              <InfoItem label="来源" value={typedRecord.source} />
              <InfoItem
                label="当前状态"
                value={
                  <span className={cn("badge", statusInfo.bgColor, statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                }
              />
              <InfoItem
                label="异常类型"
                value={
                  <span className={cn("badge", exceptionInfo.bgColor, exceptionInfo.color)}>
                    {exceptionInfo.label}
                  </span>
                }
              />
              <InfoItem label="创建时间" value={formatDateTime(typedRecord.createdAt)} />
              <InfoItem label="更新时间" value={formatDateTime(typedRecord.updatedAt)} />
            </div>
          </Section>

          <Section title="关键对象" icon="📦">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              <InfoItem label="集装箱号" value={typedRecord.containerNo} highlight />
              <InfoItem label="铅封号" value={typedRecord.sealNo} highlight />
              <InfoItem label="提单号" value={typedRecord.blNo} />
              <InfoItem label="船名" value={typedRecord.vesselName} />
              <InfoItem label="航次" value={typedRecord.voyageNo} />
              <InfoItem label="客户" value={typedRecord.customer} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mt-4 pt-4 border-t border-slate-100">
              <InfoItem label="铅封时间" value={formatDateTime(typedRecord.sealTime)} />
              <InfoItem label="到港时间" value={formatDateTime(typedRecord.arrivalTime)} />
              <InfoItem label="涉及金额" value={typedRecord.amount ? `¥${typedRecord.amount}` : "-"} />
            </div>
          </Section>

          {hasException && typedRecord.blockReason && (
            <Section title="阻断原因" icon="🚫">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 whitespace-pre-line">
                  {typedRecord.blockReason}
                </p>
              </div>
            </Section>
          )}

          {hasDiffFields && (
            <Section title="差异字段" icon="⚖️">
              <div className="space-y-2">
                {Object.entries(typedRecord.diffFields as Record<string, any>).map(([key, diff]) => (
                  <DiffField
                    key={key}
                    label={diff.label || key}
                    before={diff.before}
                    after={diff.after}
                    isDiff
                  />
                ))}
              </div>
            </Section>
          )}

          {hasException && typedRecord.remedyPath && (
            <Section title="补救路径" icon="🛠️">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 whitespace-pre-line">
                  {typedRecord.remedyPath}
                </p>
              </div>
            </Section>
          )}

          <Section title="核验结论" icon="📝">
            <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-ocean-900">
                {typedRecord.conclusion || "暂无结论"}
              </p>
            </div>
            {typedRecord.basis && (
              <div>
                <p className="text-sm text-slate-500 mb-2">采用依据：</p>
                <p className="text-sm text-slate-700">{typedRecord.basis}</p>
              </div>
            )}
          </Section>

          <Section
            title="历史节点"
            icon="🕐"
            action={
              <span className="text-sm text-slate-500">
                共 {typedRecord.nodes.length} 个节点
              </span>
            }
          >
            <div className="space-y-0">
              {typedRecord.nodes.map((node, index) => (
                <TimelineNode
                  key={node.id}
                  node={node}
                  isFirst={index === 0}
                  isLast={index === typedRecord.nodes.length - 1}
                />
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="责任角色" icon="👥">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {typedRecord.applicantName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {typedRecord.applicantName || "-"}
                  </p>
                  <p className="text-xs text-blue-600">申请人</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
                  {typedRecord.currentHandlerName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {typedRecord.currentHandlerName || "-"}
                  </p>
                  <p className="text-xs text-emerald-600">当前责任人</p>
                </div>
              </div>

              {typedRecord.reviewerName && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-medium">
                    {typedRecord.reviewerName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {typedRecord.reviewerName}
                    </p>
                    <p className="text-xs text-amber-600">复核人</p>
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section
            title="附件材料"
            icon="📎"
            action={
              <span className="text-sm text-slate-500">
                {typedRecord.attachments.length} 个
              </span>
            }
          >
            {typedRecord.attachments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无附件</p>
            ) : (
              <div className="space-y-2">
                {typedRecord.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                      {att.fileType?.startsWith("image") ? "🖼️" :
                       att.fileType?.includes("pdf") ? "📄" :
                       att.fileType?.includes("sheet") ? "📊" : "📁"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {att.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>v{att.version}</span>
                        <span>·</span>
                        <span>{formatFileSize(att.fileSize)}</span>
                        {att.isEvidence && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600">证据</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button className="text-ocean-600 hover:text-ocean-800 text-sm">
                      查看
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="证据清单"
            icon="🔍"
            action={
              <span className="text-sm text-slate-500">
                {typedRecord.evidenceItems.length} 项
              </span>
            }
          >
            {typedRecord.evidenceItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无证据</p>
            ) : (
              <div className="space-y-3">
                {typedRecord.evidenceItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">{item.title}</span>
                      <span className={cn(
                        "badge",
                        item.status === "valid" && "bg-emerald-100 text-emerald-700",
                        item.status === "invalid" && "bg-red-100 text-red-700",
                        item.status === "questioned" && "bg-amber-100 text-amber-700"
                      )}>
                        {item.status === "valid" ? "有效" :
                         item.status === "invalid" ? "无效" :
                         item.status === "questioned" ? "存疑" : item.status}
                      </span>
                    </div>
                    {item.content && (
                      <p className="text-xs text-slate-600">{item.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>📌 {item.type === "photo" ? "照片" : item.type === "document" ? "文档" : item.type}</span>
                      {item.verified ? (
                        <span className="text-emerald-600">✓ 已核验</span>
                      ) : (
                        <span className="text-slate-400">待核验</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {typedRecord.archivedAt && (
            <div className="card p-4 bg-slate-50">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span>📅</span>
                <span>归档时间：{formatDateTime(typedRecord.archivedAt)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
