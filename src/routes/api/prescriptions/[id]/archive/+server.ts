import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { PrescriptionStatus } from '@prisma/client';

export const POST: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const { reviewerId, reason, resolution, disputed } = data;

  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
  if (!reviewer || reviewer.role !== 'REVIEWER') {
    return json({ error: '无权归档' }, { status: 403 });
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id }
  });

  if (!prescription) {
    return json({ error: '处方不存在' }, { status: 404 });
  }

  const updatedPrescription = await prisma.prescription.update({
    where: { id: params.id },
    data: {
      status: disputed ? PrescriptionStatus.DISPUTED : PrescriptionStatus.ARCHIVED,
      currentHandler: reviewer.name,
      archives: {
        create: {
          reviewerId,
          reason,
          resolution,
          disputed: disputed || false
        }
      },
      histories: {
        create: {
          action: disputed ? '争议归档' : '异常归档',
          operatorId: reviewerId,
          operatorName: reviewer.name,
          details: `归档原因：${reason}${disputed ? '（存在争议）' : ''}`
        }
      }
    },
    include: { archives: true, histories: true }
  });

  return json(updatedPrescription);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const { reviewerId, resolution, disputeComments } = data;

  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
  if (!reviewer || reviewer.role !== 'REVIEWER') {
    return json({ error: '无权操作' }, { status: 403 });
  }

  const latestArchive = await prisma.archive.findFirst({
    where: { prescriptionId: params.id },
    orderBy: { archivedAt: 'desc' }
  });

  if (!latestArchive) {
    return json({ error: '未找到归档记录' }, { status: 404 });
  }

  await prisma.archive.update({
    where: { id: latestArchive.id },
    data: {
      resolution,
      disputed: false,
      disputeComments,
      resolvedAt: new Date()
    }
  });

  await prisma.prescription.update({
    where: { id: params.id },
    data: {
      status: PrescriptionStatus.ARCHIVED,
      histories: {
        create: {
          action: '争议解决',
          operatorId: reviewerId,
          operatorName: reviewer.name,
          details: `处理结果：${resolution}`
        }
      }
    }
  });

  return json({ success: true });
};
