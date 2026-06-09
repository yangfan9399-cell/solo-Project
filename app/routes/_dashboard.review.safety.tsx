import { useState } from "react";
import { useLoaderData, useNavigate, useFetcher, type MetaFunction } from "react-router";
import { db } from "~/db";
import {
  workPermits,
  contractors,
  workZones,
  permitWorkers,
  certificates,
  approvalNodes,
  permitIssues,
} from "~/db/schema";
import { eq, and, desc, sql, inArray, isNull } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "安全验收 - 舞台搭建进场系统" }];
};

interface BlockingIssue {
  id: number;
  issueType: string;
  description: string;
  isBlocking: boolean;
}

interface PermitWithDetails {
  id: number;
  permitNumber: string;
  title: string;
  workType: string;
  status: string;
  securityApprovedAt: Date | null;
  contractorId: number;
  contractorName: string | null;
  workZoneId: number | null;
  workZoneName: string | null;
  workZoneCode: string | null;
  hasExpiredHeightCert: boolean;
  blockingIssues: BlockingIssue[];
  hasBlockingIssues: boolean;
}

interface ApprovedPermit {
  id: number;
  permitNumber: string;
  title: string;
  status: string;
  safetyApprovedAt: Date | null;
  contractorName: string | null;
  workType: string;
}

interface LoaderData {
  pendingPermits: PermitWithDetails[];
  approvedHistory: ApprovedPermit[];
}

export async function loader() {
  const pendingResult = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      workType: workPermits.workType,
      status: workPermits.status,
      securityApprovedAt: workPermits.securityApprovedAt,
      contractorId: workPermits.contractorId,
      contractorName: contractors.name,
      workZoneId: workPermits.workZoneId,
      workZoneName: workZones.name,
      workZoneCode: workZones.code,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .leftJoin(workZones, eq(workPermits.workZoneId, workZones.id))
    .where(eq(workPermits.status, "security_approved"))
    .orderBy(desc(workPermits.securityApprovedAt));

  const permitIds = pendingResult.map((p) => p.id);
  const heightCertsMap = new Map<number, boolean>();

  if (permitIds.length > 0) {
    const permitWorkersResult = await db
      .select({
        permitId: permitWorkers.permitId,
        workerId: permitWorkers.workerId,
      })
      .from(permitWorkers)
      .where(inArray(permitWorkers.permitId, permitIds));

    const workerIds = [...new Set(permitWorkersResult.map((pw) => pw.workerId))];

    if (workerIds.length > 0) {
      const today = new Date();
      const certsResult = await db
        .select({
          workerId: certificates.workerId,
          type: certificates.type,
          expiryDate: certificates.expiryDate,
        })
        .from(certificates)
        .where(
          and(
            eq(certificates.type, "height_work"),
            sql<boolean>`${certificates.expiryDate} < ${today.toISOString().split("T")[0]}`
          )
        );

      const expiredWorkerIds = new Set(certsResult.map((c) => c.workerId));

      for (const pw of permitWorkersResult) {
        if (expiredWorkerIds.has(pw.workerId)) {
          heightCertsMap.set(pw.permitId, true);
        }
      }
    }
  }

  const pendingPermits: PermitWithDetails[] = pendingResult.map((p) => ({
    ...p,
    hasExpiredHeightCert: heightCertsMap.get(p.id) || false,
    blockingIssues: [],
    hasBlockingIssues: false,
  }));

  if (permitIds.length > 0) {
    const issuesResult = await db
      .select({
        id: permitIssues.id,
        permitId: permitIssues.permitId,
        issueType: permitIssues.issueType,
        description: permitIssues.description,
        isBlocking: permitIssues.isBlocking,
      })
      .from(permitIssues)
      .where(
        and(
          inArray(permitIssues.permitId, permitIds),
          eq(permitIssues.isBlocking, true),
          isNull(permitIssues.resolvedAt)
        )
      );

    const issuesMap = new Map<number, BlockingIssue[]>();
    for (const issue of issuesResult) {
      const list = issuesMap.get(issue.permitId) || [];
      list.push(issue as BlockingIssue);
      issuesMap.set(issue.permitId, list);
    }

    for (const permit of pendingPermits) {
      const issues = issuesMap.get(permit.id) || [];
      permit.blockingIssues = issues;
      permit.hasBlockingIssues = issues.length > 0 || permit.hasExpiredHeightCert;
    }
  }

  const approvedResult = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      status: workPermits.status,
      safetyApprovedAt: workPermits.safetyApprovedAt,
      contractorName: contractors.name,
      workType: workPermits.workType,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .where(sql`status IN ('safety_approved', 'safety_rejected')`)
    .orderBy(desc(workPermits.safetyApprovedAt))
    .limit(20);

  const approvedHistory: ApprovedPermit[] = approvedResult.map((r) => ({
    id: r.id,
    permitNumber: r.permitNumber,
    title: r.title,
    status: r.status,
    safetyApprovedAt: r.safetyApprovedAt,
    contractorName: r.contractorName,
    workType: r.workType,
  }));

  return { pendingPermits, approvedHistory } satisfies LoaderData;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const permitId = parseInt(formData.get("permitId") as string, 10);
  const comment = formData.get("comment") as string | null;

  if (!permitId || isNaN(permitId)) {
    return { success: false, error: "Invalid permit ID" };
  }

  if (intent === "approve") {
    const permitResult = await db
      .select({ status: workPermits.status })
      .from(workPermits)
      .where(eq(workPermits.id, permitId));

    if (permitResult.length === 0) {
      return { success: false, error: "Permit not found" };
    }

    if (permitResult[0].status !== "security_approved") {
      return { success: false, error: "Permit is not in security_approved status" };
    }

    const permitWorkersResult = await db
      .select({ workerId: permitWorkers.workerId })
      .from(permitWorkers)
      .where(eq(permitWorkers.permitId, permitId));

    const workerIds = permitWorkersResult.map((pw) => pw.workerId);

    if (workerIds.length > 0) {
      const today = new Date();
      const expiredCerts = await db
        .select({ id: certificates.id })
        .from(certificates)
        .where(
          and(
            inArray(certificates.workerId, workerIds),
            eq(certificates.type, "height_work"),
            sql<boolean>`${certificates.expiryDate} < ${today.toISOString().split("T")[0]}`
          )
        );

      if (expiredCerts.length > 0) {
        return { success: false, error: "存在登高证过期的作业人员，无法通过安全验收" };
      }
    }

    const blockingIssues = await db
      .select({ id: permitIssues.id })
      .from(permitIssues)
      .where(
        and(
          eq(permitIssues.permitId, permitId),
          eq(permitIssues.isBlocking, true),
          isNull(permitIssues.resolvedAt)
        )
      );

    if (blockingIssues.length > 0) {
      return { success: false, error: "存在未解决的阻断性问题，无法通过安全验收" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(workPermits)
        .set({
          status: "safety_approved",
          safetyApprovedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workPermits.id, permitId));

      await tx.insert(approvalNodes).values({
        permitId,
        role: "safety_officer",
        action: "通过",
        status: "safety_approved",
        comment: comment || null,
        operatorName: "安全主管",
      });
    });

    return { success: true };
  }

  if (intent === "reject") {
    const permitResult = await db
      .select({ status: workPermits.status })
      .from(workPermits)
      .where(eq(workPermits.id, permitId));

    if (permitResult.length === 0) {
      return { success: false, error: "Permit not found" };
    }

    if (permitResult[0].status !== "security_approved") {
      return { success: false, error: "Permit is not in security_approved status" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(workPermits)
        .set({
          status: "safety_rejected",
          updatedAt: new Date(),
        })
        .where(eq(workPermits.id, permitId));

      await tx.insert(approvalNodes).values({
        permitId,
        role: "safety_officer",
        action: "驳回",
        status: "safety_rejected",
        comment: comment || null,
        operatorName: "安全主管",
      });
    });

    return { success: true };
  }

  return { success: false, error: "Invalid intent" };
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

function getIssueTypeLabel(type: string) {
  const map: Record<string, string> = {
    certificate_expired: "证照过期",
    zone_conflict: "区域冲突",
    night_permit_missing: "夜间施工审批缺失",
    incomplete_info: "信息不完整",
    safety_violation: "安全违规",
    other: "其他问题",
  };
  return map[type] || type;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    safety_approved: { label: "安全通过", className: "badge-success" },
    safety_rejected: { label: "安全驳回", className: "badge-danger" },
  };
  const info = statusMap[status] || { label: status, className: "badge-secondary" };
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  permitNumber: string;
}

function RejectModal({ isOpen, onClose, onConfirm, permitNumber }: RejectModalProps) {
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(comment);
    setComment("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">驳回作业申请</h3>
          <p className="text-sm text-slate-500 mt-1">许可证编号：{permitNumber}</p>
        </div>
        <div className="p-5">
          <label className="label">驳回原因</label>
          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="请输入驳回原因..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={!comment.trim()}
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SafetyReview() {
  const { pendingPermits, approvedHistory } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<{
    id: number;
    permitNumber: string;
  } | null>(null);

  const handleApprove = (permitId: number) => {
    const formData = new FormData();
    formData.append("intent", "approve");
    formData.append("permitId", permitId.toString());
    fetcher.submit(formData, { method: "post" });
  };

  const handleRejectClick = (permitId: number, permitNumber: string) => {
    setSelectedPermit({ id: permitId, permitNumber });
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = (comment: string) => {
    if (!selectedPermit) return;
    const formData = new FormData();
    formData.append("intent", "reject");
    formData.append("permitId", selectedPermit.id.toString());
    formData.append("comment", comment);
    fetcher.submit(formData, { method: "post" });
    setRejectModalOpen(false);
    setSelectedPermit(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">安全验收</h1>
        <p className="text-slate-500 mt-1">安全主管对作业许可证进行安全条件验收</p>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">待安全验收</h2>
              <p className="text-sm text-slate-500 mt-1">
                共 {pendingPermits.length} 份作业许可等待安全验收
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  许可证编号
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  承包商
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  作业类型
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  阻断原因
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  安保通过时间
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingPermits.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    暂无待安全验收的作业许可证
                  </td>
                </tr>
              ) : (
                pendingPermits.map((permit) => (
                  <tr
                    key={permit.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-medium text-slate-900">
                        {permit.permitNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {permit.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {permit.contractorName || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {getWorkTypeLabel(permit.workType)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {permit.hasBlockingIssues ? (
                        <div className="space-y-1">
                          {permit.hasExpiredHeightCert && (
                            <div className="flex items-center gap-1">
                              <span className="badge badge-danger">
                                登高证过期
                              </span>
                            </div>
                          )}
                          {permit.blockingIssues.map((issue) => (
                            <div
                              key={issue.id}
                              className="flex items-center gap-1"
                            >
                              <span className="badge badge-danger">
                                {getIssueTypeLabel(issue.issueType)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="badge badge-success">无阻断问题</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDateTime(permit.securityApprovedAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          onClick={() => navigate(`/permits/${permit.id}`)}
                        >
                          详情
                        </button>
                        {permit.hasBlockingIssues ? (
                          <div className="relative group">
                            <button
                              className="btn btn-success opacity-50 cursor-not-allowed"
                              disabled
                            >
                              通过验收
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {permit.hasExpiredHeightCert && <p>• 存在登高证过期的作业人员</p>}
                              {permit.blockingIssues.map((issue) => (
                                <p key={issue.id}>• {issue.description}</p>
                              ))}
                              <p className="mt-1 text-slate-300">请先解决以上阻断性问题</p>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn btn-success"
                            onClick={() => handleApprove(permit.id)}
                            disabled={fetcher.state !== "idle"}
                          >
                            通过验收
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            handleRejectClick(permit.id, permit.permitNumber)
                          }
                          disabled={fetcher.state !== "idle"}
                        >
                          驳回
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">已验收历史记录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  许可证编号
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  承包商
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  作业类型
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  验收时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {approvedHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    暂无验收历史记录
                  </td>
                </tr>
              ) : (
                approvedHistory.map((permit) => (
                  <tr
                    key={permit.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/permits/${permit.id}`)}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-medium text-slate-900">
                        {permit.permitNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {permit.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {permit.contractorName || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600">
                        {getWorkTypeLabel(permit.workType)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(permit.status)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDateTime(permit.safetyApprovedAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedPermit(null);
        }}
        onConfirm={handleRejectConfirm}
        permitNumber={selectedPermit?.permitNumber || ""}
      />
    </div>
  );
}
