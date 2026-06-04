import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { PrescriptionStatus } from '@prisma/client';

const ALLOWED_ARCHIVE_STATUSES = [
  PrescriptionStatus.DOSAGE_ISSUE,
  PrescriptionStatus.PATIENT_MISMATCH,
  PrescriptionStatus.TIMEOUT,
  PrescriptionStatus.REJECTED
];

export const POST: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const { reviewerId, reason, resolution, disputed } = data;

  const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
  if (!reviewer || reviewer.role !== 'REVIEWER') {
    return json({ error: '无权归档' }, { status: 403 });
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: {
      archives: {
        where: { disputed: true, resolvedAt: null },
        take: 1
      }
    }
  });

  if (!prescription) {
    return json({ error: '处方不存在' }, { status: 404 });
  }

  if (prescription.archives.length > 0) {
    return json({
      error: '该处方存在未解决的争议归档，请先处理争议后再进行其他操作',
      hasOpenDispute: true
    }, { status: 400 });
  }

  if (!ALLOWED_ARCHIVE_STATUSES.includes(prescription.status)) {
    return json({
      error: `处方状态为「${prescription.status}」，不允许异常归档。仅「剂量异常」「患者信息不符」「超时未取」「已拒绝」状态可归档`,
      invalidStatus: true
    }, { status: 400 });
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

  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id }
  });

  if (!prescription) {
    return json({ error: '处方不存在' }, { status: 404 });
  }

  if (prescription.status !== PrescriptionStatus.DISPUTED) {
    return json({
      error: `处方状态为「${prescription.status}」，不允许争议解决操作。仅「争议中」状态可执行此操作`,
      invalidStatus: true
    }, { status: 400 });
  }

  const openDispute = await prisma.archive.findFirst({
    where: {
      prescriptionId: params.id,
      disputed: true,
      resolvedAt: null
    },
    orderBy: { archivedAt: 'desc' }
  });

  if (!openDispute) {
    return json({
      error: '未找到未解决的争议归档记录，无需执行争议解决',
      noOpenDispute: true
    }, { status: 400 });
  }

  await prisma.archive.update({
    where: { id: openDispute.id },
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
