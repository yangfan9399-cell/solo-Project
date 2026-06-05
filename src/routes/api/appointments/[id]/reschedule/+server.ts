import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { appointments, appointmentChanges, followUps } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	if (locals.user.role !== 'consultant') {
		throw error(403, '无权限');
	}

	const appointmentId = parseInt(params.id);
	const data = await request.json();

	const [existing] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));

	if (!existing) {
		throw error(404, '预约不存在');
	}

	await db
		.update(appointments)
		.set({ status: 'rescheduled', updatedAt: new Date() })
		.where(eq(appointments.id, appointmentId));

	const [newAppointment] = await db
		.insert(appointments)
		.values({
			studentId: existing.studentId,
			courseId: existing.courseId,
			teacherId: data.teacherId,
			consultantId: locals.user.id,
			scheduledAt: data.scheduledAt,
			duration: existing.duration,
			status: 'pending_schedule',
			notes: data.notes || existing.notes,
			previousAppointmentId: appointmentId
		})
		.returning();

	await db.insert(appointmentChanges).values({
		appointmentId: newAppointment.id,
		changedBy: locals.user.id,
		changeType: 'reschedule',
		oldValue: JSON.stringify({
			appointmentId,
			teacherId: existing.teacherId,
			scheduledAt: existing.scheduledAt
		}),
		newValue: JSON.stringify({
			teacherId: data.teacherId,
			scheduledAt: data.scheduledAt
		}),
		reason: data.reason || '改期'
	});

	await db.insert(followUps).values({
		appointmentId: newAppointment.id,
		consultantId: locals.user.id
	});

	return json(newAppointment);
};