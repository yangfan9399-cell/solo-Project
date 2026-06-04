import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { PrescriptionStatus } from '@prisma/client';

export const POST: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const { pharmacistId, result, dosageSuggestion, comments } = data;

  const pharmacist = await prisma.user.findUnique({ where: { id: pharmacistId } });
  if (!pharmacist || pharmacist.role !== 'PHARMACIST') {
    return json({ error: '无权审核' }, { status: 403 });
  }

  let newStatus: PrescriptionStatus;
  let actionText: string;
  let details: string;

  switch (result) {
    case 'APPROVED':
      newStatus = PrescriptionStatus.APPROVED;
      actionText = '审核通过';
      details = '药师审核通过，处方可正常发药';
      break;
    case 'DOSAGE_ISSUE':
      newStatus = PrescriptionStatus.DOSAGE_ISSUE;
      actionText = '剂量异常';
      details = `剂量异常：${dosageSuggestion || '需调整剂量'}`;
      break;
    case 'PATIENT_MISMATCH':
      newStatus = PrescriptionStatus.PATIENT_MISMATCH;
      actionText = '患者信息不符';
      details = `患者信息不符：${comments || '需核对患者信息'}`;
      break;
    case 'NEEDS_ADJUSTMENT':
      newStatus = PrescriptionStatus.DOSAGE_ISSUE;
      actionText = '需调整';
      details = `需调整：${dosageSuggestion || '需要调整处方'}`;
      break;
    case 'RETURN_TO_DOCTOR':
      newStatus = PrescriptionStatus.REJECTED;
      actionText = '退回医生';
      details = `退回医生：${comments || '处方需要医生重新开具'}`;
      break;
    default:
      return json({ error: '无效的审核结果' }, { status: 400 });
  }

  const prescription = await prisma.prescription.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      currentHandler: pharmacist.name,
      reviews: {
        create: {
          pharmacistId,
          result,
          dosageSuggestion,
          comments
        }
      },
      histories: {
        create: {
          action: actionText,
          operatorId: pharmacistId,
          operatorName: pharmacist.name,
          details
        }
      }
    },
    include: { reviews: true, histories: true }
  });

  return json(prescription);
};
