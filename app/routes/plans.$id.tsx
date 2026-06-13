import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getPlanDetail } from "~/lib/workflow";
import type { DiffField, ChangedField } from "~/db/schema";

export async function loader({ params }: { params: { id: string } }) {
  const { plan, nodes, attachments, auditLogs } = await getPlanDetail(params.id);
  if (!plan) {
    throw new Response("计划不存在", { status: 404 });
  }
  return json({ plan, nodes, attachments, auditLogs });
}

const statusLabels: Record<string, string> = {
  accepted: "已受理",
  processing: "处理中",
  reviewing: "复核中",
  archived: "已归档",
  returned: "已退回",
  reprocessing: "重新处理",
};

const statusStyles: Record<string, string> = {
  accepted: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-purple-100 text-purple-800",
  archived: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800",
  reprocessing: "bg-orange-100 text-orange-800",
};

const abnormalTypeLabels: Record<string, string> = {
  none: "正常",
  missing_record: "记录缺失",
  attachment_version_mismatch: "附件版本不一致",
  reprocessing_needed: "需重新处理",
};

const abnormalTypeStyles: Record<string, string> = {
  none: "bg-gray-100 text-gray-800",
  missing_record: "bg-red-100 text-red-800",
  attachment_version_mismatch: "bg-orange-100 text-orange-800",
  reprocessing_needed: "bg-yellow-100 text-yellow-800",
};

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800";
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

function AbnormalTypeBadge({ type }: { type: string }) {
  const style = abnormalTypeStyles[type] || "bg-gray-100 text-gray-800";
  const label = abnormalTypeLabels[type] || type;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex py-2 sm:gap-4">
      <dt className="w-36 flex-shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{children}</dd>
    </div>
  );
}

const actionLabels: Record<string, string> = {
  create: "创建计划",
  accept: "受理",
  process: "处理",
  submit_review: "提交复核",
  review_approve: "审核通过",
  review_return: "退回",
  archive: "归档",
  reprocess: "重新处理",
  supplement: "补充记录",
  modify_key_field: "修改关键字段",
};

export default function PlanDetailPage() {
  const { plan, nodes, attachments, auditLogs } = useLoaderData<typeof loader>();

  const showProcessLink = !plan.isArchived && (plan.status === "accepted" || plan.status === "returned" || plan.status === "reprocessing");
  const showReviewLink = plan.status === "reviewing";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {plan.isArchived && (
        <div className="mb-6 rounded-lg bg-gray-100 border border-gray-300 px-6 py-3 text-center">
          <span className="text-sm font-semibold text-gray-700">已归档 - 只读</span>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
          <StatusBadge status={plan.status} />
          <AbnormalTypeBadge type={plan.abnormalType} />
        </div>
        <div className="flex items-center gap-3">
          {showProcessLink && (
            <Link
              to={`/plans/${plan.id}/process`}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              前往处理
            </Link>
          )}
          {showReviewLink && (
            <Link
              to={`/plans/${plan.id}/review`}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              前往复核
            </Link>
          )}
          {plan.isArchived && (
            <Link
              to={`/plans/${plan.id}/reprocess`}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              重新处理
            </Link>
          )}
          <Link
            to="/"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            返回列表
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="基本信息">
          <dl className="divide-y divide-gray-100">
            <FieldRow label="计划编号">{plan.planCode}</FieldRow>
            <FieldRow label="标题">{plan.title}</FieldRow>
            <FieldRow label="区域">{plan.region}</FieldRow>
            <FieldRow label="线路名称">{plan.lineName}</FieldRow>
            <FieldRow label="停电类型">{plan.outageType}</FieldRow>
            <FieldRow label="计划开始时间">{formatDateTime(plan.plannedStartTime)}</FieldRow>
            <FieldRow label="计划结束时间">{formatDateTime(plan.plannedEndTime)}</FieldRow>
            <FieldRow label="实际开始时间">{formatDateTime(plan.actualStartTime)}</FieldRow>
            <FieldRow label="实际结束时间">{formatDateTime(plan.actualEndTime)}</FieldRow>
            <FieldRow label="影响用户数">{plan.affectedUsers != null ? plan.affectedUsers : "—"}</FieldRow>
          </dl>
        </Section>

        <Section title="责任信息">
          <dl className="divide-y divide-gray-100">
            <FieldRow label="负责人">{plan.responsiblePerson}</FieldRow>
            <FieldRow label="申请人">{plan.applicantName}</FieldRow>
            <FieldRow label="复核人">{plan.reviewerName || "—"}</FieldRow>
          </dl>
        </Section>

        <Section title="业务记录">
          <dl className="divide-y divide-gray-100">
            <FieldRow label="业务记录">
              {plan.businessRecord ? <p className="whitespace-pre-wrap">{plan.businessRecord}</p> : <span className="text-gray-400">未填写</span>}
            </FieldRow>
            <FieldRow label="现场说明">
              {plan.onsiteDescription ? <p className="whitespace-pre-wrap">{plan.onsiteDescription}</p> : <span className="text-gray-400">未填写</span>}
            </FieldRow>
            <FieldRow label="取证结论">
              {plan.evidenceConclusion ? <p className="whitespace-pre-wrap">{plan.evidenceConclusion}</p> : <span className="text-gray-400">未填写</span>}
            </FieldRow>
            <FieldRow label="依据参考">{plan.basisReference || "—"}</FieldRow>
          </dl>
        </Section>

        <Section title="当前状态">
          <dl className="divide-y divide-gray-100">
            <FieldRow label="状态"><StatusBadge status={plan.status} /></FieldRow>
            <FieldRow label="异常类型"><AbnormalTypeBadge type={plan.abnormalType} /></FieldRow>
          </dl>
        </Section>

        {plan.abnormalType !== "none" && (
          <Section title="阻断信息">
            <dl className="divide-y divide-gray-100">
              <FieldRow label="阻断原因">
                <span className="font-medium text-red-700">{plan.blockingReason || "—"}</span>
              </FieldRow>
            </dl>
            {plan.diffFields && plan.diffFields.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">差异字段</h3>
                <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">字段</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">期望值</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">实际值</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(plan.diffFields as DiffField[]).map((diff, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-gray-900">{diff.field}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{diff.expected}</td>
                        <td className="px-4 py-2 text-sm text-red-700 font-medium">{diff.actual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {plan.remediationPath && (
              <dl className="mt-4 divide-y divide-gray-100">
                <FieldRow label="补救路径">
                  <span className="font-medium text-green-700">{plan.remediationPath}</span>
                </FieldRow>
              </dl>
            )}
          </Section>
        )}

        <Section title="工作流历史">
          {nodes.length === 0 ? (
            <p className="text-sm text-gray-500">暂无工作流记录</p>
          ) : (
            <ol className="relative border-l-2 border-gray-200 ml-2">
              {nodes.map((node) => (
                <li key={node.id} className="mb-6 ml-6">
                  <span className="absolute -left-2 mt-1.5 h-4 w-4 rounded-full border-2 border-gray-300 bg-white" />
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {actionLabels[node.action] || node.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        {statusLabels[node.fromStatus || ""] || node.fromStatus || "—"}
                        {" → "}
                        {statusLabels[node.toStatus || ""] || node.toStatus || "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
                      <span>操作人: {node.operatorName}</span>
                      <span>角色: {node.operatorRole}</span>
                      <span>时间: {formatDateTime(node.createdAt)}</span>
                    </div>
                    {node.comment && (
                      <p className="mt-2 text-sm text-gray-700">{node.comment}</p>
                    )}
                    {node.changedFields && node.changedFields.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-500">变更字段:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {node.changedFields.map((cf: ChangedField, i: number) => (
                            <span key={i} className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                              {cf.field}: {cf.oldValue || "空"} → {cf.newValue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="附件列表">
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-500">暂无附件</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">文件名</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">版本</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">类型</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">上传人</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">上传时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attachments.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 text-sm">
                      <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {att.fileName}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">v{att.version}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{att.fileType}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{att.uploadedBy}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{formatDateTime(att.uploadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="审计日志">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-500">暂无审计日志</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">变更字段</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">旧值</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">新值</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">操作人</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">变更时间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">关键</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className={log.isKeyField ? "bg-yellow-50" : "hover:bg-gray-50"}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">{log.fieldChanged}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-sm text-gray-600" title={log.oldValue ?? undefined}>
                      {log.oldValue || "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-sm text-gray-600" title={log.newValue ?? undefined}>
                      {log.newValue || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{log.changedBy}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{formatDateTime(log.changedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm">
                      {log.isKeyField ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          关键
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  );
}
