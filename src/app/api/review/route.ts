import { NextResponse } from 'next/server'
import { db } from '@/db'
import { inspections, residents, hazards, appointments, rectifications } from '@/db/schema'
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

  const allRectifications = await db
    .select({
      status: rectifications.status,
      repairDate: rectifications.repairDate,
      completedAt: rectifications.completedAt,
    })
    .from(rectifications)

  const completedRectifications = allRectifications.filter(
    (r) => r.status === 'completed' && r.repairDate && r.completedAt
  )

  const totalDays = completedRectifications.reduce((sum, r) => {
    if (r.repairDate && r.completedAt) {
      const repairDate = new Date(r.repairDate)
      const completedAt = new Date(r.completedAt)
      const diffTime = Math.abs(completedAt.getTime() - repairDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return sum + diffDays
    }
    return sum
  }, 0)

  const avgDays = completedRectifications.length > 0
    ? Math.round(totalDays / completedRectifications.length)
    : 0

  const overdueCount = allRectifications.filter((r) => r.status === 'overdue').length
  const pendingCount = allRectifications.filter((r) => r.status === 'pending').length

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
    cycleStats: {
      avgDays,
      overdueCount,
      completedCount: completedRectifications.length,
      pendingCount,
    },
    totalInspections: totalInspections.length,
    totalHazards: totalHazards.length,
    totalRejections: totalRejections.length,
  }

  return NextResponse.json(result)
}
