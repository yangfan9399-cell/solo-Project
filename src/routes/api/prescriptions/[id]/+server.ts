import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      medicines: true,
      reviews: {
        include: { pharmacist: true },
        orderBy: { reviewedAt: 'desc' }
      },
      pickups: {
        include: { clerk: true },
        orderBy: { createdAt: 'desc' }
      },
      histories: {
        orderBy: { timestamp: 'desc' }
      },
      archives: {
        include: { reviewer: true },
        orderBy: { archivedAt: 'desc' }
      }
    }
  });

  if (!prescription) {
    return json({ error: '处方不存在' }, { status: 404 });
  }

  const result = {
    id: prescription.id,
    prescriptionNo: prescription.prescriptionNo,
    source: prescription.source,
    sourceHospital: prescription.sourceHospital,
    doctorName: prescription.doctorName,
    department: prescription.department,
    diagnosis: prescription.diagnosis,
    patient: prescription.patient,
    status: prescription.status,
    currentHandler: prescription.currentHandler,
    expireAt: prescription.expireAt,
    createdAt: prescription.createdAt,
    updatedAt: prescription.updatedAt,
    medicines: prescription.medicines,
    reviews: prescription.reviews.map(r => ({
      id: r.id,
      pharmacistName: r.pharmacist.name,
      result: r.result,
      dosageSuggestion: r.dosageSuggestion,
      comments: r.comments,
      reviewedAt: r.reviewedAt
    })),
    pickups: prescription.pickups.map(p => ({
      id: p.id,
      clerkName: p.clerk.name,
      pickupTime: p.pickupTime,
      verifierName: p.verifierName,
      verifierIdCard: p.verifierIdCard,
      relation: p.relation,
      supplementaryInfo: p.supplementaryInfo,
      status: p.status,
      createdAt: p.createdAt
    })),
    histories: prescription.histories,
    archives: prescription.archives.map(a => ({
      id: a.id,
      reviewerName: a.reviewer?.name,
      reason: a.reason,
      resolution: a.resolution,
      disputed: a.disputed,
      disputeComments: a.disputeComments,
      archivedAt: a.archivedAt,
      resolvedAt: a.resolvedAt
    }))
  };

  return json(result);
};
