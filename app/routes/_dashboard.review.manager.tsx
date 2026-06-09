import { useState } from "react";
import { useLoaderData, useNavigate, Form, useActionData, type MetaFunction } from "react-router";
import { db } from "~/db";
import { workPermits, contractors, approvalNodes } from "~/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export const meta: MetaFunction = () => {
  return [{ title: "项目管理审批 - 舞台搭建进场系统" }];
};

type WorkPermitWithContractor = InferSelectModel<typeof workPermits> & {
  contractorName: string | null;
};

interface LoaderData {
  pendingPermits: WorkPermitWithContractor[];
  historyPermits: WorkPermitWithContractor[];
}

export async function loader() {
  const pendingPermits = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      workType: workPermits.workType,
      status: workPermits.status,
      safetyApprovedAt: workPermits.safetyApprovedAt,
      createdAt: workPermits.createdAt,
      contractorId: workPermits.contractorId,
      contractorName: contractors.name,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .where(eq(workPermits.status, "safety_approved"))
    .orderBy(desc(workPermits.safetyApprovedAt));

  const historyPermits = await db
    .select({
      id: workPermits.id,
      permitNumber: workPermits.permitNumber,
      title: workPermits.title,
      workType: workPermits.workType,
      status: workPermits.status,
      managerApprovedAt: workPermits.managerApprovedAt,
      createdAt: workPermits.createdAt,
      contractorId: workPermits.contractorId,
      contractorName: contractors.name,
    })
    .from(workPermits)
    .leftJoin(contractors, eq(workPermits.contractorId, contractors.id))
    .where(
      or(
        eq(workPermits.status, "manager_rejected"),
        eq(workPermits.status, "archived")
      )
    )
    .orderBy(desc(workPermits.updatedAt));

  return {
    pendingPermits: pendingPermits as WorkPermitWithContractor[],
    historyPermits: historyPermits as WorkPermitWithContractor[],
  } satisfies LoaderData;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const permitId = parseInt(formData.get("permitId") as string, 10);
  const comment = formData.get("comment") as string | null;

  if (!permitId || isNaN(permitId)) {
    return { success: false, error: "无效的许可证ID" };
  }

  const operatorName = "项目经理";

  try {
    if (intent === "archive") {
      await db.transaction(async (tx) => {
        await tx
          .update(workPermits)
          .set({
            status: "archived",
            managerApprovedAt: sql`now()`,
            updatedAt: sql`now()`,
          })
          .where(eq(workPermits.id, permitId));

        await tx.insert(approvalNodes).values({
          permitId,
          role: "project_manager",
          action: "归档",
          status: "archived",
          comment: comment || null,
          operatorName,
        });
      });

      return { success: true, message: "已归档" };
    }

    if (intent === "reject") {
      await db.transaction(async (tx) => {
        await tx
          .update(workPermits)
          .set({
            status: "manager_rejected",
            updatedAt: sql`now()`,
          })
          .where(eq(workPermits.id, permitId));

        await tx.insert(approvalNodes).values({
          permitId,
          role: "project_manager",
          action: "退回",
          status: "manager_rejected",
          comment: comment || null,
          operatorName,
        });
      });

      return { success: true, message: "已退回" };
    }

    return { success: false, error: "无效的操作" };
  } catch (error) {
    console.error("审批操作失败:", error);
    return { success: false, error: "操作失败，请重试" };
  }
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    safety_approved: { label: "待项目经理审批", className: "badge-info" },
    manager_rejected: { label: "已退回", className: "badge-danger" },
    archived: { label: "已归档", className: "badge-secondary" },
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

export default function ReviewManager() {
  const { pendingPermits, historyPermits } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectPermitId, setRejectPermitId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const handleRejectClick = (permitId: number) => {
    setRejectPermitId(permitId);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectPermitId) return;
    setRejectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">项目管理审批</h1>
        <p className="text-slate-500 mt-1">项目经理审批作业许可证，可归档或退回</p>
      </div>

      <div className="card">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              待审批
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {pendingPermits.length}
              </span>
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("history")}
            >
              已处理
              <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                {historyPermits.length}
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
                    安全验收时间
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingPermits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      暂无待审批的作业许可证
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
                        <span className="text-sm text-slate-500">
                          {formatDateTime(permit.safetyApprovedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(permit.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn btn-secondary text-xs"
                            onClick={() => navigate(`/permits/${permit.id}`)}
                          >
                            查看详情
                          </button>
                          <Form method="post" className="inline">
                            <input type="hidden" name="permitId" value={permit.id} />
                            <input type="hidden" name="intent" value="archive" />
                            <button type="submit" className="btn btn-success text-xs">
                              归档
                            </button>
                          </Form>
                          <button
                            className="btn btn-danger text-xs"
                            onClick={() => handleRejectClick(permit.id)}
                          >
                            退回
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
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {historyPermits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      暂无已处理的记录
                    </td>
                  </tr>
                ) : (
                  historyPermits.map((permit) => (
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
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn btn-secondary text-xs"
                            onClick={() => navigate(`/permits/${permit.id}`)}
                          >
                            查看详情
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

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            {activeTab === "pending"
              ? `待审批 ${pendingPermits.length} 条`
              : `已处理 ${historyPermits.length} 条`}
          </p>
        </div>
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">退回作业许可证</h3>
              <p className="text-sm text-slate-500 mt-1">请填写退回原因</p>
            </div>
            <Form method="post" onSubmit={handleRejectSubmit}>
              <div className="p-6">
                <input type="hidden" name="permitId" value={rejectPermitId || ""} />
                <input type="hidden" name="intent" value="reject" />
                <div>
                  <label className="label">退回原因</label>
                  <textarea
                    name="comment"
                    className="input min-h-[120px] resize-y"
                    placeholder="请输入退回原因..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRejectModalOpen(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-danger">
                  确认退回
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
