import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { PrescriptionStatus } from '@prisma/client';

const ALLOWED_PICKUP_STATUSES = [
  PrescriptionStatus.APPROVED,
  PrescriptionStatus.READY_FOR_PICKUP
];

export const POST: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const { clerkId, verifierName, verifierIdCard, relation, supplementaryInfo } = data;

  const clerk = await prisma.user.findUnique({ where: { id: clerkId } });
  if (!clerk || clerk.role !== 'CLERK') {
    return json({ error: '无权操作' }, { status: 403 });
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: {
      pickups: {
        where: { status: 'COMPLETED' },
        take: 1
      }
    }
  });

  if (!prescription) {
    return json({ error: '处方不存在' }, { status: 404 });
  }

  if (prescription.status === PrescriptionStatus.PICKED_UP) {
    return json({
      error: '该处方已完成取药，请勿重复核销',
      statusCode: prescription.status,
      alreadyPickedUp: true
    }, { status: 400 });
  }

  if (prescription.pickups.length > 0) {
    return json({
      error: '该处方已有已完成的取药记录，请勿重复核销',
      statusCode: prescription.status,
      alreadyPickedUp: true
    }, { status: 400 });
  }

  if (!ALLOWED_PICKUP_STATUSES.includes(prescription.status)) {
    return json({
      error: `处方状态为「${prescription.status}」，不允许取药核销。仅「审核通过」或「待取药」状态可核销`,
      statusCode: prescription.status,
      blocked: true
    }, { status: 400 });
  }

  const updatedPrescription = await prisma.prescription.update({
    where: { id: params.id },
    data: {
      status: PrescriptionStatus.PICKED_UP,
      currentHandler: clerk.name,
      pickups: {
        create: {
          clerkId,
          pickupTime: new Date(),
          verifierName,
          verifierIdCard,
          relation,
          supplementaryInfo,
          status: 'COMPLETED'
        }
      },
      histories: {
        create: {
          action: '取药核销',
          operatorId: clerkId,
          operatorName: clerk.name,
          details: `取药人：${verifierName}，与患者关系：${relation || '本人'}`
        }
      }
    },
    include: { pickups: true, histories: true }
  });

  return json(updatedPrescription);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const data = await request.json();
  const { clerkId, supplementaryInfo } = data;

  const clerk = await prisma.user.findUnique({ where: { id: clerkId } });
  if (!clerk || clerk.role !== 'CLERK') {
    return json({ error: '无权操作' }, { status: 403 });
  }

  const latestPickup = await prisma.pickup.findFirst({
    where: { prescriptionId: params.id },
    orderBy: { createdAt: 'desc' }
  });

  if (!latestPickup) {
    return json({ error: '未找到取药记录' }, { status: 404 });
  }

  await prisma.pickup.update({
    where: { id: latestPickup.id },
    data: { supplementaryInfo }
  });

  await prisma.history.create({
    data: {
      prescriptionId: params.id,
      action: '补充身份信息',
      operatorId: clerkId,
      operatorName: clerk.name,
      details: supplementaryInfo
    }
  });

  return json({ success: true });
};
