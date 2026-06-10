import { NextResponse } from 'next/server'
import { db } from '@/db'
import { inspections, rectifications, hazards, historyNodes } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function POST(request: Request) {
  const body = await request.json()

  const inspection = await db
    .select({ id: inspections.id })
    .from(inspections)
    .where(eq(inspections.id, body.inspectionId))
    .limit(1)

  if (!inspection[0]) {
    return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
  }

  if (body.action === 'approve') {
    await db.update(inspections).set({ status: 'completed' }).where(eq(inspections.id, body.inspectionId))

    await db.insert(historyNodes).values({
      inspectionId: body.inspectionId,
      type: 'review',
      title: '复核通过',
      description: '复核员已确认整改合格',
      operator: '复核员',
    })
  } else if (body.action === 'stop') {
    const hazardIdsResult = await db
      .select({ id: hazards.id })
      .from(hazards)
      .where(eq(hazards.inspectionId, body.inspectionId))
    
    const hazardIds = hazardIdsResult.map(h => h.id)
    
    await db.update(rectifications)
      .set({ status: 'stopped' })
      .where(inArray(rectifications.hazardId, hazardIds))

    await db.insert(historyNodes).values({
      inspectionId: body.inspectionId,
      type: 'review',
      title: '停气处理',
      description: '因整改不合格或逾期，已执行停气处理',
      operator: '复核员',
    })
  }

  return NextResponse.json({ success: true })
}
