import { useLoaderData, Link, type MetaFunction, type LoaderFunctionArgs } from "react-router";
import { db } from "~/db";
import {
  workPermits,
  contractors,
  workZones,
  permitWorkers,
  workers,
  certificates,
  approvalNodes,
  riskItems,
  permitIssues,
} from "~/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
  InferSelectModel,
} from "drizzle-orm";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.permit) {
    return [{ title: "作业许可证不存在" }];
  }
  return [{ title: `${data.permit.permitNumber} - 作业许可证详情` }];
};

type CertificateWithWorker = InferSelectModel<typeof certificates>;

interface WorkerWithCerts {
  id: number;
  name: string;
  idNumber: string;
  phone: string | null;
  role: string | null;
  certificates: CertificateWithWorker[];
}

interface LoaderData {
  permit: InferSelectModel<typeof workPermits> & {
    contractor: InferSelectModel<typeof contractors> | null;
    workZone: InferSelectModel<typeof workZones> | null;
  };
  workers: WorkerWithCerts[];
  approvalNodes: InferSelectModel<typeof approvalNodes>[];
  riskItems: InferSelectModel<typeof riskItems>[];
  issues: InferSelectModel<typeof permitIssues>[];
  hasExpiredHeightCert: boolean;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const id = parseInt(params.id!, 10);
  if (isNaN(id)) {
    throw new Response("Invalid permit ID", { status: 400 });
  }

  const permitResult = await db
    .select({
      permit: workPermits,
      contractor: contractors,
      workZone: workZones,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .leftJoin(workZones, eq(workPermits.workZoneId, workZones.id))
    .where(eq(workPermits.id, id));

  if (permitResult.length === 0) {
    throw new Response("Permit not found", { status: 404 });
  }

  const { permit, contractor, workZone } = permitResult[0];

  const permitWorkersResult = await db
    .select({
      permitWorker: permitWorkers,
      worker: workers,
    })
    .from(permitWorkers)
    .innerJoin(workers, eq(permitWorkers.workerId, workers.id))
    .where(eq(permitWorkers.permitId, id));

  const workerIds = permitWorkersResult.map((pw) => pw.worker.id);
  let certs: CertificateWithWorker[] = [];
  if (workerIds.length > 0) {
    certs = await db
      .select()
      .from(certificates)
      .where(sql`worker_id IN (${sql.join(workerIds, sql`, `)})`);
  }

  const workersWithCerts: WorkerWithCerts[] = permitWorkersResult.map((pw) => ({
    id: pw.worker.id,
    name: pw.worker.name,
    idNumber: pw.worker.idNumber,
    phone: pw.worker.phone,
    role: pw.permitWorker.role,
    certificates: certs.filter((c) => c.workerId === pw.worker.id),
  }));

  const approvalNodesList = await db
    .select()
    .from(approvalNodes)
    .where(eq(approvalNodes.permitId, id))
    .orderBy(desc(approvalNodes.createdAt));

  const riskItemsList = await db
    .select()
    .from(riskItems)
    .where(eq(riskItems.permitId, id))
    .orderBy(desc(riskItems.createdAt));

  const issuesList = await db
    .select()
    .from(permitIssues)
    .where(eq(permitIssues.permitId, id))
    .orderBy(desc(permitIssues.createdAt));

  const today = new Date();
  let hasExpiredHeightCert = false;
  for (const worker of workersWithCerts) {
    for (const cert of worker.certificates) {
      if (cert.type === "height_work") {
        const expiryDate = new Date(cert.expiryDate);
        if (expiryDate < today) {
          hasExpiredHeightCert = true;
          break;
        }
      }
    }
    if (hasExpiredHeightCert) break;
  }

  return {
    permit: {
      ...permit,
      contractor,
      workZone,
    },
    workers: workersWithCerts,
    approvalNodes: approvalNodesList,
    riskItems: riskItemsList,
    issues: issuesList,
    hasExpiredHeightCert,
  } satisfies LoaderData;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    draft: { label: "草稿", className: "badge-secondary" },
    submitted: { label: "已提交", className: "badge-info" },
    security_approved: { label: "安保通过", className: "badge-info" },
    security_rejected: { label: "安保驳回", className: "badge-danger" },
    safety_approved: { label: "安全通过", className: "badge-info" },
    safety_rejected: { label: "安全驳回", className: "badge-danger" },
    manager_approved: { label: "已批准", className: "badge-success" },
    manager_rejected: { label: "项目经理驳回", className: "badge-danger" },
    archived: { label: "已归档", className: "badge-secondary" },
  };
  const info = statusMap[status] || { label: status, className: "badge-secondary" };
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

function getWorkTypeLabel(type: string) {
  const map: Record<string, string> = {
    stage_setup: "舞台搭建",
    lighting_install: "灯光安装",
    sound_install: "音响安装",
    truss_hoisting: "桁架吊装",
    scaffolding: "脚手架搭设",
    electrical: "电气作业",
    general: "一般作业",
  };
  return map[type] || type;
}

function getCertificateTypeLabel(type: string) {
  const map: Record<string, string> = {
    height_work: "登高证",
    electrician: "电工证",
    welding: "焊工证",
    crane_operator: "起重作业证",
    scaffolding: "脚手架作业证",
    first_aid: "急救证",
    fire_safety: "消防安全证",
  };
  return map[type] || type;
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    contractor: "承包商",
    security: "安保人员",
    safety_officer: "安全员",
    project_manager: "项目经理",
  };
  return map[role] || role;
}

function getRiskLevelInfo(level: string) {
  const map: Record<string, { label: string; className: string }> = {
    low: { label: "低", className: "badge-success" },
    medium: { label: "中", className: "badge-warning" },
    high: { label: "高", className: "badge-danger" },
  };
  return map[level] || { label: level, className: "badge-secondary" };
}

function getIssueTypeLabel(type: string) {
  const map: Record<string, string> = {
    certificate_expired: "证书过期",
    zone_conflict: "区域冲突",
    night_permit_missing: "缺少夜间许可",
    incomplete_info: "信息不完整",
    safety_violation: "安全违规",
    other: "其他",
  };
  return map[type] || type;
}

function isCertificateExpired(expiryDate: string | Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskIdNumber(idNumber: string) {
  if (idNumber.length <= 10) return idNumber;
  return idNumber.slice(0, 6) + "********" + idNumber.slice(-4);
}

export default function PermitDetail() {
  const { permit, workers, approvalNodes, riskItems, issues, hasExpiredHeightCert } =
    useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/permits" className="text-slate-400 hover:text-slate-600">
            ← 返回列表
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{permit.title}</h1>
              {getStatusBadge(permit.status)}
            </div>
            <p className="text-slate-500 mt-1">
              许可证编号：{permit.permitNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">打印</button>
          <button className="btn btn-secondary">编辑</button>
          {permit.status === "draft" && (
            <button className="btn btn-primary">提交审批</button>
          )}
        </div>
      </div>

      {hasExpiredHeightCert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-medium text-red-800">登高证过期警告</p>
            <p className="text-sm text-red-600">
              该作业许可证下有作业人员的登高证已过期，存在安全风险，请及时处理
            </p>
          </div>
        </div>
      )}

      {issues.filter((i) => i.isBlocking && !i.resolvedAt).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-800">存在未解决的阻断性问题</p>
            <p className="text-sm text-amber-600">
              共有 {issues.filter((i) => i.isBlocking && !i.resolvedAt).length} 个阻断性问题需要解决
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">基本信息</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">作业类型</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {getWorkTypeLabel(permit.workType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">施工区域</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {permit.workZone
                      ? `${permit.workZone.name} (${permit.workZone.code})`
                      : "未指定"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">开始时间</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {formatDateTime(permit.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">结束时间</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {formatDateTime(permit.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">是否夜间施工</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {permit.isNightWork ? (
                      <span className="badge badge-warning">是</span>
                    ) : (
                      "否"
                    )}
                  </p>
                </div>
                {permit.isNightWork && (
                  <div>
                    <p className="text-sm text-slate-500">夜间施工许可证号</p>
                    <p className="text-slate-900 font-medium mt-1">
                      {permit.nightPermitNumber || "未填写"}
                    </p>
                  </div>
                )}
              </div>
              {permit.description && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">作业描述</p>
                  <p className="text-slate-700 mt-1">{permit.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">作业人员</h2>
                <span className="text-sm text-slate-500">共 {workers.length} 人</span>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {workers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">暂无作业人员</div>
              ) : (
                workers.map((worker) => {
                  const hasExpiredHeight = worker.certificates.some(
                    (c) => c.type === "height_work" && isCertificateExpired(c.expiryDate)
                  );
                  return (
                    <div key={worker.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {worker.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">
                                {worker.name}
                              </p>
                              {hasExpiredHeight && (
                                <span className="badge badge-danger flex items-center gap-1">
                                  <span>🚨</span>
                                  登高证过期
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                              身份证：{maskIdNumber(worker.idNumber)}
                              {worker.role && ` · ${worker.role}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      {worker.certificates.length > 0 && (
                        <div className="mt-3 ml-13 pl-13">
                          <p className="text-xs text-slate-500 mb-2">所持证书</p>
                          <div className="flex flex-wrap gap-2">
                            {worker.certificates.map((cert) => {
                              const expired = isCertificateExpired(cert.expiryDate);
                              const isHeightCert = cert.type === "height_work";
                              return (
                                <div
                                  key={cert.id}
                                  className={`px-3 py-1.5 rounded-lg text-sm ${
                                    expired && isHeightCert
                                      ? "bg-red-50 border border-red-200 text-red-700"
                                      : expired
                                      ? "bg-amber-50 border border-amber-200 text-amber-700"
                                      : "bg-slate-50 border border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {expired && isHeightCert && <span>🚨</span>}
                                    {expired && !isHeightCert && <span>⚠️</span>}
                                    <span className="font-medium">
                                      {getCertificateTypeLabel(cert.type)}
                                    </span>
                                  </div>
                                  <p className="text-xs mt-0.5 opacity-80">
                                    {cert.certificateNumber} · 有效期至{" "}
                                    {formatDate(cert.expiryDate)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">风险清单</h2>
                <span className="text-sm text-slate-500">共 {riskItems.length} 项</span>
              </div>
            </div>
            <div className="divide-y divide-slate-200">
              {riskItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500">暂无风险项</div>
              ) : (
                riskItems.map((risk) => {
                  const levelInfo = getRiskLevelInfo(risk.level);
                  return (
                    <div key={risk.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              risk.level === "high"
                                ? "bg-red-500"
                                : risk.level === "medium"
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">
                                {risk.title}
                              </p>
                              <span className={`badge ${levelInfo.className}`}>
                                {levelInfo.label}风险
                              </span>
                              {risk.isResolved && (
                                <span className="badge badge-success">已解决</span>
                              )}
                            </div>
                            {risk.description && (
                              <p className="text-sm text-slate-500 mt-1">
                                {risk.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {risk.mitigation && (
                        <div className="mt-2 ml-5 pl-3 border-l-2 border-slate-200">
                          <p className="text-xs text-slate-500">缓解措施</p>
                          <p className="text-sm text-slate-600 mt-0.5">
                            {risk.mitigation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {issues.length > 0 && (
            <div className="card">
              <div className="p-5 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">问题记录</h2>
                  <span className="text-sm text-slate-500">共 {issues.length} 条</span>
                </div>
              </div>
              <div className="divide-y divide-slate-200">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {issue.resolvedAt ? "✅" : issue.isBlocking ? "🔴" : "🟡"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {getIssueTypeLabel(issue.issueType)}
                            </p>
                            {issue.isBlocking && (
                              <span className="badge badge-danger">阻断性</span>
                            )}
                            {issue.resolvedAt && (
                              <span className="badge badge-success">已解决</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            {issue.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            创建于 {formatDateTime(issue.createdAt)}
                            {issue.resolvedAt &&
                              ` · 解决于 ${formatDateTime(issue.resolvedAt)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">承包商信息</h2>
            </div>
            <div className="p-5">
              {permit.contractor ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">单位名称</p>
                    <p className="text-slate-900 font-medium mt-1">
                      {permit.contractor.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">联系人</p>
                    <p className="text-slate-900 font-medium mt-1">
                      {permit.contractor.contactPerson}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">联系电话</p>
                    <p className="text-slate-900 font-medium mt-1">
                      {permit.contractor.phone || "未填写"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">电子邮箱</p>
                    <p className="text-slate-900 font-medium mt-1">
                      {permit.contractor.email || "未填写"}
                    </p>
                  </div>
                  {permit.contractor.licenseNumber && (
                    <div>
                      <p className="text-sm text-slate-500">资质证书编号</p>
                      <p className="text-slate-900 font-medium mt-1">
                        {permit.contractor.licenseNumber}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-4">
                  暂无承包商信息
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">审批历史</h2>
            </div>
            <div className="p-5">
              {approvalNodes.length === 0 ? (
                <div className="text-center text-slate-500 py-4">暂无审批记录</div>
              ) : (
                <div className="space-y-0">
                  {approvalNodes.map((node, index) => (
                    <div key={node.id} className="timeline-item">
                      <div className="pt-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {getRoleLabel(node.role)}
                          </p>
                          <span
                            className={`badge ${
                              node.status.includes("approved")
                                ? "badge-success"
                                : node.status.includes("rejected")
                                ? "badge-danger"
                                : "badge-info"
                            }`}
                          >
                            {node.action}
                          </span>
                        </div>
                        {node.operatorName && (
                          <p className="text-sm text-slate-500 mt-0.5">
                            操作人：{node.operatorName}
                          </p>
                        )}
                        {node.comment && (
                          <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                            {node.comment}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {formatDateTime(node.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">创建信息</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-sm text-slate-500">创建时间</p>
                <p className="text-slate-900 font-medium mt-1">
                  {formatDateTime(permit.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">更新时间</p>
                <p className="text-slate-900 font-medium mt-1">
                  {formatDateTime(permit.updatedAt)}
                </p>
              </div>
              {permit.submittedAt && (
                <div>
                  <p className="text-sm text-slate-500">提交时间</p>
                  <p className="text-slate-900 font-medium mt-1">
                    {formatDateTime(permit.submittedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
