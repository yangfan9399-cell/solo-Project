import { NextResponse } from 'next/server'
import { db } from '@/db'
import { appointments, inspections, historyNodes } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

  const newAppointment = await db
    .insert(appointments)
    .values({
      inspectionId: body.inspectionId,
      residentId: inspection[0].id,
      servicePersonName: body.servicePersonName || '客服人员',
      scheduledDate: body.scheduledDate || new Date().toISOString().split('T')[0],
      status: body.status || 'pending',
      notes: body.notes,
      isSecondAttempt: body.isSecondAttempt || false,
    })
    .returning()

  await db.insert(historyNodes).values({
    inspectionId: body.inspectionId,
    type: 'appointment',
    title: body.isSecondAttempt ? '二次预约' : '预约成功',
    description: `${body.servicePersonName || '客服人员'}已创建${body.isSecondAttempt ? '二次' : ''}预约`,
    operator: body.servicePersonName || '客服人员',
  })

  return NextResponse.json(newAppointment[0])
}
