import { NextResponse } from 'next/server'
import { db } from '@/db'
import { inspections, residents, hazards, appointments } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET() {
  const allResidents = await db.select({ community: residents.community }).from(residents)
  const communities = [...new Set(allResidents.map((r) => r.community))]

  const communityStats = await Promise.all(
    communities.map(async (community) => {
      const communityResidents = await db
        .select({ id: residents.id })
        .from(residents)
        .where(eq(residents.community, community))
      const residentIds = communityResidents.map((r) => r.id)

      const totalInspections = await db
        .select({ count: inspections.id })
        .from(inspections)
        .where(inArray(inspections.residentId, residentIds))

      const completedInspections = await db
        .select({ count: inspections.id })
        .from(inspections)
        .where(and(inArray(inspections.residentId, residentIds), eq(inspections.status, 'completed')))

      const rejectedInspections = await db
        .select({ count: inspections.id })
        .from(inspections)
        .where(and(inArray(inspections.residentId, residentIds), eq(inspections.status, 'rejected')))

      const hazardCount = await db
        .select({ count: hazards.id })
        .from(hazards)
        .innerJoin(inspections, eq(hazards.inspectionId, inspections.id))
        .where(inArray(inspections.residentId, residentIds))

      return {
        community,
        totalInspections: totalInspections.length,
        completedInspections: completedInspections.length,
        rejectedInspections: rejectedInspections.length,
        hazardCount: hazardCount.length,
      }
    })
  )

  const allHazards = await db.select({ type: hazards.type }).from(hazards)
  const hazardTypes = [...new Set(allHazards.map((h) => h.type))]

  const hazardTypeStats = await Promise.all(
    hazardTypes.map(async (type) => ({
      type,
      count: (await db.select({ count: hazards.id }).from(hazards).where(eq(hazards.type, type)))
        .length,
    }))
  )

  const rejectionStats = await Promise.all(
    communities.map(async (community) => {
      const communityResidents = await db
        .select({ id: residents.id })
        .from(residents)
        .where(eq(residents.community, community))
      const residentIds = communityResidents.map((r) => r.id)

      const rejectCount = await db
        .select({ count: inspections.id })
        .from(inspections)
        .where(and(inArray(inspections.residentId, residentIds), eq(inspections.status, 'rejected')))

      const secondAttemptCount = await db
        .select({ count: appointments.id })
        .from(appointments)
        .innerJoin(inspections, eq(appointments.inspectionId, inspections.id))
        .where(
          and(
            inArray(inspections.residentId, residentIds),
            eq(appointments.isSecondAttempt, true)
          )
        )

      return {
        community,
        rejectCount: rejectCount.length,
        secondAttemptCount: secondAttemptCount.length,
      }
    })
  )

  const totalInspections = await db.select({ count: inspections.id }).from(inspections)
  const totalHazards = await db.select({ count: hazards.id }).from(hazards)
  const totalRejections = await db
    .select({ count: inspections.id })
    .from(inspections)
    .where(eq(inspections.status, 'rejected'))

  const result = {
    communityStats,
    hazardTypeStats,
    rejectionStats,
    totalInspections: [{ count: totalInspections.length }],
    totalHazards: [{ count: totalHazards.length }],
    totalRejections: [{ count: totalRejections.length }],
  }

  return NextResponse.json(result)
}
