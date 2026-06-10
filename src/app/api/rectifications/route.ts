import { NextResponse } from 'next/server'
import { db } from '@/db'
import { rectifications, hazards, historyNodes } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  const body = await request.json()

  const hazard = await db
    .select({ id: hazards.id, inspectionId: hazards.inspectionId })
    .from(hazards)
    .where(eq(hazards.id, body.hazardId))
    .limit(1)

  if (!hazard[0]) {
    return NextResponse.json({ error: 'Hazard not found' }, { status: 404 })
  }

  const newRectification = await db
    .insert(rectifications)
    .values({
      hazardId: body.hazardId,
      status: body.status || 'completed',
      repairmanName: body.repairmanName || '维修师傅',
      repairDate: body.repairDate || new Date().toISOString().split('T')[0],
      description: body.description,
      beforePhotos: body.beforePhotos || [],
      afterPhotos: body.afterPhotos || [],
      completedAt: new Date(),
    })
    .returning()

  await db.insert(historyNodes).values({
    inspectionId: hazard[0].inspectionId,
    type: 'rectification',
    title: '整改完成',
    description: `${body.repairmanName || '维修师傅'}已完成整改`,
    operator: body.repairmanName || '维修师傅',
  })

  return NextResponse.json(newRectification[0])
}
