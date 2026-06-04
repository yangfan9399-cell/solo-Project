import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, Link, Form, routeAction$, z, zod$, type RequestEventAction } from "@builder.io/qwik-city";
import { getConsistentInspectionDetail } from "~/lib/consistency";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SOURCE_LABELS,
  ISSUE_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  EVIDENCE_TYPE_LABELS,
  HISTORY_ACTION_LABELS,
  REQUIRED_EVIDENCE_TYPES,
} from "~/lib/types";
import {
  formatDate,
  formatDateShort,
  getDaysRemaining,
  isOverdue,
  validateEvidences,
  getMissingEvidenceLabels,
  getRemediationPath,
} from "~/lib/utils";
import type { EvidenceType, ReviewActionType } from "@prisma/client";
import { validateAndTransitionState, createConsistentNotification } from "~/lib/consistency";

export const useInspectionDetail = routeLoader$(async (requestEvent) => {
  const id = requestEvent.params.id;
  const cookie = userCookie.get(requestEvent);
  const currentUser = await getCurrentUser(cookie);

  const inspection = await getConsistentInspectionDetail(id);

  if (!inspection) {
    throw requestEvent.error(404, "巡查记录不存在");
  }

  const evidenceValidation = validateEvidences(inspection.evidences);
  const latestRectification = inspection.rectifications[0];

  let photoMissingInfo = null;
  if (!evidenceValidation.isValid || latestRectification?.isPhotoMissing) {
    const missingTypes = latestRectification?.isPhotoMissing
      ? (latestRectification.missingTypes as EvidenceType[])
      : evidenceValidation.missingTypes;

    photoMissingInfo = {
      isMissing: true,
      missingTypes,
      missingLabels: getMissingEvidenceLabels(missingTypes),
      remediationPath: getRemediationPath(missingTypes),
      canApprove: false,
    };
  }

  const notifications = currentUser
    ? await prisma.notification.findMany({
        where: {
          inspectionId: id,
          userId: currentUser.id,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return {
    inspection,
    currentUser,
    evidenceValidation,
    photoMissingInfo,
    notifications,
  };
});

export const useSubmitRectification = routeAction$(
  async (form, requestEvent: RequestEventAction) => {
    const { description } = form;
    const inspectionId = requestEvent.params.id;
    const cookie = userCookie.get(requestEvent);
    const currentUser = await getCurrentUser(cookie);

    if (!currentUser || currentUser.role !== "INSPECTOR") {
      return requestEvent.json(403, { error: "无权限执行此操作" });
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { building: true, evidences: true },
    });

    if (!inspection) {
      return requestEvent.json(404, { error: "巡查记录不存在" });
    }

    if (inspection.status !== "PENDING_RECTIFICATION" && inspection.status !== "RETURNED") {
      return requestEvent.json(400, { error: "当前状态不允许提交整改" });
    }

    const evidenceData: Array<{
      type: EvidenceType;
      url: string;
      thumbnailUrl?: string;
      description?: string;
    }> = [];

    const afterPhotoUrl = form.afterPhotoUrl;
    const processPhotoUrl = form.processPhotoUrl;
    const locationPhotoUrl = form.locationPhotoUrl;

    if (afterPhotoUrl) {
      evidenceData.push({
        type: "AFTER_PHOTO",
        url: afterPhotoUrl,
        thumbnailUrl: afterPhotoUrl,
        description: `整改后照片：${inspection.building.name}`,
      });
    }

    if (processPhotoUrl) {
      evidenceData.push({
        type: "PROCESS_PHOTO",
        url: processPhotoUrl,
        thumbnailUrl: processPhotoUrl,
        description: "整改过程照片",
      });
    }

    if (locationPhotoUrl) {
      evidenceData.push({
        type: "LOCATION_PHOTO",
        url: locationPhotoUrl,
        thumbnailUrl: locationPhotoUrl,
        description: `位置确认照片：${inspection.building.name}`,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const rectification = await tx.rectification.create({
        data: {
          inspectionId,
          description,
          submittedById: currentUser.id,
          isOverdue: isOverdue(inspection.deadline),
        },
      });

      const createdEvidences = [];
      for (const ev of evidenceData) {
        const evidence = await tx.evidence.create({
          data: {
            type: ev.type,
            url: ev.url,
            thumbnailUrl: ev.thumbnailUrl || null,
            description: ev.description || null,
            uploadedById: currentUser.id,
            inspectionId,
            rectificationId: rectification.id,
          },
        });
        createdEvidences.push(evidence);
      }

      const allEvidences = [...inspection.evidences, ...createdEvidences];
      const evidenceValidation = validateEvidences(allEvidences);

      await tx.rectification.update({
        where: { id: rectification.id },
        data: {
          isPhotoMissing: !evidenceValidation.isValid,
          missingTypes: evidenceValidation.missingTypes,
          buildingMatch: true,
        },
      });

      const transitionResult = await validateAndTransitionState(
        {
          inspectionId,
          fromStatus: inspection.status,
          toStatus: "PENDING_REVIEW",
          operatorId: currentUser.id,
          actionType: "SUBMIT_RECTIFICATION",
          description: `${currentUser.name} 提交整改申请，${evidenceValidation.isValid ? "证据完整" : `缺少证据：${getMissingEvidenceLabels(evidenceValidation.missingTypes).join("、")}`}`,
          rectificationId: rectification.id,
        },
        tx
      );

      if (!transitionResult.success) {
        throw new Error(transitionResult.error);
      }

      const reviewers = await tx.user.findMany({
        where: { role: "REVIEWER" },
      });

      for (const reviewer of reviewers) {
        await createConsistentNotification(
          {
            type: "REVIEW_REQUIRED",
            title: "待复核提醒",
            content: `${currentUser.name} 提交了整改申请（${inspection.inspectionNo}），请及时复核。`,
            inspectionId,
            userId: reviewer.id,
            sentById: currentUser.id,
          },
          tx
        );
      }

      return {
        rectification,
        evidences: createdEvidences,
        evidenceValidation,
        inspection: transitionResult.inspection,
      };
    });

    throw requestEvent.redirect(302, `/inspections/${inspectionId}`);
  },
  zod$({
    description: z.string().min(1, "整改说明不能为空"),
    afterPhotoUrl: z.string().optional(),
    processPhotoUrl: z.string().optional(),
    locationPhotoUrl: z.string().optional(),
  })
);

export const useReviewAction = routeAction$(
  async (form, requestEvent: RequestEventAction) => {
    const { actionType, comment, rectificationId } = form;
    const inspectionId = requestEvent.params.id;
    const cookie = userCookie.get(requestEvent);
    const currentUser = await getCurrentUser(cookie);

    if (!currentUser || currentUser.role !== "REVIEWER") {
      return requestEvent.json(403, { error: "无权限执行此操作" });
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        building: true,
        evidences: true,
        rectifications: {
          where: { id: rectificationId },
        },
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!inspection) {
      return requestEvent.json(404, { error: "巡查记录不存在" });
    }

    if (inspection.status !== "PENDING_REVIEW") {
      return requestEvent.json(400, { error: "当前状态不允许复核" });
    }

    const latestRectification = inspection.rectifications[0];
    if (!latestRectification) {
      return requestEvent.json(400, { error: "未找到对应的整改记录" });
    }

    const evidenceValidation = validateEvidences(inspection.evidences);

    if (actionType === "APPROVE") {
      if (!evidenceValidation.isValid) {
        throw requestEvent.redirect(302, `/inspections/${inspectionId}?error=evidence_missing`);
      }

      if (!latestRectification.buildingMatch) {
        throw requestEvent.redirect(302, `/inspections/${inspectionId}?error=building_mismatch`);
      }
    }

    await prisma.$transaction(async (tx) => {
      const toStatus = actionType === "APPROVE"
        ? "CLOSED"
        : actionType === "RETURN"
        ? "RETURNED"
        : "ARCHIVED";

      const reviewAction = await tx.reviewAction.create({
        data: {
          inspectionId,
          rectificationId,
          actionType: actionType as ReviewActionType,
          comment: comment || null,
          reviewedById: currentUser.id,
          missingTypes: evidenceValidation.missingTypes,
          remediationPath: !evidenceValidation.isValid ? getRemediationPath(evidenceValidation.missingTypes) : null,
        },
      });

      const transitionResult = await validateAndTransitionState(
        {
          inspectionId,
          fromStatus: inspection.status,
          toStatus: toStatus as any,
          operatorId: currentUser.id,
          actionType: actionType === "APPROVE" ? "REVIEW_APPROVE" : actionType === "RETURN" ? "RETURN" : "ARCHIVE",
          description: `${currentUser.name} ${
            actionType === "APPROVE"
              ? "复核通过，完成销项"
              : actionType === "RETURN"
              ? "退回整改"
              : "归档记录"
          }${comment ? `，备注：${comment}` : ""}`,
          reviewActionId: reviewAction.id,
        },
        tx
      );

      if (!transitionResult.success) {
        throw new Error(transitionResult.error);
      }

      await tx.rectification.update({
        where: { id: rectificationId },
        data: {
          isQualified: actionType === "APPROVE",
        },
      });

      const notificationType = actionType === "APPROVE"
        ? "REVIEW_APPROVED"
        : actionType === "RETURN"
        ? "REVIEW_REJECTED"
        : "ARCHIVED";

      const notificationTitle = actionType === "APPROVE"
        ? "整改已销项"
        : actionType === "RETURN"
        ? "整改被退回"
        : "记录已归档";

      const notificationContent = actionType === "APPROVE"
        ? `您提交的整改申请（${inspection.inspectionNo}）已通过复核，完成销项。`
        : actionType === "RETURN"
        ? `您提交的整改申请（${inspection.inspectionNo}）被退回，原因：${comment || "请重新整改后再次提交"}。`
        : `巡查记录（${inspection.inspectionNo}）已归档。`;

      const notifyUsers = [inspection.createdById, inspection.assignedToId].filter(Boolean) as string[];
      for (const notifyUserId of notifyUsers) {
        await createConsistentNotification(
          {
            type: notificationType as any,
            title: notificationTitle,
            content: notificationContent,
            inspectionId,
            userId: notifyUserId,
            sentById: currentUser.id,
          },
          tx
        );
      }
    });

    throw requestEvent.redirect(302, `/inspections/${inspectionId}`);
  },
  zod$({
    actionType: z.enum(["APPROVE", "RETURN", "ARCHIVE"]),
    comment: z.string().optional(),
    rectificationId: z.string(),
  })
);

export default component$(() => {
  const data = useInspectionDetail();
  const submitAction = useSubmitRectification();
  const reviewAction = useReviewAction();

  const showRectifyForm = useSignal(false);
  const showReviewPanel = useSignal(false);
  const selectedImage = useSignal<string | null>(null);

  const { inspection, currentUser, photoMissingInfo, notifications } = data.value;
  const latestRectification = inspection.rectifications[0];

  const overdue = isOverdue(inspection.deadline);
  const daysRemaining = getDaysRemaining(inspection.deadline);

  const presentEvidenceTypes = new Set(inspection.evidences.map(e => e.type));
  const canSubmitRectification = (currentUser?.role === "INSPECTOR") &&
    (inspection.status === "PENDING_RECTIFICATION" || inspection.status === "RETURNED");
  const canReview = (currentUser?.role === "REVIEWER") && inspection.status === "PENDING_REVIEW";

  const sampleImages = [
    { type: "AFTER_PHOTO" as EvidenceType, url: "https://picsum.photos/seed/after-demo/600/400", label: "整改后照片" },
    { type: "PROCESS_PHOTO" as EvidenceType, url: "https://picsum.photos/seed/process-demo/600/400", label: "过程照片" },
    { type: "LOCATION_PHOTO" as EvidenceType, url: "https://picsum.photos/seed/location-demo/600/400", label: "位置照片" },
  ];

  useVisibleTask$(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error === "evidence_missing") {
      alert("证据不完整，无法销项。请确保包含整改前、整改后、位置和过程四类照片。");
    } else if (error === "building_mismatch") {
      alert("责任楼栋不匹配，无法销项。请确认整改地点与问题发生楼栋一致。");
    }
  });

  return (
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center space-x-3">
            <Link
              href="/"
              class="text-gray-500 hover:text-gray-700"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h2 class="text-2xl font-bold text-gray-900">
              巡查详情 - {inspection.inspectionNo}
            </h2>
          </div>
          <p class="mt-1 text-sm text-gray-500 ml-8">
            创建于 {formatDate(inspection.createdAt)}
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <span class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[inspection.status]}`}>
            {STATUS_LABELS[inspection.status]}
          </span>
          {inspection.isOverdue && (
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              ⚠ 已超期
            </span>
          )}
        </div>
      </div>

      {photoMissingInfo && (
        <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-amber-800">证据缺失提醒</h3>
              <div class="mt-2 text-sm text-amber-700">
                <p class="font-medium">缺少的证据类型：{photoMissingInfo.missingLabels.join("、")}</p>
                <p class="mt-1">{photoMissingInfo.remediationPath}</p>
              </div>
              <div class="mt-3">
                <p class="text-xs text-amber-600 font-medium">
                  ❌ 当前无法销项，请补充完整证据后再提交审核
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt class="text-sm font-medium text-gray-500">巡查来源</dt>
                <dd class="mt-1">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {SOURCE_LABELS[inspection.source]}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">问题类型</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {ISSUE_TYPE_LABELS[inspection.issueType]}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">严重程度</dt>
                <dd class="mt-1">
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[inspection.severity]}`}>
                    {SEVERITY_LABELS[inspection.severity]}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">整改期限</dt>
                <dd class={`mt-1 text-sm ${overdue ? "text-red-600 font-medium" : "text-gray-900"}`}>
                  {formatDateShort(inspection.deadline)}
                  <span class="ml-2 text-xs">
                    {overdue
                      ? `(已超期 ${Math.abs(daysRemaining)} 天)`
                      : daysRemaining > 0
                      ? `(剩余 ${daysRemaining} 天)`
                      : "(今天到期)"}
                  </span>
                </dd>
              </div>
              <div class="md:col-span-2">
                <dt class="text-sm font-medium text-gray-500">问题描述</dt>
                <dd class="mt-1 text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                  {inspection.description}
                </dd>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">责任楼栋信息</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{inspection.building.name}</p>
                  <p class="text-xs text-gray-500">编号：{inspection.building.code}</p>
                  <p class="text-xs text-gray-500">{inspection.building.address}</p>
                </div>
              </div>
              <div class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    责任人：{inspection.assignedTo?.name || "未指派"}
                  </p>
                  {inspection.building.responsible && (
                    <>
                      <p class="text-xs text-gray-500">物业：{inspection.building.responsible}</p>
                      <p class="text-xs text-gray-500">电话：{inspection.building.phone}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {latestRectification && !latestRectification.buildingMatch && (
              <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-700 font-medium">⚠ 责任楼栋不匹配</p>
                <p class="text-xs text-red-600 mt-1">整改照片显示的楼栋与问题发生楼栋不一致，请重新核实。</p>
              </div>
            )}
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">证据链（整改前后对比）</h3>
              <div class="flex items-center space-x-2 text-xs">
                {REQUIRED_EVIDENCE_TYPES.map((type) => (
                  <span
                    key={type}
                    class={`px-2 py-1 rounded-full ${
                      presentEvidenceTypes.has(type)
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {presentEvidenceTypes.has(type) ? "✓" : "✗"} {EVIDENCE_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspection.evidences.map((evidence) => (
                <div
                  key={evidence.id}
                  class="relative group cursor-pointer"
                  onClick$={() => selectedImage.value = evidence.url}
                >
                  <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={evidence.url}
                      alt={evidence.description || EVIDENCE_TYPE_LABELS[evidence.type]}
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                    <span class="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full transition-opacity">
                      点击查看大图
                    </span>
                  </div>
                  <div class="mt-2">
                    <span class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      evidence.type === "BEFORE_PHOTO"
                        ? "bg-red-100 text-red-800"
                        : evidence.type === "AFTER_PHOTO"
                        ? "bg-green-100 text-green-800"
                        : evidence.type === "LOCATION_PHOTO"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {EVIDENCE_TYPE_LABELS[evidence.type]}
                    </span>
                    {evidence.description && (
                      <p class="text-xs text-gray-500 mt-1">{evidence.description}</p>
                    )}
                    <p class="text-xs text-gray-400 mt-1">
                      {evidence.uploadedBy.name} · {formatDate(evidence.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {latestRectification && (
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">最近一次整改记录</h3>
              <div class="space-y-4">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-gray-900">
                        {latestRectification.submittedBy.name} 提交了整改
                      </p>
                      <p class="text-xs text-gray-500">
                        {formatDate(latestRectification.submittedAt)}
                      </p>
                    </div>
                    <p class="mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      {latestRectification.description}
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      {latestRectification.isPhotoMissing && (
                        <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          ⚠ 照片缺失
                        </span>
                      )}
                      {!latestRectification.buildingMatch && (
                        <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          ⚠ 楼栋不匹配
                        </span>
                      )}
                      {latestRectification.isOverdue && (
                        <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          ⚠ 超期提交
                        </span>
                      )}
                      {latestRectification.isQualified === true && (
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✓ 整改合格
                        </span>
                      )}
                      {latestRectification.isQualified === false && (
                        <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          ✗ 整改不合格
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {latestRectification.reviewAction && (
                  <div class="ml-11 border-l-2 border-gray-200 pl-4 pt-2">
                    <div class="flex items-start space-x-3">
                      <div class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        latestRectification.reviewAction.actionType === "APPROVE"
                          ? "bg-green-100"
                          : latestRectification.reviewAction.actionType === "RETURN"
                          ? "bg-red-100"
                          : "bg-gray-100"
                      }`}>
                        <svg class={`w-4 h-4 ${
                          latestRectification.reviewAction.actionType === "APPROVE"
                            ? "text-green-600"
                            : latestRectification.reviewAction.actionType === "RETURN"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {latestRectification.reviewAction.actionType === "APPROVE" ? (
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          ) : latestRectification.reviewAction.actionType === "RETURN" ? (
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          ) : (
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {latestRectification.reviewAction.reviewedBy.name}
                          {latestRectification.reviewAction.actionType === "APPROVE"
                            ? " 复核通过（已销项）"
                            : latestRectification.reviewAction.actionType === "RETURN"
                            ? " 退回整改"
                            : " 已归档"}
                        </p>
                        <p class="text-xs text-gray-500">
                          {formatDate(latestRectification.reviewAction.reviewedAt)}
                        </p>
                        {latestRectification.reviewAction.comment && (
                          <p class="mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            {latestRectification.reviewAction.comment}
                          </p>
                        )}
                        {latestRectification.reviewAction.remediationPath && (
                          <div class="mt-2 p-3 bg-amber-50 rounded-lg">
                            <p class="text-xs text-amber-700 font-medium">补救路径：</p>
                            <p class="text-xs text-amber-600 mt-1">
                              {latestRectification.reviewAction.remediationPath}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {canSubmitRectification && (
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">提交整改</h3>
                <button
                  onClick$={() => showRectifyForm.value = !showRectifyForm.value}
                  class="text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  {showRectifyForm.value ? "收起表单" : "展开表单"}
                </button>
              </div>

              {showRectifyForm.value && (
                <Form action={submitAction} class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      整改说明 <span class="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="请详细描述整改措施和结果..."
                    />
                  </div>

                  <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-sm font-medium text-blue-800 mb-2">示例图片（点击即可填入）</p>
                    <div class="grid grid-cols-3 gap-3">
                      {sampleImages.map((img, idx) => (
                        <div
                          key={idx}
                          class="cursor-pointer group"
                          onClick$={() => {
                            const inputId = img.type === "AFTER_PHOTO"
                              ? "afterPhotoUrl"
                              : img.type === "PROCESS_PHOTO"
                              ? "processPhotoUrl"
                              : "locationPhotoUrl";
                            const input = document.getElementById(inputId) as HTMLInputElement;
                            if (input) input.value = img.url;
                          }}
                        >
                          <img
                            src={img.url}
                            alt={img.label}
                            class="w-full h-20 object-cover rounded-lg group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                          />
                          <p class="text-xs text-center text-blue-700 mt-1">{img.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        整改后照片 URL
                        {!presentEvidenceTypes.has("AFTER_PHOTO") && (
                          <span class="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        id="afterPhotoUrl"
                        type="url"
                        name="afterPhotoUrl"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        过程照片 URL
                        {!presentEvidenceTypes.has("PROCESS_PHOTO") && (
                          <span class="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        id="processPhotoUrl"
                        type="url"
                        name="processPhotoUrl"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        位置照片 URL
                        {!presentEvidenceTypes.has("LOCATION_PHOTO") && (
                          <span class="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        id="locationPhotoUrl"
                        type="url"
                        name="locationPhotoUrl"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div class="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick$={() => showRectifyForm.value = false}
                      class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      提交整改申请
                    </button>
                  </div>
                </Form>
              )}
            </div>
          )}

          {canReview && latestRectification && (
            <div class="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-purple-900">复核操作</h3>
                  <p class="text-sm text-purple-600 mt-1">
                    作为复核员，您可以确认销项、退回整改或归档记录
                  </p>
                </div>
                <button
                  onClick$={() => showReviewPanel.value = !showReviewPanel.value}
                  class="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  {showReviewPanel.value ? "收起操作面板" : "展开操作面板"}
                </button>
              </div>

              {photoMissingInfo && (
                <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p class="text-sm font-medium text-red-800">
                    ❌ 证据不完整，无法销项
                  </p>
                  <p class="text-xs text-red-600 mt-1">
                    缺少：{photoMissingInfo.missingLabels.join("、")}
                  </p>
                </div>
              )}

              {showReviewPanel.value && (
                <Form action={reviewAction} class="space-y-4">
                  <input
                    type="hidden"
                    name="rectificationId"
                    value={latestRectification.id}
                  />

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      复核备注
                    </label>
                    <textarea
                      name="comment"
                      rows={3}
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="请填写复核意见..."
                    />
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      name="actionType"
                      value="APPROVE"
                      disabled={!!photoMissingInfo || !latestRectification.buildingMatch}
                      class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        photoMissingInfo || !latestRectification.buildingMatch
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      ✓ 确认销项
                    </button>
                    <button
                      type="submit"
                      name="actionType"
                      value="RETURN"
                      class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      ✗ 退回整改
                    </button>
                    <button
                      type="submit"
                      name="actionType"
                      value="ARCHIVE"
                      class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      📁 归档记录
                    </button>
                  </div>
                </Form>
              )}
            </div>
          )}
        </div>

        <div class="space-y-6">
          {inspection.lastChange && (
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">最近一次改动</h3>
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {HISTORY_ACTION_LABELS[inspection.lastChange.actionType]}
                  </p>
                  <p class="text-xs text-gray-500">
                    {inspection.lastChange.operator.name} · {formatDate(inspection.lastChange.timestamp)}
                  </p>
                  <p class="text-sm text-gray-700 mt-2">
                    {inspection.lastChange.description}
                  </p>
                  <div class="mt-2 flex items-center space-x-2">
                    {inspection.lastChange.fromStatus && (
                      <span class={`px-2 py-0.5 text-xs rounded ${STATUS_COLORS[inspection.lastChange.fromStatus]}`}>
                        {STATUS_LABELS[inspection.lastChange.fromStatus]}
                      </span>
                    )}
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span class={`px-2 py-0.5 text-xs rounded ${STATUS_COLORS[inspection.lastChange.toStatus]}`}>
                      {STATUS_LABELS[inspection.lastChange.toStatus]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">历史节点</h3>
            <div class="relative">
              <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div class="space-y-6">
                {[...inspection.historyNodes].reverse().map((node, idx) => (
                  <div key={node.id} class="relative flex items-start space-x-4 pl-8">
                    <div class={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      idx === 0 ? "bg-green-500 ring-4 ring-green-100" : "bg-gray-200"
                    }`}>
                      <svg class={`w-4 h-4 ${idx === 0 ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {node.actionType === "CREATE" ? (
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        ) : node.actionType === "SUBMIT_RECTIFICATION" ? (
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : node.actionType === "REVIEW_APPROVE" ? (
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        ) : node.actionType === "RETURN" ? (
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <p class={`text-sm font-medium ${idx === 0 ? "text-green-600" : "text-gray-900"}`}>
                          {HISTORY_ACTION_LABELS[node.actionType]}
                        </p>
                        <span class="text-xs text-gray-500">
                          {formatDate(node.timestamp)}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 mt-0.5">
                        操作人：{node.operator.name}
                        ({node.operator.role === "INSPECTOR" ? "巡查员" : "复核员"})
                      </p>
                      <p class="text-sm text-gray-700 mt-2 bg-gray-50 rounded-lg p-2">
                        {node.description}
                      </p>
                      {(node.fromStatus || node.toStatus) && (
                        <div class="mt-2 flex items-center space-x-2">
                          {node.fromStatus && (
                            <span class={`px-2 py-0.5 text-xs rounded ${STATUS_COLORS[node.fromStatus]}`}>
                              {STATUS_LABELS[node.fromStatus]}
                            </span>
                          )}
                          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span class={`px-2 py-0.5 text-xs rounded ${STATUS_COLORS[node.toStatus]}`}>
                            {STATUS_LABELS[node.toStatus]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {notifications.length > 0 && (
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">相关通知</h3>
              <div class="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    class={`p-3 rounded-lg border ${
                      notification.isRead ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class={`text-sm font-medium ${notification.isRead ? "text-gray-700" : "text-blue-800"}`}>
                          {notification.title}
                        </p>
                        <p class="text-xs text-gray-500 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <p class="text-xs text-gray-600 mt-2">{notification.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedImage.value && (
        <div
          class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick$={() => selectedImage.value = null}
        >
          <div class="relative max-w-4xl max-h-full">
            <img
              src={selectedImage.value}
              alt="大图预览"
              class="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick$={() => selectedImage.value = null}
              class="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
