import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { PrescriptionStatus } from '@prisma/client';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status') as PrescriptionStatus | null;
  const search = url.searchParams.get('search') || '';

  const prescriptions = await prisma.prescription.findMany({
    where: {
      ...(status && { status }),
      ...(search && {
        OR: [
          { prescriptionNo: { contains: search } },
          { patient: { name: { contains: search } } }
        ]
      })
    },
    include: {
      patient: true,
      medicines: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const result = prescriptions.map(p => ({
    id: p.id,
    prescriptionNo: p.prescriptionNo,
    source: p.source,
    sourceHospital: p.sourceHospital,
    patientName: p.patient.name,
    status: p.status,
    currentHandler: p.currentHandler,
    createdAt: p.createdAt,
    medicineCount: p.medicines.length
  }));

  return json(result);
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();

  const patient = await prisma.patient.upsert({
    where: { idCard: data.patient.idCard },
    update: {
      name: data.patient.name,
      phone: data.patient.phone,
      birthDate: data.patient.birthDate ? new Date(data.patient.birthDate) : null,
      gender: data.patient.gender,
      address: data.patient.address
    },
    create: {
      name: data.patient.name,
      idCard: data.patient.idCard,
      phone: data.patient.phone,
      birthDate: data.patient.birthDate ? new Date(data.patient.birthDate) : null,
      gender: data.patient.gender,
      address: data.patient.address
    }
  });

  const prescription = await prisma.prescription.create({
    data: {
      prescriptionNo: data.prescriptionNo,
      source: data.source,
      sourceHospital: data.sourceHospital,
      doctorName: data.doctorName,
      department: data.department,
      diagnosis: data.diagnosis,
      patientId: patient.id,
      currentHandler: '系统',
      expireAt: data.expireAt ? new Date(data.expireAt) : null,
      medicines: {
        create: data.medicines.map((m: any) => ({
          name: m.name,
          specification: m.specification,
          dosage: m.dosage,
          frequency: m.frequency,
          quantity: m.quantity,
          unit: m.unit,
          price: m.price,
          notes: m.notes
        }))
      },
      histories: {
        create: {
          action: '处方接收',
          operatorName: '系统',
          details: `处方 ${data.prescriptionNo} 已接收，来自 ${data.sourceHospital || data.source}`
        }
      }
    },
    include: {
      patient: true,
      medicines: true,
      histories: true
    }
  });

  return json(prescription);
};
