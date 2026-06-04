import { routeAction$, zod$, z, type RequestEventAction } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import { validateAndTransitionState, createConsistentNotification } from "~/lib/consistency";
import { validateEvidences, getMissingEvidenceLabels, getRemediationPath } from "~/lib/utils";
import type { ReviewActionType, EvidenceType } from "@prisma/client";

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
          include: { evidences: true },
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

    const allEvidences = inspection.evidences;
    const evidenceValidation = validateEvidences(allEvidences);

    if (actionType === "APPROVE") {
      if (!evidenceValidation.isValid) {
        const missingLabels = getMissingEvidenceLabels(evidenceValidation.missingTypes);
        return requestEvent.json(400, {
          error: "证据不完整，无法销项",
          details: {
            missingTypes: evidenceValidation.missingTypes,
            missingLabels,
            remediationPath: getRemediationPath(evidenceValidation.missingTypes),
          },
        });
      }

      if (!latestRectification.buildingMatch) {
        return requestEvent.json(400, {
          error: "责任楼栋不匹配，无法销项",
          details: {
            remediationPath: "请确认整改地点与问题发生楼栋一致后再销项。",
          },
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
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

      const transitionResult = await validateAndTransitionState({
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
        metadata: {
          evidenceComplete: evidenceValidation.isValid,
          missingTypes: evidenceValidation.missingTypes,
        },
      });

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
      for (const userId of notifyUsers) {
        await createConsistentNotification({
          type: notificationType as any,
          title: notificationTitle,
          content: notificationContent,
          inspectionId,
          userId,
          sentById: currentUser.id,
        });
      }

      return {
        reviewAction,
        inspection: transitionResult.inspection,
      };
    });

    return requestEvent.json(200, {
      success: true,
      message: actionType === "APPROVE"
        ? "复核通过，已完成销项"
        : actionType === "RETURN"
        ? "已退回整改"
        : "已归档记录",
      data: result,
    });
  },
  zod$({
    actionType: z.enum(["APPROVE", "RETURN", "ARCHIVE"]),
    comment: z.string().optional(),
    rectificationId: z.string(),
  })
);
