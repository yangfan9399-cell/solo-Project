import { routeLoader$ } from "@builder.io/qwik-city";
import { getConsistentInspectionDetail } from "~/lib/consistency";
import prisma from "~/lib/prisma";
import { userCookie, getCurrentUser } from "~/lib/auth";
import { validateEvidences, getMissingEvidenceLabels, getRemediationPath } from "~/lib/utils";

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
      ? latestRectification.missingTypes
      : evidenceValidation.missingTypes;

    photoMissingInfo = {
      isMissing: true,
      missingTypes,
      missingLabels: getMissingEvidenceLabels(missingTypes as any),
      remediationPath: getRemediationPath(missingTypes as any),
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
