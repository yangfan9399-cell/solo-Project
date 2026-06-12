import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useActionData } from "@remix-run/react";
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
      },
      attachments: {
        orderBy: (attachments, { desc }) => [desc(attachments.uploadedAt)],
      },
    },
  });

  if (!complaint) {
    throw new Response("Not Found", { status: 404 });
  }

  const allUsers = await db.query.users.findMany();

  return json({ complaint, allUsers });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const id = parseInt(params.id || "0");
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  const complaint = await db.query.complaints.findFirst({
    where: eq(complaints.id, id),
    with: {
      nodes: {
        orderBy: (nodes, { desc }) => [desc(nodes.sortOrder)],
        limit: 1,
      },
    },
  });

  if (!complaint) {
    return json({ error: "案件不存在" }, { status: 404 });
  }

  if (complaint.isArchived && actionType !== "reprocess") {
    return json({ error: "已归档案件只读，如需修改请先重新处理" }, { status: 400 });
  }

  const currentUser = { id: 1, name: "张伟", role: "applicant" };
  const reviewer = { id: 3, name: "王强", role: "reviewer" };
  const archivist = { id: 4, name: "刘芳", role: "archivist" };

  const maxSortOrder = complaint.nodes[0]?.sortOrder || 0;
  const nextSortOrder = maxSortOrder + 1;

  switch (actionType) {
    case "supplement": {
      const businessRecord = formData.get("businessRecord") as string;
      const siteDescription = formData.get("siteDescription") as string;
      const noiseLevelBefore = formData.get("noiseLevelBefore") as string;
      const noiseLevelAfter = formData.get("noiseLevelAfter") as string;
      const fineAmount = formData.get("fineAmount") as string;
      const conclusion = formData.get("conclusion") as string;

      const changes: Record<string, any> = {};
      const diffFields: string[] = [];

      if (noiseLevelBefore && complaint.noiseLevelBefore?.toString() !== noiseLevelBefore) {
        changes.noiseLevelBefore = noiseLevelBefore;
        diffFields.push("noiseLevelBefore");
      }
      if (noiseLevelAfter && complaint.noiseLevelAfter?.toString() !== noiseLevelAfter) {
        changes.noiseLevelAfter = noiseLevelAfter;
        diffFields.push("noiseLevelAfter");
      }
      if (fineAmount && complaint.fineAmount?.toString() !== fineAmount) {
        changes.fineAmount = fineAmount;
        diffFields.push("fineAmount");
      }
      if (conclusion && complaint.conclusion !== conclusion) {
        changes.conclusion = conclusion;
        diffFields.push("conclusion");
      }

      if (diffFields.length === 0) {
        return json({ error: "没有检测到字段变更" }, { status: 400 });
      }

      changes.currentStatus = "processing";
      changes.hasException = false;
      changes.exceptionType = null;
      changes.blockingReason = null;
      changes.remedyPath = null;

      await db.update(complaints)
        .set({
          ...changes,
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "supplement",
        status: "processing",
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: `补充材料：${businessRecord || siteDescription || "更新了业务数据"}`,
        changes: JSON.stringify(changes),
        diffFields: JSON.stringify(diffFields),
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process`);
    }

    case "submitReview": {
      await db.update(complaints)
        .set({
          currentStatus: "review",
          updatedAt: new Date(),
          hasException: false,
          exceptionType: null,
          blockingReason: null,
          remedyPath: null,
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "process",
        status: "review",
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: formData.get("remark") as string || "处理完成，提交复核",
        changes: JSON.stringify({ currentStatus: "review" }),
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process`);
    }

    case "reviewPass": {
      await db.update(complaints)
        .set({
          currentStatus: "archived",
          reviewedAt: new Date(),
          updatedAt: new Date(),
          hasException: false,
          exceptionType: null,
          blockingReason: null,
          remedyPath: null,
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "review",
        status: "archived",
        operatorId: reviewer.id,
        operatorName: reviewer.name,
        operatorRole: reviewer.role,
        remark: formData.get("remark") as string || "复核通过，移交归档",
        changes: JSON.stringify({ currentStatus: "archived", reviewedAt: new Date().toISOString() }),
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process`);
    }

    case "reject": {
      const rejectReason = formData.get("rejectReason") as string;
      const diffFieldsStr = formData.get("diffFields") as string;
      const diffFields = diffFieldsStr ? diffFieldsStr.split(",").map(s => s.trim()).filter(Boolean) : [];

      const blockingReason = formData.get("blockingReason") as string || "资料不完整，退回补证";
      const remedyPath = formData.get("remedyPath") as string || "请补充完整相关材料后重新提交";
      const exceptionType = formData.get("exceptionType") as string || "missing_fields";

      await db.update(complaints)
        .set({
          currentStatus: "rejected",
          hasException: true,
          exceptionType,
          blockingReason,
          remedyPath,
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "reject",
        status: "rejected",
        operatorId: reviewer.id,
        operatorName: reviewer.name,
        operatorRole: reviewer.role,
        remark: rejectReason,
        isBlocking: true,
        blockingReason,
        remedyPath,
        diffFields: JSON.stringify(diffFields),
        changes: JSON.stringify({
          currentStatus: "rejected",
          hasException: true,
          exceptionType,
        }),
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process`);
    }

    case "archive": {
      await db.update(complaints)
        .set({
          isArchived: true,
          currentStatus: "archived",
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "archive",
        status: "archived",
        operatorId: archivist.id,
        operatorName: archivist.name,
        operatorRole: archivist.role,
        remark: `档案已归档，归档编号：DA-ZS-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`,
        changes: JSON.stringify({ isArchived: true, archivedAt: new Date().toISOString() }),
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}`);
    }

    case "reprocess": {
      await db.update(complaints)
        .set({
          isArchived: false,
          currentStatus: "processing",
          hasException: true,
          exceptionType: "reprocess",
          updatedAt: new Date(),
          currentHandlerId: currentUser.id,
          conclusion: complaint.conclusion ? complaint.conclusion + "（注：因投诉人再次投诉，已启动重新处理程序）" : undefined,
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "reprocess",
        status: "processing",
        operatorId: reviewer.id,
        operatorName: reviewer.name,
        operatorRole: reviewer.role,
        remark: formData.get("remark") as string || "接到新的投诉或发现新问题，启动重新处理程序。原档案保留，重新处理后生成新节点序列。",
        changes: JSON.stringify({
          currentStatus: "processing",
          isArchived: false,
          hasException: true,
          exceptionType: "reprocess",
        }),
        diffFields: JSON.stringify(["currentStatus", "isArchived", "conclusion"]),
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process`);
    }

    default:
      return json({ error: "未知操作" }, { status: 400 });
  }
}

export default function ComplaintProcess() {
  const { complaint } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [activeTab, setActiveTab] = useState<"supplement" | "review" | "archive">("supplement");

  const statusInfo = STATUS_MAP[complaint.currentStatus] || { label: complaint.currentStatus, color: "text-gray-700", bgColor: "bg-gray-100" };
  const exceptionInfo = complaint.exceptionType ? EXCEPTION_TYPE_MAP[complaint.exceptionType] : null;

  const isArchived = complaint.isArchived;
  const canSupplement = !isArchived && (complaint.currentStatus === "processing" || complaint.currentStatus === "rejected");
  const canReview = !isArchived && complaint.currentStatus === "review";
  const canArchive = !isArchived && complaint.currentStatus === "archived";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/complaints/${complaint.id}`} className="text-slate-500 hover:text-slate-700">
            ← 返回详情
          </Link>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-sm text-slate-500">{complaint.caseNo}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {isArchived && (
            <span className="text-sm text-slate-500">🔒 只读</span>
          )}
        </div>
      </div>

      {isArchived && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h3 className="font-semibold text-amber-800">案件已归档</h3>
                <p className="text-sm text-amber-700">归档时间：{formatDate(complaint.archivedAt)}</p>
              </div>
            </div>
            <Form method="post">
              <input type="hidden" name="actionType" value="reprocess" />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                onClick={(e) => {
                  if (!confirm("确定要重新处理此案件吗？重新处理将生成新的节点序列，原档案保留。")) {
                    e.preventDefault();
                  }
                }}
              >
                🔄 重新处理
              </button>
            </Form>
          </div>
        </div>
      )}

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
              <p className="text-red-700 mb-2">
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

      {!isArchived && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("supplement")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "supplement"
                    ? "border-blue-500 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📝 补充材料
                {complaint.currentStatus === "rejected" && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs">待补证</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("review")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "review"
                    ? "border-blue-500 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                ✅ 复核审批
                {complaint.currentStatus === "review" && (
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-xs">待复核</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("archive")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "archive"
                    ? "border-blue-500 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📦 归档管理
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "supplement" && (
              <SupplementTab complaint={complaint} disabled={!canSupplement} />
            )}
            {activeTab === "review" && (
              <ReviewTab complaint={complaint} disabled={!canReview} />
            )}
            {activeTab === "archive" && (
              <ArchiveTab complaint={complaint} />
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📋 当前案件信息</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCell label="处理前噪声" value={formatNoise(complaint.noiseLevelBefore)} />
          <InfoCell label="处理后噪声" value={formatNoise(complaint.noiseLevelAfter)} />
          <InfoCell label="罚款金额" value={formatCurrency(complaint.fineAmount)} />
          <InfoCell label="责任单位" value={complaint.responsibleParty || "-"} />
          <InfoCell label="违法类型" value={complaint.violationType || "-"} />
          <InfoCell label="法律依据" value={complaint.legalBasis || "-"} />
          <InfoCell label="当前处理人" value={complaint.currentHandler?.name || "-"} />
          <InfoCell label="案件来源" value={complaint.source} />
        </div>
        <div className="mt-4">
          <label className="text-sm text-slate-500">处理结论</label>
          <div className="mt-1 p-3 bg-slate-50 rounded-lg text-slate-700">
            {complaint.conclusion || <span className="text-slate-400 italic">暂无结论</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplementTab({ complaint, disabled }: { complaint: any; disabled: boolean }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        💡 <strong>申请人操作区：</strong>您可以补充业务记录、现场说明、证据附件，以及更新相关业务字段。
      </div>

      <Form method="post" className="space-y-6">
        <input type="hidden" name="actionType" value="supplement" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              业务记录
            </label>
            <textarea
              name="businessRecord"
              rows={3}
              disabled={disabled}
              placeholder="请补充业务相关记录..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              现场说明
            </label>
            <textarea
              name="siteDescription"
              rows={3}
              disabled={disabled}
              placeholder="请描述现场情况..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              处理前噪声值 (dB)
            </label>
            <input
              type="number"
              name="noiseLevelBefore"
              defaultValue={complaint.noiseLevelBefore || ""}
              step="0.1"
              disabled={disabled}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              处理后噪声值 (dB)
            </label>
            <input
              type="number"
              name="noiseLevelAfter"
              defaultValue={complaint.noiseLevelAfter || ""}
              step="0.1"
              disabled={disabled}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              罚款金额 (元)
            </label>
            <input
              type="number"
              name="fineAmount"
              defaultValue={complaint.fineAmount || ""}
              step="0.01"
              disabled={disabled}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            处理结论
          </label>
          <textarea
            name="conclusion"
            rows={3}
            defaultValue={complaint.conclusion || ""}
            disabled={disabled}
            placeholder="请填写处理结论..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            证据附件上传
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm text-slate-500 mb-2">点击或拖拽文件到此处上传</p>
            <p className="text-xs text-slate-400">支持图片、PDF、音频、视频等格式</p>
            <p className="text-xs text-amber-500 mt-2">（演示环境：暂不支持真实文件上传）</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={disabled}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存草稿
          </button>
          <button
            type="submit"
            disabled={disabled}
            formAction="?actionType=supplement"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 保存补充
          </button>
          <Form method="post" className="inline">
            <input type="hidden" name="actionType" value="submitReview" />
            <input type="hidden" name="remark" value="补充完成，提交复核" />
            <button
              type="submit"
              disabled={disabled}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ 提交复核
            </button>
          </Form>
        </div>
      </Form>
    </div>
  );
}

function ReviewTab({ complaint, disabled }: { complaint: any; disabled: boolean }) {
  const [rejectMode, setRejectMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
        ✅ <strong>复核人操作区：</strong>您可以确认结论并通过，或退回补证。请仔细核查所有材料的完整性和准确性。
      </div>

      {!rejectMode ? (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">复核要点</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className={complaint.noiseLevelBefore ? "text-green-500" : "text-red-500"}>
                  {complaint.noiseLevelBefore ? "✓" : "✗"}
                </span>
                处理前噪声监测数据
              </li>
              <li className="flex items-center gap-2">
                <span className={complaint.noiseLevelAfter ? "text-green-500" : "text-red-500"}>
                  {complaint.noiseLevelAfter ? "✓" : "✗"}
                </span>
                处理后噪声监测数据（整改复测）
              </li>
              <li className="flex items-center gap-2">
                <span className={complaint.fineAmount ? "text-green-500" : "text-red-500"}>
                  {complaint.fineAmount ? "✓" : "✗"}
                </span>
                处罚金额确认
              </li>
              <li className="flex items-center gap-2">
                <span className={complaint.legalBasis ? "text-green-500" : "text-red-500"}>
                  {complaint.legalBasis ? "✓" : "✗"}
                </span>
                法律依据完整
              </li>
              <li className="flex items-center gap-2">
                <span className={complaint.conclusion ? "text-green-500" : "text-red-500"}>
                  {complaint.conclusion ? "✓" : "✗"}
                </span>
                处理结论明确
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                证据附件齐全
              </li>
            </ul>
          </div>

          <Form method="post">
            <input type="hidden" name="actionType" value="reviewPass" />
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                复核意见
              </label>
              <textarea
                name="remark"
                rows={2}
                disabled={disabled}
                placeholder="请填写复核意见（选填）..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectMode(true)}
                disabled={disabled}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↩️ 退回补证
              </button>
              <button
                type="submit"
                disabled={disabled}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ 复核通过
              </button>
            </div>
          </Form>
        </div>
      ) : (
        <Form method="post" className="space-y-4">
          <input type="hidden" name="actionType" value="reject" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              异常类型
            </label>
            <select
              name="exceptionType"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="missing_fields">记录漏填</option>
              <option value="attachment_version_mismatch">附件版本不一致</option>
              <option value="reprocess">需要重新处理</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              退回原因 / 阻断原因
            </label>
            <textarea
              name="blockingReason"
              rows={3}
              required
              placeholder="请详细说明退回原因，指出存在的问题..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              补救路径 / 整改要求
            </label>
            <textarea
              name="remedyPath"
              rows={3}
              required
              placeholder="请说明需要补充或修改的内容，以及具体要求..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              差异字段（用逗号分隔）
            </label>
            <input
              type="text"
              name="diffFields"
              placeholder="例如: noiseLevelAfter, fineAmount, conclusion"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              可选字段：noiseLevelBefore, noiseLevelAfter, fineAmount, responsibleParty, legalBasis, conclusion, attachments
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              备注说明
            </label>
            <textarea
              name="rejectReason"
              rows={2}
              placeholder="补充说明..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRejectMode(false)}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              ↩️ 确认退回
            </button>
          </div>
        </Form>
      )}
    </div>
  );
}

function ArchiveTab({ complaint }: { complaint: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50/50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
        📦 <strong>归档人操作区：</strong>复核通过的案件将自动进入归档状态。归档后案件只读，如需修改需先重新处理。
      </div>

      <div className="bg-slate-50 rounded-lg p-6 text-center">
        {complaint.isArchived ? (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">案件已归档</h3>
            <p className="text-sm text-slate-500 mb-4">
              归档时间：{formatDate(complaint.archivedAt)}
            </p>
            <p className="text-sm text-slate-500">
              归档后案件只读，如需修改请点击「重新处理」
            </p>
          </>
        ) : complaint.currentStatus === "archived" ? (
          <>
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">待归档</h3>
            <p className="text-sm text-slate-500 mb-4">
              该案件已通过复核，等待归档
            </p>
            <Form method="post">
              <input type="hidden" name="actionType" value="archive" />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                📦 确认归档
              </button>
            </Form>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">尚未到达归档环节</h3>
            <p className="text-sm text-slate-500">
              当前状态：{STATUS_MAP[complaint.currentStatus]?.label || complaint.currentStatus}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              案件需经过「受理 → 处理 → 复核」后才能归档
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-700 truncate">{value}</div>
    </div>
  );
}
