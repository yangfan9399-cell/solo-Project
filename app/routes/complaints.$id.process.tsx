import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useActionData, useNavigation } from "@remix-run/react";
import { db } from "~/db";
import { complaints, complaintNodes, attachments, users } from "~/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { STATUS_MAP, NODE_TYPE_MAP, EXCEPTION_TYPE_MAP, FIELD_LABEL_MAP, formatDate, formatCurrency, formatNoise } from "~/lib/utils";
import { useState } from "react";

type Role = "applicant" | "reviewer" | "archivist";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const id = parseInt(params.id || "0");

  const url = new URL(request.url);
  const role = (url.searchParams.get("role") || "applicant") as Role;

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

  return json({ complaint, allUsers, currentRole: role });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const id = parseInt(params.id || "0");
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const role = (formData.get("role") as Role) || "applicant";

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

  const usersMap: Record<string, { id: number; name: string; role: Role }> = {
    applicant: { id: 1, name: "张伟", role: "applicant" },
    reviewer: { id: 3, name: "王强", role: "reviewer" },
    archivist: { id: 4, name: "刘芳", role: "archivist" },
  };

  const currentUser = usersMap[role] || usersMap.applicant;
  const reviewer = usersMap.reviewer;
  const archivist = usersMap.archivist;

  const maxSortOrder = complaint.nodes[0]?.sortOrder || 0;
  const nextSortOrder = maxSortOrder + 1;

  switch (actionType) {
    case "supplement": {
      if (role !== "applicant") {
        return json({ error: "只有申请人可以补充材料" }, { status: 403 });
      }

      const businessRecord = (formData.get("businessRecord") as string) || "";
      const siteDescription = (formData.get("siteDescription") as string) || "";
      const attachmentName = (formData.get("attachmentName") as string) || "";
      const attachmentType = (formData.get("attachmentType") as string) || "evidence";
      const attachmentDescription = (formData.get("attachmentDescription") as string) || "";

      if (!businessRecord && !siteDescription && !attachmentName) {
        return json({ error: "请至少填写一项补充内容" }, { status: 400 });
      }

      const remarkParts: string[] = [];
      if (businessRecord) remarkParts.push(`业务记录：${businessRecord}`);
      if (siteDescription) remarkParts.push(`现场说明：${siteDescription}`);
      if (attachmentName) remarkParts.push(`上传证据附件：${attachmentName}`);

      const node = await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "supplement",
        status: "processing",
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: remarkParts.join("；"),
        changes: null,
        diffFields: null,
        sortOrder: nextSortOrder,
      }).returning();

      if (attachmentName) {
        await db.insert(attachments).values({
          complaintId: id,
          nodeId: node[0].id,
          type: attachmentType,
          name: attachmentName,
          url: `/attachments/${id}_${Date.now()}_${attachmentName}`,
          version: 1,
          uploadedBy: currentUser.id,
          isEvidence: true,
          evidenceConclusion: "待核实",
          description: attachmentDescription || null,
        });
      }

      await db.update(complaints)
        .set({
          currentStatus: "processing",
          hasException: false,
          exceptionType: null,
          blockingReason: null,
          remedyPath: null,
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, id));

      return redirect(`/complaints/${id}/process?role=${role}`);
    }

    case "submitReview": {
      if (role !== "applicant") {
        return json({ error: "只有申请人可以提交复核" }, { status: 403 });
      }

      await db.update(complaints)
        .set({
          currentStatus: "review",
          updatedAt: new Date(),
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "process",
        status: "review",
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: "补充完成，提交复核",
        changes: { currentStatus: "review" },
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process?role=${role}`);
    }

    case "reviewPass": {
      if (role !== "reviewer") {
        return json({ error: "只有复核人可以通过复核" }, { status: 403 });
      }

      const remark = (formData.get("remark") as string) || "复核通过，移交归档";

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
        remark,
        changes: { currentStatus: "archived", reviewedAt: new Date().toISOString() },
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process?role=${role}`);
    }

    case "reject": {
      if (role !== "reviewer") {
        return json({ error: "只有复核人可以退回补证" }, { status: 403 });
      }

      const rejectReason = (formData.get("rejectReason") as string) || "";
      const diffFieldsStr = (formData.get("diffFields") as string) || "";
      const diffFields = diffFieldsStr ? diffFieldsStr.split(",").map(s => s.trim()).filter(Boolean) : [];

      const blockingReason = (formData.get("blockingReason") as string) || "资料不完整，退回补证";
      const remedyPath = (formData.get("remedyPath") as string) || "请补充完整相关材料后重新提交";
      const exceptionType = (formData.get("exceptionType") as string) || "missing_fields";

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
        remark: rejectReason || blockingReason,
        isBlocking: true,
        blockingReason,
        remedyPath,
        diffFields: diffFields,
        changes: {
          currentStatus: "rejected",
          hasException: true,
          exceptionType,
        },
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process?role=${role}`);
    }

    case "archive": {
      if (role !== "archivist") {
        return json({ error: "只有归档员可以归档" }, { status: 403 });
      }

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
        changes: { isArchived: true, archivedAt: new Date().toISOString() },
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}?role=${role}`);
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
          conclusion: complaint.conclusion
            ? complaint.conclusion + "（注：因投诉人再次投诉，已启动重新处理程序）"
            : undefined,
        })
        .where(eq(complaints.id, id));

      await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "reprocess",
        status: "processing",
        operatorId: reviewer.id,
        operatorName: reviewer.name,
        operatorRole: reviewer.role,
        remark: (formData.get("remark") as string) || "接到新的投诉或发现新问题，启动重新处理程序。原档案保留，重新处理后生成新节点序列。",
        changes: {
          currentStatus: "processing",
          isArchived: false,
          hasException: true,
          exceptionType: "reprocess",
        },
        diffFields: ["currentStatus", "isArchived", "conclusion"],
        sortOrder: nextSortOrder,
      });

      return redirect(`/complaints/${id}/process?role=${role}`);
    }

    case "uploadAttachment": {
      if (role !== "applicant") {
        return json({ error: "只有申请人可以上传证据附件" }, { status: 403 });
      }

      const attName = (formData.get("attachmentName") as string) || "";
      const attType = (formData.get("attachmentType") as string) || "evidence";
      const attDescription = (formData.get("attachmentDescription") as string) || "";

      if (!attName) {
        return json({ error: "请输入附件名称" }, { status: 400 });
      }

      const existingVersions = await db.query.attachments.findMany({
        where: and(
          eq(attachments.complaintId, id),
          eq(attachments.type, attType),
        ),
      });
      const maxVersion = existingVersions.length > 0
        ? Math.max(...existingVersions.map(a => a.version || 0))
        : 0;

      const node = await db.insert(complaintNodes).values({
        complaintId: id,
        nodeType: "supplement",
        status: complaint.currentStatus,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: `上传证据附件：${attName}`,
        changes: null,
        diffFields: null,
        sortOrder: nextSortOrder,
      }).returning();

      await db.insert(attachments).values({
        complaintId: id,
        nodeId: node[0].id,
        type: attType,
        name: attName,
        url: `/attachments/${id}_${Date.now()}_${attName}`,
        version: maxVersion + 1,
        uploadedBy: currentUser.id,
        isEvidence: true,
        evidenceConclusion: "待核实",
        description: attDescription || null,
      });

      return redirect(`/complaints/${id}/process?role=${role}`);
    }

    default:
      return json({ error: "未知操作" }, { status: 400 });
  }
}

export default function ComplaintProcess() {
  const { complaint, currentRole } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const statusInfo = STATUS_MAP[complaint.currentStatus] || { label: complaint.currentStatus, color: "text-gray-700", bgColor: "bg-gray-100" };
  const exceptionInfo = complaint.exceptionType ? EXCEPTION_TYPE_MAP[complaint.exceptionType] : null;

  const isArchived = complaint.isArchived;

  const canApplicantAct = !isArchived && currentRole === "applicant" && (complaint.currentStatus === "processing" || complaint.currentStatus === "rejected");
  const canReviewerAct = !isArchived && currentRole === "reviewer" && complaint.currentStatus === "review";
  const canArchivistAct = !isArchived && currentRole === "archivist" && complaint.currentStatus === "archived";

  function roleUrl(r: Role) {
    return `/complaints/${complaint.id}/process?role=${r}`;
  }

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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">当前角色：</span>
          <div className="flex gap-2">
            {(["applicant", "reviewer", "archivist"] as Role[]).map((r) => (
              <Link
                key={r}
                to={roleUrl(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentRole === r
                    ? r === "applicant"
                      ? "bg-blue-600 text-white"
                      : r === "reviewer"
                      ? "bg-amber-600 text-white"
                      : "bg-green-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r === "applicant" ? "📝 申请人" : r === "reviewer" ? "✅ 复核人" : "📦 归档员"}
              </Link>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-2">切换角色以模拟不同权限操作</span>
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
            {currentRole === "reviewer" && (
              <Form method="post">
                <input type="hidden" name="actionType" value="reprocess" />
                <input type="hidden" name="role" value={currentRole} />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                  onClick={(e) => {
                    if (!confirm("确定要重新处理此案件吗？重新处理将生成新的节点序列，原档案保留。")) {
                      e.preventDefault();
                    }
                  }}
                >
                  🔄 重新处理
                </button>
              </Form>
            )}
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

      {actionData && "error" in actionData && actionData.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          ❌ {actionData.error}
        </div>
      )}

      {!isArchived && (
        <div className="space-y-6">
          {currentRole === "applicant" && (
            <ApplicantPanel
              complaint={complaint}
              canAct={canApplicantAct}
              role={currentRole}
              isSubmitting={isSubmitting}
            />
          )}

          {currentRole === "reviewer" && (
            <ReviewerPanel
              complaint={complaint}
              canAct={canReviewerAct}
              role={currentRole}
              isSubmitting={isSubmitting}
            />
          )}

          {currentRole === "archivist" && (
            <ArchivistPanel
              complaint={complaint}
              canAct={canArchivistAct}
              role={currentRole}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📋 当前案件信息（只读参考）</h3>
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

function ApplicantPanel({ complaint, canAct, role, isSubmitting }: {
  complaint: any;
  canAct: boolean;
  role: Role;
  isSubmitting: boolean;
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <h3 className="font-semibold text-blue-800">申请人操作区</h3>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">角色：申请人</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">您只能补充业务记录、现场说明和证据附件。噪声值、罚款金额、处理结论等关键字段由复核人填写。</p>
        {!canAct && (
          <p className="text-sm text-red-600 mt-2 font-medium">
            ⚠️ 当前案件状态不允许申请人操作（{STATUS_MAP[complaint.currentStatus]?.label || complaint.currentStatus}）
          </p>
        )}
      </div>

      <div className="p-6 space-y-6">
        <Form method="post" className="space-y-6">
          <input type="hidden" name="actionType" value="supplement" />
          <input type="hidden" name="role" value={role} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                业务记录 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="businessRecord"
                rows={4}
                disabled={!canAct || isSubmitting}
                placeholder="请补充业务相关记录，例如：监测过程描述、整改措施说明等..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                现场说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="siteDescription"
                rows={4}
                disabled={!canAct || isSubmitting}
                placeholder="请描述现场情况，例如：噪声源确认、周边环境影响、当事人配合情况等..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-700">证据附件</label>
              <button
                type="button"
                disabled={!canAct || isSubmitting}
                onClick={() => setShowUpload(!showUpload)}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showUpload ? "收起上传区" : "➕ 添加附件"}
              </button>
            </div>

            {showUpload && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">附件名称</label>
                    <input
                      type="text"
                      name="attachmentName"
                      disabled={!canAct || isSubmitting}
                      placeholder="例如：现场照片1.jpg"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">附件类型</label>
                    <select
                      name="attachmentType"
                      disabled={!canAct || isSubmitting}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100"
                    >
                      <option value="evidence">证据材料</option>
                      <option value="photo">现场照片</option>
                      <option value="report">监测报告</option>
                      <option value="audio">现场录音</option>
                      <option value="document">公文文书</option>
                      <option value="video">现场视频</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">附件说明</label>
                  <input
                    type="text"
                    name="attachmentDescription"
                    disabled={!canAct || isSubmitting}
                    placeholder="简要说明附件内容和用途"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100"
                  />
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-white">
                  <div className="text-2xl mb-1">📎</div>
                  <p className="text-sm text-slate-500">点击选择文件或拖拽到此处</p>
                  <p className="text-xs text-slate-400 mt-1">支持图片、PDF、音频、视频（演示环境自动创建附件记录）</p>
                  <input type="file" className="hidden" disabled={!canAct} />
                </div>
              </div>
            )}

            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-500">已上传附件：</p>
                {complaint.attachments.map((att: any) => (
                  <div key={att.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                    <span>📎</span>
                    <span className="text-slate-700">{att.name}</span>
                    <span className="text-xs text-slate-400">v{att.version}</span>
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
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={!canAct || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "提交中..." : "💾 保存补充材料"}
            </button>
            <Form method="post" className="inline">
              <input type="hidden" name="actionType" value="submitReview" />
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                disabled={!canAct || isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ 提交复核
              </button>
            </Form>
          </div>
        </Form>
      </div>
    </div>
  );
}

function ReviewerPanel({ complaint, canAct, role, isSubmitting }: {
  complaint: any;
  canAct: boolean;
  role: Role;
  isSubmitting: boolean;
}) {
  const [rejectMode, setRejectMode] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <h3 className="font-semibold text-amber-800">复核人操作区</h3>
          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">角色：复核人</span>
        </div>
        <p className="text-sm text-amber-700 mt-1">您可以确认结论并通过复核，或退回补证并指定异常类型和差异字段。</p>
        {!canAct && (
          <p className="text-sm text-red-600 mt-2 font-medium">
            ⚠️ 当前案件状态不允许复核操作（{STATUS_MAP[complaint.currentStatus]?.label || complaint.currentStatus}）
          </p>
        )}
      </div>

      <div className="p-6 space-y-6">
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
          </ul>
        </div>

        {!rejectMode ? (
          <Form method="post">
            <input type="hidden" name="actionType" value="reviewPass" />
            <input type="hidden" name="role" value={role} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">复核意见</label>
              <textarea
                name="remark"
                rows={2}
                disabled={!canAct || isSubmitting}
                placeholder="请填写复核意见（选填）..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectMode(true)}
                disabled={!canAct || isSubmitting}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↩️ 退回补证
              </button>
              <button
                type="submit"
                disabled={!canAct || isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ 复核通过
              </button>
            </div>
          </Form>
        ) : (
          <Form method="post" className="space-y-4">
            <input type="hidden" name="actionType" value="reject" />
            <input type="hidden" name="role" value={role} />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">异常类型</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">退回原因 / 阻断原因</label>
              <textarea
                name="blockingReason"
                rows={3}
                required
                placeholder="请详细说明退回原因，指出存在的问题..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">补救路径 / 整改要求</label>
              <textarea
                name="remedyPath"
                rows={3}
                required
                placeholder="请说明需要补充或修改的内容，以及具体要求..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">差异字段（用逗号分隔）</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">备注说明</label>
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
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                ↩️ 确认退回
              </button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}

function ArchivistPanel({ complaint, canAct, role, isSubmitting }: {
  complaint: any;
  canAct: boolean;
  role: Role;
  isSubmitting: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <h3 className="font-semibold text-green-800">归档员操作区</h3>
          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">角色：归档员</span>
        </div>
        <p className="text-sm text-green-700 mt-1">您负责确认结论并归档，或退回补证。归档后案件只读。</p>
      </div>

      <div className="p-6">
        <div className="bg-slate-50 rounded-lg p-6 text-center">
          {complaint.isArchived ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">案件已归档</h3>
              <p className="text-sm text-slate-500 mb-4">归档时间：{formatDate(complaint.archivedAt)}</p>
              <p className="text-sm text-slate-500">归档后案件只读，如需修改需复核人发起重新处理</p>
            </>
          ) : complaint.currentStatus === "archived" ? (
            <>
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">待归档</h3>
              <p className="text-sm text-slate-500 mb-4">该案件已通过复核，等待归档</p>
              <Form method="post">
                <input type="hidden" name="actionType" value="archive" />
                <input type="hidden" name="role" value={role} />
                <button
                  type="submit"
                  disabled={!canAct || isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
