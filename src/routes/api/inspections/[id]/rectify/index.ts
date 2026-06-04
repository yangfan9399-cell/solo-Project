import { routeAction$, zod$, z, type RequestEventAction } from "@builder.io/qwik-city";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import { validateAndTransitionState, createConsistentNotification, validateEvidenceConsistency } from "~/lib/consistency";
import { validateEvidences, getMissingEvidenceLabels, getRemediationPath, isOverdue, validateBuildingMatch } from "~/lib/utils";
import type { EvidenceType } from "@prisma/client";

export const useSubmitRectification = routeAction$(
  async (form, requestEvent: RequestEventAction) => {
    const { description, evidences } = form;
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

    const evidenceData = Array.isArray(evidences) ? evidences : [evidences];

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
        const evData = typeof ev === "string" ? JSON.parse(ev) : ev;
        const buildingCheck = validateBuildingMatch(
          evData.description || "",
          inspection.building.name,
          inspection.building.code
        );

        const evidence = await tx.evidence.create({
          data: {
            type: evData.type as EvidenceType,
            url: evData.url,
            thumbnailUrl: evData.thumbnailUrl || null,
            description: evData.description || null,
            uploadedById: currentUser.id,
            inspectionId,
            rectificationId: rectification.id,
          },
        });
        createdEvidences.push(evidence);
      }

      const allEvidences = [...inspection.evidences, ...createdEvidences];
      const evidenceValidation = validateEvidences(allEvidences);

      const buildingMatches = createdEvidences.every((ev) => {
        if (!ev.description) return true;
        const check = validateBuildingMatch(
          ev.description,
          inspection.building.name,
          inspection.building.code
        );
        return check.isMatch;
      });

      await tx.rectification.update({
        where: { id: rectification.id },
        data: {
          isPhotoMissing: !evidenceValidation.isValid,
          missingTypes: evidenceValidation.missingTypes,
          buildingMatch: buildingMatches,
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
          metadata: {
            evidenceCount: createdEvidences.length,
            evidenceTypes: createdEvidences.map(e => e.type),
          },
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
        buildingMatch: buildingMatches,
      };
    });

    return requestEvent.json(200, {
      success: true,
      message: "整改提交成功",
      data: result,
    });
  },
  zod$({
    description: z.string().min(1, "整改说明不能为空"),
    evidences: z.union([
      z.object({
        type: z.enum(["BEFORE_PHOTO", "AFTER_PHOTO", "LOCATION_PHOTO", "PROCESS_PHOTO", "DOCUMENT"]),
        url: z.string().url("请输入有效的图片URL"),
        thumbnailUrl: z.string().optional(),
        description: z.string().optional(),
      }),
      z.array(
        z.object({
          type: z.enum(["BEFORE_PHOTO", "AFTER_PHOTO", "LOCATION_PHOTO", "PROCESS_PHOTO", "DOCUMENT"]),
          url: z.string().url("请输入有效的图片URL"),
          thumbnailUrl: z.string().optional(),
          description: z.string().optional(),
        })
      ),
    ]),
  })
);
