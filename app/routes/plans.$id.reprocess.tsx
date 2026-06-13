import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getPlan, getPlanDetail, reprocessPlan } from "~/lib/workflow";
import type { ChangedField } from "~/db/schema";

export async function loader({ params }: { params: { id: string } }) {
  const plan = await getPlan(params.id);
  if (!plan) {
    throw new Response("计划不存在", { status: 404 });
  }
  if (!plan.isArchived) {
    throw new Response("只有已归档的计划才能重新处理", { status: 403 });
  }
  const { nodes, auditLogs } = await getPlanDetail(params.id);
  return json({ plan, nodes, auditLogs });
}

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  const planId = params.id;
  const formData = await request.formData();
  const reason = formData.get("reason") as string;

  if (!reason || !reason.trim()) {
    return json({ error: "重新处理原因不能为空" }, { status: 400 });
  }

  await reprocessPlan(planId, "reviewer_001", "李复核员", reason.trim());
  return redirect(`/plans/${planId}/process`);
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

export default function PlanReprocessPage() {
  const { plan, nodes, auditLogs } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">重新处理</h1>
          <StatusBadge status={plan.status} />
          <AbnormalTypeBadge type={plan.abnormalType} />
        </div>
        <a
          href={`/plans/${plan.id}`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          返回详情
        </a>
      </div>

      <div className="mb-4 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
        <span className="text-sm font-medium text-orange-800">
          当前角色: 归档复核人
        </span>
        <span className="ml-4 text-sm text-orange-700">
          计划: {plan.title} ({plan.planCode})
        </span>
      </div>

      <div className="mb-4 rounded-lg bg-gray-100 border border-gray-300 px-4 py-3 text-center">
        <span className="text-sm font-semibold text-gray-700">已归档 - 只读</span>
      </div>

      <div className="space-y-6">
        <Section title="计划信息摘要">
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
            <FieldRow label="负责人">{plan.responsiblePerson}</FieldRow>
            <FieldRow label="申请人">{plan.applicantName}</FieldRow>
            <FieldRow label="复核人">{plan.reviewerName || "—"}</FieldRow>
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
            {plan.conclusionSummary && (
              <FieldRow label="结论摘要">
                <p className="whitespace-pre-wrap">{plan.conclusionSummary}</p>
              </FieldRow>
            )}
          </dl>
        </Section>

        <Section title="重新处理操作">
          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                重新处理原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={4}
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="请输入重新处理的原因..."
              />
            </div>
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                提交重新处理
              </button>
            </div>
          </Form>
        </Section>

        <Section title="工作流时间线">
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

        <Section title="关键字段变更审计">
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
