import { useState } from "react";
import {
  useLoaderData,
  useActionData,
  useNavigate,
  Form,
  useNavigation,
} from "react-router";
import { db } from "~/db";
import { workPermits, contractors, approvalNodes } from "~/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { MetaFunction, ActionFunctionArgs } from "react-router";
import type { InferSelectModel } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "安保核验 - 舞台搭建进场系统" }];
};

type WorkPermitWithContractor = InferSelectModel<typeof workPermits> & {
  contractorName: string | null;
};

interface LoaderData {
  pendingPermits: WorkPermitWithContractor[];
  reviewedPermits: WorkPermitWithContractor[];
}

export async function loader() {
  const pendingPermits = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      workType: workPermits.workType,
      status: workPermits.status,
      submittedAt: workPermits.submittedAt,
      contractorId: workPermits.contractorId,
      contractorName: contractors.name,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .where(eq(workPermits.status, "submitted"))
    .orderBy(desc(workPermits.submittedAt));

  const reviewedPermits = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      workType: workPermits.workType,
      status: workPermits.status,
      submittedAt: workPermits.submittedAt,
      securityApprovedAt: workPermits.securityApprovedAt,
      contractorId: workPermits.contractorId,
      contractorName: contractors.name,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .where(
      sql`${workPermits.status} IN ('security_approved', 'security_rejected')`
    )
    .orderBy(desc(workPermits.updatedAt));

  return {
    pendingPermits: pendingPermits as WorkPermitWithContractor[],
    reviewedPermits: reviewedPermits as WorkPermitWithContractor[],
  } satisfies LoaderData;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const permitId = parseInt(formData.get("permitId") as string, 10);
  const comment = formData.get("comment") as string | null;

  if (isNaN(permitId)) {
    return { success: false, error: "无效的许可证ID" };
  }

  const permitResult = await db
    .select()
    .from(workPermits)
    .where(eq(workPermits.id, permitId));

  if (permitResult.length === 0) {
    return { success: false, error: "许可证不存在" };
  }

  const permit = permitResult[0];

  if (permit.status !== "submitted") {
    return { success: false, error: "该许可证当前状态不可进行安保核验" };
  }

  if (intent === "approve") {
    await db.transaction(async (tx) => {
      await tx
        .update(workPermits)
        .set({
          status: "security_approved",
          securityApprovedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workPermits.id, permitId));

      await tx.insert(approvalNodes).values({
        permitId,
        role: "security",
        action: "通过",
        status: "security_approved",
        comment: comment || null,
        operatorName: "安保管理员",
      });
    });

    return { success: true, message: "安保核验通过" };
  }

  if (intent === "reject") {
    if (!comment || comment.trim().length === 0) {
      return { success: false, error: "请输入驳回原因" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(workPermits)
        .set({
          status: "security_rejected",
          updatedAt: new Date(),
        })
        .where(eq(workPermits.id, permitId));

      await tx.insert(approvalNodes).values({
        permitId,
        role: "security",
        action: "驳回",
        status: "security_rejected",
        comment: comment.trim(),
        operatorName: "安保管理员",
      });
    });

    return { success: true, message: "已驳回申请" };
  }

  return { success: false, error: "未知操作" };
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    submitted: { label: "待核验", className: "badge-info" },
    security_approved: { label: "安保通过", className: "badge-success" },
    security_rejected: { label: "安保驳回", className: "badge-danger" },
  };
  const info = statusMap[status] || { label: status, className: "badge-secondary" };
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

function getWorkTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    stage_setup: "舞台搭建",
    lighting_install: "灯光安装",
    sound_install: "音响安装",
    truss_hoisting: "桁架吊装",
    scaffolding: "脚手架",
    electrical: "电气作业",
    general: "综合作业",
  };
  return typeMap[type] || type;
}

function formatDateTime(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecurityReview() {
  const { pendingPermits, reviewedPermits } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectPermitId, setRejectPermitId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const handleRejectClick = (permitId: number) => {
    setRejectPermitId(permitId);
    setRejectComment("");
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectPermitId || !rejectComment.trim()) return;
    setRejectModalOpen(false);
  };

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">安保核验</h1>
        <p className="text-slate-500 mt-1">场馆入场安保核验审批</p>
      </div>

      {actionData?.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{actionData.message}</p>
        </div>
      )}

      {actionData?.success === false && actionData.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{actionData.error}</p>
        </div>
      )}

      <div className="card">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              待核验
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {pendingPermits.length}
              </span>
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("history")}
            >
              已核验
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs">
                {reviewedPermits.length}
              </span>
            </button>
          </div>
        </div>

        {activeTab === "pending" && (
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
                    提交时间
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingPermits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      暂无待核验的作业许可证
                    </td>
                  </tr>
                ) : (
                  pendingPermits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <span
                          className="font-mono text-sm font-medium text-slate-900 cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/permits/${permit.id}`)}
                        >
                          {permit.permitNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-sm font-medium text-slate-900 cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/permits/${permit.id}`)}
                        >
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
                        <span className="text-sm text-slate-500">
                          {formatDateTime(permit.submittedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Form method="post">
                            <input type="hidden" name="intent" value="approve" />
                            <input type="hidden" name="permitId" value={permit.id} />
                            <button
                              type="submit"
                              className="btn btn-success"
                              disabled={isSubmitting}
                            >
                              通过
                            </button>
                          </Form>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleRejectClick(permit.id)}
                            disabled={isSubmitting}
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
        )}

        {activeTab === "history" && (
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
                    核验时间
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reviewedPermits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      暂无已核验记录
                    </td>
                  </tr>
                ) : (
                  reviewedPermits.map((permit) => (
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
                          {formatDateTime(permit.securityApprovedAt || permit.submittedAt)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            {activeTab === "pending"
              ? `待核验 ${pendingPermits.length} 条记录`
              : `已核验 ${reviewedPermits.length} 条记录`}
          </p>
        </div>
      </div>

      {rejectModalOpen && rejectPermitId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">驳回申请</h3>
              <p className="text-sm text-slate-500 mt-1">
                请输入驳回原因，以便承包商了解问题并进行整改
              </p>
            </div>
            <Form method="post" onSubmit={handleRejectConfirm}>
              <input type="hidden" name="intent" value="reject" />
              <input type="hidden" name="permitId" value={rejectPermitId} />
              <div className="p-6">
                <label className="label">驳回原因</label>
                <textarea
                  name="comment"
                  className="input min-h-[120px] resize-y"
                  placeholder="请详细描述驳回原因..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  required
                />
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isSubmitting || !rejectComment.trim()}
                >
                  {isSubmitting ? "提交中..." : "确认驳回"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
