import { NextResponse } from 'next/server'
import { db } from '@/db'
import { inspections, residents, meters, hazards } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const community = searchParams.get('community')

  const allData = await db
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
    })
    .from(inspections)
    .leftJoin(residents, eq(inspections.residentId, residents.id))
    .leftJoin(meters, eq(inspections.meterId, meters.id))

  let filteredData = allData

  if (status) {
    filteredData = filteredData.filter((item) => item.status === status)
  }

  if (community) {
    filteredData = filteredData.filter((item) => item.community === community)
  }

  const result = await Promise.all(
    filteredData.map(async (item) => {
      const hazardList = await db
        .select({ id: hazards.id })
        .from(hazards)
        .where(eq(hazards.inspectionId, item.id))

      return {
        ...item,
        hazardCount: hazardList.length,
        hasHazard: hazardList.length > 0,
      }
    })
  )

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const body = await request.json()

  const newInspection = await db
    .insert(inspections)
    .values({
      residentId: body.residentId,
      meterId: body.meterId,
      inspectorName: body.inspectorName,
      inspectionDate: body.inspectionDate,
      status: body.status,
      notes: body.notes,
    })
    .returning()

  return NextResponse.json(newInspection[0])
}
