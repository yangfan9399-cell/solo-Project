import { routeAction$, zod$, z, type RequestEventAction } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import { validateAndTransitionState, createConsistentNotification } from "~/lib/consistency";
import { validateEvidences, getMissingEvidenceLabels, getRemediationPath, getBuildingMismatchRemediationPath } from "~/lib/utils";
import type { ReviewActionType } from "@prisma/client";

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
    const isBuildingMismatch = !latestRectification.buildingMatch;

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

      if (isBuildingMismatch) {
        return requestEvent.json(400, {
          error: "责任楼栋不匹配，无法销项",
          details: {
            remediationPath: getBuildingMismatchRemediationPath(inspection.building.name, inspection.building.code),
          },
        });
      }
    }

    const isEvidenceMissing = !evidenceValidation.isValid;

    const returnReason = isBuildingMismatch
      ? "责任楼栋不匹配"
      : isEvidenceMissing
      ? `证据缺失：${getMissingEvidenceLabels(evidenceValidation.missingTypes).join("、")}`
      : null;
    const remediationPath = isBuildingMismatch
      ? getBuildingMismatchRemediationPath(inspection.building.name, inspection.building.code)
      : isEvidenceMissing
      ? getRemediationPath(evidenceValidation.missingTypes)
      : null;
    const fullReturnContent = returnReason
      ? `${returnReason}。${remediationPath}`
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const toStatus = actionType === "APPROVE"
        ? "CLOSED"
        : actionType === "RETURN"
        ? "RETURNED"
        : "ARCHIVED";

      const hasAutoComment = (actionType === "RETURN" && returnReason !== null);
      const finalComment = comment || (hasAutoComment ? returnReason : null);

      const reviewAction = await tx.reviewAction.create({
        data: {
          inspectionId,
          rectificationId,
          actionType: actionType as ReviewActionType,
          comment: finalComment,
          reviewedById: currentUser.id,
          missingTypes: evidenceValidation.missingTypes,
          remediationPath,
        },
      });

      const historyDescription = actionType === "APPROVE"
        ? `${currentUser.name} 复核通过，完成销项`
        : actionType === "RETURN"
        ? `${currentUser.name} 退回整改，原因：${finalComment || "请重新整改后再次提交"}`
        : `${currentUser.name} 归档记录`;

      const transitionResult = await validateAndTransitionState(
        {
          inspectionId,
          fromStatus: inspection.status,
          toStatus: toStatus as any,
          operatorId: currentUser.id,
          actionType: actionType === "APPROVE" ? "REVIEW_APPROVE" : actionType === "RETURN" ? "RETURN" : "ARCHIVE",
          description: historyDescription,
          reviewActionId: reviewAction.id,
          metadata: {
            evidenceComplete: evidenceValidation.isValid,
            missingTypes: evidenceValidation.missingTypes,
          },
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
        ? `您提交的整改申请（${inspection.inspectionNo}）被退回，原因：${finalComment || "请重新整改后再次提交"}。${remediationPath ? `补救路径：${remediationPath}` : ""}`
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
