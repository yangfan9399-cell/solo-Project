import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigate, useActionData } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { StatusBadge, DocumentStatusBadge } from "~/components/StatusBadge";
import { differenceInDays, format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { z } from "zod";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `${data?.trademark.trademarkName || "商标详情"} - 商标续展管理系统` }];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { trademarkId } = params;

  if (!trademarkId) {
    throw redirect("/trademarks");
  }

  const trademark = await prisma.trademark.findUnique({
    where: { id: trademarkId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      consultant: { select: { id: true, name: true, email: true } },
      agent: { select: { id: true, name: true, email: true } },
      supervisor: { select: { id: true, name: true, email: true } },
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { name: true } },
        },
      },
      reviewHistories: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, role: true } },
        },
      },
      materialIssues: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!trademark) {
    throw redirect("/trademarks");
  }

  if (user.role === "CLIENT" && trademark.clientId !== user.id) {
    throw redirect("/");
  }
  if (user.role === "CONSULTANT" && trademark.consultantId !== user.id) {
    throw redirect("/");
  }

  return json({ user, trademark });
}

const DocumentSchema = z.object({
  type: z.enum(["TRADEMARK_CERTIFICATE", "IDENTITY_PROOF", "POWER_OF_ATTORNEY", "RENEWAL_APPLICATION", "OTHER"]),
  name: z.string().min(1, "文件名称不能为空"),
  fileUrl: z.string().min(1, "请输入文件链接"),
});

const ReviewSchema = z.object({
  action: z.enum(["approve", "reject", "submit", "archive", "abandon", "expedite"]),
  comment: z.string().optional(),
  rejectionReason: z.string().optional(),
  expeditedReason: z.string().optional(),
  issueType: z.string().optional(),
  issueDescription: z.string().optional(),
  documentIds: z.string().optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { trademarkId } = params;

  if (!trademarkId) {
    return json({ error: "商标ID不存在" }, { status: 400 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action");

  const trademark = await prisma.trademark.findUnique({
    where: { id: trademarkId },
  });

  if (!trademark) {
    return json({ error: "商标不存在" }, { status: 404 });
  }

  if (_action === "uploadDocument") {
    if (user.role !== "CLIENT" && user.role !== "CONSULTANT") {
      return json({ error: "无权限上传材料" }, { status: 403 });
    }

    const result = DocumentSchema.safeParse({
      type: formData.get("type"),
      name: formData.get("name"),
      fileUrl: formData.get("fileUrl"),
    });

    if (!result.success) {
      return json(
        { errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const newDoc = await prisma.document.create({
      data: {
        type: result.data.type,
        name: result.data.name,
        fileUrl: result.data.fileUrl,
        status: "UPLOADED",
        uploadedById: user.id,
        trademarkId: trademarkId,
      },
    });

    const rejectedDocsOfSameType = await prisma.document.findMany({
      where: {
        trademarkId: trademarkId,
        type: result.data.type,
        status: "REJECTED",
      },
      select: { id: true, rejectionReason: true },
    });

    if (rejectedDocsOfSameType.length > 0) {
      const rejectionReasons = rejectedDocsOfSameType
        .map((d) => d.rejectionReason)
        .filter(Boolean) as string[];

      if (rejectionReasons.length > 0) {
        await prisma.materialIssue.updateMany({
          where: {
            trademarkId: trademarkId,
            resolved: false,
            description: { in: rejectionReasons },
          },
          data: { resolved: true },
        });
      }

      const remainingIssues = await prisma.materialIssue.count({
        where: {
          trademarkId: trademarkId,
          resolved: false,
        },
      });

      if (remainingIssues === 0 && trademark.status === "MATERIALS_DEFICIENT") {
        await prisma.trademark.update({
          where: { id: trademarkId },
          data: { status: "MATERIALS_UPLOADED" },
        });

        await prisma.reviewHistory.create({
          data: {
            action: "材料补正完成",
            status: "MATERIALS_UPLOADED",
            trademarkId: trademarkId,
            userId: user.id,
            comment: `客户补正了${documentTypeLabels[result.data.type] || result.data.type}，所有材料问题已解决`,
          },
        });
      } else {
        await prisma.reviewHistory.create({
          data: {
            action: "材料补正",
            status: trademark.status,
            trademarkId: trademarkId,
            userId: user.id,
            comment: `客户补正了${documentTypeLabels[result.data.type] || result.data.type}`,
          },
        });
      }
    } else if (trademark.status === "PENDING_UPLOAD") {
      await prisma.trademark.update({
        where: { id: trademarkId },
        data: { status: "MATERIALS_UPLOADED" },
      });

      await prisma.reviewHistory.create({
        data: {
          action: "材料上传",
          status: "MATERIALS_UPLOADED",
          trademarkId: trademarkId,
          userId: user.id,
          comment: "客户上传了材料",
        },
      });
    }

    return json({ success: true, documentId: newDoc.id });
  }

  if (_action === "agentReview") {
    if (user.role !== "AGENT") {
      return json({ error: "无权限审核" }, { status: 403 });
    }

    const action = formData.get("action");
    const comment = formData.get("comment") as string | null;
    const issueType = formData.get("issueType") as string | null;
    const issueDescription = formData.get("issueDescription") as string | null;
    const documentIds = formData.getAll("documentIds") as string[];

    if (action === "reject") {
      const errors: Record<string, string[]> = {};

      if (!issueType || issueType.trim() === "") {
        errors.issueType = ["请选择问题类型"];
      }
      if (!issueDescription || issueDescription.trim() === "") {
        errors.issueDescription = ["请填写问题描述"];
      }
      if (!documentIds || documentIds.length === 0 || documentIds.every((id) => id.trim() === "")) {
        errors.documentIds = ["请至少选择一个关联材料"];
      }

      if (Object.keys(errors).length > 0) {
        return json(
          {
            errors,
            formValues: {
              action: "reject",
              issueType: issueType || "",
              issueDescription: issueDescription || "",
              comment: comment || "",
              documentIds: documentIds || [],
            },
          },
          { status: 400 }
        );
      }

      const validDocIds = documentIds.filter((id) => id.trim() !== "");

      await prisma.materialIssue.create({
        data: {
          issueType: issueType!,
          description: issueDescription!,
          trademarkId: trademarkId,
          resolved: false,
        },
      });

      if (validDocIds.length > 0) {
        await prisma.document.updateMany({
          where: {
            id: { in: validDocIds },
            trademarkId: trademarkId,
          },
          data: {
            status: "REJECTED",
            rejectionReason: issueDescription!,
          },
        });
      }

      await prisma.trademark.update({
        where: { id: trademarkId },
        data: {
          status: "MATERIALS_DEFICIENT",
          agentId: user.id,
        },
      });

      await prisma.reviewHistory.create({
        data: {
          action: "代理人审核驳回",
          status: "MATERIALS_DEFICIENT",
          trademarkId: trademarkId,
          userId: user.id,
          comment: comment || issueDescription,
        },
      });

      return redirect(`/trademarks/${trademarkId}`);
    }

    if (action === "approve") {
      await prisma.document.updateMany({
        where: { trademarkId: trademarkId, status: "UPLOADED" },
        data: { status: "APPROVED" },
      });

      await prisma.materialIssue.updateMany({
        where: { trademarkId: trademarkId, resolved: false },
        data: { resolved: true },
      });

      await prisma.trademark.update({
        where: { id: trademarkId },
        data: {
          status: "AGENT_APPROVED",
          agentId: user.id,
        },
      });

      await prisma.reviewHistory.create({
        data: {
          action: "代理人审核通过",
          status: "AGENT_APPROVED",
          trademarkId: trademarkId,
          userId: user.id,
          comment: comment || undefined,
        },
      });

      return redirect(`/trademarks/${trademarkId}`);
    }

    return json({ error: "未知操作" }, { status: 400 });
  }

  if (_action === "submit") {
    if (user.role !== "AGENT") {
      return json({ error: "无权限递交" }, { status: 403 });
    }

    await prisma.trademark.update({
      where: { id: trademarkId },
      data: {
        status: "SUBMITTED",
        agentId: user.id,
      },
    });

    await prisma.reviewHistory.create({
      data: {
        action: "已递交",
        status: "SUBMITTED",
        trademarkId: trademarkId,
        userId: user.id,
        comment: "代理人已递交续展申请",
      },
    });

    return redirect(`/trademarks/${trademarkId}`);
  }

  if (_action === "supervisorReview") {
    if (user.role !== "SUPERVISOR") {
      return json({ error: "无权限复核" }, { status: 403 });
    }

    const result = ReviewSchema.safeParse({
      action: formData.get("action"),
      comment: formData.get("comment"),
    });

    if (!result.success) {
      return json(
        { errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let newStatus = trademark.status;
    let actionText = "";

    if (result.data.action === "archive") {
      newStatus = "ARCHIVED";
      actionText = "主管复核通过并归档";
    } else if (result.data.action === "reject") {
      newStatus = "SUPERVISOR_REVIEW";
      actionText = "主管复核驳回";
    }

    await prisma.trademark.update({
      where: { id: trademarkId },
      data: {
        status: newStatus,
        supervisorId: user.id,
      },
    });

    await prisma.reviewHistory.create({
      data: {
        action: actionText,
        status: newStatus,
        trademarkId: trademarkId,
        userId: user.id,
        comment: result.data.comment,
      },
    });

    return redirect(`/trademarks/${trademarkId}`);
  }

  if (_action === "expedite") {
    if (user.role !== "CONSULTANT" && user.role !== "AGENT") {
      return json({ error: "无权限设置加急" }, { status: 403 });
    }

    const expeditedReason = formData.get("expeditedReason") as string;

    await prisma.trademark.update({
      where: { id: trademarkId },
      data: {
        isExpedited: true,
        expeditedReason,
        status: "EXPEDITED",
      },
    });

    await prisma.reviewHistory.create({
      data: {
        action: "设置加急",
        status: "EXPEDITED",
        trademarkId: trademarkId,
        userId: user.id,
        comment: expeditedReason || "临期加急处理",
      },
    });

    return redirect(`/trademarks/${trademarkId}`);
  }

  if (_action === "abandon") {
    if (user.role !== "CLIENT" && user.role !== "CONSULTANT") {
      return json({ error: "无权限放弃" }, { status: 403 });
    }

    const comment = formData.get("comment") as string;

    await prisma.trademark.update({
      where: { id: trademarkId },
      data: {
        status: "ABANDONED",
      },
    });

    await prisma.reviewHistory.create({
      data: {
        action: "客户放弃",
        status: "ABANDONED",
        trademarkId: trademarkId,
        userId: user.id,
        comment: comment || "客户放弃续展",
      },
    });

    return redirect(`/trademarks/${trademarkId}`);
  }

  return json({ error: "未知操作" }, { status: 400 });
}

const documentTypeLabels: Record<string, string> = {
  TRADEMARK_CERTIFICATE: "商标注册证",
  IDENTITY_PROOF: "身份证明文件",
  POWER_OF_ATTORNEY: "授权委托书",
  RENEWAL_APPLICATION: "续展申请书",
  OTHER: "其他材料",
};

const roleLabels: Record<string, string> = {
  CONSULTANT: "顾问",
  CLIENT: "客户",
  AGENT: "代理人",
  SUPERVISOR: "主管",
};

export default function TrademarkDetail() {
  const { user, trademark } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const rejectFormData = actionData as any;

  const daysLeft = differenceInDays(
    new Date(trademark.expiryDate),
    new Date()
  );
  const isUrgent = daysLeft <= 30;
  const isExpiring = daysLeft <= 90;

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {trademark.trademarkName}
              </h2>
              <StatusBadge status={trademark.status} />
              {trademark.isExpedited && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  加急处理
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              商标号：{trademark.trademarkNo}
            </p>
          </div>
        </div>
      </div>

      {isExpiring && daysLeft > 0 && (
        <div
          className={`rounded-lg p-4 ${
            isUrgent
              ? "bg-red-50 border border-red-200"
              : "bg-yellow-50 border border-yellow-200"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className={`h-5 w-5 ${isUrgent ? "text-red-400" : "text-yellow-400"}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isUrgent ? "text-red-800" : "text-yellow-800"}`}>
              商标即将到期
              </h3>
              <div className="mt-1 text-sm">
                <span className={`text-2xl font-bold ${isUrgent ? "text-red-600" : "text-yellow-600"}`}>
                  剩余 {daysLeft} 天
                </span>
                <span className={`ml-2 ${isUrgent ? "text-red-700" : "text-yellow-700"}`}>
                  到期日期：{format(new Date(trademark.expiryDate), "yyyy年MM月dd日")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {daysLeft <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                商标已过期
              </h3>
              <p className="text-sm text-red-700">
                到期日期：{format(new Date(trademark.expiryDate), "yyyy年MM月dd日")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                商标信息
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">商标号</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {trademark.trademarkNo}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">商标名称</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {trademark.trademarkName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">商标类别</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    第{trademark.category}类 - {trademark.categoryName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">注册日期</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(trademark.registrationDate), "yyyy年MM月dd日")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">到期日期</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(trademark.expiryDate), "yyyy年MM月dd日")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">当前状态</dt>
                  <dd className="mt-1">
                    <StatusBadge status={trademark.status} />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">备注</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {trademark.notes || "无"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                材料清单
              </h3>
              {(user.role === "CLIENT" || user.role === "CONSULTANT") && (
                <span className="text-sm text-gray-500">
                  共 {trademark.documents.length} 份材料
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-200">
              {trademark.documents.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  暂无上传材料
                </div>
              ) : (
                  trademark.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className={`px-4 py-4 sm:px-6 ${
                        doc.status === "REJECTED" ? "bg-red-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {doc.status === "REJECTED" ? (
                              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ) : doc.status === "APPROVED" ? (
                              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {doc.name}
                              </p>
                              {doc.status === "REJECTED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  已驳回
                                </span>
                              )}
                              {doc.status === "APPROVED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  已通过
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {documentTypeLabels[doc.type] || doc.type} · 上传者：{doc.uploadedBy.name}
                              <span className="mx-1">·</span>
                              {format(new Date(doc.createdAt), "yyyy-MM-dd HH:mm")}
                            </p>
                            {doc.status === "REJECTED" && doc.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-100 rounded-md">
                                <p className="text-xs font-medium text-red-800">
                                  驳回原因：
                                </p>
                                <p className="text-xs text-red-700 mt-0.5">
                                  {doc.rejectionReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                          <DocumentStatusBadge status={doc.status} />
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            查看
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
            </div>

            {(user.role === "CLIENT" || user.role === "CONSULTANT") &&
              trademark.status !== "ARCHIVED" &&
              trademark.status !== "ABANDONED" && (
                <div className="px-4 py-4 border-t border-gray-200 sm:px-6">
                  {trademark.documents.some((d: any) => d.status === "REJECTED") && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="ml-2 flex-1">
                          <p className="text-sm font-medium text-yellow-800">
                            有 {trademark.documents.filter((d: any) => d.status === "REJECTED").length} 份材料被驳回，需要补正
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            请重新上传被驳回的材料，上传同类型材料后对应问题会自动标记为已补正
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    上传新材料
                  </h4>
                  <Form method="post" className="space-y-3">
                    <input type="hidden" name="_action" value="uploadDocument" />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <select
                          name="type"
                          defaultValue={
                            trademark.documents.find((d: any) => d.status === "REJECTED")?.type || ""
                          }
                          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">选择材料类型</option>
                          <option value="TRADEMARK_CERTIFICATE">商标注册证</option>
                          <option value="IDENTITY_PROOF">身份证明文件</option>
                          <option value="POWER_OF_ATTORNEY">授权委托书</option>
                          <option value="RENEWAL_APPLICATION">续展申请书</option>
                          <option value="OTHER">其他材料</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          name="name"
                          placeholder="文件名称"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="fileUrl"
                          placeholder="文件链接/URL"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <button type="submit" className="btn btn-primary">
                          上传
                        </button>
                      </div>
                    </div>
                  </Form>
                </div>
              )}
          </div>

          <div className="card">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  材料问题
                </h3>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                    <span className="text-gray-600">
                      待解决 {trademark.materialIssues.filter((i: any) => !i.resolved).length}
                    </span>
                  </span>
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                    <span className="text-gray-600">
                      已补正 {trademark.materialIssues.filter((i: any) => i.resolved).length}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {trademark.materialIssues.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  暂无材料问题
                </div>
              ) : (
                <>
                  {trademark.materialIssues.filter((i: any) => !i.resolved).length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-red-50 sm:px-6">
                        <p className="text-sm font-medium text-red-800">
                          待解决问题
                        </p>
                      </div>
                      {trademark.materialIssues
                        .filter((i: any) => !i.resolved)
                        .map((issue: any) => (
                          <div
                            key={issue.id}
                            className="px-4 py-4 sm:px-6 bg-red-50/30"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      {issue.issueType}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(issue.createdAt), "yyyy-MM-dd HH:mm")}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-700">
                                    {issue.description}
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                待补正
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {trademark.materialIssues.filter((i: any) => i.resolved).length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-green-50 sm:px-6">
                        <p className="text-sm font-medium text-green-800">
                          已补正问题
                        </p>
                      </div>
                      {trademark.materialIssues
                        .filter((i: any) => i.resolved)
                        .map((issue: any) => (
                          <div
                            key={issue.id}
                            className="px-4 py-3 sm:px-6 opacity-70"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {issue.issueType}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(issue.updatedAt), "yyyy-MM-dd HH:mm")}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500 line-through">
                                    {issue.description}
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                已补正
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                历史节点
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {trademark.reviewHistories.map((history, historyIdx) => (
                    <li key={history.id}>
                      <div className="relative pb-8">
                        {historyIdx !== trademark.reviewHistories.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <svg
                                className="h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div>
                              <div className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">
                                  {history.user.name}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  ({roleLabels[history.user.role] || history.user.role})
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-gray-900">
                                {history.action}
                              </p>
                              {history.comment && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {history.comment}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-gray-500">
                                {format(new Date(history.createdAt), "yyyy年MM月dd日 HH:mm")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                相关人员
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">顾问</p>
                <p className="text-sm font-medium text-gray-900">
                  {trademark.consultant.name}
                </p>
                <p className="text-xs text-gray-500">
                  {trademark.consultant.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">客户</p>
                <p className="text-sm font-medium text-gray-900">
                  {trademark.client.name}
                </p>
                <p className="text-xs text-gray-500">
                  {trademark.client.email}
                </p>
              </div>
              {trademark.agent && (
                <div>
                  <p className="text-sm text-gray-500">代理人</p>
                  <p className="text-sm font-medium text-gray-900">
                    {trademark.agent.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {trademark.agent.email}
                  </p>
                </div>
              )}
              {trademark.supervisor && (
                <div>
                  <p className="text-sm text-gray-500">主管</p>
                  <p className="text-sm font-medium text-gray-900">
                    {trademark.supervisor.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {trademark.supervisor.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                操作
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-3">
              {user.role === "AGENT" &&
                (trademark.status === "MATERIALS_UPLOADED" ||
                  trademark.status === "MATERIALS_DEFICIENT" ||
                  trademark.status === "EXPEDITED") && (
                <>
                  <Form method="post">
                    <input type="hidden" name="_action" value="agentReview" />
                    <input type="hidden" name="action" value="approve" />
                    <button type="submit" className="w-full btn btn-success">
                      审核通过
                    </button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="_action" value="agentReview" />
                    <input type="hidden" name="action" value="reject" />
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        问题类型 <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="issueType"
                        defaultValue={String(rejectFormData?.formValues?.issueType || "")}
                        className={`block w-full pl-3 pr-10 py-2 text-base focus:outline-none sm:text-sm rounded-md ${
                          rejectFormData?.errors?.issueType
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-red-500 focus:border-red-500"
                        }`}
                      >
                        <option value="">请选择问题类型</option>
                        <option value="文件不清晰">文件不清晰</option>
                        <option value="材料缺失">材料缺失</option>
                        <option value="信息不符">信息不符</option>
                        <option value="格式错误">格式错误</option>
                        <option value="过期失效">过期失效</option>
                        <option value="其他问题">其他问题</option>
                      </select>
                      {rejectFormData?.errors?.issueType && (
                        <p className="mt-1 text-sm text-red-600">
                          {rejectFormData.errors.issueType[0]}
                        </p>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        问题描述 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="issueDescription"
                        rows={2}
                        placeholder="请详细描述材料存在的问题..."
                        defaultValue={String(rejectFormData?.formValues?.issueDescription || "")}
                        className={`shadow-sm block w-full sm:text-sm rounded-md ${
                          rejectFormData?.errors?.issueDescription
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-red-500 focus:border-red-500"
                        }`}
                      />
                      {rejectFormData?.errors?.issueDescription && (
                        <p className="mt-1 text-sm text-red-600">
                          {rejectFormData.errors.issueDescription[0]}
                        </p>
                      )}
                    </div>
                    
                    {trademark.documents.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          关联问题文档 <span className="text-red-500">*</span>
                        </label>
                        <div className={`space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 ${
                          rejectFormData?.errors?.documentIds
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}>
                          {trademark.documents.map((doc: any) => (
                            <label key={doc.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                name="documentIds"
                                value={doc.id}
                                defaultChecked={
                                  Array.isArray(rejectFormData?.formValues?.documentIds) &&
                                  rejectFormData.formValues.documentIds.includes(doc.id)
                                }
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">{doc.name}</span>
                              <span className="text-xs text-gray-400">
                                ({documentTypeLabels[doc.type] || doc.type})
                              </span>
                            </label>
                          ))}
                        </div>
                        {rejectFormData?.errors?.documentIds && (
                          <p className="mt-1 text-sm text-red-600">
                            {rejectFormData.errors.documentIds[0]}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        备注说明
                      </label>
                      <textarea
                        name="comment"
                        rows={2}
                        placeholder="其他补充说明..."
                        defaultValue={String(rejectFormData?.formValues?.comment || "")}
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <button type="submit" className="w-full btn btn-danger">
                      驳回申请
                    </button>
                  </Form>
                </>
              )}

              {user.role === "AGENT" &&
                trademark.status === "AGENT_APPROVED" && (
                <Form method="post">
                  <input type="hidden" name="_action" value="submit" />
                  <button type="submit" className="w-full btn btn-primary">
                    递交续展申请
                  </button>
                </Form>
              )}

              {user.role === "SUPERVISOR" &&
                (trademark.status === "SUBMITTED" ||
                  trademark.status === "SUPERVISOR_REVIEW") && (
                <>
                  <Form method="post">
                    <input type="hidden" name="_action" value="supervisorReview" />
                    <input type="hidden" name="action" value="archive" />
                    <button type="submit" className="w-full btn btn-success">
                      复核通过并归档
                    </button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="_action" value="supervisorReview" />
                    <input type="hidden" name="action" value="reject" />
                    <div className="mb-2">
                      <textarea
                        name="comment"
                        rows={2}
                        placeholder="驳回原因..."
                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <button type="submit" className="w-full btn btn-danger">
                      退回修改
                    </button>
                  </Form>
                </>
              )}

              {(user.role === "CONSULTANT" || user.role === "AGENT") &&
                !trademark.isExpedited &&
                trademark.status !== "ARCHIVED" &&
                trademark.status !== "ABANDONED" &&
                isExpiring && (
                <Form method="post">
                  <input type="hidden" name="_action" value="expedite" />
                  <div className="mb-2">
                    <textarea
                      name="expeditedReason"
                      rows={2}
                      placeholder="加急原因..."
                      className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <button type="submit" className="w-full btn btn-warning">
                    设置加急处理
                  </button>
                </Form>
              )}

              {(user.role === "CLIENT" || user.role === "CONSULTANT") &&
                trademark.status !== "ARCHIVED" &&
                trademark.status !== "ABANDONED" && (
                <Form method="post">
                  <input type="hidden" name="_action" value="abandon" />
                  <div className="mb-2">
                    <textarea
                      name="comment"
                      rows={2}
                      placeholder="放弃原因..."
                      className="shadow-sm focus:ring-gray-500 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <button type="submit" className="w-full btn btn-secondary">
                    放弃续展
                  </button>
                </Form>
              )}

              {trademark.status === "ARCHIVED" && (
                <p className="text-sm text-gray-500 text-center py-4">
                  该商标已归档，无法进行操作
                </p>
              )}

              {trademark.status === "ABANDONED" && (
                <p className="text-sm text-gray-500 text-center py-4">
                  该商标已被放弃，无法进行操作
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
