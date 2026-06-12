import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getApplicationDetail } from "~/lib/queries.server";
import {
  STATUS_LABELS,
  SAMPLE_TYPE_LABELS,
  RISK_LEVEL_LABELS,
  NODE_TYPE_LABELS,
  ROLE_LABELS,
  RECORD_TYPE_LABELS,
  CHANGE_TYPE_LABELS,
} from "~/lib/types";
import type { AppStatus, SampleType } from "~/lib/types";
import StatusBadge from "~/components/StatusBadge";
import DiffViewer from "~/components/DiffViewer";
import Timeline from "~/components/Timeline";

export const meta: MetaFunction = () => {
  return [{ title: "申请详情 - 影视拍摄安全验收系统" }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id);
  if (isNaN(id)) throw new Response("Not Found", { status: 404 });

  const detail = await getApplicationDetail(id);
  if (!detail) throw new Response("Not Found", { status: 404 });

  return json(detail);
}

export default function ApplicationDetail() {
  const { application: app, nodes, attachments, fieldChanges, businessRecords } =
    useLoaderData<typeof loader>();

  const isArchived = app.status === "archived";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← 返回列表
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            申请详情 #{app.id}
          </h1>
          <StatusBadge status={app.status as AppStatus} />
          {app.sampleType && (
            <span className="badge bg-indigo-100 text-indigo-800">
              {SAMPLE_TYPE_LABELS[app.sampleType as SampleType]}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isArchived && (
            <Link
              to={`/applications/${app.id}/process`}
              className="btn-primary"
            >
              处理台
            </Link>
          )}
          {(app.status === "review" || app.status === "archived") && (
            <Link
              to={`/applications/${app.id}/review`}
              className="btn-warning"
            >
              复核归档
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">基本信息</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-sm text-gray-500">来源</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {app.source === "online_application" ? "线上申请" : app.source}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">项目名称</dt>
                <dd className="text-sm font-medium text-gray-900">{app.projectName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">场景名称</dt>
                <dd className="text-sm font-medium text-gray-900">{app.sceneName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">拍摄地点</dt>
                <dd className="text-sm font-medium text-gray-900">{app.location}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">申请人</dt>
                <dd className="text-sm font-medium text-gray-900">{app.applicantName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">当前责任人</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {app.currentResponsible || "-"}
                  {app.currentResponsibleRole && (
                    <span className="text-gray-400 ml-1">
                      ({ROLE_LABELS[app.currentResponsibleRole as keyof typeof ROLE_LABELS] || app.currentResponsibleRole})
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">拍摄起止时间</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {app.shootingStartDate
                    ? `${new Date(app.shootingStartDate).toLocaleDateString("zh-CN")} ~ ${new Date(app.shootingEndDate!).toLocaleDateString("zh-CN")}`
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">剧组人数</dt>
                <dd className="text-sm font-medium text-gray-900">{app.crewCount || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">预算金额</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {app.budgetAmount ? `¥${Number(app.budgetAmount).toLocaleString()}` : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">风险等级</dt>
                <dd className="text-sm">
                  <span className={`badge ${
                    app.riskLevel === "high" ? "bg-red-100 text-red-800" :
                    app.riskLevel === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {RISK_LEVEL_LABELS[app.riskLevel || "medium"]}
                  </span>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-500">安全预案摘要</dt>
                <dd className="text-sm font-medium text-gray-900">{app.safetyPlanSummary || "-"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-500">结论</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {app.conclusion || "暂无结论"}
                </dd>
              </div>
            </dl>
          </div>

          {fieldChanges.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">处理前后差异</h2>
              <DiffViewer changes={fieldChanges.map((fc) => ({
                fieldName: fc.fieldName,
                fieldLabel: fc.fieldLabel,
                oldValue: fc.oldValue,
                newValue: fc.newValue,
                changeType: fc.changeType,
                changedBy: fc.changedBy,
                changedAt: new Date(fc.changedAt).toLocaleString("zh-CN"),
              }))} />
            </div>
          )}

          {businessRecords.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">业务记录与现场说明</h2>
              <div className="space-y-3">
                {businessRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${
                        record.recordType === "business_record" ? "bg-blue-100 text-blue-800" :
                        record.recordType === "site_description" ? "bg-teal-100 text-teal-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {RECORD_TYPE_LABELS[record.recordType] || record.recordType}
                      </span>
                      <span className="text-xs text-gray-400">
                        {record.createdBy} · {new Date(record.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{record.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">证据附件</h2>
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {att.fileType === "pdf" ? "📄" : att.fileType === "image" ? "🖼️" : "📎"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{att.fileName}</p>
                        <p className="text-xs text-gray-400">
                          版本: {att.fileVersion} · 上传人: {att.uploadedBy} · {new Date(att.uploadedAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {att.isEvidence && (
                        <span className="badge bg-amber-100 text-amber-800">证据</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">流转时间线</h2>
            <Timeline
              nodes={nodes.map((n) => ({
                nodeType: n.nodeType,
                operatorName: n.operatorName,
                operatorRole: n.operatorRole,
                actionTaken: n.actionTaken,
                blockingReason: n.blockingReason,
                remedyPath: n.remedyPath,
                createdAt: new Date(n.createdAt).toLocaleString("zh-CN"),
                notes: n.notes,
              }))}
            />
          </div>

          {nodes.some((n) => n.basisReference) && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">采用依据</h2>
              <div className="space-y-2">
                {nodes.filter((n) => n.basisReference).map((n) => (
                  <div key={n.id} className="text-sm text-gray-700 border-l-2 border-blue-300 pl-3">
                    <p>{n.basisReference}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {NODE_TYPE_LABELS[n.nodeType as keyof typeof NODE_TYPE_LABELS]}节点 · {n.operatorName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
