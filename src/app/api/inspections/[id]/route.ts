import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
  inspections,
  residents,
  meters,
  hazards,
  rectifications,
  appointments,
  historyNodes,
} from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)

  const inspection = await db
    .select({
      id: inspections.id,
      residentId: inspections.residentId,
      meterId: inspections.meterId,
      inspectorName: inspections.inspectorName,
      inspectionDate: inspections.inspectionDate,
      status: inspections.status,
      notes: inspections.notes,
      residentName: residents.name,
      phone: residents.phone,
      address: residents.address,
      community: residents.community,
      building: residents.building,
      floor: residents.floor,
      room: residents.room,
      meterNumber: meters.meterNumber,
      meterLocation: meters.location,
      meterInstallationDate: meters.installationDate,
    })
    .from(inspections)
    .leftJoin(residents, eq(inspections.residentId, residents.id))
    .leftJoin(meters, eq(inspections.meterId, meters.id))
    .where(eq(inspections.id, id))
    .limit(1)

  if (!inspection[0]) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
  }

  const hazardList = await db
    .select({
      id: hazards.id,
      type: hazards.type,
      level: hazards.level,
      description: hazards.description,
      photos: hazards.photos,
      createdAt: hazards.createdAt,
    })
    .from(hazards)
    .where(eq(hazards.inspectionId, id))

  const hazardIds = hazardList.map((h) => h.id)

  const rectList = hazardIds.length > 0
    ? await db
        .select({
          id: rectifications.id,
          hazardId: rectifications.hazardId,
          status: rectifications.status,
          repairmanName: rectifications.repairmanName,
          repairDate: rectifications.repairDate,
          description: rectifications.description,
          beforePhotos: rectifications.beforePhotos,
          afterPhotos: rectifications.afterPhotos,
          completedAt: rectifications.completedAt,
          createdAt: rectifications.createdAt,
        })
        .from(rectifications)
        .where(inArray(rectifications.hazardId, hazardIds))
    : []

  const apptList = await db
    .select({
      id: appointments.id,
      servicePersonName: appointments.servicePersonName,
      scheduledDate: appointments.scheduledDate,
      status: appointments.status,
      notes: appointments.notes,
      isSecondAttempt: appointments.isSecondAttempt,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .where(eq(appointments.inspectionId, id))
    .orderBy(appointments.createdAt)

  const history = await db
    .select({
      id: historyNodes.id,
      type: historyNodes.type,
      title: historyNodes.title,
      description: historyNodes.description,
      operator: historyNodes.operator,
      createdAt: historyNodes.createdAt,
    })
    .from(historyNodes)
    .where(eq(historyNodes.inspectionId, id))
    .orderBy(historyNodes.createdAt)

  return NextResponse.json({
    ...inspection[0],
    hazards: hazardList,
    rectifications: rectList,
    appointments: apptList,
    history,
  })
}
