import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { appointments, teachers, appointmentChanges } from '$lib/db/schema';
import { eq, and, sql, gte, lte, or } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	if (locals.user.role !== 'admin') {
		throw error(403, '无权限');
	}

	const appointmentId = parseInt(params.id);
	const data = await request.json();

	const [existing] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));

	if (!existing) {
		throw error(404, '预约不存在');
	}

	const scheduledAt = new Date(data.scheduledAt);
	const duration = data.duration || existing.duration || 60;
	const teacherId = data.teacherId || existing.teacherId;

	if (!teacherId) {
		throw error(400, '必须指定老师');
	}

	const conflictCheck = await checkTeacherConflict(teacherId, scheduledAt, duration, appointmentId);

	if (conflictCheck.hasConflict) {
		await db
			.update(appointments)
			.set({ status: 'teacher_conflict', updatedAt: new Date() })
			.where(eq(appointments.id, appointmentId));

		await db.insert(appointmentChanges).values({
			appointmentId,
			changedBy: locals.user.id,
			changeType: 'conflict_detected',
			oldValue: existing.status,
			newValue: 'teacher_conflict',
			reason: `检测到老师时间冲突：${conflictCheck.conflictingAppointments?.[0]?.student?.name} 的课程`
		});

		return json(
			{
				success: false,
				conflict: true,
				message: '老师时间冲突',
				conflictingAppointments: conflictCheck.conflictingAppointments,
				alternativeTeachers: conflictCheck.alternativeTeachers
			},
			{ status: 409 }
		);
	}

	const [updated] = await db
		.update(appointments)
		.set({
			teacherId,
			scheduledAt,
			duration,
			status: 'scheduled',
			updatedAt: new Date()
		})
		.where(eq(appointments.id, appointmentId))
		.returning();

	await db.insert(appointmentChanges).values({
		appointmentId,
		changedBy: locals.user.id,
		changeType: 'schedule_confirmed',
		oldValue: existing.status,
		newValue: 'scheduled',
		reason: '教务确认排课'
	});

	return json({ success: true, appointment: updated });
};

async function checkTeacherConflict(
	teacherId: number,
	scheduledAt: Date,
	duration: number,
	excludeAppointmentId?: number
) {
	const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);

	const conflicting = await db
		.select({
			appointment: appointments,
			student: {
				id: sql`students.id`,
				name: sql`students.name`
			}
		})
		.from(appointments)
		.leftJoin(sql`students`, sql`students.id = appointments.student_id`)
		.where(
			and(
				eq(appointments.teacherId, teacherId),
				or(
					eq(appointments.status, 'scheduled'),
					eq(appointments.status, 'pending_schedule')
				),
				excludeAppointmentId ? sql`appointments.id != ${excludeAppointmentId}` : sql`TRUE`,
				gte(appointments.scheduledAt, scheduledAt),
				lte(appointments.scheduledAt, endTime)
			)
		);

	if (conflicting.length > 0) {
		const [teacher] = await db
			.select()
			.from(teachers)
			.where(eq(teachers.id, teacherId));

		const alternatives = await db
			.select()
			.from(teachers)
			.where(sql`specialties && ${teacher?.specialties || []}::text[] AND id != ${teacherId}`);

		return {
			hasConflict: true,
			conflictingAppointments: conflicting,
			alternativeTeachers: alternatives
		};
	}

	return { hasConflict: false };
}